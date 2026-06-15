module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},50645,a=>{a.n(a.i(27572))},43619,a=>{a.n(a.i(79962))},13718,a=>{a.n(a.i(85523))},18198,a=>{a.n(a.i(45518))},62212,a=>{a.n(a.i(66114))},13743,a=>{"use strict";let b=(0,a.i(1269).default)("arrow-left",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);a.s(["ArrowLeft",()=>b],13743)},19548,a=>{a.n(a.i(30284))},73896,a=>{"use strict";a.i(89647);var b=a.i(53541);function c(a){return{communityId:String(a.communityId),pageId:null==a.pageId?null:String(a.pageId),name:String(a.name??""),slug:String(a.slug??""),isActive:!!a.isActive,region:null==a.region?null:String(a.region),localidad:null==a.localidad?null:String(a.localidad),tipo:null==a.tipo?null:String(a.tipo),tramo:null==a.tramo?null:String(a.tramo),path:null==a.path?null:String(a.path),logoUrl:null==a.logoUrl?null:String(a.logoUrl)}}async function d(){let a=await (0,b.getPool)();return((await a.request().query(`
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
    `),g=f.recordset?.[0];return g?c(g):null}a.s(["getAdminCommunityById",()=>e,"listAdminCommunities",()=>d],73896)},94127,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/src/components/admin/AdminCommunityList.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/src/components/admin/AdminCommunityList.tsx <module evaluation>","default");a.s(["default",0,b])},80476,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/src/components/admin/AdminCommunityList.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/src/components/admin/AdminCommunityList.tsx","default");a.s(["default",0,b])},34023,a=>{"use strict";a.i(94127);var b=a.i(80476);a.n(b)},27624,a=>{"use strict";var b=a.i(7997),c=a.i(95936),d=a.i(13743),e=a.i(85059),f=a.i(84254),g=a.i(34023),h=a.i(38904),i=a.i(73896);async function j(){let a=await (0,i.listAdminCommunities)();return(0,b.jsxs)("section",{className:"rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]",children:[(0,b.jsxs)("div",{className:"mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",children:[(0,b.jsxs)("div",{className:"flex items-start gap-4",children:[(0,b.jsx)("div",{className:"flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700",children:(0,b.jsx)(e.MapPinned,{className:"h-5 w-5"})}),(0,b.jsxs)("div",{children:[(0,b.jsx)("h2",{className:"text-2xl font-semibold text-slate-950",children:"Listado de comunidades"}),(0,b.jsx)("p",{className:"mt-2 text-sm text-slate-600",children:"Revisa el estado de cada comunidad y edita su información base y logo."})]})]}),(0,b.jsxs)("div",{className:"flex flex-wrap gap-3",children:[(0,b.jsx)(h.Button,{asChild:!0,variant:"outline",className:"rounded-full border-slate-200 bg-white",children:(0,b.jsxs)(c.default,{href:"/admin",children:[(0,b.jsx)(d.ArrowLeft,{className:"h-4 w-4"}),"Volver al admin"]})}),(0,b.jsx)(h.Button,{asChild:!0,className:"rounded-full bg-slate-950 hover:bg-slate-800",children:(0,b.jsxs)(c.default,{href:"/admin/comunidades/nueva",children:[(0,b.jsx)(f.Plus,{className:"h-4 w-4"}),"Crear comunidad"]})})]})]}),(0,b.jsx)(g.default,{items:a})]})}a.s(["default",()=>j,"dynamic",0,"force-dynamic","runtime",0,"nodejs"])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__04008e08._.js.map