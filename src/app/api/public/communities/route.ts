// src/app/api/public/communities/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPool } from "@/lib/db";
import * as sql from "mssql";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // Responde 200 con array vacío para no romper el header
      return NextResponse.json([], { status: 200 });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      // Deja que mssql infiera el tipo del parámetro
      .input("email", session.user.email)
      .query(`
        SELECT DISTINCT 
          p.Title AS Title,
          p.Path  AS Path,
          NULL    AS LogoUrl   -- <- tu schema no tiene LogoUrl, lo seteamos a NULL
        FROM auth.Users u
        INNER JOIN cms.UserPageAccess a ON a.UserId = u.UserId
        INNER JOIN cms.Pages p          ON p.PageId = a.PageId
        WHERE u.Email = @email
        ORDER BY p.Title
      `);

    // Devuelve ARRAY PLANO porque tu AppHeader espera [{ Title, Path, LogoUrl }]
    return NextResponse.json(result.recordset ?? [], { status: 200 });
  } catch (err) {
    console.error("[User Communities API]", err);
    // Devuelve [] para no romper el render, pero loguea el error arriba
    return NextResponse.json([], { status: 200 });
  }
}
