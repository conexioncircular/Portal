import { randomUUID } from "node:crypto";
import sanitizeHtml from "sanitize-html";
import { getPool, sql } from "@/lib/db";
import { sanitizeRichHtml } from "@/lib/html-sanitizer";
import {
  getNewsCoverImage,
  mapNewsImageRow,
  normalizeNewsImages,
  type NewsImage,
  type NewsImageWriteInput,
} from "@/lib/news-images";
import { NEWS_IMAGE_MAX_FILES } from "@/lib/news-image-upload";

export type AdminNewsCommunity = {
  communityId: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type AdminNewsListItem = {
  newsId: string;
  communityId: string;
  communityIds: string[];
  communities: AdminNewsCommunity[];
  communityName: string;
  communitySlug: string;
  title: string;
  slug: string;
  isPublic: boolean;
  isFeatured: boolean;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type AdminNewsDetails = {
  newsId: string;
  communityId: string;
  communityIds: string[];
  communities: AdminNewsCommunity[];
  title: string;
  slug: string;
  summary: string;
  bodyHtml: string;
  imageUrl: string | null;
  images?: NewsImage[];
  isFeatured: boolean;
  isPublic: boolean;
  sortOrder: number | null;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type CreateAdminNewsInput = {
  communityId?: string;
  communityIds?: string[];
  title: string;
  slug: string;
  summary: string;
  bodyHtml: string;
  imageUrl?: string | null;
  images?: NewsImageWriteInput[];
  isFeatured?: boolean;
  isPublic?: boolean;
  sortOrder?: number | null;
};

export type UpdateAdminNewsInput = CreateAdminNewsInput & {
  newsId: string;
};

export type UpdateAdminNewsResult = {
  newsId: string;
  communityId: string;
  communityIds: string[];
  removedBlobNames: string[];
};

type NormalizedNewsInput = {
  requestedCommunityId: string | null;
  communityIds: string[];
  title: string;
  slug: string;
  summary: string;
  bodyHtml: string;
  imageUrl: string | null;
  images: NewsImageWriteInput[] | undefined;
  isFeatured: boolean;
  isPublic: boolean;
  sortOrder: number | null;
  hasSortOrder: boolean;
};

function normalizeRequiredText(value: unknown): string {
  return String(value ?? "").trim();
}

const UNIQUE_IDENTIFIER_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUniqueIdentifier(value: string): boolean {
  return UNIQUE_IDENTIFIER_PATTERN.test(value);
}

function normalizeUniqueIdentifier(value: unknown, fieldName: string): string {
  const normalized = normalizeRequiredText(value);
  if (!isUniqueIdentifier(normalized)) {
    throw new Error(`${fieldName} invalido`);
  }

  return normalized;
}

type NormalizedCommunitySelection = {
  requestedCommunityId: string | null;
  communityIds: string[];
};

export function normalizeAdminNewsCommunitySelection(input: {
  communityId?: unknown;
  communityIds?: unknown;
}): NormalizedCommunitySelection {
  const requestedCommunityId =
    input.communityId === undefined || input.communityId === null
      ? null
      : normalizeUniqueIdentifier(input.communityId, "CommunityId");

  let rawCommunityIds: unknown[];
  if (input.communityIds === undefined) {
    rawCommunityIds = requestedCommunityId ? [requestedCommunityId] : [];
  } else {
    if (!Array.isArray(input.communityIds)) {
      throw new Error("La coleccion de comunidades no es valida.");
    }
    rawCommunityIds = input.communityIds;
  }

  const communityIds: string[] = [];
  const seenCommunityIds = new Set<string>();

  for (const [index, rawCommunityId] of rawCommunityIds.entries()) {
    const communityId = normalizeUniqueIdentifier(
      rawCommunityId,
      `CommunityId ${index + 1}`
    );
    const comparisonKey = communityId.toLowerCase();
    if (!seenCommunityIds.has(comparisonKey)) {
      seenCommunityIds.add(comparisonKey);
      communityIds.push(communityId);
    }
  }

  if (communityIds.length === 0) {
    throw new Error("Debes seleccionar al menos una comunidad.");
  }

  if (
    requestedCommunityId &&
    !seenCommunityIds.has(requestedCommunityId.toLowerCase())
  ) {
    throw new Error(
      "La comunidad principal debe estar incluida en las comunidades seleccionadas."
    );
  }

  return { requestedCommunityId, communityIds };
}

function selectCreatePrimaryCommunityId(
  selection: NormalizedCommunitySelection
): string {
  return selection.requestedCommunityId ?? selection.communityIds[0];
}

function selectUpdatePrimaryCommunityId(
  currentCommunityId: string,
  communityIds: readonly string[]
): string {
  const currentComparisonKey = currentCommunityId.toLowerCase();
  return (
    communityIds.find(
      (communityId) => communityId.toLowerCase() === currentComparisonKey
    ) ?? communityIds[0]
  );
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeSlug(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeImageUrl(value: unknown): string {
  const normalized = normalizeRequiredText(value);
  if (!normalized || normalized.length > 500) {
    throw new Error("La URL de una imagen es invalida o supera 500 caracteres.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    throw new Error("La URL de una imagen no es valida.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("La URL de una imagen debe usar HTTP o HTTPS.");
  }

  return normalized;
}

function normalizeBlobName(value: unknown): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  if (
    normalized.length > 500 ||
    !normalized.startsWith("news/") ||
    normalized.includes("\\") ||
    normalized.split("/").some((segment) => segment === "..")
  ) {
    throw new Error("El nombre interno de una imagen no es valido.");
  }

  return normalized;
}

function normalizeCaption(value: unknown): string | null {
  const normalized = sanitizeHtml(String(value ?? ""), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > 200) {
    throw new Error("La descripcion de una imagen supera 200 caracteres.");
  }

  return normalized;
}

export function parseAdminNewsImageInputs(
  value: unknown
): NewsImageWriteInput[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("La coleccion de imagenes no es valida.");
  }

  if (value.length > NEWS_IMAGE_MAX_FILES) {
    throw new Error(
      `Una noticia puede tener como maximo ${NEWS_IMAGE_MAX_FILES} imagenes.`
    );
  }

  return value.map((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error(`La imagen ${index + 1} no es valida.`);
    }

    const record = item as Record<string, unknown>;
    const newsImageId = normalizeOptionalText(record.newsImageId);
    const parsedSortOrder = Number(record.sortOrder);

    return {
      ...(newsImageId ? { newsImageId } : {}),
      imageUrl: normalizeRequiredText(record.imageUrl),
      caption: record.caption == null ? null : String(record.caption),
      sortOrder:
        Number.isInteger(parsedSortOrder) && parsedSortOrder >= 1
          ? parsedSortOrder
          : index + 1,
      isCover: record.isCover === true,
      blobName: normalizeOptionalText(record.blobName),
    };
  });
}

export function parseAdminNewsCommunityIds(
  value: unknown
): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("La coleccion de comunidades no es valida.");
  }

  return value.map((communityId, index) => {
    if (typeof communityId !== "string") {
      throw new Error(`CommunityId ${index + 1} invalido`);
    }
    return communityId;
  });
}

export function getNewNewsImageBlobNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return [];
    }

    const record = item as Record<string, unknown>;
    if (normalizeOptionalText(record.newsImageId)) {
      return [];
    }

    const blobName = normalizeOptionalText(record.blobName);
    return blobName ? [blobName] : [];
  });
}

