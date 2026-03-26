import * as sql from "mssql";
import { getPool } from "@/lib/db";

export type UserCommunity = {
  pageId: string;
  title: string;
  slug: string;
  path: string;
};

function pathToSlug(path: string): string {
  return String(path ?? "")
    .trim()
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .pop() ?? "";
}

export async function getUserCommunities(userId: string): Promise<UserCommunity[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query(/* sql */ `
      SELECT DISTINCT
        p.PageId AS pageId,
        p.Title  AS title,
        p.Path   AS path
      FROM cms.UserPageAccess upa
      INNER JOIN cms.Pages p ON p.PageId = upa.PageId
      WHERE upa.UserId = @userId
      ORDER BY p.Title
    `);

  return (result.recordset ?? []).map((row) => {
    const path = String(row.path ?? "").trim();
    return {
      pageId: String(row.pageId),
      title: String(row.title ?? ""),
      path,
      slug: pathToSlug(path),
    };
  });
}
