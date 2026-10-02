// src/middleware.ts — protege /comunidades/** según allowedPaths
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function getSiteOrigin(rawValue: string | undefined, fallbackHostname: string): URL | null {
  const value = rawValue?.trim() ||
    (process.env.NODE_ENV === "production" ? `https://${fallbackHostname}` : "");

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? new URL(url.origin) : null;
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string) {
  const value = String(hostname ?? "").trim().toLowerCase();
  return value === "localhost" || value === "127.0.0.1" || value === "::1" || value === "[::1]";
}

function getRequestHostname(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const rawHost = forwardedHost?.split(",")[0]?.trim() ||
    req.headers.get("host")?.trim() || req.nextUrl.host;

  try {
    return new URL(`http://${rawHost}`).hostname.toLowerCase();
  } catch {
    return req.nextUrl.hostname.toLowerCase();
  }
}

// Routing de dominio independiente de NEXTAUTH_URL y de los permisos del usuario.
function getHostnameRedirect(req: NextRequest): URL | null {
  const requestHostname = getRequestHostname(req);
  if (isLocalHostname(requestHostname)) {
    return null;
  }

  const mainOrigin = getSiteOrigin(process.env.NEXT_PUBLIC_MAIN_SITE_URL, "conexioncircular.cl");
  const communitiesOrigin = getSiteOrigin(
    process.env.NEXT_PUBLIC_COMMUNITIES_URL,
    "comunidades.conexioncircular.cl"
  );

  if (!mainOrigin || !communitiesOrigin ||
    requestHostname !== mainOrigin.hostname.toLowerCase() ||
    requestHostname === communitiesOrigin.hostname.toLowerCase()) {
    return null;
  }

  const pathname = norm(req.nextUrl.pathname);
  const isPortalPath = ["/login", "/post-login", "/unauthorized", "/comunidades", "/admin"]
    .some((base) => pathname === base || pathname.startsWith(`${base}/`));
  if (!isPortalPath) {
    return null;
  }

  const url = new URL(communitiesOrigin.origin);
  url.pathname = req.nextUrl.pathname;
  url.search = req.nextUrl.search;
  return url;
}

// Normaliza: minúsculas y sin "/" final (salvo raíz)
function norm(p: string) {
  const x = p.split("?")[0].split("#")[0].toLowerCase();
  return x !== "/" && x.endsWith("/") ? x.slice(0, -1) : x;
}

// ¿el current está permitido exactamente o como subruta de un permitido específico?
function isPathAllowed(currentPath: string, allowed: string[]) {
  const current = norm(currentPath);
  const segs = (s: string) => norm(s).split("/").filter(Boolean);

  for (const raw of allowed) {
    const base = norm(raw);
    if (!base) continue;
    if (current === base) return true;

    // abre subárbol solo si el permitido tiene >=2 segmentos (p.ej. /comunidades/valparaiso)
    const baseSegs = segs(base);
    const currSegs = segs(current);
    const canOpenSubtree = baseSegs.length >= 2;
    if (canOpenSubtree && currSegs.length > baseSegs.length && current.startsWith(base + "/")) {
      return true;
    }
  }
  return false;
}

// Rutas públicas
const PUBLIC = new Set<string>([
  "/", "/login", "/post-login", "/unauthorized",
  "/favicon.ico", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest",
]);

function isPublic(pathname: string) {
  const p = norm(pathname);
  if (PUBLIC.has(p)) return true;
  if (p.startsWith("/_next")) return true;
  if (p.startsWith("/images")) return true;
  if (p.startsWith("/static")) return true;
  if (p.startsWith("/public")) return true;
  if (p.startsWith("/fonts")) return true;
  if (p.startsWith("/api/")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const normalizedPath = norm(pathname);
  const hostnameRedirect = getHostnameRedirect(req);

  if (hostnameRedirect) {
    return NextResponse.redirect(hostnameRedirect, 308);
  }

  // Deja pasar rutas públicas
  if (isPublic(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (normalizedPath.startsWith("/admin")) {
    if (!token) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", req.nextUrl.href);
      return NextResponse.redirect(url);
    }

    if (!token.isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.nextUrl.origin));
    }

    return NextResponse.next();
  }

  // Solo protegemos comunidades; el resto pasa
  if (!normalizedPath.startsWith("/comunidades/")) {
    return NextResponse.next();
  }

  if (!token) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(url);
  }

  if (token.isAdmin) {
    return NextResponse.next();
  }

  const allowedPaths = token.allowedPaths ?? [];
  const primaryPath = token.primaryPath;

  // autorizar si el path pertenece a allowedPaths o a la primaria
  const ok =
    isPathAllowed(pathname, allowedPaths) ||
    (primaryPath ? isPathAllowed(pathname, [primaryPath]) : false);

  if (!ok) {
    return NextResponse.redirect(new URL("/unauthorized", req.nextUrl.origin));
  }

  return NextResponse.next();
}

// Intercepta todo excepto estáticos y APIs (ya excluidos por isPublic)
export const config = {
  matcher: [
    "/((?!health$|health/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|images/|static/|public/|fonts/|api/|.*\\.[\\w]+$).*)",
  ],
};
