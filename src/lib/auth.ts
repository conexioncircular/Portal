import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isAdminPrincipal } from "./admin";
import {
  authenticatePortalUser,
  getPortalAdminLandingPath,
  getPortalUserAccessPaths,
  type AuthenticatedPortalUser,
} from "./authentication";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function readClaimsFromUser(
  user?: unknown
): Omit<AuthenticatedPortalUser, "id" | "email" | "name"> | null {
  if (!user || typeof user !== "object") return null;
  const candidate = user as Partial<AuthenticatedPortalUser>;
  if (typeof candidate.isAdmin !== "boolean" || !Array.isArray(candidate.allowedPaths)) return null;
  return {
    isAdmin: candidate.isAdmin,
    allowedPaths: candidate.allowedPaths,
    primaryPath: typeof candidate.primaryPath === "string" ? candidate.primaryPath : undefined,
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
      primaryPath: isAdmin ? getPortalAdminLandingPath() : undefined,
    };
  }
  if (isAdmin) {
    return {
      isAdmin,
      allowedPaths: [] as string[],
      primaryPath: getPortalAdminLandingPath(),
    };
  }
  const { paths, primary } = await getPortalUserAccessPaths(uid);
  return { isAdmin, allowedPaths: paths, primaryPath: primary ?? undefined };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
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
        if (!identifier || !credentials?.password) throw new Error("MissingCredentials");
        const user = await authenticatePortalUser(identifier, credentials.password);
        return user ?? null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const authUser = user as Partial<AuthenticatedPortalUser> | undefined;
      if (authUser?.id) token.uid = authUser.id;
      if (authUser?.name) token.name = authUser.name;
      if (authUser?.email) token.email = authUser.email;

      const userClaims = readClaimsFromUser(authUser);
      if (userClaims) {
        token.isAdmin = userClaims.isAdmin;
        token.allowedPaths = userClaims.allowedPaths;
        token.primaryPath = userClaims.primaryPath;
      }

      const uid = String(token.uid ?? token.sub ?? "").trim();
      const email = String(token.email ?? "").trim();
      const shouldRefreshClaims = trigger === "update" || typeof token.isAdmin !== "boolean" || !Array.isArray(token.allowedPaths);
      if (!shouldRefreshClaims) {
        token.isAdmin = !!token.isAdmin;
        token.allowedPaths = token.allowedPaths ?? [];
        token.primaryPath = typeof token.primaryPath === "string" ? token.primaryPath : undefined;
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
        token.primaryPath = typeof token.primaryPath === "string" ? token.primaryPath : undefined;
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
  pages: { signIn: "/login", error: "/login" },
};

export async function auth() {
  return getServerSession(authOptions);
}
