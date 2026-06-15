import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "password requerido" }, { status: 400 });
    }
    const hash = await argon2.hash(password);
    return NextResponse.json({ hash });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}

