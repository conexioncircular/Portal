import { getPool, sql } from "./db";
import sanitizeHtml from "sanitize-html";
import { sanitizeRichHtml } from "./html-sanitizer";
import { mapNewsImageRow, type NewsImage } from "./news-images";

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
  Images?: NewsImage[];
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
  const summary = row.Summary == null
    ? null
    : sanitizeHtml(String(row.Summary), { allowedTags: [], allowedAttributes: {} })
        .replace(/\s+/g, " ")
        .trim() || null;

  return {
    NewsId: String(row.NewsId),
    Title: String(row.Title ?? ""),
    Slug: String(row.Slug ?? ""),
    Summary: summary,
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
    .input("communityId", sql.UniqueIdentifier, communityId)
    .input("limit", limit)
    .input("offset", offset)
    .query(/* sql */ `
      SELECT
        n.NewsId,
        n.Title,
        n.Slug,
        n.Summary,
        COALESCE(coverImage.ImageUrl, firstImage.ImageUrl, n.ImageUrl) AS ImageUrl,
        CAST(ISNULL(n.IsFeatured, 0) AS bit) AS IsFeatured,
        n.PublishedAt,
        n.CreatedAt,
        COUNT(1) OVER() AS TotalRows
      FROM cms.News AS n
      INNER JOIN cms.NewsCommunities AS nc
        ON nc.NewsId = n.NewsId
       AND nc.CommunityId = @communityId
      OUTER APPLY (
        SELECT TOP (1) ni.ImageUrl
        FROM cms.NewsImages AS ni
        WHERE ni.NewsId = n.NewsId
          AND ni.IsCover = 1
        ORDER BY ni.SortOrder, ni.NewsImageId
      ) AS coverImage
      OUTER APPLY (
        SELECT TOP (1) ni.ImageUrl
        FROM cms.NewsImages AS ni
        WHERE ni.NewsId = n.NewsId
        ORDER BY ni.SortOrder, ni.NewsImageId
      ) AS firstImage
      WHERE n.IsPublic = 1
      ORDER BY n.IsFeatured DESC,
               CASE WHEN n.SortOrder IS NULL THEN 1 ELSE 0 END ASC,
               COALESCE(n.SortOrder, 9999) ASC,
               COALESCE(n.PublishedAt, n.CreatedAt) DESC,
               n.CreatedAt DESC,
               n.NewsId DESC
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
    .input("communityId", sql.UniqueIdentifier, communityId)
    .input("newsSlug", normSlug(newsSlug))
    .query(/* sql */ `
      SELECT TOP 1
        n.NewsId,
        nc.CommunityId,
        n.Title,
        n.Slug,
        n.Summary,
        n.BodyHtml,
        COALESCE(coverImage.ImageUrl, firstImage.ImageUrl, n.ImageUrl) AS ImageUrl,
        CAST(ISNULL(n.IsFeatured, 0) AS bit) AS IsFeatured,
        CAST(ISNULL(n.IsPublic, 0) AS bit) AS IsPublic,
        n.SortOrder,
        n.PublishedAt,
        n.CreatedAt,
        n.UpdatedAt
      FROM cms.News AS n
      INNER JOIN cms.NewsCommunities AS nc
        ON nc.NewsId = n.NewsId
       AND nc.CommunityId = @communityId
      OUTER APPLY (
        SELECT TOP (1) ni.ImageUrl
        FROM cms.NewsImages AS ni
        WHERE ni.NewsId = n.NewsId
          AND ni.IsCover = 1
        ORDER BY ni.SortOrder, ni.NewsImageId
      ) AS coverImage
      OUTER APPLY (
        SELECT TOP (1) ni.ImageUrl
        FROM cms.NewsImages AS ni
        WHERE ni.NewsId = n.NewsId
        ORDER BY ni.SortOrder, ni.NewsImageId
      ) AS firstImage
      WHERE LOWER(n.Slug) = LOWER(@newsSlug)
        AND n.IsPublic = 1
    `);

  const row = result.recordset?.[0];
  if (!row) {
    return null;
  }

  const imagesResult = await pool
    .request()
    .input("newsId", sql.UniqueIdentifier, String(row.NewsId))
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
      WHERE NewsId = CAST(@newsId AS uniqueidentifier)
      ORDER BY SortOrder, NewsImageId
    `);

  return {
    ...mapCommunityNewsListItem(row),
    Summary: row.Summary == null ? null : sanitizeRichHtml(row.Summary),
    CommunityId: String(row.CommunityId),
    BodyHtml: row.BodyHtml == null ? null : sanitizeRichHtml(row.BodyHtml),
    Images: (imagesResult.recordset ?? []).map((imageRow) =>
      mapNewsImageRow(imageRow)
    ),
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
