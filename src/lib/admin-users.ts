import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";
import * as sql from "mssql";
import { getPool } from "./db";
import { ensureAdminUsersTable, isBootstrapAdminEmail, listManagedPages } from "./admin";

export type ManagedUserAccess = {
  pageId: string;
  title: string;
  path: string;
  isPrimary: boolean;
};

export type ManagedUserSummary = {
  userId: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  isAdmin: boolean;
  accesses: ManagedUserAccess[];
  primaryPageId: string | null;
};

type CreateManagedUserInput = {
  email: string;
  password: string;
  displayName?: string | null;
  pageIds?: string[];
  primaryPageId?: string | null;
  isAdmin?: boolean;
};

type ReplaceManagedUserAccessInput = {
  userId: string;
  pageIds?: string[];
  primaryPageId?: string | null;
  isAdmin?: boolean;
};

type UpdateManagedUserProfileInput = {
  userId: string;
  displayName?: string | null;
  isActive?: boolean;
};

function normalizeEmail(email?: string | null): string {
  return String(email ?? "").trim().toLowerCase();
}

function normalizeDisplayName(displayName?: string | null): string | null {
  const value = String(displayName ?? "").trim();
  return value || null;
}

function uniqueIds(values?: string[]): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );
}

async function validatePageIds(pageIds: string[]): Promise<void> {
  if (pageIds.length === 0) {
    return;
  }

  const pages = await listManagedPages();
  const validIds = new Set(pages.map((page) => page.pageId));
  const invalidIds = pageIds.filter((pageId) => !validIds.has(pageId));

  if (invalidIds.length > 0) {
    throw new Error(`PageId inválido: ${invalidIds.join(", ")}`);
  }
}

async function getUserByEmail(email: string): Promise<{ userId: string; email: string } | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("email", sql.NVarChar(256), normalizeEmail(email))
    .query(/* sql */ `
      SELECT TOP 1
        u.UserId AS userId,
        u.Email AS email
      FROM auth.Users u
      WHERE LOWER(u.Email) = LOWER(@email)
    `);

  const row = result.recordset?.[0];
  if (!row) {
    return null;
  }

  return {
    userId: String(row.userId),
    email: String(row.email),
  };
}

async function getUserById(userId: string): Promise<{ userId: string; email: string } | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query(/* sql */ `
      SELECT TOP 1
        u.UserId AS userId,
        u.Email AS email
      FROM auth.Users u
      WHERE u.UserId = @userId
    `);

  const row = result.recordset?.[0];
  if (!row) {
    return null;
  }

  return {
    userId: String(row.userId),
    email: String(row.email),
  };
}

async function setAdminFlagInTransaction(
  transaction: sql.Transaction,
  userId: string,
  email: string,
  isAdmin: boolean
): Promise<void> {
  if (isAdmin) {
    await new sql.Request(transaction)
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
    return;
  }

  await new sql.Request(transaction)
    .input("userId", sql.UniqueIdentifier, userId)
    .query("DELETE FROM auth.AdminUsers WHERE UserId = @userId");
}

async function replaceUserAccessInTransaction(
  transaction: sql.Transaction,
  userId: string,
  pageIds: string[],
  primaryPageId?: string | null
): Promise<void> {
  await new sql.Request(transaction)
    .input("userId", sql.UniqueIdentifier, userId)
    .query("DELETE FROM cms.UserPageAccess WHERE UserId = @userId");

  if (pageIds.length === 0) {
    return;
  }

  const effectivePrimaryPageId = primaryPageId && pageIds.includes(primaryPageId)
    ? primaryPageId
    : pageIds[0];

  for (const pageId of pageIds) {
    await new sql.Request(transaction)
      .input("userId", sql.UniqueIdentifier, userId)
      .input("pageId", sql.UniqueIdentifier, pageId)
      .input("accessLevel", sql.NVarChar(50), "read")
      .input("isPrimary", sql.Bit, pageId === effectivePrimaryPageId)
      .query(/* sql */ `
        INSERT INTO cms.UserPageAccess (UserId, PageId, AccessLevel, IsPrimary)
        VALUES (@userId, @pageId, @accessLevel, @isPrimary)
      `);
  }
}

export async function listManagedUsers(): Promise<ManagedUserSummary[]> {
  await ensureAdminUsersTable();

  const pool = await getPool();
  const [usersResult, accessResult] = await Promise.all([
    pool.request().query(/* sql */ `
      SELECT
        u.UserId AS userId,
        u.Email AS email,
        u.DisplayName AS displayName,
        CAST(ISNULL(u.IsActive, 0) AS bit) AS isActive,
        CAST(CASE WHEN au.UserId IS NULL THEN 0 ELSE 1 END AS bit) AS isAdmin
      FROM auth.Users u
      LEFT JOIN auth.AdminUsers au ON au.UserId = u.UserId
      ORDER BY u.Email
    `),
    pool.request().query(/* sql */ `
      SELECT
        upa.UserId AS userId,
        upa.PageId AS pageId,
        CAST(ISNULL(upa.IsPrimary, 0) AS bit) AS isPrimary,
        p.Title AS title,
        p.Path AS path
      FROM cms.UserPageAccess upa
      INNER JOIN cms.Pages p ON p.PageId = upa.PageId
      ORDER BY p.Title, p.Path
    `),
  ]);

  const accessMap = new Map<string, ManagedUserAccess[]>();
  for (const row of accessResult.recordset ?? []) {
    const userId = String(row.userId);
    const current = accessMap.get(userId) ?? [];
    current.push({
      pageId: String(row.pageId),
      title: String(row.title ?? row.path ?? ""),
      path: String(row.path ?? "").trim(),
      isPrimary: !!row.isPrimary,
    });
    accessMap.set(userId, current);
  }

  return (usersResult.recordset ?? []).map((row) => {
    const userId = String(row.userId);
    const accesses = accessMap.get(userId) ?? [];

    return {
      userId,
      email: String(row.email),
      displayName: row.displayName == null ? null : String(row.displayName),
      isActive: !!row.isActive,
      isAdmin: !!row.isAdmin || isBootstrapAdminEmail(String(row.email)),
      accesses,
      primaryPageId: accesses.find((item) => item.isPrimary)?.pageId ?? null,
    };
  });
}

