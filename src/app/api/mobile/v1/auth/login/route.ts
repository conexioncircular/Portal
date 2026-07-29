import { NextResponse } from "next/server";
import { authenticatePortalUser } from "@/lib/authentication";
import { ACCESS_TOKEN_EXPIRATION_SECONDS, createMobileAccessToken } from "@/lib/mobile-auth-token";
import { getMobileAuthorization } from "@/lib/mobile-authorization";
import { getMobileUserCommunities } from "@/lib/mobile-communities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_IDENTIFIER_LENGTH = 256;
const MAX_PASSWORD_LENGTH = 1024;
const ALLOWED_CORS_ORIGINS = new Set([
  "http://localhost:8081",
  "http://127.0.0.1:8081",
]);

type LoginPayload = { identifier?: unknown; password?: unknown };

function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  if (!origin || !ALLOWED_CORS_ORIGINS.has(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, corsHeaders: HeadersInit) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...corsHeaders } });
}

function invalidRequest(corsHeaders: HeadersInit) {
  return json({
    success: false,
    data: null,
    error: { code: "INVALID_REQUEST", message: "Debes ingresar usuario y contraseña." },
  }, 400, corsHeaders);
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);
  let body: LoginPayload;
  try {
    body = (await request.json()) as LoginPayload;
  } catch {
    return invalidRequest(corsHeaders);
  }
  if (!body || typeof body !== "object" || typeof body.identifier !== "string" || typeof body.password !== "string") {
    return invalidRequest(corsHeaders);
  }
  const identifier = body.identifier.trim();
  const password = body.password;
  if (!identifier || !password || identifier.length > MAX_IDENTIFIER_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return invalidRequest(corsHeaders);
  }

  try {
    const user = await authenticatePortalUser(identifier, password);
    if (!user) {
      return json({
        success: false,
        data: null,
        error: { code: "INVALID_CREDENTIALS", message: "Usuario o contraseña incorrectos." },
      }, 401, corsHeaders);
    }
    const authorization = getMobileAuthorization(user.isAdmin);
    const [communities, token] = await Promise.all([
      getMobileUserCommunities(user.id),
      createMobileAccessToken({ userId: user.id, isAdmin: user.isAdmin, roles: authorization.roles }),
    ]);
    return json({
      success: true,
      data: {
        accessToken: token,
        tokenType: "Bearer",
        expiresIn: ACCESS_TOKEN_EXPIRATION_SECONDS,
        user: {
          userId: user.id,
          email: user.email,
          displayName: user.name,
          isAdmin: user.isAdmin,
          roles: authorization.roles,
          permissions: authorization.permissions,
          communities,
        },
      },
      error: null,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[mobile-auth] login failed", { error: error instanceof Error ? error.name : "unknown" });
    return json({
      success: false,
      data: null,
      error: { code: "INTERNAL_ERROR", message: "No fue posible iniciar sesión." },
    }, 500, corsHeaders);
  }
}
