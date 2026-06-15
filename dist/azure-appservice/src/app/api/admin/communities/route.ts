import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { createAdminCommunity, listAdminCommunities } from "@/lib/admin-communities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function GET() {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const items = await listAdminCommunities();
    return NextResponse.json({ items });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudieron cargar las comunidades") },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const body = await req.json();
    const created = await createAdminCommunity({
      name: body?.name,
      isActive: body?.isActive ?? true,
      region: body?.region,
      localidad: body?.localidad,
      tipo: body?.tipo,
      tramo: body?.tramo,
      logoUrl: body?.logoUrl,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo guardar la comunidad") },
      { status: 400 }
    );
  }
}