export async function createManagedUser(input: CreateManagedUserInput): Promise<ManagedUserSummary> {
  const email = normalizeEmail(input.email);
  const password = String(input.password ?? "");
  const displayName = normalizeDisplayName(input.displayName);
  const requestedPrimaryPageId = String(input.primaryPageId ?? "").trim() || null;
  const pageIds = uniqueIds(input.pageIds);

  if (!email) {
    throw new Error("Email requerido");
  }
  if (password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }

  const effectivePageIds = requestedPrimaryPageId && !pageIds.includes(requestedPrimaryPageId)
    ? [...pageIds, requestedPrimaryPageId]
    : pageIds;

  await validatePageIds(effectivePageIds);

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("Ya existe un usuario con ese email");
  }

  await ensureAdminUsersTable();

  const passwordHash = await argon2.hash(password);
  const userId = randomUUID();
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();
  try {
    await new sql.Request(transaction)
      .input("userId", sql.UniqueIdentifier, userId)
      .input("email", sql.NVarChar(256), email)
      .input("displayName", sql.NVarChar(256), displayName)
      .input("passwordHash", sql.NVarChar(sql.MAX), passwordHash)
      .input("passwordAlgo", sql.NVarChar(50), "argon2")
      .input("isActive", sql.Bit, true)
      .query(/* sql */ `
        INSERT INTO auth.Users (
          UserId,
          Email,
          DisplayName,
          PasswordHash,
          PasswordAlgo,
          IsActive
        ) VALUES (
          @userId,
          @email,
          @displayName,
          @passwordHash,
          @passwordAlgo,
          @isActive
        )
      `);

    await replaceUserAccessInTransaction(
      transaction,
      userId,
      effectivePageIds,
      requestedPrimaryPageId
    );

    await setAdminFlagInTransaction(transaction, userId, email, !!input.isAdmin);

    await transaction.commit();
  } catch (error) {
    if (transaction._aborted !== true) {
      await transaction.rollback().catch(() => undefined);
    }
    throw error;
  }

  const users = await listManagedUsers();
  const created = users.find((user) => user.userId === userId);
  if (!created) {
    throw new Error("No se pudo cargar el usuario recién creado");
  }

  return created;
}

export async function updateManagedUserPassword(userId: string, password: string): Promise<void> {
  const safePassword = String(password ?? "");
  if (safePassword.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }

  const existingUser = await getUserById(userId);
  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  const passwordHash = await argon2.hash(safePassword);
  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("passwordHash", sql.NVarChar(sql.MAX), passwordHash)
    .input("passwordAlgo", sql.NVarChar(50), "argon2")
    .query(/* sql */ `
      UPDATE auth.Users
      SET PasswordHash = @passwordHash,
          PasswordAlgo = @passwordAlgo
      WHERE UserId = @userId
    `);
}

export async function replaceManagedUserAccess(
  input: ReplaceManagedUserAccessInput
): Promise<ManagedUserSummary> {
  const userId = String(input.userId ?? "").trim();
  if (!userId) {
    throw new Error("UserId requerido");
  }

  const requestedPrimaryPageId = String(input.primaryPageId ?? "").trim() || null;
  const pageIds = uniqueIds(input.pageIds);
  const effectivePageIds = requestedPrimaryPageId && !pageIds.includes(requestedPrimaryPageId)
    ? [...pageIds, requestedPrimaryPageId]
    : pageIds;

  await validatePageIds(effectivePageIds);

  await ensureAdminUsersTable();

  const existingUser = await getUserById(userId);
  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();
  try {
    await replaceUserAccessInTransaction(
      transaction,
      userId,
      effectivePageIds,
      requestedPrimaryPageId
    );

    if (typeof input.isAdmin === "boolean") {
      await setAdminFlagInTransaction(transaction, userId, existingUser.email, input.isAdmin);
    }

    await transaction.commit();
  } catch (error) {
    if (transaction._aborted !== true) {
      await transaction.rollback().catch(() => undefined);
    }
    throw error;
  }

  const users = await listManagedUsers();
  const updated = users.find((user) => user.userId === userId);
  if (!updated) {
    throw new Error("No se pudo cargar el usuario actualizado");
  }

  return updated;
}

export async function updateManagedUserProfile(
  input: UpdateManagedUserProfileInput
): Promise<ManagedUserSummary> {
  const userId = String(input.userId ?? "").trim();
  if (!userId) {
    throw new Error("UserId requerido");
  }

  const existingUser = await getUserById(userId);
  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  const displayName = normalizeDisplayName(input.displayName);
  const isActive = typeof input.isActive === "boolean" ? input.isActive : undefined;

  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("displayName", sql.NVarChar(256), displayName)
    .input("isActive", sql.Bit, isActive ?? null)
    .query(/* sql */ `
      UPDATE auth.Users
      SET DisplayName = @displayName,
          IsActive = COALESCE(@isActive, IsActive)
      WHERE UserId = @userId
    `);

  const users = await listManagedUsers();
  const updated = users.find((user) => user.userId === userId);
  if (!updated) {
    throw new Error("No se pudo cargar el usuario actualizado");
  }

  return updated;
}