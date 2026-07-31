import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { uploadNewsImages } from "@/lib/azure-blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const safePrefixes = [
    "Debes seleccionar al menos una imagen",
    "Debes seleccionar una comunidad",
    "Formato de imagen no soportado",
    "La imagen seleccionada esta vacia",
    "La imagen supera el maximo permitido",
    "La firma binaria del archivo no coincide",
    "Una noticia puede tener como maximo",
    "La comunidad seleccionada no existe",
  ];

  return safePrefixes.some((prefix) => error.message.startsWith(prefix))
    ? error.message
    : fallback;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const formData = await req.formData();
    const files = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ].filter((value): value is File => value instanceof File);
    const communityId = String(formData.get("communityId") ?? "").trim();

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Debes seleccionar al menos una imagen valida." },
        { status: 400 }
      );
    }

    if (!communityId) {
      return NextResponse.json(
        { error: "Debes seleccionar una comunidad antes de subir la imagen." },
        { status: 400 }
      );
    }

    const uploaded = await uploadNewsImages(files, communityId);
    const firstImage = uploaded[0];

    const responseItems = uploaded.map((item, index) => ({
      ...item,
      index,
      originalName: files[index]?.name,
    }));

    return NextResponse.json(
      {
        items: responseItems,
        // Compatibilidad temporal con consumidores de una sola imagen.
        url: firstImage?.url,
        blobName: firstImage?.blobName,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo subir la imagen") },
      { status: 400 }
    );
  }
}
