import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { updateManagedUserProfile } from "@/lib/admin-users";
import { getSafeApiErrorMessage } from "@/lib/api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_USER_ERROR_PREFIXES = ["UserId requerido", "Usuario no encontrado"] as const;

export async function PATCH(
  req: NextRequest,
  routeContext: { params: Promise<{ userId: string }> }
) {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const body = await req.json();
    const { userId } = await routeContext.params;

    const user = await updateManagedUserProfile({
      userId,
      displayName: body?.displayName,
      isActive: typeof body?.isActive === "boolean" ? body.isActive : undefined,
    });

    return NextResponse.json({ user });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: getSafeApiErrorMessage(
          error,
          "No se pudo actualizar el perfil del usuario",
          SAFE_USER_ERROR_PREFIXES
        ),
      },
      { status: 400 }
    );
  }
}