function normalizeImageWriteInputs(
  images: NewsImageWriteInput[] | undefined
): NewsImageWriteInput[] | undefined {
  if (images === undefined) {
    return undefined;
  }

  if (images.length > NEWS_IMAGE_MAX_FILES) {
    throw new Error(
      `Una noticia puede tener como maximo ${NEWS_IMAGE_MAX_FILES} imagenes.`
    );
  }

  const normalized = images.map((image, index) => ({
    ...(normalizeOptionalText(image.newsImageId)
      ? {
          newsImageId: normalizeUniqueIdentifier(
            image.newsImageId,
            `NewsImageId de la imagen ${index + 1}`
          ),
        }
      : {}),
    imageUrl: normalizeImageUrl(image.imageUrl),
    caption: normalizeCaption(image.caption),
    sortOrder:
      Number.isInteger(image.sortOrder) && Number(image.sortOrder) >= 1
        ? Number(image.sortOrder)
        : index + 1,
    isCover: image.isCover === true,
    blobName: normalizeBlobName(image.blobName),
  }));

  const imageIds = new Set<string>();
  const imageUrls = new Set<string>();

  for (const image of normalized) {
    if (image.newsImageId) {
      if (imageIds.has(image.newsImageId)) {
        throw new Error("La coleccion contiene identificadores de imagen duplicados.");
      }
      imageIds.add(image.newsImageId);
    }

    if (imageUrls.has(image.imageUrl)) {
      throw new Error("La coleccion contiene URLs de imagen duplicadas.");
    }
    imageUrls.add(image.imageUrl);
  }

  return normalized;
}

function normalizeNewsInput(
  input: CreateAdminNewsInput | UpdateAdminNewsInput
): NormalizedNewsInput {
  const communitySelection = normalizeAdminNewsCommunitySelection(input);
  const title = normalizeRequiredText(input.title);
  const slug = normalizeSlug(input.slug);
  const summary = sanitizeRichHtml(normalizeRequiredText(input.summary));
  const bodyHtml = sanitizeRichHtml(normalizeRequiredText(input.bodyHtml));
  const imageUrl = normalizeOptionalText(input.imageUrl);
  const images = normalizeImageWriteInputs(input.images);
  const isFeatured = !!input.isFeatured;
  const isPublic = input.isPublic ?? true;
  const sortOrder =
    typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
      ? Math.trunc(input.sortOrder)
      : null;
  const hasSortOrder = sortOrder !== null;

  if (!title) {
    throw new Error("Title obligatorio");
  }
  if (!slug) {
    throw new Error("Slug obligatorio");
  }
  if (!summary) {
    throw new Error("Summary obligatorio");
  }
  if (!bodyHtml) {
    throw new Error("BodyHtml obligatorio");
  }
  if (sortOrder !== null && sortOrder < 0) {
    throw new Error("Orden invalido");
  }

  return {
    ...communitySelection,
    title,
    slug,
    summary,
    bodyHtml,
    imageUrl,
    images,
    isFeatured,
    isPublic,
    sortOrder,
    hasSortOrder,
  };
}

function mapNullableDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value : new Date(String(value));
}

async function ensureCommunitiesExistInTransaction(
  transaction: sql.Transaction,
  communityIds: readonly string[]
): Promise<void> {
  const request = new sql.Request(transaction);
  const parameterNames = communityIds.map((communityId, index) => {
    const parameterName = `communityId${index}`;
    request.input(parameterName, sql.UniqueIdentifier, communityId);
    return parameterName;
  });

  const result = await request.query(/* sql */ `
    SELECT CommunityId
    FROM cms.Communities WITH (HOLDLOCK)
    WHERE CommunityId IN (
      ${parameterNames
        .map((parameterName) => `CAST(@${parameterName} AS UNIQUEIDENTIFIER)`)
        .join(", ")}
    )
  `);

  const existingCommunityIds = new Set(
    (result.recordset ?? []).map((row) =>
      String(row.CommunityId).toLowerCase()
    )
  );

  if (
    existingCommunityIds.size !== communityIds.length ||
    communityIds.some(
      (communityId) => !existingCommunityIds.has(communityId.toLowerCase())
    )
  ) {
    throw new Error("Una o mas comunidades seleccionadas no existen.");
  }
}

async function ensureUniqueNewsSlugInTransaction(
  transaction: sql.Transaction,
  communityIds: readonly string[],
  slug: string,
  excludeNewsId?: string
): Promise<void> {
  const orderedCommunityIds = [...communityIds].sort((left, right) =>
    left.localeCompare(right, "en", { sensitivity: "base" })
  );

  for (const communityId of orderedCommunityIds) {
    const request = new sql.Request(transaction)
      .input("communityId", sql.UniqueIdentifier, communityId)
      .input("slug", sql.NVarChar(500), slug);

    const exclusionClause = excludeNewsId
      ? "AND n.NewsId <> CAST(@excludeNewsId AS UNIQUEIDENTIFIER)"
      : "";

    if (excludeNewsId) {
      request.input("excludeNewsId", sql.UniqueIdentifier, excludeNewsId);
    }

    const result = await request.query(/* sql */ `
      SELECT TOP (1) n.NewsId
      FROM cms.News AS n WITH (UPDLOCK, HOLDLOCK)
      WHERE LOWER(n.Slug) = LOWER(@slug)
        ${exclusionClause}
        AND (
          n.CommunityId = CAST(@communityId AS UNIQUEIDENTIFIER)
          OR EXISTS (
            SELECT 1
            FROM cms.NewsCommunities AS nc WITH (UPDLOCK, HOLDLOCK)
            WHERE nc.NewsId = n.NewsId
              AND nc.CommunityId = CAST(@communityId AS UNIQUEIDENTIFIER)
          )
        )
    `);

    if (result.recordset?.[0]) {
      throw new Error(
        "Ya existe una noticia con ese slug en una comunidad seleccionada."
      );
    }
  }
}

async function insertNewsCommunity(
  transaction: sql.Transaction,
  newsId: string,
  communityId: string
): Promise<void> {
  await new sql.Request(transaction)
    .input("newsId", sql.UniqueIdentifier, newsId)
    .input("communityId", sql.UniqueIdentifier, communityId)
    .query(/* sql */ `
      INSERT INTO cms.NewsCommunities (NewsId, CommunityId, CreatedAt)
      VALUES (
        CAST(@newsId AS UNIQUEIDENTIFIER),
        CAST(@communityId AS UNIQUEIDENTIFIER),
        SYSUTCDATETIME()
      )
    `);
}

function createNewsImage(
  newsId: string,
  input: NewsImageWriteInput,
  options?: { allowMissingBlobName?: boolean }
): NewsImage {
  const blobName = normalizeBlobName(input.blobName);
  const imageUrl = normalizeImageUrl(input.imageUrl);

  if (!blobName && !options?.allowMissingBlobName) {
    throw new Error("Una imagen nueva debe incluir su BlobName.");
  }

  if (blobName) {
    let decodedPathname: string;
    try {
      decodedPathname = decodeURIComponent(new URL(imageUrl).pathname);
    } catch {
      throw new Error("La URL publica no coincide con el BlobName de la imagen.");
    }

    if (!decodedPathname.endsWith(`/${blobName}`)) {
      throw new Error("La URL publica no coincide con el BlobName de la imagen.");
    }
  }

  return {
    newsImageId: randomUUID(),
    newsId,
    imageUrl,
    caption: normalizeCaption(input.caption),
    sortOrder: Number(input.sortOrder) || 1,
    isCover: input.isCover === true,
    blobName,
    createdAt: new Date(),
  };
}

