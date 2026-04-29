import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { listManagedPages } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdminSession();
  if ("response" in guard) {
    return guard.response;
  }

  const pages = await listManagedPages();
  return NextResponse.json({ pages });
}