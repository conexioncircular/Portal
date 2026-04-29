import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { replaceManagedUserAccess } from "@/lib/admin-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function PUT(req: NextRequest, context: any) {
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
      { error: getErrorMessage(error, "No se pudo actualizar el acceso del usuario") },
      { status: 400 }
    );
  }
}