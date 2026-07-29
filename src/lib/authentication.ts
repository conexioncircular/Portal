import * as argon2 from "argon2";
import { isAdminPrincipal, isBootstrapAdminEmail } from "./admin";
import { getPool } from "./db";

type UserRow = { id: string; email: string; displayName: string | null; passwordHash: string; passwordAlgo: string; isActive: boolean };
type AccessRow = { Path: string; IsPrimary?: boolean };

export type AuthenticatedPortalUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  allowedPaths: string[];
  primaryPath?: string;
};

const AUTH_LOOKUP_TIMEOUT_MS = Math.max(Number(process.env.AUTH_LOOKUP_TIMEOUT_MS ?? 15000) || 15000, 1000);
const AUTH_ERROR_CODES = {
  dbTimeout: "AuthDbTimeout",
  dbUnavailable: "AuthDbUnavailable",
  passwordVerificationFailed: "AuthPasswordVerificationFailed",
} as const;

function createAuthError(code: string) {
  const error = new Error(code);
  error.name = "AuthError";
  return error;
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, errorCode: string) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(createAuthError(errorCode)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function maskIdentifier(identifier: string) {
  const value = String(identifier ?? "").trim();
  if (!value) return "(empty-identifier)";
  if (value.includes("@")) {
    const [localPart = "", domainPart = ""] = value.split("@");
    if (!localPart || !domainPart) return "(invalid-identifier)";
    const visibleLocal = localPart.length <= 2 ? `${localPart[0] ?? "*"}*` : `${localPart.slice(0, 2)}***`;
    return `${visibleLocal}@${domainPart}`;
  }
  return value.length <= 2 ? `${value[0] ?? "*"}*` : `${value.slice(0, 2)}***`;
}

function normPath(path?: string | null): string {
  const value = String(path ?? "").trim().toLowerCase();
  return value !== "/" && value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getPortalAdminLandingPath(): string {
  const candidate = normPath(process.env.ADMIN_DEFAULT_PATH ?? "/admin");
  return candidate || "/admin";
}

function mapAccessRows(rows: AccessRow[]) {
  const paths = new Set<string>();
  for (const row of rows) {
    const path = normPath(row.Path);
    if (path) paths.add(path);
  }
  const primaryRow = rows.find((row) => !!row.IsPrimary) ?? rows[0];
  return { paths: Array.from(paths), primary: primaryRow?.Path ? normPath(primaryRow.Path) : null };
}

export async function getPortalUserAccessPaths(userId: string) {
  const result = await withTimeout(
    (async () => {
      const pool = await getPool();
      return pool.request().input("UserId", String(userId)).query(/* sql */ `
        SELECT p.Path, upa.IsPrimary
        FROM cms.UserPageAccess upa
        JOIN cms.Pages p ON p.PageId = upa.PageId
        WHERE upa.UserId = @UserId
      `);
    })(),
    AUTH_LOOKUP_TIMEOUT_MS,
    AUTH_ERROR_CODES.dbTimeout
  );
  return mapAccessRows(result.recordset as AccessRow[]);
}

async function fetchLoginCandidate(identifier: string): Promise<(UserRow & { accessRows: AccessRow[] }) | null> {
  const safeIdentifier = String(identifier ?? "").trim();
  const startedAt = Date.now();
  let result;
  try {
    result = await withTimeout(
      (async () => {
        const pool = await getPool();
        return pool.request().input("identifier", safeIdentifier).query(/* sql */ `
          SELECT TOP 1
            u.UserId AS id, u.Email AS email, u.DisplayName AS displayName,
            u.PasswordHash AS passwordHash, u.PasswordAlgo AS passwordAlgo,
            CAST(u.IsActive AS bit) AS isActive
          FROM auth.Users u
          WHERE u.Email = @identifier;

          SELECT p.Path, upa.IsPrimary
          FROM auth.Users u
          JOIN cms.UserPageAccess upa ON upa.UserId = u.UserId
          JOIN cms.Pages p ON p.PageId = upa.PageId
          WHERE u.Email = @identifier;
        `);
      })(),
      AUTH_LOOKUP_TIMEOUT_MS,
      AUTH_ERROR_CODES.dbTimeout
    );
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const maskedIdentifier = maskIdentifier(safeIdentifier);
    if (error instanceof Error && error.message === AUTH_ERROR_CODES.dbTimeout) {
      console.error("[auth] login lookup timed out", { identifier: maskedIdentifier, elapsedMs, timeoutMs: AUTH_LOOKUP_TIMEOUT_MS });
      throw error;
    }
    console.error("[auth] login lookup failed", { identifier: maskedIdentifier, elapsedMs, error });
    throw createAuthError(AUTH_ERROR_CODES.dbUnavailable);
  }
  const recordsets = result.recordsets as unknown as Array<unknown[]> | undefined;
  const user = ((recordsets?.[0] ?? []) as UserRow[])[0];
  if (!user) return null;
  return { ...user, accessRows: (recordsets?.[1] ?? []) as AccessRow[] };
}

export async function authenticatePortalUser(identifier: string, password: string): Promise<AuthenticatedPortalUser | null> {
  const candidate = await fetchLoginCandidate(identifier);
  if (!candidate || !candidate.isActive) return null;
  let isValidPassword = false;
  try {
    isValidPassword = await argon2.verify(candidate.passwordHash, password);
  } catch (error) {
    console.error("[auth] password verification failed", { identifier: maskIdentifier(candidate.email), error });
    throw createAuthError(AUTH_ERROR_CODES.passwordVerificationFailed);
  }
  if (!isValidPassword) return null;
  const isAdmin = isBootstrapAdminEmail(candidate.email) || (await isAdminPrincipal({ userId: candidate.id, email: candidate.email }).catch(() => false));
  const access = mapAccessRows(candidate.accessRows);
  return {
    id: candidate.id,
    email: candidate.email,
    name: candidate.displayName ?? candidate.email,
    isAdmin,
    allowedPaths: isAdmin ? [] : access.paths,
    primaryPath: isAdmin ? getPortalAdminLandingPath() : access.primary ?? undefined,
  };
}
