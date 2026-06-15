import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { getAdminCommunityById, updateAdminCommunity } from "@/lib/admin-communities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ communityId: string }>;
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(_req: NextRequest, routeContext: RouteContext) {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const { communityId } = await routeContext.params;
    const item = await getAdminCommunityById(communityId);

    if (!item) {
      return NextResponse.json({ error: "Comunidad no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo cargar la comunidad") },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest, routeContext: RouteContext) {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const { communityId } = await routeContext.params;
    const body = await req.json();
    const updated = await updateAdminCommunity({
      communityId,
      name: body?.name,
      isActive: body?.isActive ?? true,
      region: body?.region,
      localidad: body?.localidad,
      tipo: body?.tipo,
      tramo: body?.tramo,
      logoUrl: body?.logoUrl,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo actualizar la comunidad") },
      { status: 400 }
    );
  }
}
