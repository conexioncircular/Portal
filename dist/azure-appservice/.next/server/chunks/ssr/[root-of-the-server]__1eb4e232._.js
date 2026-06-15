module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},50645,a=>{a.n(a.i(27572))},43619,a=>{a.n(a.i(79962))},13718,a=>{a.n(a.i(85523))},18198,a=>{a.n(a.i(45518))},62212,a=>{a.n(a.i(66114))},19548,a=>{a.n(a.i(30284))},20657,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/src/components/admin/AdminCommunityForm.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/src/components/admin/AdminCommunityForm.tsx <module evaluation>","default");a.s(["default",0,b])},68471,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/src/components/admin/AdminCommunityForm.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/src/components/admin/AdminCommunityForm.tsx","default");a.s(["default",0,b])},82179,a=>{"use strict";a.i(20657);var b=a.i(68471);a.n(b)},73896,a=>{"use strict";a.i(89647);var b=a.i(53541);function c(a){return{communityId:String(a.communityId),pageId:null==a.pageId?null:String(a.pageId),name:String(a.name??""),slug:String(a.slug??""),isActive:!!a.isActive,region:null==a.region?null:String(a.region),localidad:null==a.localidad?null:String(a.localidad),tipo:null==a.tipo?null:String(a.tipo),tramo:null==a.tramo?null:String(a.tramo),path:null==a.path?null:String(a.path),logoUrl:null==a.logoUrl?null:String(a.logoUrl)}}async function d(){let a=await (0,b.getPool)();return((await a.request().query(`
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
  `)).recordset??[]).map(a=>c(a))}async function e(a){let d=String(a??"").trim();if(!d)return null;let e=await (0,b.getPool)(),f=await e.request().input("communityId",d).query(`
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
    `),g=f.recordset?.[0];return g?c(g):null}a.s(["getAdminCommunityById",()=>e,"listAdminCommunities",()=>d],73896)},11490,a=>{"use strict";var b=a.i(7997);a.i(70396);var c=a.i(73727),d=a.i(82179),e=a.i(73896);async function f({params:a}){let{communityId:f}=await a,g=await (0,e.getAdminCommunityById)(f);return g||(0,c.notFound)(),(0,b.jsx)(d.default,{mode:"edit",initialValues:{communityId:g.communityId,name:g.name,slug:g.slug,isActive:g.isActive,region:g.region,localidad:g.localidad,tipo:g.tipo,tramo:g.tramo,path:g.path,logoUrl:g.logoUrl}})}a.s(["default",()=>f,"dynamic",0,"force-dynamic","runtime",0,"nodejs"])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__1eb4e232._.js.map