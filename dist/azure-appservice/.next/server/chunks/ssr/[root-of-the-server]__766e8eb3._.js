module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},50645,a=>{a.n(a.i(27572))},43619,a=>{a.n(a.i(79962))},13718,a=>{a.n(a.i(85523))},18198,a=>{a.n(a.i(45518))},62212,a=>{a.n(a.i(66114))},32646,a=>{a.n(a.i(25313))},40842,a=>{"use strict";var b=a.i(53541);async function c(){let a=await (0,b.getPool)();return((await a.request().query(`
    SELECT
      CommunityId AS communityId,
      Name AS name,
      Slug AS slug,
      CAST(ISNULL(IsActive, 0) AS bit) AS isActive
    FROM cms.Communities
    ORDER BY Name
  `)).recordset??[]).map(a=>({communityId:String(a.communityId),name:String(a.name??""),slug:String(a.slug??""),isActive:!!a.isActive}))}async function d(){let a=await (0,b.getPool)();return((await a.request().query(`
    SELECT
      n.NewsId AS newsId,
      n.CommunityId AS communityId,
      c.Name AS communityName,
      c.Slug AS communitySlug,
      n.Title AS title,
      n.Slug AS slug,
      CAST(ISNULL(n.IsPublic, 0) AS bit) AS isPublic,
      CAST(ISNULL(n.IsFeatured, 0) AS bit) AS isFeatured,
      n.PublishedAt AS publishedAt,
      n.CreatedAt AS createdAt,
      n.UpdatedAt AS updatedAt
    FROM cms.News n
    INNER JOIN cms.Communities c ON c.CommunityId = n.CommunityId
    ORDER BY n.UpdatedAt DESC,
             n.CreatedAt DESC,
             n.NewsId DESC
  `)).recordset??[]).map(a=>({newsId:String(a.newsId),communityId:String(a.communityId),communityName:String(a.communityName??""),communitySlug:String(a.communitySlug??""),title:String(a.title??""),slug:String(a.slug??""),isPublic:!!a.isPublic,isFeatured:!!a.isFeatured,publishedAt:a.publishedAt instanceof Date?a.publishedAt:a.publishedAt?new Date(a.publishedAt):null,createdAt:a.createdAt instanceof Date?a.createdAt:a.createdAt?new Date(a.createdAt):null,updatedAt:a.updatedAt instanceof Date?a.updatedAt:a.updatedAt?new Date(a.updatedAt):null}))}async function e(a){let c=String(a??"").trim();if(!c)return null;let d=await (0,b.getPool)(),e=await d.request().input("newsId",c).query(`
      SELECT TOP 1
        n.NewsId AS newsId,
        n.CommunityId AS communityId,
        n.Title AS title,
        n.Slug AS slug,
        n.Summary AS summary,
        n.BodyHtml AS bodyHtml,
        n.ImageUrl AS imageUrl,
        CAST(ISNULL(n.IsFeatured, 0) AS bit) AS isFeatured,
        CAST(ISNULL(n.IsPublic, 0) AS bit) AS isPublic,
        n.SortOrder AS sortOrder,
        n.PublishedAt AS publishedAt,
        n.CreatedAt AS createdAt,
        n.UpdatedAt AS updatedAt
      FROM cms.News n
      WHERE CAST(n.NewsId AS NVARCHAR(50)) = CAST(@newsId AS NVARCHAR(50))
    `),f=e.recordset?.[0];return f?{newsId:String(f.newsId),communityId:String(f.communityId),title:String(f.title??""),slug:String(f.slug??""),summary:String(f.summary??""),bodyHtml:String(f.bodyHtml??""),imageUrl:null==f.imageUrl?null:String(f.imageUrl),isFeatured:!!f.isFeatured,isPublic:!!f.isPublic,sortOrder:"number"==typeof f.sortOrder?f.sortOrder:null==f.sortOrder?null:Number(f.sortOrder),publishedAt:f.publishedAt instanceof Date?f.publishedAt:f.publishedAt?new Date(f.publishedAt):null,createdAt:f.createdAt instanceof Date?f.createdAt:f.createdAt?new Date(f.createdAt):null,updatedAt:f.updatedAt instanceof Date?f.updatedAt:f.updatedAt?new Date(f.updatedAt):null}:null}a.s(["getAdminNewsById",()=>e,"listAdminNews",()=>d,"listAdminNewsCommunities",()=>c])},56718,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/src/components/admin/AdminNewsCreateForm.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/src/components/admin/AdminNewsCreateForm.tsx <module evaluation>","default");a.s(["default",0,b])},54640,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/src/components/admin/AdminNewsCreateForm.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/src/components/admin/AdminNewsCreateForm.tsx","default");a.s(["default",0,b])},12254,a=>{"use strict";a.i(56718);var b=a.i(54640);a.n(b)},20628,a=>{"use strict";var b=a.i(7997),c=a.i(12254),d=a.i(40842);async function e(){let a=await (0,d.listAdminNewsCommunities)();return(0,b.jsx)(c.default,{communities:a})}a.s(["default",()=>e,"dynamic",0,"force-dynamic","runtime",0,"nodejs"])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__766e8eb3._.js.map