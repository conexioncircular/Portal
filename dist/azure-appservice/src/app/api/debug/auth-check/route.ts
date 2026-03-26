import { NextRequest, NextResponse } from "next/server";
import * as sql from "mssql";
import { getPool } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "email requerido" }, { status: 400 });

    const pool = await getPool();
    const userRes = await pool
      .request()
      .input("email", sql.NVarChar(256), email)
      .query(
        `SELECT TOP 1 u.UserId, u.Email, u.DisplayName, u.PasswordHash, u.PasswordAlgo, u.IsActive
         FROM auth.Users u WHERE u.Email = @email`
      );

    const u = userRes.recordset?.[0];
    if (!u) return NextResponse.json({ found: false });

    const info = {
      found: true,
      userId: String(u.UserId),
      email: u.Email,
      isActive: !!u.IsActive,
      algo: u.PasswordAlgo ?? null,
      hasHash: !!u.PasswordHash,
      // In dev, expose a tiny prefix to recognize hash type
      hashPreview:
        process.env.NODE_ENV !== "production" && typeof u.PasswordHash === "string"
          ? String(u.PasswordHash).slice(0, 12)
          : undefined,
    };
    return NextResponse.json(info);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
