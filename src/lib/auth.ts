import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as argon2 from "argon2";
import { getPool } from "./db";
import { isAdminPrincipal, isBootstrapAdminEmail } from "./admin";

type UserRow = {
  id: string;
  email: string;
  displayName: string | null;
  passwordHash: string;
  passwordAlgo: string;
  isActive: boolean;
};

type AccessRow = {
  Path: string;
  IsPrimary?: boolean;
};

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  allowedPaths: string[];
  primaryPath?: string;
};

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const AUTH_LOOKUP_TIMEOUT_MS = Math.max(
  Number(process.env.AUTH_LOOKUP_TIMEOUT_MS ?? 15000) || 15000,
  1000
);

const AUTH_ERROR_CODES = {
  dbTimeout: "AuthDbTimeout",
  dbUnavailable: "AuthDbUnavailable",
  passwordVerificationFailed: "AuthPasswordVerificationFailed",
} as const;

function createAuthError(code: string) {
  const error = new Error(code);
  error.name = "AuthError";
  return error;
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, errorCode: string) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(createAuthError(errorCode)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function maskIdentifier(identifier: string) {
  const value = String(identifier ?? "").trim();
  if (!value) {
    return "(empty-identifier)";
  }

  if (value.includes("@")) {
    const [localPart = "", domainPart = ""] = value.split("@");
    if (!localPart || !domainPart) {
      return "(invalid-identifier)";
    }

    const visibleLocal = localPart.length <= 2
      ? `${localPart[0] ?? "*"}*`
      : `${localPart.slice(0, 2)}***`;

    return `${visibleLocal}@${domainPart}`;
  }

  return value.length <= 2 ? `${value[0] ?? "*"}*` : `${value.slice(0, 2)}***`;
}

function normPath(path?: string | null): string {
  const value = String(path ?? "").trim().toLowerCase();
  return value !== "/" && value.endsWith("/") ? value.slice(0, -1) : value;
}

function getAdminLandingPath(): string {
  const candidate = normPath(process.env.ADMIN_DEFAULT_PATH ?? "/admin");
  return candidate || "/admin";
}

function mapAccessRows(rows: AccessRow[]): { paths: string[]; primary: string | null } {
  const paths = new Set<string>();

  for (const row of rows) {
    const path = normPath(row.Path);
    if (path) {
      paths.add(path);
    }
  }

  const primaryRow = rows.find((row) => !!row.IsPrimary) ?? rows[0];
  const primary = primaryRow?.Path ? normPath(primaryRow.Path) : null;

  return {
    paths: Array.from(paths),
    primary,
  };
}

async function getUserAccessPaths(
  userId: string
): Promise<{ paths: string[]; primary: string | null }> {
  const result = await withTimeout(
    (async () => {
      const pool = await getPool();
      return pool
        .request()
        .input("UserId", String(userId))
        .query(/* sql */ `
          SELECT p.Path, upa.IsPrimary
          FROM cms.UserPageAccess upa
          JOIN cms.Pages p ON p.PageId = upa.PageId
          WHERE upa.UserId = @UserId
        `);
    })(),
    AUTH_LOOKUP_TIMEOUT_MS,
    AUTH_ERROR_CODES.dbTimeout
  );

  return mapAccessRows(result.recordset as AccessRow[]);
}

async function fetchLoginCandidate(
  identifier: string
): Promise<(UserRow & { accessRows: AccessRow[] }) | null> {
  const safeIdentifier = String(identifier ?? "").trim();
  const startedAt = Date.now();

  let result;
  try {
    result = await withTimeout(
      (async () => {
        const pool = await getPool();
        return pool
          .request()
          .input("identifier", safeIdentifier)
          .query(/* sql */ `
            SELECT TOP 1
              u.UserId AS id,
              u.Email AS email,
              u.DisplayName AS displayName,
              u.PasswordHash AS passwordHash,
              u.PasswordAlgo AS passwordAlgo,
              CAST(u.IsActive AS bit) AS isActive
            FROM auth.Users u
            WHERE u.Email = @identifier;

            SELECT
              p.Path,
              upa.IsPrimary
            FROM auth.Users u
            JOIN cms.UserPageAccess upa ON upa.UserId = u.UserId
            JOIN cms.Pages p ON p.PageId = upa.PageId
            WHERE u.Email = @identifier;
          `);
      })(),
      AUTH_LOOKUP_TIMEOUT_MS,
      AUTH_ERROR_CODES.dbTimeout
    );
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const maskedIdentifier = maskIdentifier(safeIdentifier);

    if (error instanceof Error && error.message === AUTH_ERROR_CODES.dbTimeout) {
      console.error("[auth] login lookup timed out", {
        identifier: maskedIdentifier,
        elapsedMs,
        timeoutMs: AUTH_LOOKUP_TIMEOUT_MS,
      });
      throw error;
    }

    console.error("[auth] login lookup failed", {
      identifier: maskedIdentifier,
      elapsedMs,
      error,
    });
    throw createAuthError(AUTH_ERROR_CODES.dbUnavailable);
  }

  const recordsets = result.recordsets as unknown as Array<unknown[]> | undefined;
  const userRecordset = (recordsets?.[0] ?? []) as UserRow[];
  const accessRecordset = (recordsets?.[1] ?? []) as AccessRow[];
  const user = userRecordset[0];

  if (!user) {
    return null;
  }

  return {
    ...user,
    accessRows: accessRecordset,
  };
}

async function authenticateUser(
  identifier: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const candidate = await fetchLoginCandidate(identifier);
  if (!candidate || !candidate.isActive) {
    return null;
  }

  let isValidPassword = false;
  try {
    isValidPassword = await argon2.verify(candidate.passwordHash, password);
  } catch (error) {
    console.error("[auth] password verification failed", {
      identifier: maskIdentifier(candidate.email),
      error,
    });
    throw createAuthError(AUTH_ERROR_CODES.passwordVerificationFailed);
  }

  if (!isValidPassword) {
    return null;
  }

  const isAdmin =
    isBootstrapAdminEmail(candidate.email) ||
    (await isAdminPrincipal({
      userId: candidate.id,
      email: candidate.email,
    }).catch(() => false));
  const access = mapAccessRows(candidate.accessRows);

  return {
    id: candidate.id,
    email: candidate.email,
    name: candidate.displayName ?? candidate.email,
    isAdmin,
    allowedPaths: isAdmin ? [] : access.paths,
    primaryPath: isAdmin ? getAdminLandingPath() : access.primary ?? undefined,
  };
}

function readClaimsFromUser(
  user?: unknown
): Omit<AuthenticatedUser, "id" | "email" | "name"> | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  const candidate = user as Partial<AuthenticatedUser>;
  if (typeof candidate.isAdmin !== "boolean" || !Array.isArray(candidate.allowedPaths)) {
    return null;
  }

  return {
    isAdmin: candidate.isAdmin,
    allowedPaths: candidate.allowedPaths,
    primaryPath:
      typeof candidate.primaryPath === "string" ? candidate.primaryPath : undefined,
  };
}

