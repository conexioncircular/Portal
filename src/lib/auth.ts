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

function maskEmail(email: string) {
  const [localPart = "", domainPart = ""] = String(email ?? "").trim().split("@");
  if (!localPart || !domainPart) {
    return "(invalid-email)";
  }

  const visibleLocal = localPart.length <= 2
    ? `${localPart[0] ?? "*"}*`
    : `${localPart.slice(0, 2)}***`;

  return `${visibleLocal}@${domainPart}`;
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
  const pool = await getPool();
  const result = await pool
    .request()
    .input("UserId", String(userId))
    .query(/* sql */ `
      SELECT p.Path, upa.IsPrimary
      FROM cms.UserPageAccess upa
      JOIN cms.Pages p ON p.PageId = upa.PageId
      WHERE upa.UserId = @UserId
    `);

  return mapAccessRows(result.recordset as AccessRow[]);
}

async function fetchLoginCandidate(
  email: string
): Promise<(UserRow & { isAdmin: boolean; accessRows: AccessRow[] }) | null> {
  const safeEmail = String(email ?? "").trim().toLowerCase();
  const startedAt = Date.now();

  let result;
  try {
    result = await withTimeout(
      (async () => {
        const pool = await getPool();
        return pool
          .request()
          .input("email", safeEmail)
          .query(/* sql */ `
            IF OBJECT_ID(N'auth.AdminUsers', N'U') IS NULL
            BEGIN
              CREATE TABLE auth.AdminUsers (
                UserId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                Email NVARCHAR(256) NOT NULL UNIQUE,
                CreatedAt DATETIME2(0) NOT NULL
                  CONSTRAINT DF_AdminUsers_CreatedAt DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2(0) NOT NULL
                  CONSTRAINT DF_AdminUsers_UpdatedAt DEFAULT SYSUTCDATETIME()
              );
            END;

            SELECT TOP 1
              u.UserId AS id,
              u.Email AS email,
              u.DisplayName AS displayName,
              u.PasswordHash AS passwordHash,
              u.PasswordAlgo AS passwordAlgo,
              CAST(u.IsActive AS bit) AS isActive,
              CAST(
                CASE
                  WHEN EXISTS (
                    SELECT 1
                    FROM auth.AdminUsers au
                    WHERE au.UserId = u.UserId OR LOWER(au.Email) = LOWER(u.Email)
                  ) THEN 1
                  ELSE 0
                END
              AS bit) AS isAdmin
            FROM auth.Users u
            WHERE LOWER(u.Email) = LOWER(@email);

            SELECT
              p.Path,
              upa.IsPrimary
            FROM auth.Users u
            JOIN cms.UserPageAccess upa ON upa.UserId = u.UserId
            JOIN cms.Pages p ON p.PageId = upa.PageId
            WHERE LOWER(u.Email) = LOWER(@email);
          `);
      })(),
      AUTH_LOOKUP_TIMEOUT_MS,
      AUTH_ERROR_CODES.dbTimeout
    );
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const maskedEmail = maskEmail(safeEmail);

    if (error instanceof Error && error.message === AUTH_ERROR_CODES.dbTimeout) {
      console.error("[auth] login lookup timed out", {
        email: maskedEmail,
        elapsedMs,
        timeoutMs: AUTH_LOOKUP_TIMEOUT_MS,
      });
      throw error;
    }

    console.error("[auth] login lookup failed", {
      email: maskedEmail,
      elapsedMs,
      error,
    });
    throw createAuthError(AUTH_ERROR_CODES.dbUnavailable);
  }

  const recordsets = result.recordsets as unknown as Array<unknown[]> | undefined;
  const userRecordset = (recordsets?.[0] ?? []) as Array<UserRow & { isAdmin: boolean }>;
  const accessRecordset = (recordsets?.[1] ?? []) as AccessRow[];
  const user = userRecordset[0] as (UserRow & { isAdmin: boolean }) | undefined;

  if (!user) {
    return null;
  }

  return {
    ...user,
    accessRows: accessRecordset,
  };
}

async function authenticateUser(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const candidate = await fetchLoginCandidate(email);
  if (!candidate || !candidate.isActive) {
    return null;
  }

  let isValidPassword = false;
  try {
    isValidPassword = await argon2.verify(candidate.passwordHash, password);
  } catch (error) {
    console.error("[auth] password verification failed", {
      email: maskEmail(candidate.email),
      error,
    });
    throw createAuthError(AUTH_ERROR_CODES.passwordVerificationFailed);
  }

  if (!isValidPassword) {
    return null;
  }

  const isAdmin = candidate.isAdmin || isBootstrapAdminEmail(candidate.email);
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
        email: {
          label: "Correo electronico",
          type: "text",
          placeholder: "usuario@dominio.com",
        },
        password: {
          label: "Contrasena",
          type: "password",
          placeholder: "********",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("MissingCredentials");
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;
        const user = await authenticateUser(email, password);

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
      const email = String(token.email ?? "").trim().toLowerCase();
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