function buildCreateImages(
  newsId: string,
  input: NormalizedNewsInput
): NewsImage[] {
  if (input.images !== undefined) {
    const images = input.images.map((image) => {
      if (image.newsImageId) {
        throw new Error("Una imagen nueva no puede incluir NewsImageId.");
      }
      return createNewsImage(newsId, image);
    });
    return normalizeNewsImages(images);
  }

  if (!input.imageUrl) {
    return [];
  }

  return normalizeNewsImages([
    createNewsImage(
      newsId,
      {
        imageUrl: input.imageUrl,
        caption: null,
        sortOrder: 1,
        isCover: true,
        blobName: null,
      },
      { allowMissingBlobName: true }
    ),
  ]);
}

async function insertNewsImage(
  transaction: sql.Transaction,
  image: NewsImage
): Promise<void> {
  await new sql.Request(transaction)
    .input(
      "newsImageId",
      sql.UniqueIdentifier,
      normalizeUniqueIdentifier(image.newsImageId, "NewsImageId")
    )
    .input(
      "newsId",
      sql.UniqueIdentifier,
      normalizeUniqueIdentifier(image.newsId, "NewsId")
    )
    .input("imageUrl", sql.NVarChar(500), image.imageUrl)
    .input("caption", sql.NVarChar(200), image.caption)
    .input("sortOrder", sql.Int, image.sortOrder)
    .input("isCover", sql.Bit, image.isCover)
    .input("blobName", sql.NVarChar(500), image.blobName)
    .query(/* sql */ `
      INSERT INTO cms.NewsImages (
        NewsImageId,
        NewsId,
        ImageUrl,
        Caption,
        SortOrder,
        IsCover,
        BlobName
      )
      VALUES (
        @newsImageId,
        @newsId,
        @imageUrl,
        @caption,
        @sortOrder,
        @isCover,
        @blobName
      )
    `);
}

export async function listAdminNewsCommunities(): Promise<
  AdminNewsCommunity[]
> {
  const pool = await getPool();
  const result = await pool.request().query(/* sql */ `
    SELECT
      CommunityId AS communityId,
      Name AS name,
      Slug AS slug,
      CAST(ISNULL(IsActive, 0) AS bit) AS isActive
    FROM cms.Communities
    ORDER BY Name
  `);

  return (result.recordset ?? []).map((row) => ({
    communityId: String(row.communityId),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    isActive: !!row.isActive,
  }));
}

function mapAdminNewsCommunityRow(
  row: Record<string, unknown>
): AdminNewsCommunity {
  return {
    communityId: String(row.communityId),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    isActive: !!row.isActive,
  };
}

function normalizeAdminNewsCommunities(
  newsId: string,
  primaryCommunity: AdminNewsCommunity,
  associatedCommunities: readonly AdminNewsCommunity[]
): AdminNewsCommunity[] {
  const communitiesById = new Map(
    associatedCommunities.map((community) => [
      community.communityId.toLowerCase(),
      community,
    ])
  );
  const primaryComparisonKey = primaryCommunity.communityId.toLowerCase();

  if (!communitiesById.has(primaryComparisonKey)) {
    console.error(
      "[admin-news] primary community missing from NewsCommunities",
      { newsId, communityId: primaryCommunity.communityId }
    );
    communitiesById.set(primaryComparisonKey, primaryCommunity);
  }

  return Array.from(communitiesById.values()).sort((left, right) => {
    const leftIsPrimary =
      left.communityId.toLowerCase() === primaryComparisonKey;
    const rightIsPrimary =
      right.communityId.toLowerCase() === primaryComparisonKey;
    if (leftIsPrimary !== rightIsPrimary) {
      return leftIsPrimary ? -1 : 1;
    }

    return (
      left.name.localeCompare(right.name, "es", { sensitivity: "base" }) ||
      left.communityId.localeCompare(right.communityId, "en", {
        sensitivity: "base",
      })
    );
  });
}

