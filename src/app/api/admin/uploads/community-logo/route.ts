import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { uploadCommunityLogo } from "@/lib/azure-blob";
import { normalizeCommunitySlug } from "@/lib/community-slug";
import { getSafeApiErrorMessage } from "@/lib/api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_LOGO_ERROR_PREFIXES = [
  "Formato de imagen no soportado",
  "El logo seleccionado esta vacio",
  "El logo supera el maximo permitido",
  "La firma binaria del logo no corresponde",
  "Debes ingresar el nombre de la comunidad",
] as const;

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const slug = normalizeCommunitySlug(formData.get("slug"));

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Debes seleccionar una imagen valida." },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { error: "Debes ingresar el nombre de la comunidad antes de subir el logo." },
        { status: 400 }
      );
    }

    const uploaded = await uploadCommunityLogo(file, slug);
    return NextResponse.json(
      { url: uploaded.url, blobName: uploaded.blobName },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: getSafeApiErrorMessage(
          error,
          "No se pudo subir el logo",
          SAFE_LOGO_ERROR_PREFIXES
        ),
      },
      { status: 400 }
    );
  }
}
