// src/lib/db.ts
import * as sql from "mssql";

type ConnectionPool = sql.ConnectionPool;

function readPositiveInt(rawValue: string | undefined, fallback: number) {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildConfig(): sql.config {
  const connStr = process.env.SQLSERVER_CONN;
  if (connStr && connStr.trim().length > 0) {
    const parsedConfig = (
      sql.ConnectionPool as typeof sql.ConnectionPool & {
        parseConnectionString: (connectionString: string) => sql.config;
      }
    ).parseConnectionString(connStr);

    return {
      ...parsedConfig,
      connectionTimeout: readPositiveInt(
        process.env.DB_CONNECTION_TIMEOUT_MS,
        parsedConfig.connectionTimeout ?? 5000
      ),
      requestTimeout: readPositiveInt(
        process.env.DB_REQUEST_TIMEOUT_MS,
        parsedConfig.requestTimeout ?? 8000
      ),
      options: {
        ...(parsedConfig.options ?? {}),
        trustServerCertificate:
          (process.env.DB_TRUST_SERVER_CERTIFICATE ?? "false") === "true" ||
          parsedConfig.options?.trustServerCertificate === true,
      },
      pool: {
        ...(parsedConfig.pool ?? {}),
        min: Math.max(0, Number(process.env.DB_POOL_MIN ?? parsedConfig.pool?.min ?? 0) || 0),
        max: readPositiveInt(
          process.env.DB_POOL_MAX,
          parsedConfig.pool?.max ?? 5
        ),
        idleTimeoutMillis: readPositiveInt(
          process.env.DB_POOL_IDLE_MS,
          parsedConfig.pool?.idleTimeoutMillis ?? 30000
        ),
      },
    } satisfies sql.config;
  }

  const server = process.env.DB_SERVER;
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (!server || !database || !user || !password) {
    throw new Error(
      "Config DB invalida: define SQLSERVER_CONN o las variables DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD"
    );
  }

  const connectionTimeout = readPositiveInt(process.env.DB_CONNECTION_TIMEOUT_MS, 5000);
  const requestTimeout = readPositiveInt(process.env.DB_REQUEST_TIMEOUT_MS, 8000);

  return {
    server,
    database,
    user,
    password,
    connectionTimeout,
    requestTimeout,
    options: {
      encrypt: (process.env.DB_ENCRYPT ?? "true") === "true",
      trustServerCertificate:
        (process.env.DB_TRUST_SERVER_CERTIFICATE ?? "false") === "true",
    },
    pool: {
      min: Math.max(0, Number(process.env.DB_POOL_MIN ?? 0) || 0),
      max: readPositiveInt(process.env.DB_POOL_MAX, 5),
      idleTimeoutMillis: readPositiveInt(process.env.DB_POOL_IDLE_MS, 30000),
    },
  } satisfies sql.config;
}

async function connectPool(pool: ConnectionPool) {
  try {
    return await pool.connect();
  } catch (error) {
    if (global.__mssqlPool === pool) {
      global.__mssqlPool = undefined;
    }

    await pool.close().catch(() => undefined);
    throw error;
  }
}

declare global {
  var __mssqlPool: ConnectionPool | undefined;
}

export async function getPool(): Promise<ConnectionPool> {
  if (global.__mssqlPool) {
    if (!global.__mssqlPool.connected) {
      await connectPool(global.__mssqlPool);
    }
    return global.__mssqlPool;
  }

  const cfg = buildConfig();
  const pool = new sql.ConnectionPool(cfg);
  global.__mssqlPool = await connectPool(pool);

  return global.__mssqlPool!;
}

export { sql };

export async function getPrimaryAndAllowedPaths(userId: string): Promise<{
  allowedPaths: string[];
  primaryPath?: string;
}> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query(/* sql */ `
      SELECT
        upa.PageId,
        upa.AccessLevel,
        upa.IsPrimary,
        p.Path,
        p.IsPublic
      FROM cms.UserPageAccess upa
      JOIN cms.Pages p ON p.PageId = upa.PageId
      WHERE upa.UserId = @userId
        AND (p.IsPublic = 0 OR p.IsPublic IS NULL)
    `);

  const normalizePath = (value: string | null | undefined) => {
    if (!value) return "";
    const normalized = value.toLowerCase();
    return normalized !== "/" && normalized.endsWith("/")
      ? normalized.slice(0, -1)
      : normalized;
  };

  const paths = new Set<string>();
  let primary: string | undefined;

  for (const row of result.recordset as Array<{ Path: string; IsPrimary?: boolean }>) {
    const path = normalizePath(row.Path);
    if (path) {
      paths.add(path);
    }
  }

  const primaryRow =
    (result.recordset as Array<{ Path?: string; IsPrimary?: boolean }>).find((row) => !!row.IsPrimary) ??
    result.recordset?.[0];

  if (primaryRow?.Path) {
    primary = normalizePath(primaryRow.Path);
  }

  return {
    allowedPaths: Array.from(paths),
    primaryPath: primary,
  };
}
