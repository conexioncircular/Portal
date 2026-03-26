// src/middleware.ts — protege /comunidades/** según allowedPaths
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

  // Deja pasar rutas públicas
  if (isPublic(pathname)) return NextResponse.next();

  // Solo protegemos comunidades; el resto pasa
  if (!norm(pathname).startsWith("/comunidades/")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(url);
  }

  const allowedPaths: string[] = (token as any).allowedPaths || [];
  const primaryPath: string | null | undefined = (token as any).primaryPath;

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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|images/|static/|public/|fonts/|api/|.*\\.[\\w]+$).*)",
  ],
};
