// src/app/api/communities/[slug]/news/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCommunityBySlug, listPublicCommunityNews } from "@/lib/data";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const normalizedSlug = String(slug ?? "").trim().toLowerCase();

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "6", 10), 24);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

  try {
    const community = await getCommunityBySlug(normalizedSlug);
    if (!community || !community.isActive) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const result = await listPublicCommunityNews(community.id, { limit, offset });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[News API]", err);
    return NextResponse.json({ items: [], total: 0 });
  }
}
