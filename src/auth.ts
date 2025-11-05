// src/auth.ts — Shim para NextAuth v4
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";

// Exporta las options por si se necesitan
export { authOptions };

// Reexporta la función auth()
export async function auth() {
  return getServerSession(authOptions);
}

// Compatibilidad cliente
export { signIn, signOut } from "next-auth/react";
