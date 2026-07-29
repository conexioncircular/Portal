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
type LoginPayload = { identifier?: unknown; password?: unknown };

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function invalidRequest() {
  return json({
    success: false,
    data: null,
    error: { code: "INVALID_REQUEST", message: "Debes ingresar usuario y contraseña." },
  }, 400);
}

export async function POST(request: Request) {
  let body: LoginPayload;
  try {
    body = (await request.json()) as LoginPayload;
  } catch {
    return invalidRequest();
  }
  if (!body || typeof body !== "object" || typeof body.identifier !== "string" || typeof body.password !== "string") {
    return invalidRequest();
  }
  const identifier = body.identifier.trim();
  const password = body.password;
  if (!identifier || !password || identifier.length > MAX_IDENTIFIER_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return invalidRequest();
  }

  try {
    const user = await authenticatePortalUser(identifier, password);
    if (!user) {
      return json({
        success: false,
        data: null,
        error: { code: "INVALID_CREDENTIALS", message: "Usuario o contraseña incorrectos." },
      }, 401);
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
    }, 200);
  } catch (error) {
    console.error("[mobile-auth] login failed", { error: error instanceof Error ? error.name : "unknown" });
    return json({
      success: false,
      data: null,
      error: { code: "INTERNAL_ERROR", message: "No fue posible iniciar sesión." },
    }, 500);
  }
}
