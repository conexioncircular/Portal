import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { updateManagedUserProfile } from "@/lib/admin-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function PATCH(req: NextRequest, routeContext: any) {
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
      { error: getErrorMessage(error, "No se pudo actualizar el perfil del usuario") },
      { status: 400 }
    );
  }
}