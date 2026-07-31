import { getPool, sql } from "./db";

export type MobileCommunity = {
  pageId: string;
  communityId: string;
  name: string;
  slug: string;
  path: string;
  logoUrl: string | null;
  isPrimary: boolean;
  accessLevel: number | null;
};

export async function getMobileUserCommunities(userId: string): Promise<MobileCommunity[]> {
  const pool = await getPool();
  const result = await pool.request().input("userId", sql.UniqueIdentifier, userId).query(/* sql */ `
    SELECT DISTINCT
      p.PageId AS pageId, c.CommunityId AS communityId, c.Name AS name,
      c.Slug AS slug, p.Path AS path, p.LogoUrl AS logoUrl,
      CAST(ISNULL(upa.IsPrimary, 0) AS bit) AS isPrimary,
      upa.AccessLevel AS accessLevel
    FROM auth.Users u
    INNER JOIN cms.UserPageAccess upa ON upa.UserId = u.UserId
    INNER JOIN cms.Pages p ON p.PageId = upa.PageId
    INNER JOIN cms.Communities c
      ON CAST(c.CommunityId AS NVARCHAR(50)) = CAST(p.CommunityId AS NVARCHAR(50))
    WHERE u.UserId = @userId
    ORDER BY c.Name, p.Path
  `);
  return (result.recordset ?? []).map((row) => ({
    pageId: String(row.pageId), communityId: String(row.communityId), name: String(row.name ?? ""),
    slug: String(row.slug ?? ""), path: String(row.path ?? "").trim(),
    logoUrl: row.logoUrl == null ? null : String(row.logoUrl), isPrimary: !!row.isPrimary,
    accessLevel: row.accessLevel == null ? null : Number(row.accessLevel),
  }));
}
