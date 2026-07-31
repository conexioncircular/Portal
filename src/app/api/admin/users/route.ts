import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { createManagedUser, listManagedUsers } from "@/lib/admin-users";
import { getSafeApiErrorMessage } from "@/lib/api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_USER_ERROR_PREFIXES = [
  "La contrasena debe ",
  "La contraseña debe ",
  "PageId inválido",
  "Identificador requerido",
  "Ya existe un usuario ",
] as const;

export async function GET() {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  const users = await listManagedUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const body = await req.json();
    const user = await createManagedUser({
      email: body?.email,
      password: body?.password,
      displayName: body?.displayName,
      pageIds: Array.isArray(body?.pageIds) ? body.pageIds : [],
      primaryPageId: body?.primaryPageId,
      isAdmin: !!body?.isAdmin,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: getSafeApiErrorMessage(
          error,
          "No se pudo crear el usuario",
          SAFE_USER_ERROR_PREFIXES
        ),
      },
      { status: 400 }
    );
  }
}
