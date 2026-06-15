import "server-only";

import { BlobServiceClient } from "@azure/storage-blob";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getPool } from "@/lib/db";
import { normalizeCommunitySlug } from "@/lib/community-slug";
import {
  NEWS_IMAGE_ALLOWED_LABEL,
  getAllowedNewsImageType,
  parseNewsImageMaxUploadMb,
} from "@/lib/news-image-upload";
import {
  COMMUNITY_LOGO_ALLOWED_LABEL,
  getAllowedCommunityLogoType,
} from "@/lib/community-logo-upload";

type AzureBlobConfig = {
  connectionString: string;
  containerName: string;
  maxUploadBytes: number;
  maxUploadMb: number;
};

function getAzureBlobConfig(): AzureBlobConfig {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME?.trim();
  const maxUploadMb = parseNewsImageMaxUploadMb(
    process.env.AZURE_STORAGE_MAX_UPLOAD_MB
  );

  if (!connectionString) {
    throw new Error(
      "Falta AZURE_STORAGE_CONNECTION_STRING para subir imagenes."
    );
  }

  if (!containerName) {
    throw new Error(
      "Falta AZURE_STORAGE_CONTAINER_NAME para subir imagenes."
    );
  }

  return {
    connectionString,
    containerName,
    maxUploadMb,
    maxUploadBytes: Math.round(maxUploadMb * 1024 * 1024),
  };
}

function sanitizeBlobSegment(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.slice(0, 80) || fallback;
}

function sanitizeFileStem(fileName: string): string {
  return sanitizeBlobSegment(path.parse(fileName).name, "imagen");
}

function sanitizeFlatSlugSegment(value: string, fallback: string): string {
  const normalized = normalizeCommunitySlug(value);
  return normalized.slice(0, 80) || fallback;
}

async function getCommunityBlobSegment(communityId: string): Promise<string> {
  const normalizedCommunityId = String(communityId ?? "").trim();
  if (!normalizedCommunityId) {
    throw new Error("Debes seleccionar una comunidad antes de subir la imagen.");
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("communityId", normalizedCommunityId)
    .query(/* sql */ `
      SELECT TOP 1
        Name AS name,
        Slug AS slug
      FROM cms.Communities
      WHERE CAST(CommunityId AS NVARCHAR(50)) = CAST(@communityId AS NVARCHAR(50))
    `);

  const row = result.recordset?.[0];
  if (!row) {
    throw new Error("La comunidad seleccionada no existe.");
  }

  const nameSegment = sanitizeBlobSegment(String(row.name ?? ""), "");
  if (nameSegment) {
    return nameSegment;
  }

  const slugSegment = sanitizeBlobSegment(String(row.slug ?? ""), "comunidad");
  return slugSegment;
}

async function buildNewsImageBlobName(
  fileName: string,
  extension: string,
  communityId: string
): Promise<string> {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const communitySegment = await getCommunityBlobSegment(communityId);

  return `news/${communitySegment}/${year}/${month}/${randomUUID()}-${sanitizeFileStem(
    fileName
  )}.${extension}`;
}

function buildCommunityLogoBlobName(
  fileName: string,
  extension: string,
  communitySlug: string
): string {
  const slugSegment = sanitizeFlatSlugSegment(communitySlug, "comunidad");
  return `community-logos/${slugSegment}/${randomUUID()}-${sanitizeFileStem(
    fileName
  )}.${extension}`;
}

export async function uploadNewsImage(
  file: File,
  communityId: string
): Promise<{
  url: string;
  blobName: string;
}> {
  const allowedType = getAllowedNewsImageType({
    mimeType: file.type,
    fileName: file.name,
  });

  if (!allowedType) {
    throw new Error(
      `Formato de imagen no soportado. Usa ${NEWS_IMAGE_ALLOWED_LABEL}.`
    );
  }

  const { connectionString, containerName, maxUploadBytes, maxUploadMb } =
    getAzureBlobConfig();

  if (!file.size) {
    throw new Error("La imagen seleccionada esta vacia.");
  }

  if (file.size > maxUploadBytes) {
    throw new Error(`La imagen supera el maximo permitido de ${maxUploadMb} MB.`);
  }

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  await containerClient.createIfNotExists({ access: "blob" });

  const blobName = await buildNewsImageBlobName(
    file.name,
    allowedType.defaultExtension,
    communityId
  );
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const data = Buffer.from(await file.arrayBuffer());

  await blockBlobClient.uploadData(data, {
    blobHTTPHeaders: {
      blobContentType: allowedType.mimeType,
      blobCacheControl: "public, max-age=31536000, immutable",
    },
  });

  return {
    url: blockBlobClient.url,
    blobName,
  };
}

export async function uploadCommunityLogo(
  file: File,
  communitySlug: string
): Promise<{
  url: string;
  blobName: string;
}> {
  const allowedType = getAllowedCommunityLogoType({
    mimeType: file.type,
    fileName: file.name,
  });

  if (!allowedType) {
    throw new Error(
      `Formato de logo no soportado. Usa ${COMMUNITY_LOGO_ALLOWED_LABEL}.`
    );
  }

  const { connectionString, containerName, maxUploadBytes, maxUploadMb } =
    getAzureBlobConfig();

  if (!file.size) {
    throw new Error("El logo seleccionado esta vacio.");
  }

  if (file.size > maxUploadBytes) {
    throw new Error(`El logo supera el maximo permitido de ${maxUploadMb} MB.`);
  }

  const normalizedCommunitySlug = sanitizeFlatSlugSegment(
    communitySlug,
    "comunidad"
  );
  if (!normalizedCommunitySlug) {
    throw new Error("Debes ingresar el nombre de la comunidad antes de subir el logo.");
  }

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  await containerClient.createIfNotExists({ access: "blob" });

  const blobName = buildCommunityLogoBlobName(
    file.name,
    allowedType.defaultExtension,
    normalizedCommunitySlug
  );
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const data = Buffer.from(await file.arrayBuffer());

  await blockBlobClient.uploadData(data, {
    blobHTTPHeaders: {
      blobContentType: allowedType.mimeType,
      blobCacheControl: "public, max-age=31536000, immutable",
    },
  });

  return {
    url: blockBlobClient.url,
    blobName,
  };
}
