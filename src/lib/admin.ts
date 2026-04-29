import * as sql from "mssql";
import { getPool } from "./db";

export type AdminPrincipal = {
  userId?: string | null;
  email?: string | null;
};

export type ManagedPage = {
  pageId: string;
  title: string;
  path: string;
  isPublic: boolean;
};

function normalizeEmail(email?: string | null): string {
  return String(email ?? "").trim().toLowerCase();
}

function normalizePath(path?: string | null): string {
  const value = String(path ?? "").trim().toLowerCase();
  return value !== "/" && value.endsWith("/") ? value.slice(0, -1) : value;
}

function getBootstrapAdminEmails(): Set<string> {
  const raw = process.env.INTERNAL_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? "";

  return new Set(
    raw
      .split(/[;,\n]/)
      .map((value) => normalizeEmail(value))
      .filter(Boolean)
  );
}

export function isBootstrapAdminEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  return !!normalized && getBootstrapAdminEmails().has(normalized);
}

export async function ensureAdminUsersTable(): Promise<void> {
  const pool = await getPool();
  await pool.request().query(/* sql */ `
    IF OBJECT_ID(N'auth.AdminUsers', N'U') IS NULL
    BEGIN
      CREATE TABLE auth.AdminUsers (
        UserId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        Email NVARCHAR(256) NOT NULL UNIQUE,
        CreatedAt DATETIME2(0) NOT NULL
          CONSTRAINT DF_AdminUsers_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2(0) NOT NULL
          CONSTRAINT DF_AdminUsers_UpdatedAt DEFAULT SYSUTCDATETIME()
      );
    END
  `);
}

export async function isAdminPrincipal(principal: AdminPrincipal): Promise<boolean> {
  const email = normalizeEmail(principal.email);
  if (isBootstrapAdminEmail(email)) {
    return true;
  }

  const userId = String(principal.userId ?? "").trim();
  if (!userId && !email) {
    return false;
  }

  await ensureAdminUsersTable();

  const pool = await getPool();
  const request = pool.request();

  let whereClause = "";
  if (userId) {
    request.input("userId", sql.UniqueIdentifier, userId);
    whereClause = "UserId = @userId";
  }
  if (email) {
    request.input("email", sql.NVarChar(256), email);
    whereClause = whereClause ? `${whereClause} OR LOWER(Email) = LOWER(@email)` : "LOWER(Email) = LOWER(@email)";
  }

  const result = await request.query(`
    SELECT TOP 1 1 AS ok
    FROM auth.AdminUsers
    WHERE ${whereClause}
  `);

  return !!result.recordset?.[0];
}

export async function listManagedPages(): Promise<ManagedPage[]> {
  const pool = await getPool();
  const result = await pool.request().query(/* sql */ `
    SELECT
      p.PageId AS pageId,
      p.Title AS title,
      p.Path AS path,
      CAST(ISNULL(p.IsPublic, 0) AS bit) AS isPublic
    FROM cms.Pages p
    WHERE NULLIF(LTRIM(RTRIM(p.Path)), '') IS NOT NULL
    ORDER BY p.Title, p.Path
  `);

  return (result.recordset ?? []).map((row) => ({
    pageId: String(row.pageId),
    title: String(row.title ?? row.path ?? ""),
    path: String(row.path ?? "").trim(),
    isPublic: !!row.isPublic,
  }));
}

export async function getAdminAccessPaths(): Promise<{ paths: string[]; primary: string | null }> {
  const pages = await listManagedPages();
  const paths = Array.from(
    new Set(
      pages
        .map((page) => normalizePath(page.path))
        .filter(Boolean)
    )
  );

  const primary =
    paths.find((path) => path.startsWith("/comunidades/")) ??
    paths[0] ??
    null;

  return { paths, primary };
}

export async function upsertAdminUser(userId: string, email: string): Promise<void> {
  await ensureAdminUsersTable();

  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("email", sql.NVarChar(256), normalizeEmail(email))
    .query(/* sql */ `
      MERGE auth.AdminUsers AS target
      USING (SELECT @userId AS UserId, @email AS Email) AS source
      ON target.UserId = source.UserId
      WHEN MATCHED THEN
        UPDATE SET Email = source.Email, UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (UserId, Email)
        VALUES (source.UserId, source.Email);
    `);
}

export async function removeAdminUser(userId: string): Promise<void> {
  await ensureAdminUsersTable();

  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query("DELETE FROM auth.AdminUsers WHERE UserId = @userId");
}