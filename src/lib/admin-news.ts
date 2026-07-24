import { getPool } from "@/lib/db";
import { sanitizeRichHtml } from "@/lib/html-sanitizer";

export type AdminNewsCommunity = {
  communityId: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type AdminNewsListItem = {
  newsId: string;
  communityId: string;
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
  title: string;
  slug: string;
  summary: string;
  bodyHtml: string;
  imageUrl: string | null;
  isFeatured: boolean;
  isPublic: boolean;
  sortOrder: number | null;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type CreateAdminNewsInput = {
  communityId: string;
  title: string;
  slug: string;
  summary: string;
  bodyHtml: string;
  imageUrl?: string | null;
  isFeatured?: boolean;
  isPublic?: boolean;
  sortOrder?: number | null;
};

export type UpdateAdminNewsInput = CreateAdminNewsInput & {
  newsId: string;
};

function normalizeRequiredText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeSlug(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizePublishedAt(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Fecha de publicación inválida");
  }

  return parsed;
}

export async function listAdminNewsCommunities(): Promise<AdminNewsCommunity[]> {
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

export async function listAdminNews(): Promise<AdminNewsListItem[]> {
  const pool = await getPool();
  const result = await pool.request().query(/* sql */ `
    SELECT
      n.NewsId AS newsId,
      n.CommunityId AS communityId,
      c.Name AS communityName,
      c.Slug AS communitySlug,
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

  return (result.recordset ?? []).map((row) => ({
    newsId: String(row.newsId),
    communityId: String(row.communityId),
    communityName: String(row.communityName ?? ""),
    communitySlug: String(row.communitySlug ?? ""),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    isPublic: !!row.isPublic,
    isFeatured: !!row.isFeatured,
    publishedAt: row.publishedAt instanceof Date ? row.publishedAt : row.publishedAt ? new Date(row.publishedAt) : null,
    createdAt: row.createdAt instanceof Date ? row.createdAt : row.createdAt ? new Date(row.createdAt) : null,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : row.updatedAt ? new Date(row.updatedAt) : null,
  }));
}

export async function getAdminNewsById(newsId: string): Promise<AdminNewsDetails | null> {
  const normalizedNewsId = normalizeRequiredText(newsId);
  if (!normalizedNewsId) {
    return null;
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("newsId", normalizedNewsId)
    .query(/* sql */ `
      SELECT TOP 1
        n.NewsId AS newsId,
        n.CommunityId AS communityId,
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
      WHERE CAST(n.NewsId AS NVARCHAR(50)) = CAST(@newsId AS NVARCHAR(50))
    `);

  const row = result.recordset?.[0];
  if (!row) {
    return null;
  }

  return {
    newsId: String(row.newsId),
    communityId: String(row.communityId),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    summary: String(row.summary ?? ""),
    bodyHtml: String(row.bodyHtml ?? ""),
    imageUrl: row.imageUrl == null ? null : String(row.imageUrl),
    isFeatured: !!row.isFeatured,
    isPublic: !!row.isPublic,
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : row.sortOrder == null ? null : Number(row.sortOrder),
    publishedAt: row.publishedAt instanceof Date ? row.publishedAt : row.publishedAt ? new Date(row.publishedAt) : null,
    createdAt: row.createdAt instanceof Date ? row.createdAt : row.createdAt ? new Date(row.createdAt) : null,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : row.updatedAt ? new Date(row.updatedAt) : null,
  };
}

async function ensureCommunityExists(communityId: string): Promise<void> {
  const pool = await getPool();
  const communityResult = await pool
    .request()
    .input("communityId", communityId)
    .query(/* sql */ `
      SELECT TOP 1 CommunityId
      FROM cms.Communities
      WHERE CAST(CommunityId AS NVARCHAR(50)) = CAST(@communityId AS NVARCHAR(50))
    `);

  if (!communityResult.recordset?.[0]) {
    throw new Error("Comunidad no encontrada");
  }
}

async function ensureUniqueNewsSlug(communityId: string, slug: string, excludeNewsId?: string): Promise<void> {
  const pool = await getPool();
  const request = pool
    .request()
    .input("communityId", communityId)
    .input("slug", slug);

  const exclusionClause = excludeNewsId
    ? "AND CAST(NewsId AS NVARCHAR(50)) <> CAST(@excludeNewsId AS NVARCHAR(50))"
    : "";

  if (excludeNewsId) {
    request.input("excludeNewsId", excludeNewsId);
  }

  const duplicateResult = await request.query(/* sql */ `
    SELECT TOP 1 NewsId
    FROM cms.News
    WHERE CAST(CommunityId AS NVARCHAR(50)) = CAST(@communityId AS NVARCHAR(50))
      AND LOWER(Slug) = LOWER(@slug)
      ${exclusionClause}
  `);

  if (duplicateResult.recordset?.[0]) {
    throw new Error("Ya existe una noticia con ese slug para esta comunidad.");
  }
}

function normalizeNewsInput(input: CreateAdminNewsInput | UpdateAdminNewsInput) {
  const communityId = normalizeRequiredText(input.communityId);
  const title = normalizeRequiredText(input.title);
  const slug = normalizeSlug(input.slug);
  const summary = normalizeRequiredText(input.summary);
  const bodyHtml = sanitizeRichHtml(normalizeRequiredText(input.bodyHtml));
  const imageUrl = normalizeOptionalText(input.imageUrl);
  const isFeatured = !!input.isFeatured;
  const isPublic = input.isPublic ?? true;
  const sortOrder = typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
    ? Math.trunc(input.sortOrder)
    : null;
  const hasSortOrder = sortOrder !== null;

  if (!communityId) {
    throw new Error("CommunityId obligatorio");
  }
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
    communityId,
    title,
    slug,
    summary,
    bodyHtml,
    imageUrl,
    isFeatured,
    isPublic,
    sortOrder,
    hasSortOrder,
  };
}

export async function createAdminNews(input: CreateAdminNewsInput): Promise<{ newsId: string }> {
  const { communityId, title, slug, summary, bodyHtml, imageUrl, isFeatured, isPublic, sortOrder, hasSortOrder } = normalizeNewsInput(input);

  await ensureCommunityExists(communityId);
  await ensureUniqueNewsSlug(communityId, slug);

  const pool = await getPool();

  const insertResult = await pool
    .request()
    .input("communityId", communityId)
    .input("title", title)
    .input("slug", slug)
    .input("summary", summary)
    .input("bodyHtml", bodyHtml)
    .input("imageUrl", imageUrl)
    .input("isFeatured", isFeatured)
    .input("isPublic", isPublic)
    .input("hasSortOrder", hasSortOrder)
    .input("sortOrder", sortOrder ?? 0)
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
      OUTPUT INSERTED.NewsId AS newsId
      VALUES (
        NEWID(),
        CAST(@communityId AS uniqueidentifier),
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

  const inserted = insertResult.recordset?.[0];
  if (!inserted?.newsId) {
    throw new Error("No se pudo guardar la noticia");
  }

  return { newsId: String(inserted.newsId) };
}

export async function updateAdminNews(input: UpdateAdminNewsInput): Promise<{ newsId: string }> {
  const newsId = normalizeRequiredText(input.newsId);
  if (!newsId) {
    throw new Error("NewsId obligatorio");
  }

  const existing = await getAdminNewsById(newsId);
  if (!existing) {
    throw new Error("Noticia no encontrada");
  }

  const { communityId, title, slug, summary, bodyHtml, imageUrl, isFeatured, isPublic, sortOrder, hasSortOrder } = normalizeNewsInput(input);

  await ensureCommunityExists(communityId);
  await ensureUniqueNewsSlug(communityId, slug, newsId);

  const pool = await getPool();
  await pool
    .request()
    .input("newsId", newsId)
    .input("communityId", communityId)
    .input("title", title)
    .input("slug", slug)
    .input("summary", summary)
    .input("bodyHtml", bodyHtml)
    .input("imageUrl", imageUrl)
    .input("isFeatured", isFeatured)
    .input("isPublic", isPublic)
    .input("hasSortOrder", hasSortOrder)
    .input("sortOrder", sortOrder ?? 0)
    .query(/* sql */ `
      UPDATE cms.News
      SET CommunityId = CAST(@communityId AS uniqueidentifier),
          Title = @title,
          Slug = @slug,
          Summary = @summary,
          BodyHtml = @bodyHtml,
          ImageUrl = @imageUrl,
          IsFeatured = @isFeatured,
          IsPublic = @isPublic,
          SortOrder = CASE WHEN @hasSortOrder = 1 THEN @sortOrder ELSE NULL END,
          PublishedAt = ISNULL(PublishedAt, SYSDATETIME()),
          UpdatedAt = SYSDATETIME()
      WHERE CAST(NewsId AS NVARCHAR(50)) = CAST(@newsId AS NVARCHAR(50))
    `);

  return { newsId };
}
