// src/lib/data.ts
import { getPool } from "./db";

export type Community = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
};

function normSlug(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  const pool = await getPool();
  const r = await pool
    .request()
    // ✅ Inferencia (sin tipo explícito) → evita EPARAM si hubiera un import raro
    .input("slug", normSlug(slug))
    .query(/* sql */ `
      SELECT TOP 1
        CommunityId AS id,
        Slug        AS slug,
        Name        AS name,
        IsActive    AS isActive
      FROM cms.Communities
      WHERE LOWER(Slug) = @slug
    `);

  const row = r.recordset?.[0] as Community | undefined;
  return row ?? null;
}

export async function getAllActiveSlugs(): Promise<string[]> {
  const pool = await getPool();
  const r = await pool.request().query(/* sql */ `
    SELECT Slug AS slug
    FROM cms.Communities
    WHERE IsActive = 1
  `);
  return r.recordset.map((x: { slug: string }) => String(x.slug));
}
