import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { uploadNewsImage } from "@/lib/azure-blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const communityId = String(formData.get("communityId") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Debes seleccionar una imagen valida." },
        { status: 400 }
      );
    }

    if (!communityId) {
      return NextResponse.json(
        { error: "Debes seleccionar una comunidad antes de subir la imagen." },
        { status: 400 }
      );
    }

    const uploaded = await uploadNewsImage(file, communityId);
    return NextResponse.json(
      { url: uploaded.url, blobName: uploaded.blobName },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo subir la imagen") },
      { status: 400 }
    );
  }
}
