import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { updateManagedUserPassword } from "@/lib/admin-users";
import { getSafeApiErrorMessage } from "@/lib/api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_USER_ERROR_PREFIXES = [
  "UserId requerido",
  "Usuario no encontrado",
  "La contraseña debe ",
] as const;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const body = await req.json();
    const { userId } = await context.params;

    await updateManagedUserPassword(userId, String(body?.password ?? ""));
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: getSafeApiErrorMessage(
          error,
          "No se pudo actualizar la contraseña",
          SAFE_USER_ERROR_PREFIXES
        ),
      },
      { status: 400 }
    );
  }
}
