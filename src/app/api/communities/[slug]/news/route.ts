// src/app/api/communities/[slug]/news/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import * as sql from "mssql";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> } // en Next 16 params viene como Promise
) {
  const { slug } = await ctx.params;
  const norm = String(slug ?? "").trim().toLowerCase();

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "6", 10), 24);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

  // Tu path real es /comunidades/<slug>, pero soportamos ambas variantes
  const p1 = `/${norm}`;
  const p2 = `/comunidades/${norm}`;

  try {
    const pool = await getPool();

    // 1) Resolver CommunityId por Path (DEJAMOS que mssql infiera tipo para p1/p2)
    const pageRes = await pool
      .request()
      .input("p1", p1) // sin tipo explícito
      .input("p2", p2) // sin tipo explícito
      .query(`
        SELECT TOP 1 CommunityId
        FROM cms.Pages
        WHERE LOWER(Path) = LOWER(@p1) OR LOWER(Path) = LOWER(@p2)
      `);

    const communityId: string | undefined = pageRes.recordset?.[0]?.CommunityId;
    if (!communityId) {
      return NextResponse.json({ items: [], total: 0 });
    }

    // 2) Total (comparación TOLERANTE a tipos)
    const totalRes = await pool
      .request()
      .input("cid", communityId) // sin tipo explícito
      .query(`
        SELECT COUNT(1) AS Total
        FROM cms.News
        WHERE CAST(CommunityId AS NVARCHAR(50)) = CAST(@cid AS NVARCHAR(50))
          AND IsPublic = 1
      `);
    const total = totalRes.recordset?.[0]?.Total ?? 0;

    // 3) Lista (solo tipamos ints)
    const listRes = await pool
      .request()
      .input("cid", communityId) // sin tipo explícito
      .input("limit", limit)
      .input("offset", offset)
      .query(`
        SELECT
          NewsId, Title, Slug, Summary, ImageUrl, IsFeatured, PublishedAt, CreatedAt
        FROM cms.News
        WHERE CAST(CommunityId AS NVARCHAR(50)) = CAST(@cid AS NVARCHAR(50))
          AND IsPublic = 1
        ORDER BY IsFeatured DESC,
                 COALESCE(PublishedAt, CreatedAt) DESC,
                 COALESCE(SortOrder, 9999) ASC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    return NextResponse.json({ items: listRes.recordset ?? [], total });
  } catch (err) {
    console.error("[News API]", err);
    return NextResponse.json({ items: [], total: 0 });
  }
}