export async function listAdminNews(): Promise<AdminNewsListItem[]> {
  const pool = await getPool();
  const newsResult = await pool.request().query(/* sql */ `
    SELECT
      n.NewsId AS newsId,
      n.CommunityId AS communityId,
      c.Name AS communityName,
      c.Slug AS communitySlug,
      CAST(ISNULL(c.IsActive, 0) AS bit) AS communityIsActive,
      n.Title AS title,
      n.Slug AS slug,
      CAST(ISNULL(n.IsPublic, 0) AS bit) AS isPublic,
      CAST(ISNULL(n.IsFeatured, 0) AS bit) AS isFeatured,
      n.PublishedAt AS publishedAt,
      n.CreatedAt AS createdAt,
      n.UpdatedAt AS updatedAt
    FROM cms.News n
    INNER JOIN cms.Communities c ON c.CommunityId = n.CommunityId
    ORDER BY n.UpdatedAt DESC,
             n.CreatedAt DESC,
             n.NewsId DESC
  `);

  const associationsResult = await pool.request().query(/* sql */ `
    SELECT
      nc.NewsId AS newsId,
      c.CommunityId AS communityId,
      c.Name AS name,
      c.Slug AS slug,
      CAST(ISNULL(c.IsActive, 0) AS bit) AS isActive
    FROM cms.NewsCommunities AS nc
    INNER JOIN cms.Communities AS c
      ON c.CommunityId = nc.CommunityId
    ORDER BY nc.NewsId, c.Name, c.CommunityId
  `);

  const communitiesByNewsId = new Map<string, AdminNewsCommunity[]>();
  for (const associationRow of associationsResult.recordset ?? []) {
    const associationNewsId = String(associationRow.newsId).toLowerCase();
    const communities = communitiesByNewsId.get(associationNewsId) ?? [];
    communities.push(mapAdminNewsCommunityRow(associationRow));
    communitiesByNewsId.set(associationNewsId, communities);
  }

  return (newsResult.recordset ?? []).map((row) => {
    const newsId = String(row.newsId);
    const communityId = String(row.communityId);
    const primaryCommunity: AdminNewsCommunity = {
      communityId,
      name: String(row.communityName ?? ""),
      slug: String(row.communitySlug ?? ""),
      isActive: !!row.communityIsActive,
    };
    const communities = normalizeAdminNewsCommunities(
      newsId,
      primaryCommunity,
      communitiesByNewsId.get(newsId.toLowerCase()) ?? []
    );

    return {
      newsId,
      communityId,
      communityIds: communities.map((community) => community.communityId),
      communities,
      communityName: primaryCommunity.name,
      communitySlug: primaryCommunity.slug,
      title: String(row.title ?? ""),
      slug: String(row.slug ?? ""),
      isPublic: !!row.isPublic,
      isFeatured: !!row.isFeatured,
      publishedAt: mapNullableDate(row.publishedAt),
      createdAt: mapNullableDate(row.createdAt),
      updatedAt: mapNullableDate(row.updatedAt),
    };
  });
}

