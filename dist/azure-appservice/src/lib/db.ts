// src/lib/db.ts
import * as sql from "mssql";
type ConnectionPool = sql.ConnectionPool;

function buildConfig(): sql.config | string {
  const connStr = process.env.SQLSERVER_CONN;
  if (connStr && connStr.trim().length > 0) return connStr;

  const server = process.env.DB_SERVER;
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  if (!server || !database || !user || !password) {
    throw new Error(
      "Config DB inválida: define SQLSERVER_CONN o las variables DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD"
    );
  }
  return {
    server,
    database,
    user,
    password,
    options: {
      encrypt: (process.env.DB_ENCRYPT ?? "true") === "true",
    },
    pool: {
      min: Number(process.env.DB_POOL_MIN ?? 0),
      max: Number(process.env.DB_POOL_MAX ?? 5),
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS ?? 30000),
    },
  } satisfies sql.config;
}

declare global {
  // eslint-disable-next-line no-var
  var __mssqlPool: ConnectionPool | undefined;
}

export async function getPool(): Promise<ConnectionPool> {
  if (global.__mssqlPool) {
    if (!global.__mssqlPool.connected) {
      await global.__mssqlPool.connect();
    }
    return global.__mssqlPool;
  }
  const cfg = buildConfig();
  if (typeof cfg === "string") {
    global.__mssqlPool = await sql.connect(cfg);
  } else {
    const pool = new sql.ConnectionPool(cfg);
    global.__mssqlPool = await pool.connect();
  }
  return global.__mssqlPool!;
}

export { sql };

// 👇 paths permitidos desde BD
export async function getPrimaryAndAllowedPaths(userId: string): Promise<{
  allowedPaths: string[];
  primaryPath?: string;
}> {
  const pool = await getPool();

  const r = await pool.request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query(/* sql */ `
      SELECT upa.PageId,
             upa.AccessLevel,
             upa.IsPrimary,
             p.Path,
             p.IsPublic
      FROM cms.UserPageAccess upa
      JOIN cms.Pages p ON p.PageId = upa.PageId
      WHERE upa.UserId = @userId
        AND (p.IsPublic = 0 OR p.IsPublic IS NULL)
    `);

  const norm = (s: string | null | undefined) => {
    if (!s) return "";
    const x = s.toLowerCase();
    return x !== "/" && x.endsWith("/") ? x.slice(0, -1) : x;
    };

  const paths = new Set<string>();
  let primary: string | undefined;

  for (const row of r.recordset as Array<{ Path: string; IsPrimary?: boolean }>) {
    const p = norm(row.Path);
    if (p) paths.add(p);
  }

  const primaryRow = (r.recordset as any[]).find(x => !!x.IsPrimary) ?? r.recordset?.[0];
  if (primaryRow?.Path) primary = norm(primaryRow.Path);

  return {
    allowedPaths: Array.from(paths),
    primaryPath: primary,
  };
}
