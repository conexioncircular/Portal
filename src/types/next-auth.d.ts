// src/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    // Campos a nivel raíz que ya usas
    userId?: string;
    primarySlug?: string | null;
    allowedSlugs?: string[];
    primaryPath?: string;
    allowedPaths?: string[];
    roles?: string[];

    // 👇 User enriquecido: ahora incluye 'id'
    user?: DefaultSession["user"] & {
      id?: string;               // <-- NECESARIO para session.user.id
      primaryPath?: string;
      allowedPaths?: string[];
      roles?: string[];
    };
  }

  // (opcional) si usas NextAuth.User en algún lado
  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // Mantengo tus campos
    userId?: string;
    email?: string;
    displayName?: string;
    primarySlug?: string | null;
    allowedSlugs?: string[];
    primaryPath?: string;
    allowedPaths?: string[];
    roles?: string[];

    // 👇 Alias común para id en el token (según callbacks)
    uid?: string;
  }
}
