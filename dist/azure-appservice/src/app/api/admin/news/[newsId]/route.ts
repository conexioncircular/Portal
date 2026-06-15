import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { getAdminNewsById, updateAdminNews } from "@/lib/admin-news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ newsId: string }>;
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function parseSortOrder(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Orden inválido");
  }

  return Math.trunc(parsed);
}

export async function GET(_req: NextRequest, routeContext: RouteContext) {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const { newsId } = await routeContext.params;
    const item = await getAdminNewsById(newsId);

    if (!item) {
      return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo cargar la noticia") },
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
    const { newsId } = await routeContext.params;
    const body = await req.json();
    const updated = await updateAdminNews({
      newsId,
      communityId: body?.communityId,
      title: body?.title,
      slug: body?.slug,
      summary: body?.summary,
      bodyHtml: body?.bodyHtml,
      imageUrl: body?.imageUrl,
      isFeatured: !!body?.isFeatured,
      isPublic: body?.isPublic ?? true,
      sortOrder: parseSortOrder(body?.sortOrder),
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo actualizar la noticia") },
      { status: 400 }
    );
  }
}
