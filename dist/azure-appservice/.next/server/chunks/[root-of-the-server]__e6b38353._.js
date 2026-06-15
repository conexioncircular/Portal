module.exports=[70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},22734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},60526,(e,t,r)=>{t.exports=e.x("node:os",()=>require("node:os"))},12057,(e,t,r)=>{t.exports=e.x("node:util",()=>require("node:util"))},59639,(e,t,r)=>{t.exports=e.x("node:process",()=>require("node:process"))},12714,(e,t,r)=>{t.exports=e.x("node:fs/promises",()=>require("node:fs/promises"))},74533,(e,t,r)=>{t.exports=e.x("node:child_process",()=>require("node:child_process"))},57764,(e,t,r)=>{t.exports=e.x("node:url",()=>require("node:url"))},46069,(e,t,r)=>{t.exports=e.x("argon2",()=>require("argon2"))},45706,(e,t,r)=>{t.exports=e.x("querystring",()=>require("querystring"))},6461,(e,t,r)=>{t.exports=e.x("zlib",()=>require("zlib"))},75096,e=>{e.v({name:"openid-client",version:"5.7.1",description:"OpenID Connect Relying Party (RP, Client) implementation for Node.js runtime, supports passportjs",keywords:["auth","authentication","basic","certified","client","connect","dynamic","electron","hybrid","identity","implicit","oauth","oauth2","oidc","openid","passport","relying party","strategy"],homepage:"https://github.com/panva/openid-client",repository:"panva/openid-client",funding:{url:"https://github.com/sponsors/panva"},license:"MIT",author:"Filip Skokan <panva.ip@gmail.com>",exports:{types:"./types/index.d.ts",import:"./lib/index.mjs",require:"./lib/index.js"},main:"./lib/index.js",types:"./types/index.d.ts",files:["lib","types/index.d.ts"],scripts:{format:"npx prettier --loglevel silent --write ./lib ./test ./certification ./types",test:"mocha test/**/*.test.js"},dependencies:{jose:"^4.15.9","lru-cache":"^6.0.0","object-hash":"^2.2.0","oidc-token-hash":"^5.0.3"},devDependencies:{"@types/node":"^16.18.106","@types/passport":"^1.0.16",base64url:"^3.0.1",chai:"^4.5.0",mocha:"^10.7.3",nock:"^13.5.5",prettier:"^2.8.8","readable-mock-req":"^0.2.2",sinon:"^9.2.4",timekeeper:"^2.3.1"},"standard-version":{scripts:{postchangelog:"sed -i '' -e 's/### \\[/## [/g' CHANGELOG.md"},types:[{type:"feat",section:"Features"},{type:"fix",section:"Fixes"},{type:"chore",hidden:!0},{type:"docs",hidden:!0},{type:"style",hidden:!0},{type:"refactor",section:"Refactor",hidden:!1},{type:"perf",section:"Performance",hidden:!1},{type:"test",hidden:!0}]}})},53174,e=>{"use strict";var t=e.i(89171),r=e.i(79832);async function n(){let e=await (0,r.auth)();return e?.user?.id?e.isAdmin?{session:e}:{response:t.NextResponse.json({error:"Acceso admin requerido"},{status:403})}:{response:t.NextResponse.json({error:"Autenticación requerida"},{status:401})}}e.s(["requireAdminSession",()=>n])},44540,e=>{"use strict";var t=e.i(75705);function r(e){return String(e??"").trim()}async function n(){let e=await (0,t.getPool)();return((await e.request().query(`
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
  `)).recordset??[]).map(e=>({newsId:String(e.newsId),communityId:String(e.communityId),communityName:String(e.communityName??""),communitySlug:String(e.communitySlug??""),title:String(e.title??""),slug:String(e.slug??""),isPublic:!!e.isPublic,isFeatured:!!e.isFeatured,publishedAt:e.publishedAt instanceof Date?e.publishedAt:e.publishedAt?new Date(e.publishedAt):null,createdAt:e.createdAt instanceof Date?e.createdAt:e.createdAt?new Date(e.createdAt):null,updatedAt:e.updatedAt instanceof Date?e.updatedAt:e.updatedAt?new Date(e.updatedAt):null}))}async function i(e){let n=r(e);if(!n)return null;let i=await (0,t.getPool)(),s=await i.request().input("newsId",n).query(`
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
    `),a=s.recordset?.[0];return a?{newsId:String(a.newsId),communityId:String(a.communityId),title:String(a.title??""),slug:String(a.slug??""),summary:String(a.summary??""),bodyHtml:String(a.bodyHtml??""),imageUrl:null==a.imageUrl?null:String(a.imageUrl),isFeatured:!!a.isFeatured,isPublic:!!a.isPublic,sortOrder:"number"==typeof a.sortOrder?a.sortOrder:null==a.sortOrder?null:Number(a.sortOrder),publishedAt:a.publishedAt instanceof Date?a.publishedAt:a.publishedAt?new Date(a.publishedAt):null,createdAt:a.createdAt instanceof Date?a.createdAt:a.createdAt?new Date(a.createdAt):null,updatedAt:a.updatedAt instanceof Date?a.updatedAt:a.updatedAt?new Date(a.updatedAt):null}:null}async function s(e){let r=await (0,t.getPool)(),n=await r.request().input("communityId",e).query(`
      SELECT TOP 1 CommunityId
      FROM cms.Communities
      WHERE CAST(CommunityId AS NVARCHAR(50)) = CAST(@communityId AS NVARCHAR(50))
    `);if(!n.recordset?.[0])throw Error("Comunidad no encontrada")}async function a(e,r,n){let i=(await (0,t.getPool)()).request().input("communityId",e).input("slug",r),s=n?"AND CAST(NewsId AS NVARCHAR(50)) <> CAST(@excludeNewsId AS NVARCHAR(50))":"";n&&i.input("excludeNewsId",n);let a=await i.query(`
    SELECT TOP 1 NewsId
    FROM cms.News
    WHERE CAST(CommunityId AS NVARCHAR(50)) = CAST(@communityId AS NVARCHAR(50))
      AND LOWER(Slug) = LOWER(@slug)
      ${s}
  `);if(a.recordset?.[0])throw Error("Ya existe una noticia con ese slug para esta comunidad.")}function o(e){let t=r(e.communityId),n=r(e.title),i=String(e.slug??"").trim().toLowerCase(),s=r(e.summary),a=r(e.bodyHtml),o=String(e.imageUrl??"").trim()||null,d=!!e.isFeatured,u=e.isPublic??!0,l="number"==typeof e.sortOrder&&Number.isFinite(e.sortOrder)?Math.trunc(e.sortOrder):null;if(!t)throw Error("CommunityId obligatorio");if(!n)throw Error("Title obligatorio");if(!i)throw Error("Slug obligatorio");if(!s)throw Error("Summary obligatorio");if(!a)throw Error("BodyHtml obligatorio");if(null!==l&&l<0)throw Error("Orden invalido");return{communityId:t,title:n,slug:i,summary:s,bodyHtml:a,imageUrl:o,isFeatured:d,isPublic:u,sortOrder:l,hasSortOrder:null!==l}}async function d(e){let{communityId:r,title:n,slug:i,summary:d,bodyHtml:u,imageUrl:l,isFeatured:c,isPublic:p,sortOrder:m,hasSortOrder:A}=o(e);await s(r),await a(r,i);let S=await (0,t.getPool)(),y=await S.request().input("communityId",r).input("title",n).input("slug",i).input("summary",d).input("bodyHtml",u).input("imageUrl",l).input("isFeatured",c).input("isPublic",p).input("hasSortOrder",A).input("sortOrder",m??0).query(`
      INSERT INTO cms.News (
        NewsId,
        CommunityId,
        Title,
        Slug,
        Summary,
        BodyHtml,
        ImageUrl,
        IsFeatured,
        IsPublic,
        SortOrder,
        PublishedAt,
        CreatedAt,
        UpdatedAt
      )
      OUTPUT INSERTED.NewsId AS newsId
      VALUES (
        NEWID(),
        CAST(@communityId AS uniqueidentifier),
        @title,
        @slug,
        @summary,
        @bodyHtml,
        @imageUrl,
        @isFeatured,
        @isPublic,
        CASE WHEN @hasSortOrder = 1 THEN @sortOrder ELSE NULL END,
        SYSDATETIME(),
        SYSDATETIME(),
        SYSDATETIME()
      )
    `),h=y.recordset?.[0];if(!h?.newsId)throw Error("No se pudo guardar la noticia");return{newsId:String(h.newsId)}}async function u(e){let n=r(e.newsId);if(!n)throw Error("NewsId obligatorio");if(!await i(n))throw Error("Noticia no encontrada");let{communityId:d,title:u,slug:l,summary:c,bodyHtml:p,imageUrl:m,isFeatured:A,isPublic:S,sortOrder:y,hasSortOrder:h}=o(e);await s(d),await a(d,l,n);let g=await (0,t.getPool)();return await g.request().input("newsId",n).input("communityId",d).input("title",u).input("slug",l).input("summary",c).input("bodyHtml",p).input("imageUrl",m).input("isFeatured",A).input("isPublic",S).input("hasSortOrder",h).input("sortOrder",y??0).query(`
      UPDATE cms.News
      SET CommunityId = CAST(@communityId AS uniqueidentifier),
          Title = @title,
          Slug = @slug,
          Summary = @summary,
          BodyHtml = @bodyHtml,
          ImageUrl = @imageUrl,
          IsFeatured = @isFeatured,
          IsPublic = @isPublic,
          SortOrder = CASE WHEN @hasSortOrder = 1 THEN @sortOrder ELSE NULL END,
          PublishedAt = ISNULL(PublishedAt, SYSDATETIME()),
          UpdatedAt = SYSDATETIME()
      WHERE CAST(NewsId AS NVARCHAR(50)) = CAST(@newsId AS NVARCHAR(50))
    `),{newsId:n}}e.s(["createAdminNews",()=>d,"getAdminNewsById",()=>i,"listAdminNews",()=>n,"updateAdminNews",()=>u])},35887,e=>{"use strict";var t=e.i(47909),r=e.i(74017),n=e.i(96250),i=e.i(59756),s=e.i(61916),a=e.i(14444),o=e.i(37092),d=e.i(69741),u=e.i(16795),l=e.i(87718),c=e.i(95169),p=e.i(47587),m=e.i(66012),A=e.i(70101),S=e.i(26937),y=e.i(10372),h=e.i(93695);e.i(52474);var g=e.i(220),w=e.i(89171),x=e.i(53174),E=e.i(44540);function f(e,t){return e instanceof Error?e.message:t}async function I(e,t){let r=await (0,x.requireAdminSession)();if("response"in r)return r.response;try{let{newsId:e}=await t.params,r=await (0,E.getAdminNewsById)(e);if(!r)return w.NextResponse.json({error:"Noticia no encontrada"},{status:404});return w.NextResponse.json({item:r})}catch(e){return w.NextResponse.json({error:f(e,"No se pudo cargar la noticia")},{status:400})}}async function R(e,t){let r=await (0,x.requireAdminSession)();if("response"in r)return r.response;try{let{newsId:r}=await t.params,n=await e.json(),i=await (0,E.updateAdminNews)({newsId:r,communityId:n?.communityId,title:n?.title,slug:n?.slug,summary:n?.summary,bodyHtml:n?.bodyHtml,imageUrl:n?.imageUrl,isFeatured:!!n?.isFeatured,isPublic:n?.isPublic??!0,sortOrder:function(e){if(null==e||""===e)return null;let t=Number(e);if(!Number.isFinite(t)||t<0)throw Error("Orden inválido");return Math.trunc(t)}(n?.sortOrder)});return w.NextResponse.json(i)}catch(e){return w.NextResponse.json({error:f(e,"No se pudo actualizar la noticia")},{status:400})}}e.s(["GET",()=>I,"PATCH",()=>R,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],36976);var b=e.i(36976);let N=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/admin/news/[newsId]/route",pathname:"/api/admin/news/[newsId]",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/admin/news/[newsId]/route.ts",nextConfigOutput:"standalone",userland:b}),{workAsyncStorage:C,workUnitAsyncStorage:T,serverHooks:v}=N;function O(){return(0,n.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:T})}async function P(e,t,n){N.isDev&&(0,i.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let w="/api/admin/news/[newsId]/route";w=w.replace(/\/index$/,"")||"/";let x=await N.prepare(e,t,{srcPage:w,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:E,params:f,nextConfig:I,parsedUrl:R,isDraftMode:b,prerenderManifest:C,routerServerContext:T,isOnDemandRevalidate:v,revalidateOnlyGenerated:O,resolvedPathname:P,clientReferenceManifest:q,serverActionsManifest:H}=x,U=(0,d.normalizeAppPath)(w),D=!!(C.dynamicRoutes[U]||C.routes[P]),j=async()=>((null==T?void 0:T.render404)?await T.render404(e,t,R,!1):t.end("This page could not be found"),null);if(D&&!b){let e=!!C.routes[P],t=C.dynamicRoutes[U];if(t&&!1===t.fallback&&!e){if(I.experimental.adapterPath)return await j();throw new h.NoFallbackError}}let F=null;!D||N.isDev||b||(F="/index"===(F=P)?"/":F);let L=!0===N.isDev||!D,k=D&&!L;H&&q&&(0,a.setReferenceManifestsSingleton)({page:w,clientReferenceManifest:q,serverActionsManifest:H,serverModuleMap:(0,o.createServerModuleMap)({serverActionsManifest:H})});let M=e.method||"GET",_=(0,s.getTracer)(),V=_.getActiveScopeSpan(),B={params:f,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!I.experimental.authInterrupts},cacheComponents:!!I.cacheComponents,supportsDynamicResponse:L,incrementalCache:(0,i.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:I.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n)=>N.onRequestError(e,t,n,T)},sharedContext:{buildId:E}},W=new u.NodeNextRequest(e),$=new u.NodeNextResponse(t),K=l.NextRequestAdapter.fromNodeNextRequest(W,(0,l.signalFromNodeResponse)(t));try{let a=async e=>N.handle(K,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=_.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${M} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t)}else e.updateName(`${M} ${w}`)}),o=!!(0,i.getRequestMeta)(e,"minimalMode"),d=async i=>{var s,d;let u=async({previousCacheEntry:r})=>{try{if(!o&&v&&O&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await a(i);e.fetchMetrics=B.renderOpts.fetchMetrics;let d=B.renderOpts.pendingWaitUntil;d&&n.waitUntil&&(n.waitUntil(d),d=void 0);let u=B.renderOpts.collectedTags;if(!D)return await (0,m.sendResponse)(W,$,s,B.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,A.toNodeOutgoingHttpHeaders)(s.headers);u&&(t[y.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=y.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,n=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=y.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:g.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await N.onRequestError(e,t,{routerKind:"App Router",routePath:w,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:k,isOnDemandRevalidate:v})},T),t}},l=await N.handleResponse({req:e,nextConfig:I,cacheKey:F,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:v,revalidateOnlyGenerated:O,responseGenerator:u,waitUntil:n.waitUntil,isMinimalMode:o});if(!D)return null;if((null==l||null==(s=l.value)?void 0:s.kind)!==g.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(d=l.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",v?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),b&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,A.fromNodeOutgoingHttpHeaders)(l.value.headers);return o&&D||c.delete(y.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,S.getCacheControlHeader)(l.cacheControl)),await (0,m.sendResponse)(W,$,new Response(l.value.body,{headers:c,status:l.value.status||200})),null};V?await d(V):await _.withPropagatedContext(e.headers,()=>_.trace(c.BaseServerSpan.handleRequest,{spanName:`${M} ${w}`,kind:s.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},d))}catch(t){if(t instanceof h.NoFallbackError||await N.onRequestError(e,t,{routerKind:"App Router",routePath:U,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:k,isOnDemandRevalidate:v})}),D)throw t;return await (0,m.sendResponse)(W,$,new Response(null,{status:500})),null}}e.s(["handler",()=>P,"patchFetch",()=>O,"routeModule",()=>N,"serverHooks",()=>v,"workAsyncStorage",()=>C,"workUnitAsyncStorage",()=>T],35887)},33779,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__347657e3._.js"].map(t=>e.l(t))).then(()=>t(56261)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__e6b38353._.js.map