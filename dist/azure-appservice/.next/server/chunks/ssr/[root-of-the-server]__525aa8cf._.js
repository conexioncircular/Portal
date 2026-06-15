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
    `),f=e.recordset?.[0];return f?{newsId:String(f.newsId),communityId:String(f.communityId),title:String(f.title??""),slug:String(f.slug??""),summary:String(f.summary??""),bodyHtml:String(f.bodyHtml??""),imageUrl:null==f.imageUrl?null:String(f.imageUrl),isFeatured:!!f.isFeatured,isPublic:!!f.isPublic,sortOrder:"number"==typeof f.sortOrder?f.sortOrder:null==f.sortOrder?null:Number(f.sortOrder),publishedAt:f.publishedAt instanceof Date?f.publishedAt:f.publishedAt?new Date(f.publishedAt):null,createdAt:f.createdAt instanceof Date?f.createdAt:f.createdAt?new Date(f.createdAt):null,updatedAt:f.updatedAt instanceof Date?f.updatedAt:f.updatedAt?new Date(f.updatedAt):null}:null}a.s(["getAdminNewsById",()=>e,"listAdminNews",()=>d,"listAdminNewsCommunities",()=>c])},7800,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/src/components/admin/AdminNewsList.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/src/components/admin/AdminNewsList.tsx <module evaluation>","default");a.s(["default",0,b])},42540,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/src/components/admin/AdminNewsList.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/src/components/admin/AdminNewsList.tsx","default");a.s(["default",0,b])},80252,a=>{"use strict";a.i(7800);var b=a.i(42540);a.n(b)},22724,a=>{"use strict";var b=a.i(7997),c=a.i(95936),d=a.i(95710),e=a.i(84254),f=a.i(80252),g=a.i(38904),h=a.i(40842);async function i(){let a=await (0,h.listAdminNews)();return(0,b.jsxs)("section",{className:"rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]",children:[(0,b.jsxs)("div",{className:"mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",children:[(0,b.jsxs)("div",{className:"flex items-start gap-4",children:[(0,b.jsx)("div",{className:"flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700",children:(0,b.jsx)(d.Newspaper,{className:"h-5 w-5"})}),(0,b.jsxs)("div",{children:[(0,b.jsx)("h2",{className:"text-2xl font-semibold text-slate-950",children:"Listado de noticias"}),(0,b.jsx)("p",{className:"mt-2 text-sm text-slate-600",children:"Administra noticias por comunidad y revisa su estado de publicación."})]})]}),(0,b.jsx)(g.Button,{asChild:!0,className:"rounded-full bg-slate-950 hover:bg-slate-800",children:(0,b.jsxs)(c.default,{href:"/admin/noticias/nueva",children:[(0,b.jsx)(e.Plus,{className:"h-4 w-4"}),"Crear noticia"]})})]}),(0,b.jsx)(f.default,{items:a})]})}a.s(["default",()=>i,"dynamic",0,"force-dynamic","runtime",0,"nodejs"])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__525aa8cf._.js.map