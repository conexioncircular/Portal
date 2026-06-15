import { getPool } from "./db";

export type Community = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  logoUrl: string | null;
};

export type CommunityNewsListItem = {
  NewsId: string;
  Title: string;
  Slug: string;
  Summary: string | null;
  ImageUrl: string | null;
  IsFeatured: boolean;
  PublishedAt: Date | string | null;
  CreatedAt: Date | string | null;
};

export type CommunityNewsDetail = CommunityNewsListItem & {
  CommunityId: string;
  BodyHtml: string | null;
  IsPublic: boolean;
  SortOrder: number | null;
  UpdatedAt: Date | string | null;
};

function normSlug(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

function mapCommunityRow(row: Record<string, unknown>): Community {
  return {
    id: String(row.id),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    isActive: !!row.isActive,
    logoUrl: row.logoUrl == null ? null : String(row.logoUrl),
  };
}

function mapCommunityNewsListItem(row: Record<string, unknown>): CommunityNewsListItem {
  return {
    NewsId: String(row.NewsId),
    Title: String(row.Title ?? ""),
    Slug: String(row.Slug ?? ""),
    Summary: row.Summary == null ? null : String(row.Summary),
    ImageUrl: row.ImageUrl == null ? null : String(row.ImageUrl),
    IsFeatured: !!row.IsFeatured,
    PublishedAt: row.PublishedAt == null ? null : (row.PublishedAt as Date | string),
    CreatedAt: row.CreatedAt == null ? null : (row.CreatedAt as Date | string),
  };
}

export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("slug", normSlug(slug))
    .query(/* sql */ `
      SELECT TOP 1
        c.CommunityId AS id,
        c.Slug AS slug,
        c.Name AS name,
        c.IsActive AS isActive,
        p.LogoUrl AS logoUrl
      FROM cms.Communities c
      LEFT JOIN cms.Pages p
        ON LOWER(p.Path) = CONCAT('/comunidades/', LOWER(c.Slug))
      WHERE LOWER(c.Slug) = @slug
    `);

  const row = result.recordset?.[0];
  return row ? mapCommunityRow(row) : null;
}

export async function listPublicCommunityNews(
  communityId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ items: CommunityNewsListItem[]; total: number }> {
  const limit = Math.min(Math.max(Math.trunc(options?.limit ?? 6), 1), 24);
  const offset = Math.max(Math.trunc(options?.offset ?? 0), 0);

  const pool = await getPool();
  const result = await pool
    .request()
    .input("communityId", communityId)
    .input("limit", limit)
    .input("offset", offset)
    .query(/* sql */ `
      SELECT
        NewsId,
        Title,
        Slug,
        Summary,
        ImageUrl,
        CAST(ISNULL(IsFeatured, 0) AS bit) AS IsFeatured,
        PublishedAt,
        CreatedAt,
        COUNT(1) OVER() AS TotalRows
      FROM cms.News
      WHERE CommunityId = @communityId
        AND IsPublic = 1
      ORDER BY IsFeatured DESC,
               CASE WHEN SortOrder IS NULL THEN 1 ELSE 0 END ASC,
               COALESCE(SortOrder, 9999) ASC,
               COALESCE(PublishedAt, CreatedAt) DESC,
               CreatedAt DESC,
               NewsId DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

  const rows = result.recordset ?? [];
  const total = rows[0]?.TotalRows ?? 0;

  return {
    items: rows.map((row) => mapCommunityNewsListItem(row)),
    total: Number(total) || 0,
  };
}

export async function getPublicCommunityNewsDetail(
  communityId: string,
  newsSlug: string
): Promise<CommunityNewsDetail | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("communityId", communityId)
    .input("newsSlug", normSlug(newsSlug))
    .query(/* sql */ `
      SELECT TOP 1
        NewsId,
        CommunityId,
        Title,
        Slug,
        Summary,
        BodyHtml,
        ImageUrl,
        CAST(ISNULL(IsFeatured, 0) AS bit) AS IsFeatured,
        CAST(ISNULL(IsPublic, 0) AS bit) AS IsPublic,
        SortOrder,
        PublishedAt,
        CreatedAt,
        UpdatedAt
      FROM cms.News
      WHERE CommunityId = @communityId
        AND LOWER(Slug) = LOWER(@newsSlug)
        AND IsPublic = 1
    `);

  const row = result.recordset?.[0];
  if (!row) {
    return null;
  }

  return {
    ...mapCommunityNewsListItem(row),
    CommunityId: String(row.CommunityId),
    BodyHtml: row.BodyHtml == null ? null : String(row.BodyHtml),
    IsPublic: !!row.IsPublic,
    SortOrder: row.SortOrder == null ? null : Number(row.SortOrder),
    UpdatedAt: row.UpdatedAt == null ? null : (row.UpdatedAt as Date | string),
  };
}

export async function getAllActiveSlugs(): Promise<string[]> {
  const pool = await getPool();
  const result = await pool.request().query(/* sql */ `
    SELECT Slug AS slug
    FROM cms.Communities
    WHERE IsActive = 1
  `);

  return result.recordset.map((row: { slug: string }) => String(row.slug));
}
