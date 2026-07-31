import "server-only";

import {
  BlobServiceClient,
  type ContainerClient,
} from "@azure/storage-blob";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getPool } from "@/lib/db";
import { normalizeCommunitySlug } from "@/lib/community-slug";
import {
  NEWS_IMAGE_ALLOWED_LABEL,
  NEWS_IMAGE_MAX_FILES,
  getAllowedNewsImageType,
  hasValidNewsImageSignature,
  parseNewsImageMaxUploadMb,
} from "@/lib/news-image-upload";
import {
  COMMUNITY_LOGO_ALLOWED_LABEL,
  getAllowedCommunityLogoType,
  parseCommunityLogoMaxUploadMb,
} from "@/lib/community-logo-upload";

type AzureBlobConfig = {
  connectionString: string;
  containerName: string;
};

export type UploadedNewsImage = {
  url: string;
  blobName: string;
};

export type NewsImageBlobCleanupResult = {
  deletedBlobNames: string[];
  skippedInUseBlobNames: string[];
  failedBlobNames: string[];
};

function getAzureBlobConfig(): AzureBlobConfig {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME?.trim();
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
): Promise<UploadedNewsImage> {
  const allowedType = getAllowedNewsImageType({
    mimeType: file.type,
    fileName: file.name,
  });

  if (!allowedType) {
    throw new Error(
      `Formato de imagen no soportado. Usa ${NEWS_IMAGE_ALLOWED_LABEL}.`
    );
  }

  if (!file.size) {
    throw new Error("La imagen seleccionada esta vacia.");
  }

  const maxUploadMb = parseNewsImageMaxUploadMb(
    process.env.AZURE_STORAGE_MAX_UPLOAD_MB
  );
  const maxUploadBytes = Math.round(maxUploadMb * 1024 * 1024);

  if (file.size > maxUploadBytes) {
    throw new Error(`La imagen supera el maximo permitido de ${maxUploadMb} MB.`);
  }

  const data = Buffer.from(await file.arrayBuffer());
  if (!hasValidNewsImageSignature(data, allowedType.mimeType)) {
    throw new Error(
      "La firma binaria del archivo no coincide con un formato de imagen permitido."
    );
  }

  const { connectionString, containerName } = getAzureBlobConfig();
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

function normalizeManagedNewsBlobNames(
  blobNames: readonly string[]
): string[] {
  return Array.from(
    new Set(
      blobNames
        .map((blobName) => String(blobName ?? "").trim())
        .filter(
          (blobName) =>
            blobName.startsWith("news/") &&
            !blobName.includes("\\") &&
            !blobName.split("/").some((segment) => segment === "..") &&
            blobName.length <= 500
        )
    )
  );
}

async function deleteNewsImageBlobsDirectly(
  blobNames: readonly string[]
): Promise<NewsImageBlobCleanupResult> {
  const normalizedBlobNames = normalizeManagedNewsBlobNames(blobNames);
  const result: NewsImageBlobCleanupResult = {
    deletedBlobNames: [],
    skippedInUseBlobNames: [],
    failedBlobNames: [],
  };

  if (normalizedBlobNames.length === 0) {
    return result;
  }

  let containerClient: ContainerClient;
  try {
    const { connectionString, containerName } = getAzureBlobConfig();
    containerClient = BlobServiceClient.fromConnectionString(
      connectionString
    ).getContainerClient(containerName);
  } catch {
    return {
      ...result,
      failedBlobNames: normalizedBlobNames,
    };
  }

  for (const blobName of normalizedBlobNames) {
    try {
      await containerClient.getBlockBlobClient(blobName).deleteIfExists({
        deleteSnapshots: "include",
      });
      result.deletedBlobNames.push(blobName);
    } catch {
      result.failedBlobNames.push(blobName);
    }
  }

  return result;
}

export async function uploadNewsImages(
  files: readonly File[],
  communityId: string
): Promise<UploadedNewsImage[]> {
  if (files.length === 0) {
    throw new Error("Debes seleccionar al menos una imagen.");
  }

  if (files.length > NEWS_IMAGE_MAX_FILES) {
    throw new Error(
      `Una noticia puede tener como maximo ${NEWS_IMAGE_MAX_FILES} imagenes.`
    );
  }

  const uploadedImages: UploadedNewsImage[] = [];

  try {
    for (const file of files) {
      uploadedImages.push(await uploadNewsImage(file, communityId));
    }
    return uploadedImages;
  } catch (error) {
    const cleanupResult = await deleteNewsImageBlobsDirectly(
      uploadedImages.map((image) => image.blobName)
    );

    if (cleanupResult.failedBlobNames.length > 0) {
      console.error("[news-images] partial upload cleanup failed", {
        blobNames: cleanupResult.failedBlobNames,
      });
    }

    throw error;
  }
}

export async function deleteUnusedNewsImageBlobs(
  blobNames: readonly string[]
): Promise<NewsImageBlobCleanupResult> {
  const normalizedBlobNames = normalizeManagedNewsBlobNames(blobNames);
  const result: NewsImageBlobCleanupResult = {
    deletedBlobNames: [],
    skippedInUseBlobNames: [],
    failedBlobNames: [],
  };

  if (normalizedBlobNames.length === 0) {
    return result;
  }

  let pool: Awaited<ReturnType<typeof getPool>>;
  try {
    pool = await getPool();
  } catch {
    return {
      ...result,
      failedBlobNames: normalizedBlobNames,
    };
  }

  const unusedBlobNames: string[] = [];
  for (const blobName of normalizedBlobNames) {
    try {
      const usageResult = await pool
        .request()
        .input("blobName", blobName)
        .query(/* sql */ `
          SELECT TOP 1 NewsImageId
          FROM cms.NewsImages
          WHERE BlobName = @blobName
        `);

      if (usageResult.recordset?.[0]) {
        result.skippedInUseBlobNames.push(blobName);
      } else {
        unusedBlobNames.push(blobName);
      }
    } catch {
      result.failedBlobNames.push(blobName);
    }
  }

  const directCleanupResult = await deleteNewsImageBlobsDirectly(unusedBlobNames);
  result.deletedBlobNames.push(...directCleanupResult.deletedBlobNames);
  result.failedBlobNames.push(...directCleanupResult.failedBlobNames);

  return result;
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

  const maxUploadMb = parseCommunityLogoMaxUploadMb(
    process.env.AZURE_STORAGE_MAX_UPLOAD_MB
  );
  const maxUploadBytes = Math.round(maxUploadMb * 1024 * 1024);
  const { connectionString, containerName } = getAzureBlobConfig();

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
