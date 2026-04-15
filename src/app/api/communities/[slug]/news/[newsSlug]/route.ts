// src/app/api/communities/[slug]/news/[newsSlug]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string; newsSlug: string }> }
) {
  const { slug, newsSlug } = await ctx.params;

  const normCommunity = String(slug ?? "").trim().toLowerCase();
  const normNewsSlug = String(newsSlug ?? "").trim().toLowerCase();

  if (!normCommunity || !normNewsSlug) {
    return NextResponse.json({ item: null, error: "Missing params" }, { status: 400 });
  }

  const p1 = `/${normCommunity}`;
  const p2 = `/comunidades/${normCommunity}`;

  try {
    const pool = await getPool();

    // 1) Resolver CommunityId igual que en tu endpoint de listado
    const pageRes = await pool
      .request()
      .input("p1", p1)
      .input("p2", p2)
      .query(`
        SELECT TOP 1 CommunityId
        FROM cms.Pages
        WHERE LOWER(Path) = LOWER(@p1) OR LOWER(Path) = LOWER(@p2)
      `);

    const communityId: string | undefined = pageRes.recordset?.[0]?.CommunityId;

    if (!communityId) {
      return NextResponse.json({ item: null, error: "Community not found" }, { status: 404 });
    }

    // 2) Traer la noticia completa de esa comunidad
    const detailRes = await pool
      .request()
      .input("cid", communityId)
      .input("newsSlug", normNewsSlug)
      .query(`
        SELECT TOP 1
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
        FROM cms.News
        WHERE CAST(CommunityId AS NVARCHAR(50)) = CAST(@cid AS NVARCHAR(50))
          AND LOWER(Slug) = LOWER(@newsSlug)
          AND IsPublic = 1
      `);

    const item = detailRes.recordset?.[0] ?? null;

    if (!item) {
      return NextResponse.json({ item: null, error: "News not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error("[News Detail API]", err);
    return NextResponse.json(
      { item: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}