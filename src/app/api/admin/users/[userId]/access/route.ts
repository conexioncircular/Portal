import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { replaceManagedUserAccess } from "@/lib/admin-users";
import { getSafeApiErrorMessage } from "@/lib/api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_USER_ERROR_PREFIXES = [
  "UserId requerido",
  "Usuario no encontrado",
  "PageId inválido",
] as const;

export async function PUT(
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

    const user = await replaceManagedUserAccess({
      userId,
      pageIds: Array.isArray(body?.pageIds) ? body.pageIds : [],
      primaryPageId: body?.primaryPageId,
      isAdmin: typeof body?.isAdmin === "boolean" ? body.isAdmin : undefined,
    });

    return NextResponse.json({ user });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: getSafeApiErrorMessage(
          error,
          "No se pudo actualizar el acceso del usuario",
          SAFE_USER_ERROR_PREFIXES
        ),
      },
      { status: 400 }
    );
  }
}
