import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as argon2 from "argon2";
import { getPool } from "./db";
import { getAdminAccessPaths, isAdminPrincipal } from "./admin";

type UserRow = {
  id: string;
  email: string;
  displayName: string | null;
  passwordHash: string;
  passwordAlgo: string;
  isActive: boolean;
};

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function normPath(p?: string | null): string {
  const s = String(p ?? "").trim().toLowerCase();
  return s !== "/" && s.endsWith("/") ? s.slice(0, -1) : s;
}

function mergePaths(...groups: string[][]): string[] {
  return Array.from(
    new Set(
      groups.flatMap((group) =>
        group
          .map((path) => normPath(path))
          .filter(Boolean)
      )
    )
  );
}

async function getUserAccessPaths(
  userId: string
): Promise<{ paths: string[]; primary: string | null }> {
  const pool = await getPool();
  const q = await pool
    .request()
    .input("UserId", String(userId))
    .query(/* sql */ `
      SELECT p.Path, upa.IsPrimary
      FROM cms.UserPageAccess upa
      JOIN cms.Pages p ON p.PageId = upa.PageId
      WHERE upa.UserId = @UserId
    `);

  const rows = q.recordset as Array<{ Path: string; IsPrimary?: boolean }>;
  const set = new Set<string>();

  for (const r of rows) {
    const p = normPath(r.Path);
    if (p) set.add(p);
  }

  const primaryRow = rows.find((r) => !!r.IsPrimary) ?? rows[0];
  const primary = primaryRow?.Path ? normPath(primaryRow.Path) : null;

  return { paths: Array.from(set), primary };
}

async function verifyUser(email: string, password: string): Promise<UserRow | null> {
  const pool = await getPool();

  const safeEmail = String(email ?? "").trim().toLowerCase();

  const res = await pool
    .request()
    .input("email", safeEmail)
    .query(/* sql */ `
      SELECT TOP 1
        UserId        AS id,
        Email         AS email,
        DisplayName   AS displayName,
        PasswordHash  AS passwordHash,
        PasswordAlgo  AS passwordAlgo,
        IsActive      AS isActive
      FROM auth.Users
      WHERE LOWER(Email) = LOWER(@email)
    `);

  const user = res.recordset?.[0] as UserRow | undefined;
  if (!user || !user.isActive) return null;

  const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
  return ok ? user : null;
}

async function loadAuthorizationClaims(uid: string, email: string) {
  const isAdmin = !!uid || !!email
    ? await isAdminPrincipal({ userId: uid, email }).catch(() => false)
    : false;

  if (!uid) {
    return {
      isAdmin,
      allowedPaths: [] as string[],
      primaryPath: undefined as string | undefined,
    };
  }

  if (isAdmin) {
    const [userAccess, adminAccess] = await Promise.all([
      getUserAccessPaths(uid),
      getAdminAccessPaths(),
    ]);

    return {
      isAdmin,
      // Un admin conserva su portada personal aunque tenga acceso global.
      allowedPaths: mergePaths(userAccess.paths, adminAccess.paths),
      primaryPath: userAccess.primary ?? undefined,
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
      name: "Inicio de sesión",
      credentials: {
        email: {
          label: "Correo electrónico",
          type: "text",
          placeholder: "usuario@dominio.com",
        },
        password: {
          label: "Contraseña",
          type: "password",
          placeholder: "••••••••",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Debes ingresar correo y contraseña");
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        const user = await verifyUser(email, password);
        if (!user) throw new Error("Credenciales inválidas");

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) token.uid = user.id;
      if (user?.name) token.name = user.name;
      if (user?.email) token.email = user.email as string;

      const uid = String(token.uid ?? token.sub ?? "").trim();
      const email = String(token.email ?? "").trim().toLowerCase();

      const shouldRefreshClaims =
        !!user ||
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