export async function getAdminNewsById(
  newsId: string
): Promise<AdminNewsDetails | null> {
  const normalizedNewsId = normalizeRequiredText(newsId);
  if (!isUniqueIdentifier(normalizedNewsId)) {
    return null;
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("newsId", sql.UniqueIdentifier, normalizedNewsId)
    .query(/* sql */ `
      SELECT TOP 1
        n.NewsId AS newsId,
        n.CommunityId AS communityId,
        primaryCommunity.Name AS primaryCommunityName,
        primaryCommunity.Slug AS primaryCommunitySlug,
        CAST(ISNULL(primaryCommunity.IsActive, 0) AS bit) AS primaryCommunityIsActive,
        n.Title AS title,
        n.Slug AS slug,
        n.Summary AS summary,
        n.BodyHtml AS bodyHtml,
        n.ImageUrl AS imageUrl,
        CAST(ISNULL(n.IsFeatured, 0) AS bit) AS isFeatured,
        CAST(ISNULL(n.IsPublic, 0) AS bit) AS isPublic,
        n.SortOrder AS sortOrder,
        n.PublishedAt AS publishedAt,
        n.CreatedAt AS createdAt,
        n.UpdatedAt AS updatedAt
      FROM cms.News n
      LEFT JOIN cms.Communities AS primaryCommunity
        ON primaryCommunity.CommunityId = n.CommunityId
      WHERE CAST(n.NewsId AS NVARCHAR(50)) =
        CAST(@newsId AS NVARCHAR(50))
    `);

  const row = result.recordset?.[0];
  if (!row) {
    return null;
  }

  const [imagesResult, communitiesResult] = await Promise.all([
    pool
      .request()
      .input("newsId", sql.UniqueIdentifier, normalizedNewsId)
      .query(/* sql */ `
        SELECT
          NewsImageId AS newsImageId,
          NewsId AS newsId,
          ImageUrl AS imageUrl,
          Caption AS caption,
          SortOrder AS sortOrder,
          CAST(IsCover AS bit) AS isCover,
          BlobName AS blobName,
          CreatedAt AS createdAt
        FROM cms.NewsImages
        WHERE NewsId = @newsId
        ORDER BY SortOrder, NewsImageId
      `),
    pool
      .request()
      .input("newsId", sql.UniqueIdentifier, normalizedNewsId)
      .query(/* sql */ `
        SELECT
          c.CommunityId AS communityId,
          c.Name AS name,
          c.Slug AS slug,
          CAST(ISNULL(c.IsActive, 0) AS bit) AS isActive
        FROM cms.NewsCommunities AS nc
        INNER JOIN cms.Communities AS c
          ON c.CommunityId = nc.CommunityId
        WHERE nc.NewsId = CAST(@newsId AS UNIQUEIDENTIFIER)
        ORDER BY c.Name, c.CommunityId
      `),
  ]);

  const primaryCommunity: AdminNewsCommunity = {
    communityId: String(row.communityId),
    name: String(row.primaryCommunityName ?? ""),
    slug: String(row.primaryCommunitySlug ?? ""),
    isActive: !!row.primaryCommunityIsActive,
  };
  const communities = normalizeAdminNewsCommunities(
    String(row.newsId),
    primaryCommunity,
    (communitiesResult.recordset ?? []).map((communityRow) =>
      mapAdminNewsCommunityRow(communityRow)
    )
  );

  return {
    newsId: String(row.newsId),
    communityId: String(row.communityId),
    communityIds: communities.map((community) => community.communityId),
    communities,
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    summary: String(row.summary ?? ""),
    bodyHtml: String(row.bodyHtml ?? ""),
    imageUrl: row.imageUrl == null ? null : String(row.imageUrl),
    images: (imagesResult.recordset ?? []).map((imageRow) =>
      mapNewsImageRow(imageRow)
    ),
    isFeatured: !!row.isFeatured,
    isPublic: !!row.isPublic,
    sortOrder:
      typeof row.sortOrder === "number"
        ? row.sortOrder
        : row.sortOrder == null
          ? null
          : Number(row.sortOrder),
    publishedAt: mapNullableDate(row.publishedAt),
    createdAt: mapNullableDate(row.createdAt),
    updatedAt: mapNullableDate(row.updatedAt),
  };
}

export async function createAdminNews(
  input: CreateAdminNewsInput
): Promise<{ newsId: string; communityId: string; communityIds: string[] }> {
  const normalized = normalizeNewsInput(input);
  const newsId = randomUUID();
  const images = buildCreateImages(newsId, normalized);
  const primaryCommunityId = selectCreatePrimaryCommunityId(normalized);
  const coverImageUrl = getNewsCoverImage(images)?.imageUrl ?? null;
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    await ensureCommunitiesExistInTransaction(
      transaction,
      normalized.communityIds
    );
    await ensureUniqueNewsSlugInTransaction(
      transaction,
      normalized.communityIds,
      normalized.slug
    );

    await new sql.Request(transaction)
      .input(
        "newsId",
        sql.UniqueIdentifier,
        normalizeUniqueIdentifier(newsId, "NewsId")
      )
      .input("communityId", sql.UniqueIdentifier, primaryCommunityId)
      .input("title", sql.NVarChar(sql.MAX), normalized.title)
      .input("slug", sql.NVarChar(sql.MAX), normalized.slug)
      .input("summary", sql.NVarChar(sql.MAX), normalized.summary)
      .input("bodyHtml", sql.NVarChar(sql.MAX), normalized.bodyHtml)
      .input("imageUrl", sql.NVarChar(500), coverImageUrl)
      .input("isFeatured", sql.Bit, normalized.isFeatured)
      .input("isPublic", sql.Bit, normalized.isPublic)
      .input("hasSortOrder", sql.Bit, normalized.hasSortOrder)
      .input("sortOrder", sql.Int, normalized.sortOrder ?? 0)
      .query(/* sql */ `
        INSERT INTO cms.News (
          NewsId,
          CommunityId,
          Title,
          Slug,
          Summary,
          BodyHtml,
          ImageUrl,
          IsFeatured,
          IsPublic,
          SortOrder,
          PublishedAt,
          CreatedAt,
          UpdatedAt
        )
        VALUES (
          @newsId,
          @communityId,
          @title,
          @slug,
          @summary,
          @bodyHtml,
          @imageUrl,
          @isFeatured,
          @isPublic,
          CASE WHEN @hasSortOrder = 1 THEN @sortOrder ELSE NULL END,
          SYSDATETIME(),
          SYSDATETIME(),
          SYSDATETIME()
        )
      `);

    for (const communityId of normalized.communityIds) {
      await insertNewsCommunity(transaction, newsId, communityId);
    }

    for (const image of images) {
      await insertNewsImage(transaction, image);
    }

    await transaction.commit();
    return {
      newsId,
      communityId: primaryCommunityId,
      communityIds: [...normalized.communityIds],
    };
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
}

function mergeUpdateImages(
  newsId: string,
  existingImages: NewsImage[],
  imageInputs: NewsImageWriteInput[] | undefined,
  legacyImageUrl: string | null
): NewsImage[] {
  if (imageInputs === undefined) {
    if (existingImages.length > 0) {
      return normalizeNewsImages(existingImages);
    }

    if (!legacyImageUrl) {
      return [];
    }

    return normalizeNewsImages([
      createNewsImage(
        newsId,
        {
          imageUrl: legacyImageUrl,
          caption: null,
          sortOrder: 1,
          isCover: true,
          blobName: null,
        },
        { allowMissingBlobName: true }
      ),
    ]);
  }

  const existingById = new Map(
    existingImages.map((image) => [image.newsImageId, image])
  );

  const merged = imageInputs.map((imageInput) => {
    if (!imageInput.newsImageId) {
      return createNewsImage(newsId, imageInput);
    }

    const existingImage = existingById.get(imageInput.newsImageId);
    if (!existingImage) {
      throw new Error("Una imagen indicada no pertenece a esta noticia.");
    }

    const requestedImageUrl = normalizeImageUrl(imageInput.imageUrl);
    if (requestedImageUrl !== existingImage.imageUrl) {
      throw new Error("No se puede cambiar la URL de una imagen existente.");
    }

    const requestedBlobName = normalizeBlobName(imageInput.blobName);
    if (
      requestedBlobName !== null &&
      requestedBlobName !== existingImage.blobName
    ) {
      throw new Error("No se puede cambiar el BlobName de una imagen existente.");
    }

    return {
      ...existingImage,
      caption: normalizeCaption(imageInput.caption),
      sortOrder: Number(imageInput.sortOrder) || existingImage.sortOrder,
      isCover: imageInput.isCover === true,
    };
  });

  if (merged.length > NEWS_IMAGE_MAX_FILES) {
    throw new Error(
      `Una noticia puede tener como maximo ${NEWS_IMAGE_MAX_FILES} imagenes.`
    );
  }

  return normalizeNewsImages(merged);
}

export async function updateAdminNews(
  input: UpdateAdminNewsInput
): Promise<UpdateAdminNewsResult> {
  const newsId = normalizeUniqueIdentifier(input.newsId, "NewsId");

  const normalized = normalizeNewsInput(input);
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  const removedBlobNames: string[] = [];

  await transaction.begin();

  try {
    const existingNewsResult = await new sql.Request(transaction)
      .input("newsId", sql.UniqueIdentifier, newsId)
      .query(/* sql */ `
        SELECT TOP 1 NewsId, CommunityId, ImageUrl
        FROM cms.News WITH (UPDLOCK, HOLDLOCK)
        WHERE NewsId = @newsId
      `);

    if (!existingNewsResult.recordset?.[0]) {
      throw new Error("Noticia no encontrada");
    }

    const existingNews = existingNewsResult.recordset[0];
    const currentPrimaryCommunityId = normalizeUniqueIdentifier(
      existingNews.CommunityId,
      "CommunityId principal"
    );
    const primaryCommunityId = selectUpdatePrimaryCommunityId(
      currentPrimaryCommunityId,
      normalized.communityIds
    );

    const existingCommunitiesResult = await new sql.Request(transaction)
      .input("newsId", sql.UniqueIdentifier, newsId)
      .query(/* sql */ `
        SELECT CommunityId
        FROM cms.NewsCommunities WITH (UPDLOCK, HOLDLOCK)
        WHERE NewsId = CAST(@newsId AS UNIQUEIDENTIFIER)
        ORDER BY CommunityId
      `);
    const existingCommunityIds = (existingCommunitiesResult.recordset ?? []).map(
      (row) => normalizeUniqueIdentifier(row.CommunityId, "CommunityId asociado")
    );
    const existingCommunityKeys = new Set(
      existingCommunityIds.map((communityId) => communityId.toLowerCase())
    );
    const selectedCommunityKeys = new Set(
      normalized.communityIds.map((communityId) => communityId.toLowerCase())
    );
    const addedCommunityIds = normalized.communityIds.filter(
      (communityId) => !existingCommunityKeys.has(communityId.toLowerCase())
    );
    const retainedCommunityIds = normalized.communityIds.filter((communityId) =>
      existingCommunityKeys.has(communityId.toLowerCase())
    );
    const removedCommunityIds = existingCommunityIds.filter(
      (communityId) => !selectedCommunityKeys.has(communityId.toLowerCase())
    );

    if (
      retainedCommunityIds.length + addedCommunityIds.length !==
      normalized.communityIds.length
    ) {
      throw new Error("No se pudo normalizar la seleccion de comunidades.");
    }

    await ensureCommunitiesExistInTransaction(
      transaction,
      normalized.communityIds
    );
    await ensureUniqueNewsSlugInTransaction(
      transaction,
      normalized.communityIds,
      normalized.slug,
      newsId
    );

    for (const communityId of addedCommunityIds) {
      await insertNewsCommunity(transaction, newsId, communityId);
    }

    const existingImagesResult = await new sql.Request(transaction)
      .input("newsId", sql.UniqueIdentifier, newsId)
      .query(/* sql */ `
        SELECT
          NewsImageId AS newsImageId,
          NewsId AS newsId,
          ImageUrl AS imageUrl,
          Caption AS caption,
          SortOrder AS sortOrder,
          CAST(IsCover AS bit) AS isCover,
          BlobName AS blobName,
          CreatedAt AS createdAt
        FROM cms.NewsImages WITH (UPDLOCK, HOLDLOCK)
        WHERE NewsId = @newsId
        ORDER BY SortOrder, NewsImageId
      `);

    const existingImages = (existingImagesResult.recordset ?? []).map(
      (row) => mapNewsImageRow(row)
    );
    const finalImages = mergeUpdateImages(
      newsId,
      existingImages,
      normalized.images,
      normalized.imageUrl
    );
    const finalImageIds = new Set(
      finalImages.map((image) => image.newsImageId)
    );

    for (const existingImage of existingImages) {
      if (!finalImageIds.has(existingImage.newsImageId)) {
        if (existingImage.blobName) {
          removedBlobNames.push(existingImage.blobName);
        }

        await new sql.Request(transaction)
          .input(
            "newsImageId",
            sql.UniqueIdentifier,
            normalizeUniqueIdentifier(
              existingImage.newsImageId,
              "NewsImageId"
            )
          )
          .input("newsId", sql.UniqueIdentifier, newsId)
          .query(/* sql */ `
            DELETE FROM cms.NewsImages
            WHERE NewsImageId = @newsImageId
              AND NewsId = @newsId
          `);
      }
    }

    await new sql.Request(transaction)
      .input("newsId", sql.UniqueIdentifier, newsId)
      .query(/* sql */ `
        UPDATE cms.NewsImages
        SET SortOrder = SortOrder + 1000,
            IsCover = 0
        WHERE NewsId = @newsId
      `);

    const existingImageIds = new Set(
      existingImages.map((image) => image.newsImageId)
    );

    for (const image of finalImages) {
      if (!existingImageIds.has(image.newsImageId)) {
        continue;
      }

      await new sql.Request(transaction)
        .input(
          "newsImageId",
          sql.UniqueIdentifier,
          normalizeUniqueIdentifier(image.newsImageId, "NewsImageId")
        )
        .input("newsId", sql.UniqueIdentifier, newsId)
        .input("caption", sql.NVarChar(200), image.caption)
        .input("sortOrder", sql.Int, image.sortOrder)
        .input("isCover", sql.Bit, image.isCover)
        .query(/* sql */ `
          UPDATE cms.NewsImages
          SET Caption = @caption,
              SortOrder = @sortOrder,
              IsCover = @isCover
          WHERE NewsImageId = @newsImageId
            AND NewsId = @newsId
        `);
    }

    for (const image of finalImages) {
      if (existingImageIds.has(image.newsImageId)) {
        continue;
      }
      await insertNewsImage(transaction, image);
    }

    const coverImageUrl = getNewsCoverImage(finalImages)?.imageUrl ?? null;

    await new sql.Request(transaction)
      .input("newsId", sql.UniqueIdentifier, newsId)
      .input("communityId", sql.UniqueIdentifier, primaryCommunityId)
      .input("title", sql.NVarChar(sql.MAX), normalized.title)
      .input("slug", sql.NVarChar(sql.MAX), normalized.slug)
      .input("summary", sql.NVarChar(sql.MAX), normalized.summary)
      .input("bodyHtml", sql.NVarChar(sql.MAX), normalized.bodyHtml)
      .input("imageUrl", sql.NVarChar(500), coverImageUrl)
      .input("isFeatured", sql.Bit, normalized.isFeatured)
      .input("isPublic", sql.Bit, normalized.isPublic)
      .input("hasSortOrder", sql.Bit, normalized.hasSortOrder)
      .input("sortOrder", sql.Int, normalized.sortOrder ?? 0)
      .query(/* sql */ `
        UPDATE cms.News
        SET CommunityId = @communityId,
            Title = @title,
            Slug = @slug,
            Summary = @summary,
            BodyHtml = @bodyHtml,
            ImageUrl = @imageUrl,
            IsFeatured = @isFeatured,
            IsPublic = @isPublic,
            SortOrder = CASE
              WHEN @hasSortOrder = 1 THEN @sortOrder
              ELSE NULL
            END,
            PublishedAt = ISNULL(PublishedAt, SYSDATETIME()),
            UpdatedAt = SYSDATETIME()
        WHERE NewsId = @newsId
      `);

    for (const communityId of removedCommunityIds) {
      await new sql.Request(transaction)
        .input("newsId", sql.UniqueIdentifier, newsId)
        .input("communityId", sql.UniqueIdentifier, communityId)
        .query(/* sql */ `
          DELETE FROM cms.NewsCommunities
          WHERE NewsId = CAST(@newsId AS UNIQUEIDENTIFIER)
            AND CommunityId = CAST(@communityId AS UNIQUEIDENTIFIER)
        `);
    }

    await transaction.commit();
    return {
      newsId,
      communityId: primaryCommunityId,
      communityIds: [...normalized.communityIds],
      removedBlobNames,
    };
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
}
