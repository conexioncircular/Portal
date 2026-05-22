import * as sql from "mssql";
import { getPool } from "@/lib/db";
import { buildCommunityPath, normalizeCommunitySlug } from "@/lib/community-slug";

export type AdminCommunityListItem = {
  communityId: string;
  pageId: string | null;
  name: string;
  slug: string;
  isActive: boolean;
  region: string | null;
  localidad: string | null;
  tipo: string | null;
  tramo: string | null;
  path: string | null;
  logoUrl: string | null;
};

export type AdminCommunityDetails = AdminCommunityListItem;

export type CreateAdminCommunityInput = {
  name: string;
  isActive?: boolean;
  region?: string | null;
  localidad?: string | null;
  tipo?: string | null;
  tramo?: string | null;
  logoUrl?: string | null;
};

export type UpdateAdminCommunityInput = CreateAdminCommunityInput & {
  communityId: string;
};

function normalizeRequiredText(
  value: unknown,
  label: string,
  maxLength: number
): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    throw new Error(`${label} obligatorio`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${label} supera el maximo de ${maxLength} caracteres`);
  }
  return normalized;
}

function normalizeOptionalText(
  value: unknown,
  label: string,
  maxLength: number
): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > maxLength) {
    throw new Error(`${label} supera el maximo de ${maxLength} caracteres`);
  }
  return normalized;
}

function normalizeCommunityId(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeEmail(value: string): string {
  return String(value ?? "").trim().toLowerCase();
}

function getBootstrapAdminEmails(): string[] {
  const raw = process.env.INTERNAL_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? "admincc";

  return Array.from(
    new Set(
      raw
        .split(/[;,\n]/)
        .map((value) => normalizeEmail(value))
        .filter(Boolean)
    )
  );
}

function normalizeTramo(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }

  if (!/^\d+$/.test(normalized)) {
    throw new Error("Tramo debe contener solo numeros enteros.");
  }

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Tramo debe ser un numero entero mayor que 0.");
  }

  return `Tramo ${parsed}`;
}

async function grantCommunityPageAccessInTransaction(
  transaction: sql.Transaction,
  pageId: string
): Promise<void> {
  const adminEmails = getBootstrapAdminEmails();
  if (adminEmails.length === 0) {
    return;
  }

  for (const email of adminEmails) {
    const userResult = await new sql.Request(transaction)
      .input("email", email)
      .query(/* sql */ `
        SELECT TOP 1 UserId AS userId
        FROM auth.Users
        WHERE LOWER(Email) = LOWER(@email)
      `);

    const userId = userResult.recordset?.[0]?.userId;
    if (!userId) {
      continue;
    }

    const primaryResult = await new sql.Request(transaction)
      .input("userId", String(userId))
      .query(/* sql */ `
        SELECT TOP 1 1 AS ok
        FROM cms.UserPageAccess
        WHERE UserId = CAST(@userId AS uniqueidentifier)
          AND ISNULL(IsPrimary, 0) = 1
      `);

    const hasPrimaryAccess = !!primaryResult.recordset?.[0];

    await new sql.Request(transaction)
      .input("userId", String(userId))
      .input("pageId", pageId)
      .input("accessLevel", sql.TinyInt, 1)
      .input("isPrimary", sql.Bit, hasPrimaryAccess ? 0 : 1)
      .query(/* sql */ `
        IF NOT EXISTS (
          SELECT 1
          FROM cms.UserPageAccess
          WHERE UserId = CAST(@userId AS uniqueidentifier)
            AND PageId = CAST(@pageId AS uniqueidentifier)
        )
        BEGIN
          INSERT INTO cms.UserPageAccess (UserId, PageId, AccessLevel, IsPrimary)
          VALUES (
            CAST(@userId AS uniqueidentifier),
            CAST(@pageId AS uniqueidentifier),
            @accessLevel,
            @isPrimary
          )
        END
      `);
  }
}

function mapCommunityRow(row: Record<string, unknown>): AdminCommunityListItem {
  return {
    communityId: String(row.communityId),
    pageId: row.pageId == null ? null : String(row.pageId),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    isActive: !!row.isActive,
    region: row.region == null ? null : String(row.region),
    localidad: row.localidad == null ? null : String(row.localidad),
    tipo: row.tipo == null ? null : String(row.tipo),
    tramo: row.tramo == null ? null : String(row.tramo),
    path: row.path == null ? null : String(row.path),
    logoUrl: row.logoUrl == null ? null : String(row.logoUrl),
  };
}

function normalizeCommunityInput(input: CreateAdminCommunityInput | UpdateAdminCommunityInput) {
  const name = normalizeRequiredText(input.name, "Nombre", 150);
  const slug = normalizeCommunitySlug(name);
  const isActive = input.isActive ?? true;
  const region = normalizeOptionalText(input.region, "Region", 100);
  const localidad = normalizeOptionalText(input.localidad, "Localidad", 150);
  const tipo = normalizeOptionalText(input.tipo, "Tipo", 100);
  const tramo = normalizeTramo(input.tramo);
  const logoUrl = normalizeOptionalText(input.logoUrl, "Logo", 2048);

  if (!slug) {
    throw new Error("No se pudo generar el slug de la comunidad");
  }

  return {
    name,
    slug,
    isActive,
    region,
    localidad,
    tipo,
    tramo,
    logoUrl,
    path: buildCommunityPath(slug),
  };
}

async function ensureUniqueCommunitySlug(
  slug: string,
  excludeCommunityId?: string
): Promise<void> {
  const pool = await getPool();
  const request = pool.request().input("slug", slug);

  if (excludeCommunityId) {
    request.input("excludeCommunityId", excludeCommunityId);
  }

  const exclusionClause = excludeCommunityId
    ? "AND CAST(CommunityId AS NVARCHAR(50)) <> CAST(@excludeCommunityId AS NVARCHAR(50))"
    : "";

  const result = await request.query(/* sql */ `
    SELECT TOP 1 CommunityId
    FROM cms.Communities
    WHERE LOWER(Slug) = LOWER(@slug)
      ${exclusionClause}
  `);

  if (result.recordset?.[0]) {
    throw new Error("Ya existe una comunidad con ese nombre.");
  }
}

async function ensureUniquePagePath(path: string, excludePageId?: string): Promise<void> {
  const pool = await getPool();
  const request = pool.request().input("path", path);

  if (excludePageId) {
    request.input("excludePageId", excludePageId);
  }

  const exclusionClause = excludePageId
    ? "AND CAST(PageId AS NVARCHAR(50)) <> CAST(@excludePageId AS NVARCHAR(50))"
    : "";

  const result = await request.query(/* sql */ `
    SELECT TOP 1 PageId
    FROM cms.Pages
    WHERE LOWER(Path) = LOWER(@path)
      ${exclusionClause}
  `);

  if (result.recordset?.[0]) {
    throw new Error("Ya existe una pagina asociada a ese slug.");
  }
}

async function getCommunityPageByCommunityId(communityId: string): Promise<{
  pageId: string;
  path: string | null;
  logoUrl: string | null;
} | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("communityId", communityId)
    .query(/* sql */ `
      SELECT TOP 1
        p.PageId AS pageId,
        p.Path AS path,
        p.LogoUrl AS logoUrl
      FROM cms.Pages p
      WHERE CAST(p.CommunityId AS NVARCHAR(50)) = CAST(@communityId AS NVARCHAR(50))
      ORDER BY CASE WHEN LOWER(p.Path) LIKE '/comunidades/%' THEN 0 ELSE 1 END, p.Path
    `);

  const row = result.recordset?.[0];
  if (!row) {
    return null;
  }

  return {
    pageId: String(row.pageId),
    path: row.path == null ? null : String(row.path),
    logoUrl: row.logoUrl == null ? null : String(row.logoUrl),
  };
}

export async function listAdminCommunities(): Promise<AdminCommunityListItem[]> {
  const pool = await getPool();
  const result = await pool.request().query(/* sql */ `
    SELECT
      c.CommunityId AS communityId,
      c.Name AS name,
      c.Slug AS slug,
      CAST(ISNULL(c.IsActive, 0) AS bit) AS isActive,
      c.Region AS region,
      c.Localidad AS localidad,
      c.Tipo AS tipo,
      c.Tramo AS tramo,
      p.PageId AS pageId,
      p.Path AS path,
      p.LogoUrl AS logoUrl
    FROM cms.Communities c
    OUTER APPLY (
      SELECT TOP 1
        p.PageId,
        p.Path,
        p.LogoUrl
      FROM cms.Pages p
      WHERE CAST(p.CommunityId AS NVARCHAR(50)) = CAST(c.CommunityId AS NVARCHAR(50))
      ORDER BY CASE WHEN LOWER(p.Path) = LOWER(CONCAT('/comunidades/', c.Slug)) THEN 0 ELSE 1 END, p.Path
    ) p
    ORDER BY c.Name
  `);

  return (result.recordset ?? []).map((row) => mapCommunityRow(row));
}

export async function getAdminCommunityById(
  communityId: string
): Promise<AdminCommunityDetails | null> {
  const normalizedCommunityId = normalizeCommunityId(communityId);
  if (!normalizedCommunityId) {
    return null;
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("communityId", normalizedCommunityId)
    .query(/* sql */ `
      SELECT TOP 1
        c.CommunityId AS communityId,
        c.Name AS name,
        c.Slug AS slug,
        CAST(ISNULL(c.IsActive, 0) AS bit) AS isActive,
        c.Region AS region,
        c.Localidad AS localidad,
        c.Tipo AS tipo,
        c.Tramo AS tramo,
        p.PageId AS pageId,
        p.Path AS path,
        p.LogoUrl AS logoUrl
      FROM cms.Communities c
      OUTER APPLY (
        SELECT TOP 1
          p.PageId,
          p.Path,
          p.LogoUrl
        FROM cms.Pages p
        WHERE CAST(p.CommunityId AS NVARCHAR(50)) = CAST(c.CommunityId AS NVARCHAR(50))
        ORDER BY CASE WHEN LOWER(p.Path) = LOWER(CONCAT('/comunidades/', c.Slug)) THEN 0 ELSE 1 END, p.Path
      ) p
      WHERE CAST(c.CommunityId AS NVARCHAR(50)) = CAST(@communityId AS NVARCHAR(50))
    `);

  const row = result.recordset?.[0];
  return row ? mapCommunityRow(row) : null;
}

export async function createAdminCommunity(
  input: CreateAdminCommunityInput
): Promise<{ communityId: string }> {
  const { name, slug, isActive, region, localidad, tipo, tramo, logoUrl, path } =
    normalizeCommunityInput(input);

  await ensureUniqueCommunitySlug(slug);
  await ensureUniquePagePath(path);

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  let committed = false;

  await transaction.begin();
  try {
    const insertCommunityResult = await new sql.Request(transaction)
      .input("slug", slug)
      .input("name", name)
      .input("isActive", sql.Bit, isActive)
      .input("region", region)
      .input("localidad", localidad)
      .input("tipo", tipo)
      .input("tramo", tramo)
      .query(/* sql */ `
        INSERT INTO cms.Communities (
          Slug,
          Name,
          IsActive,
          Region,
          Localidad,
          Tipo,
          Tramo
        )
        OUTPUT INSERTED.CommunityId AS communityId
        VALUES (
          @slug,
          @name,
          @isActive,
          @region,
          @localidad,
          @tipo,
          @tramo
        )
      `);

    const insertedCommunityId = insertCommunityResult.recordset?.[0]?.communityId;
    if (!insertedCommunityId) {
      throw new Error("No se pudo guardar la comunidad");
    }

    const insertPageResult = await new sql.Request(transaction)
      .input("path", path)
      .input("title", name)
      .input("communityId", String(insertedCommunityId))
      .input("logoUrl", logoUrl)
      .query(/* sql */ `
        INSERT INTO cms.Pages (
          Path,
          Title,
          IsPublic,
          CommunityId,
          LogoUrl
        )
        OUTPUT INSERTED.PageId AS pageId
        VALUES (
          @path,
          @title,
          0,
          CAST(@communityId AS uniqueidentifier),
          @logoUrl
        )
      `);

    const insertedPageId = insertPageResult.recordset?.[0]?.pageId;
    if (insertedPageId) {
      await grantCommunityPageAccessInTransaction(transaction, String(insertedPageId));
    }

    await transaction.commit();
    committed = true;

    return { communityId: String(insertedCommunityId) };
  } catch (error) {
    if (!committed) {
      await transaction.rollback().catch(() => undefined);
    }
    throw error;
  }
}

export async function updateAdminCommunity(
  input: UpdateAdminCommunityInput
): Promise<{ communityId: string }> {
  const communityId = normalizeCommunityId(input.communityId);
  if (!communityId) {
    throw new Error("CommunityId obligatorio");
  }

  const existing = await getAdminCommunityById(communityId);
  if (!existing) {
    throw new Error("Comunidad no encontrada");
  }

  const { name, slug, isActive, region, localidad, tipo, tramo, logoUrl, path } =
    normalizeCommunityInput(input);

  await ensureUniqueCommunitySlug(slug, communityId);
  await ensureUniquePagePath(path, existing.pageId ?? undefined);

  const existingPage = await getCommunityPageByCommunityId(communityId);
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  let committed = false;

  await transaction.begin();
  try {
    await new sql.Request(transaction)
      .input("communityId", communityId)
      .input("slug", slug)
      .input("name", name)
      .input("isActive", sql.Bit, isActive)
      .input("region", region)
      .input("localidad", localidad)
      .input("tipo", tipo)
      .input("tramo", tramo)
      .query(/* sql */ `
        UPDATE cms.Communities
        SET Slug = @slug,
            Name = @name,
            IsActive = @isActive,
            Region = @region,
            Localidad = @localidad,
            Tipo = @tipo,
            Tramo = @tramo
        WHERE CAST(CommunityId AS NVARCHAR(50)) = CAST(@communityId AS NVARCHAR(50))
      `);

    if (existingPage) {
      await new sql.Request(transaction)
        .input("pageId", existingPage.pageId)
        .input("path", path)
        .input("title", name)
        .input("communityId", communityId)
        .input("logoUrl", logoUrl)
        .query(/* sql */ `
          UPDATE cms.Pages
          SET Path = @path,
              Title = @title,
              IsPublic = 0,
              CommunityId = CAST(@communityId AS uniqueidentifier),
              LogoUrl = @logoUrl
          WHERE CAST(PageId AS NVARCHAR(50)) = CAST(@pageId AS NVARCHAR(50))
        `);
    } else {
      const insertPageResult = await new sql.Request(transaction)
        .input("path", path)
        .input("title", name)
        .input("communityId", communityId)
        .input("logoUrl", logoUrl)
        .query(/* sql */ `
          INSERT INTO cms.Pages (
            Path,
            Title,
            IsPublic,
            CommunityId,
            LogoUrl
          )
          OUTPUT INSERTED.PageId AS pageId
          VALUES (
            @path,
            @title,
            0,
            CAST(@communityId AS uniqueidentifier),
            @logoUrl
          )
        `);

      const insertedPageId = insertPageResult.recordset?.[0]?.pageId;
      if (insertedPageId) {
        await grantCommunityPageAccessInTransaction(transaction, String(insertedPageId));
      }
    }

    await transaction.commit();
    committed = true;
  } catch (error) {
    if (!committed) {
      await transaction.rollback().catch(() => undefined);
    }
    throw error;
  }

  return { communityId };
}
