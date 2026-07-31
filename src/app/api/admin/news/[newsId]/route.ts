import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import {
  getAdminNewsById,
  getNewNewsImageBlobNames,
  parseAdminNewsCommunityIds,
  parseAdminNewsImageInputs,
  updateAdminNews,
} from "@/lib/admin-news";
import { deleteUnusedNewsImageBlobs } from "@/lib/azure-blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ newsId: string }>;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const safePrefixes = [
    "Debes seleccionar al menos una comunidad",
    "La coleccion de comunidades no es valida",
    "La comunidad principal debe estar incluida",
    "Una o mas comunidades seleccionadas no existen",
    "CommunityId",
    "Ya existe una noticia con ese slug",
    "Noticia no encontrada",
    "Title obligatorio",
    "Slug obligatorio",
    "Summary obligatorio",
    "BodyHtml obligatorio",
    "Orden invalido",
    "Orden inválido",
    "Una noticia puede tener",
    "La coleccion de imagenes no es valida",
  ];

  return safePrefixes.some((prefix) => error.message.startsWith(prefix))
    ? error.message
    : fallback;
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

  let newBlobNames: string[] = [];

  try {
    const { newsId } = await routeContext.params;
    const body = await req.json();
    newBlobNames = getNewNewsImageBlobNames(body?.images);
    const images = parseAdminNewsImageInputs(body?.images);
    const communityIds = parseAdminNewsCommunityIds(body?.communityIds);

    const updated = await updateAdminNews({
      newsId,
      communityId: body?.communityId,
      communityIds,
      title: body?.title,
      slug: body?.slug,
      summary: body?.summary,
      bodyHtml: body?.bodyHtml,
      imageUrl: body?.imageUrl,
      images,
      isFeatured: !!body?.isFeatured,
      isPublic: body?.isPublic ?? true,
      sortOrder: parseSortOrder(body?.sortOrder),
    });

    const cleanupResult = await deleteUnusedNewsImageBlobs(
      updated.removedBlobNames
    );

    if (cleanupResult.failedBlobNames.length > 0) {
      console.error("[admin-news] post-commit blob cleanup failed", {
        newsId,
        blobNames: cleanupResult.failedBlobNames,
      });
    }

    return NextResponse.json({
      newsId: updated.newsId,
      communityId: updated.communityId,
      communityIds: updated.communityIds,
      cleanupPendingBlobNames: cleanupResult.failedBlobNames,
    });
  } catch (error: unknown) {
    if (newBlobNames.length > 0) {
      const cleanupResult = await deleteUnusedNewsImageBlobs(newBlobNames);
      if (cleanupResult.failedBlobNames.length > 0) {
        console.error("[admin-news] update rollback blob cleanup failed", {
          blobNames: cleanupResult.failedBlobNames,
        });
      }
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo actualizar la noticia") },
      { status: 400 }
    );
  }
}
