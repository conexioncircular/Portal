import { NextResponse } from "next/server";
import { auth } from "./auth";

export async function requireAdminSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ error: "Autenticación requerida" }, { status: 401 }),
    };
  }

  if (!session.isAdmin) {
    return {
      response: NextResponse.json({ error: "Acceso admin requerido" }, { status: 403 }),
    };
  }

  return { session };
}