async function loadAuthorizationClaims(uid: string, email: string) {
  const isAdmin = !!uid || !!email
    ? await isAdminPrincipal({ userId: uid, email }).catch(() => false)
    : false;

  if (!uid) {
    return {
      isAdmin,
      allowedPaths: [] as string[],
      primaryPath: isAdmin ? getAdminLandingPath() : undefined,
    };
  }

  if (isAdmin) {
    return {
      isAdmin,
      allowedPaths: [] as string[],
      primaryPath: getAdminLandingPath(),
    };
  }

  const { paths, primary } = await getUserAccessPaths(uid);
  return {
    isAdmin,
    allowedPaths: paths,
    primaryPath: primary ?? undefined,
  };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  providers: [
    Credentials({
      name: "Inicio de sesion",
      credentials: {
        identifier: {
          label: "Usuario, RUT o correo",
          type: "text",
          placeholder: "usuario, rut o correo",
        },
        password: {
          label: "Contrasena",
          type: "password",
          placeholder: "********",
        },
      },
      async authorize(credentials) {
        const legacyEmail = (credentials as Record<string, string | undefined> | undefined)?.email;
        const identifier = String(credentials?.identifier ?? legacyEmail ?? "").trim();
        if (!identifier || !credentials?.password) {
          throw new Error("MissingCredentials");
        }

        const password = credentials.password;
        const user = await authenticateUser(identifier, password);

        if (!user) {
          return null;
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const authUser = user as Partial<AuthenticatedUser> | undefined;

      if (authUser?.id) {
        token.uid = authUser.id;
      }
      if (authUser?.name) {
        token.name = authUser.name;
      }
      if (authUser?.email) {
        token.email = authUser.email;
      }

      const userClaims = readClaimsFromUser(authUser);
      if (userClaims) {
        token.isAdmin = userClaims.isAdmin;
        token.allowedPaths = userClaims.allowedPaths;
        token.primaryPath = userClaims.primaryPath;
      }

      const uid = String(token.uid ?? token.sub ?? "").trim();
      const email = String(token.email ?? "").trim();
      const shouldRefreshClaims =
        trigger === "update" ||
        typeof token.isAdmin !== "boolean" ||
        !Array.isArray(token.allowedPaths);

      if (!shouldRefreshClaims) {
        token.isAdmin = !!token.isAdmin;
        token.allowedPaths = token.allowedPaths ?? [];
        token.primaryPath =
          typeof token.primaryPath === "string" ? token.primaryPath : undefined;
        return token;
      }

      try {
        const claims = await loadAuthorizationClaims(uid, email);
        token.isAdmin = claims.isAdmin;
        token.allowedPaths = claims.allowedPaths;
        token.primaryPath = claims.primaryPath;
      } catch {
        token.isAdmin = false;
        token.allowedPaths = token.allowedPaths ?? [];
        token.primaryPath =
          typeof token.primaryPath === "string" ? token.primaryPath : undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid ?? token.sub ?? undefined;
        session.user.name = token.name ?? session.user.name ?? null;
        session.user.email = (token.email as string) ?? session.user.email ?? null;
        session.user.isAdmin = !!token.isAdmin;
        session.user.roles = token.isAdmin ? ["admin"] : [];
      }

      session.allowedPaths = token.allowedPaths ?? [];
      session.primaryPath = token.primaryPath ?? undefined;
      session.isAdmin = !!token.isAdmin;
      session.roles = token.isAdmin ? ["admin"] : [];
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export async function auth() {
  return getServerSession(authOptions);
}
