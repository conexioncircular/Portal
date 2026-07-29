import { SignJWT } from "jose";

const ACCESS_TOKEN_EXPIRATION_SECONDS = 900;
const MOBILE_JWT_ISSUER = "portal-conexion-circular";
const MOBILE_JWT_AUDIENCE = "portal-conexion-circular-mobile";

function getMobileJwtSecret(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET?.trim();
  if (!secret) throw new Error("MobileJwtSecretMissing");
  return new TextEncoder().encode(secret);
}

export async function createMobileAccessToken(claims: { userId: string; isAdmin: boolean; roles: string[] }) {
  return new SignJWT({ type: "access", isAdmin: claims.isAdmin, roles: claims.roles })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(MOBILE_JWT_ISSUER)
    .setAudience(MOBILE_JWT_AUDIENCE)
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_EXPIRATION_SECONDS}s`)
    .sign(getMobileJwtSecret());
}

export { ACCESS_TOKEN_EXPIRATION_SECONDS };
