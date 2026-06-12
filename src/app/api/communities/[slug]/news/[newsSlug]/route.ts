// src/app/api/communities/[slug]/news/[newsSlug]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCommunityBySlug, getPublicCommunityNewsDetail } from "@/lib/data";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string; newsSlug: string }> }
) {
  const { slug, newsSlug } = await ctx.params;

  const normalizedCommunity = String(slug ?? "").trim().toLowerCase();
  const normalizedNewsSlug = String(newsSlug ?? "").trim().toLowerCase();

  if (!normalizedCommunity || !normalizedNewsSlug) {
    return NextResponse.json({ item: null, error: "Missing params" }, { status: 400 });
  }

  try {
    const community = await getCommunityBySlug(normalizedCommunity);
    if (!community || !community.isActive) {
      return NextResponse.json({ item: null, error: "Community not found" }, { status: 404 });
    }

    const item = await getPublicCommunityNewsDetail(community.id, normalizedNewsSlug);
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
