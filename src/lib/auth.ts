// src/lib/auth.ts — NextAuth v4 con allowedPaths / primaryPath y DisplayName
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as sql from "mssql";
import * as argon2 from "argon2";
import { getPool } from "./db";

type UserRow = {
  id: string;
  email: string;
  displayName: string | null;
  passwordHash: string;
  passwordAlgo: string;
  isActive: boolean;
};

// 🔹 Normalizador de paths
function normPath(p?: string | null): string {
  const s = String(p ?? "").trim().toLowerCase();
  return s !== "/" && s.endsWith("/") ? s.slice(0, -1) : s;
}

// 🔹 Paths permitidos y principal
async function getUserAccessPaths(
  userId: string
): Promise<{ paths: string[]; primary: string | null }> {
  const pool = await getPool();
  const q = await pool
    .request()
    .input("UserId", sql.UniqueIdentifier, userId)
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

// 🔹 Verifica usuario y contraseña
async function verifyUser(email: string, password: string): Promise<UserRow | null> {
  const pool = await getPool();
  const res = await pool
    .request()
    .input("email", sql.NVarChar(256), email)
    .query(/* sql */ `
      SELECT TOP 1
        UserId        AS id,
        Email         AS email,
        DisplayName   AS displayName,
        PasswordHash  AS passwordHash,
        PasswordAlgo  AS passwordAlgo,
        IsActive      AS isActive
      FROM auth.Users
      WHERE Email = @email
    `);

  const user = res.recordset?.[0] as UserRow | undefined;
  if (!user || !user.isActive) return null;

  const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
  return ok ? user : null;
}

// 🔹 Configuración NextAuth
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

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

        // 🔹 Incluimos displayName como name
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
      if (user?.id) (token as any).uid = user.id;
      if (user?.name) token.name = user.name;
      if (user?.email) token.email = user.email as string;

      const needsAccessRefresh =
        !!(token as any).uid &&
        (user || !(token as any).allowedPaths || trigger === "update");

      if (needsAccessRefresh) {
        try {
          const { paths, primary } = await getUserAccessPaths((token as any).uid as string);
          (token as any).allowedPaths = paths;
          (token as any).primaryPath = primary;
        } catch {
          (token as any).allowedPaths = (token as any).allowedPaths ?? [];
          (token as any).primaryPath = (token as any).primaryPath ?? null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).uid ?? (token as any).sub ?? null;
        session.user.name = token.name ?? session.user.name ?? null;
        session.user.email = (token.email as string) ?? session.user.email ?? null;
      }
      (session as any).allowedPaths = (token as any).allowedPaths ?? [];
      (session as any).primaryPath = (token as any).primaryPath ?? null;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};

// 🔹 Helper para server components
export async function auth() {
  return getServerSession(authOptions);
}
