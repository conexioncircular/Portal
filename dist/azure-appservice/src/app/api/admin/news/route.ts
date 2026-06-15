import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { createAdminNews, listAdminNews } from "@/lib/admin-news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET() {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const items = await listAdminNews();
    return NextResponse.json({ items });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudieron cargar las noticias") },
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
    const created = await createAdminNews({
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

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo guardar la noticia") },
      { status: 400 }
    );
  }
}
