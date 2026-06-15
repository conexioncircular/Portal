module.exports=[70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},22734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},60526,(e,t,r)=>{t.exports=e.x("node:os",()=>require("node:os"))},12057,(e,t,r)=>{t.exports=e.x("node:util",()=>require("node:util"))},59639,(e,t,r)=>{t.exports=e.x("node:process",()=>require("node:process"))},12714,(e,t,r)=>{t.exports=e.x("node:fs/promises",()=>require("node:fs/promises"))},74533,(e,t,r)=>{t.exports=e.x("node:child_process",()=>require("node:child_process"))},57764,(e,t,r)=>{t.exports=e.x("node:url",()=>require("node:url"))},46069,(e,t,r)=>{t.exports=e.x("argon2",()=>require("argon2"))},45706,(e,t,r)=>{t.exports=e.x("querystring",()=>require("querystring"))},6461,(e,t,r)=>{t.exports=e.x("zlib",()=>require("zlib"))},75096,e=>{e.v({name:"openid-client",version:"5.7.1",description:"OpenID Connect Relying Party (RP, Client) implementation for Node.js runtime, supports passportjs",keywords:["auth","authentication","basic","certified","client","connect","dynamic","electron","hybrid","identity","implicit","oauth","oauth2","oidc","openid","passport","relying party","strategy"],homepage:"https://github.com/panva/openid-client",repository:"panva/openid-client",funding:{url:"https://github.com/sponsors/panva"},license:"MIT",author:"Filip Skokan <panva.ip@gmail.com>",exports:{types:"./types/index.d.ts",import:"./lib/index.mjs",require:"./lib/index.js"},main:"./lib/index.js",types:"./types/index.d.ts",files:["lib","types/index.d.ts"],scripts:{format:"npx prettier --loglevel silent --write ./lib ./test ./certification ./types",test:"mocha test/**/*.test.js"},dependencies:{jose:"^4.15.9","lru-cache":"^6.0.0","object-hash":"^2.2.0","oidc-token-hash":"^5.0.3"},devDependencies:{"@types/node":"^16.18.106","@types/passport":"^1.0.16",base64url:"^3.0.1",chai:"^4.5.0",mocha:"^10.7.3",nock:"^13.5.5",prettier:"^2.8.8","readable-mock-req":"^0.2.2",sinon:"^9.2.4",timekeeper:"^2.3.1"},"standard-version":{scripts:{postchangelog:"sed -i '' -e 's/### \\[/## [/g' CHANGELOG.md"},types:[{type:"feat",section:"Features"},{type:"fix",section:"Fixes"},{type:"chore",hidden:!0},{type:"docs",hidden:!0},{type:"style",hidden:!0},{type:"refactor",section:"Refactor",hidden:!1},{type:"perf",section:"Performance",hidden:!1},{type:"test",hidden:!0}]}})},53174,e=>{"use strict";var t=e.i(89171),r=e.i(79832);async function i(){let e=await (0,r.auth)();return e?.user?.id?e.isAdmin?{session:e}:{response:t.NextResponse.json({error:"Acceso admin requerido"},{status:403})}:{response:t.NextResponse.json({error:"Autenticación requerida"},{status:401})}}e.s(["requireAdminSession",()=>i])},13567,e=>{"use strict";function t(e){return String(e??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"")}function r(e){let r=t(e);return r?`/comunidades/${r}`:"/comunidades"}e.s(["buildCommunityPath",()=>r,"normalizeCommunitySlug",()=>t])},31212,e=>{"use strict";var t=e.i(27709),r=e.i(75705),i=e.i(13567);function n(e,t,r){let i=String(e??"").trim();if(!i)return null;if(i.length>r)throw Error(`${t} supera el maximo de ${r} caracteres`);return i}function o(e){return String(e??"").trim()}async function a(e,r){let i=Array.from(new Set((process.env.INTERNAL_ADMIN_EMAILS??process.env.ADMIN_EMAILS??"admincc").split(/[;,\n]/).map(e=>String(e??"").trim().toLowerCase()).filter(Boolean)));if(0!==i.length)for(let n of i){let i=await new t.Request(e).input("email",n).query(`
        SELECT TOP 1 UserId AS userId
        FROM auth.Users
        WHERE LOWER(Email) = LOWER(@email)
      `),o=i.recordset?.[0]?.userId;if(!o)continue;let a=await new t.Request(e).input("userId",String(o)).query(`
        SELECT TOP 1 1 AS ok
        FROM cms.UserPageAccess
        WHERE UserId = CAST(@userId AS uniqueidentifier)
          AND ISNULL(IsPrimary, 0) = 1
      `),s=!!a.recordset?.[0];await new t.Request(e).input("userId",String(o)).input("pageId",r).input("accessLevel",t.TinyInt,1).input("isPrimary",t.Bit,+!s).query(`
        IF NOT EXISTS (
          SELECT 1
          FROM cms.UserPageAccess
          WHERE UserId = CAST(@userId AS uniqueidentifier)
            AND PageId = CAST(@pageId AS uniqueidentifier)
        )
        BEGIN
          INSERT INTO cms.UserPageAccess (UserId, PageId, AccessLevel, IsPrimary)
          VALUES (
            CAST(@userId AS uniqueidentifier),
            CAST(@pageId AS uniqueidentifier),
            @accessLevel,
            @isPrimary
          )
        END
      `)}}function s(e){return{communityId:String(e.communityId),pageId:null==e.pageId?null:String(e.pageId),name:String(e.name??""),slug:String(e.slug??""),isActive:!!e.isActive,region:null==e.region?null:String(e.region),localidad:null==e.localidad?null:String(e.localidad),tipo:null==e.tipo?null:String(e.tipo),tramo:null==e.tramo?null:String(e.tramo),path:null==e.path?null:String(e.path),logoUrl:null==e.logoUrl?null:String(e.logoUrl)}}function u(e){let t=function(e,t,r){let i=String(e??"").trim();if(!i)throw Error(`${t} obligatorio`);if(i.length>150)throw Error(`${t} supera el maximo de 150 caracteres`);return i}(e.name,"Nombre",0),r=(0,i.normalizeCommunitySlug)(t),o=e.isActive??!0,a=n(e.region,"Region",100),s=n(e.localidad,"Localidad",150),u=n(e.tipo,"Tipo",100),l=function(e){let t=String(e??"").trim();if(!t)return null;if(!/^\d+$/.test(t))throw Error("Tramo debe contener solo numeros enteros.");let r=Number(t);if(!Number.isInteger(r)||r<=0)throw Error("Tramo debe ser un numero entero mayor que 0.");return String(r)}(e.tramo),d=n(e.logoUrl,"Logo",2048);if(!r)throw Error("No se pudo generar el slug de la comunidad");return{name:t,slug:r,isActive:o,region:a,localidad:s,tipo:u,tramoNumber:l,logoUrl:d,path:(0,i.buildCommunityPath)(r)}}async function l(e,t){let i=(await (0,r.getPool)()).request().input("slug",e);t&&i.input("excludeCommunityId",t);let n=t?"AND CAST(CommunityId AS NVARCHAR(50)) <> CAST(@excludeCommunityId AS NVARCHAR(50))":"",o=await i.query(`
    SELECT TOP 1 CommunityId
    FROM cms.Communities
    WHERE LOWER(Slug) = LOWER(@slug)
      ${n}
  `);if(o.recordset?.[0])throw Error("Ya existe una comunidad con ese nombre.")}async function d(e,t){let i=(await (0,r.getPool)()).request().input("path",e);t&&i.input("excludePageId",t);let n=t?"AND CAST(PageId AS NVARCHAR(50)) <> CAST(@excludePageId AS NVARCHAR(50))":"",o=await i.query(`
    SELECT TOP 1 PageId
    FROM cms.Pages
    WHERE LOWER(Path) = LOWER(@path)
      ${n}
  `);if(o.recordset?.[0])throw Error("Ya existe una pagina asociada a ese slug.")}async function c(e){let t=await (0,r.getPool)(),i=await t.request().input("communityId",e).query(`
      SELECT TOP 1
        p.PageId AS pageId,
        p.Path AS path,
        p.LogoUrl AS logoUrl
      FROM cms.Pages p
      WHERE CAST(p.CommunityId AS NVARCHAR(50)) = CAST(@communityId AS NVARCHAR(50))
      ORDER BY CASE WHEN LOWER(p.Path) LIKE '/comunidades/%' THEN 0 ELSE 1 END, p.Path
    `),n=i.recordset?.[0];return n?{pageId:String(n.pageId),path:null==n.path?null:String(n.path),logoUrl:null==n.logoUrl?null:String(n.logoUrl)}:null}async function p(){let e=await (0,r.getPool)();return((await e.request().query(`
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
  `)).recordset??[]).map(e=>s(e))}async function m(e){let t=o(e);if(!t)return null;let i=await (0,r.getPool)(),n=await i.request().input("communityId",t).query(`
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
    `),a=n.recordset?.[0];return a?s(a):null}async function g(e){let{name:i,slug:n,isActive:o,region:s,localidad:c,tipo:p,tramoNumber:m,logoUrl:g,path:A}=u(e);await l(n),await d(A);let S=await (0,r.getPool)(),E=new t.Transaction(S),R=!1;await E.begin();try{let e=await new t.Request(E).input("slug",n).input("name",i).input("isActive",t.Bit,o).input("region",s).input("localidad",c).input("tipo",p).input("tramoNumber",m).query(`
        DECLARE @nextCommunityNumber INT = (
          SELECT COALESCE(MAX(CommunityNumber), 0) + 1
          FROM cms.Communities WITH (UPDLOCK, HOLDLOCK)
        );

        INSERT INTO cms.Communities (
          CommunityNumber,
          Slug,
          Name,
          IsActive,
          Region,
          Localidad,
          Tipo,
          Tramo
        )
        OUTPUT INSERTED.CommunityId AS communityId
        VALUES (
          @nextCommunityNumber,
          @slug,
          @name,
          @isActive,
          @region,
          @localidad,
          @tipo,
          CASE WHEN @tramoNumber IS NULL THEN NULL ELSE CONCAT('Tramo ', @tramoNumber) END
        )
      `),r=e.recordset?.[0]?.communityId;if(!r)throw Error("No se pudo guardar la comunidad");let u=await new t.Request(E).input("path",A).input("title",i).input("communityId",String(r)).input("logoUrl",g).query(`
        INSERT INTO cms.Pages (
          Path,
          Title,
          IsPublic,
          CommunityId,
          LogoUrl
        )
        OUTPUT INSERTED.PageId AS pageId
        VALUES (
          @path,
          @title,
          0,
          CAST(@communityId AS uniqueidentifier),
          @logoUrl
        )
      `),l=u.recordset?.[0]?.pageId;return l&&await a(E,String(l)),await E.commit(),R=!0,{communityId:String(r)}}catch(e){throw R||await E.rollback().catch(()=>void 0),e}}async function A(e){let i=o(e.communityId);if(!i)throw Error("CommunityId obligatorio");let n=await m(i);if(!n)throw Error("Comunidad no encontrada");let{name:s,slug:p,isActive:g,region:A,localidad:S,tipo:E,tramoNumber:R,logoUrl:C,path:y}=u(e);await l(p,i),await d(y,n.pageId??void 0);let h=await c(i),I=await (0,r.getPool)(),T=new t.Transaction(I),N=!1;await T.begin();try{if(await new t.Request(T).input("communityId",i).input("slug",p).input("name",s).input("isActive",t.Bit,g).input("region",A).input("localidad",S).input("tipo",E).input("tramoNumber",R).query(`
        DECLARE @nextCommunityNumber INT = (
          SELECT COALESCE(MAX(CommunityNumber), 0) + 1
          FROM cms.Communities WITH (UPDLOCK, HOLDLOCK)
        );

        UPDATE cms.Communities
        SET CommunityNumber = COALESCE(CommunityNumber, @nextCommunityNumber),
            Slug = @slug,
            Name = @name,
            IsActive = @isActive,
            Region = @region,
            Localidad = @localidad,
            Tipo = @tipo,
            Tramo = CASE WHEN @tramoNumber IS NULL THEN NULL ELSE CONCAT('Tramo ', @tramoNumber) END
        WHERE CAST(CommunityId AS NVARCHAR(50)) = CAST(@communityId AS NVARCHAR(50))
      `),h)await new t.Request(T).input("pageId",h.pageId).input("path",y).input("title",s).input("communityId",i).input("logoUrl",C).query(`
          UPDATE cms.Pages
          SET Path = @path,
              Title = @title,
              IsPublic = 0,
              CommunityId = CAST(@communityId AS uniqueidentifier),
              LogoUrl = @logoUrl
          WHERE CAST(PageId AS NVARCHAR(50)) = CAST(@pageId AS NVARCHAR(50))
        `);else{let e=await new t.Request(T).input("path",y).input("title",s).input("communityId",i).input("logoUrl",C).query(`
          INSERT INTO cms.Pages (
            Path,
            Title,
            IsPublic,
            CommunityId,
            LogoUrl
          )
          OUTPUT INSERTED.PageId AS pageId
          VALUES (
            @path,
            @title,
            0,
            CAST(@communityId AS uniqueidentifier),
            @logoUrl
          )
        `),r=e.recordset?.[0]?.pageId;r&&await a(T,String(r))}await T.commit(),N=!0}catch(e){throw N||await T.rollback().catch(()=>void 0),e}return{communityId:i}}e.s(["createAdminCommunity",()=>g,"getAdminCommunityById",()=>m,"listAdminCommunities",()=>p,"updateAdminCommunity",()=>A])},64114,e=>{"use strict";var t=e.i(47909),r=e.i(74017),i=e.i(96250),n=e.i(59756),o=e.i(61916),a=e.i(14444),s=e.i(37092),u=e.i(69741),l=e.i(16795),d=e.i(87718),c=e.i(95169),p=e.i(47587),m=e.i(66012),g=e.i(70101),A=e.i(26937),S=e.i(10372),E=e.i(93695);e.i(52474);var R=e.i(220),C=e.i(89171),y=e.i(53174),h=e.i(31212);function I(e,t){return e instanceof Error?e.message:t}async function T(e,t){let r=await (0,y.requireAdminSession)();if("response"in r)return r.response;try{let{communityId:e}=await t.params,r=await (0,h.getAdminCommunityById)(e);if(!r)return C.NextResponse.json({error:"Comunidad no encontrada"},{status:404});return C.NextResponse.json({item:r})}catch(e){return C.NextResponse.json({error:I(e,"No se pudo cargar la comunidad")},{status:400})}}async function N(e,t){let r=await (0,y.requireAdminSession)();if("response"in r)return r.response;try{let{communityId:r}=await t.params,i=await e.json(),n=await (0,h.updateAdminCommunity)({communityId:r,name:i?.name,isActive:i?.isActive??!0,region:i?.region,localidad:i?.localidad,tipo:i?.tipo,tramo:i?.tramo,logoUrl:i?.logoUrl});return C.NextResponse.json(n)}catch(e){return C.NextResponse.json({error:I(e,"No se pudo actualizar la comunidad")},{status:400})}}e.s(["GET",()=>T,"PATCH",()=>N,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],84755);var x=e.i(84755);let f=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/admin/communities/[communityId]/route",pathname:"/api/admin/communities/[communityId]",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/admin/communities/[communityId]/route.ts",nextConfigOutput:"standalone",userland:x}),{workAsyncStorage:w,workUnitAsyncStorage:P,serverHooks:v}=f;function L(){return(0,i.patchFetch)({workAsyncStorage:w,workUnitAsyncStorage:P})}async function O(e,t,i){f.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let C="/api/admin/communities/[communityId]/route";C=C.replace(/\/index$/,"")||"/";let y=await f.prepare(e,t,{srcPage:C,multiZoneDraftMode:!1});if(!y)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:h,params:I,nextConfig:T,parsedUrl:N,isDraftMode:x,prerenderManifest:w,routerServerContext:P,isOnDemandRevalidate:v,revalidateOnlyGenerated:L,resolvedPathname:O,clientReferenceManifest:q,serverActionsManifest:b}=y,U=(0,u.normalizeAppPath)(C),H=!!(w.dynamicRoutes[U]||w.routes[O]),D=async()=>((null==P?void 0:P.render404)?await P.render404(e,t,N,!1):t.end("This page could not be found"),null);if(H&&!x){let e=!!w.routes[O],t=w.dynamicRoutes[U];if(t&&!1===t.fallback&&!e){if(T.experimental.adapterPath)return await D();throw new E.NoFallbackError}}let j=null;!H||f.isDev||x||(j="/index"===(j=O)?"/":j);let M=!0===f.isDev||!H,k=H&&!M;b&&q&&(0,a.setReferenceManifestsSingleton)({page:C,clientReferenceManifest:q,serverActionsManifest:b,serverModuleMap:(0,s.createServerModuleMap)({serverActionsManifest:b})});let W=e.method||"GET",_=(0,o.getTracer)(),F=_.getActiveScopeSpan(),V={params:I,prerenderManifest:w,renderOpts:{experimental:{authInterrupts:!!T.experimental.authInterrupts},cacheComponents:!!T.cacheComponents,supportsDynamicResponse:M,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:T.cacheLife,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,i)=>f.onRequestError(e,t,i,P)},sharedContext:{buildId:h}},$=new l.NodeNextRequest(e),B=new l.NodeNextResponse(t),K=d.NextRequestAdapter.fromNodeNextRequest($,(0,d.signalFromNodeResponse)(t));try{let a=async e=>f.handle(K,V).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=_.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let i=r.get("next.route");if(i){let t=`${W} ${i}`;e.setAttributes({"next.route":i,"http.route":i,"next.span_name":t}),e.updateName(t)}else e.updateName(`${W} ${C}`)}),s=!!(0,n.getRequestMeta)(e,"minimalMode"),u=async n=>{var o,u;let l=async({previousCacheEntry:r})=>{try{if(!s&&v&&L&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await a(n);e.fetchMetrics=V.renderOpts.fetchMetrics;let u=V.renderOpts.pendingWaitUntil;u&&i.waitUntil&&(i.waitUntil(u),u=void 0);let l=V.renderOpts.collectedTags;if(!H)return await (0,m.sendResponse)($,B,o,V.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,g.toNodeOutgoingHttpHeaders)(o.headers);l&&(t[S.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==V.renderOpts.collectedRevalidate&&!(V.renderOpts.collectedRevalidate>=S.INFINITE_CACHE)&&V.renderOpts.collectedRevalidate,i=void 0===V.renderOpts.collectedExpire||V.renderOpts.collectedExpire>=S.INFINITE_CACHE?void 0:V.renderOpts.collectedExpire;return{value:{kind:R.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:i}}}}catch(t){throw(null==r?void 0:r.isStale)&&await f.onRequestError(e,t,{routerKind:"App Router",routePath:C,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:k,isOnDemandRevalidate:v})},P),t}},d=await f.handleResponse({req:e,nextConfig:T,cacheKey:j,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:w,isRoutePPREnabled:!1,isOnDemandRevalidate:v,revalidateOnlyGenerated:L,responseGenerator:l,waitUntil:i.waitUntil,isMinimalMode:s});if(!H)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==R.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(u=d.value)?void 0:u.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",v?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),x&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,g.fromNodeOutgoingHttpHeaders)(d.value.headers);return s&&H||c.delete(S.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,A.getCacheControlHeader)(d.cacheControl)),await (0,m.sendResponse)($,B,new Response(d.value.body,{headers:c,status:d.value.status||200})),null};F?await u(F):await _.withPropagatedContext(e.headers,()=>_.trace(c.BaseServerSpan.handleRequest,{spanName:`${W} ${C}`,kind:o.SpanKind.SERVER,attributes:{"http.method":W,"http.target":e.url}},u))}catch(t){if(t instanceof E.NoFallbackError||await f.onRequestError(e,t,{routerKind:"App Router",routePath:U,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:k,isOnDemandRevalidate:v})}),H)throw t;return await (0,m.sendResponse)($,B,new Response(null,{status:500})),null}}e.s(["handler",()=>O,"patchFetch",()=>L,"routeModule",()=>f,"serverHooks",()=>v,"workAsyncStorage",()=>w,"workUnitAsyncStorage",()=>P],64114)},33779,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__347657e3._.js"].map(t=>e.l(t))).then(()=>t(56261)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__87b63bfb._.js.map