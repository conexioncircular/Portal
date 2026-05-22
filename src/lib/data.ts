import { getPool } from "./db";

export type Community = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  logoUrl: string | null;
};

function normSlug(s: string) {
  return String(s ?? "").trim().toLowerCase();
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
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    isActive: !!row.isActive,
    logoUrl: row.logoUrl == null ? null : String(row.logoUrl),
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
