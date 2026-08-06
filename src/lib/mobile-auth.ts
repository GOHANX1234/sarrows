import { decode, encode, type JWT } from "next-auth/jwt";
import { NextRequest } from "next/server";

const MOBILE_TOKEN_SALT = "sarrows-mobile-access-token";
export const MOBILE_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function getAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET or AUTH_SECRET is required for mobile authentication");
  }
  return secret;
}

export async function createMobileAccessToken(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}) {
  return encode({
    secret: getAuthSecret(),
    salt: MOBILE_TOKEN_SALT,
    maxAge: MOBILE_TOKEN_MAX_AGE_SECONDS,
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenType: "mobile",
    },
  });
}

export async function getMobileUser(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  let payload: JWT | null;
  try {
    payload = await decode({
      token,
      secret: getAuthSecret(),
      salt: MOBILE_TOKEN_SALT,
    });
  } catch {
    return null;
  }

  if (!payload || payload.tokenType !== "mobile" || typeof payload.sub !== "string") {
    return null;
  }

  return {
    id: payload.sub,
    email: typeof payload.email === "string" ? payload.email : "",
    name: typeof payload.name === "string" ? payload.name : "",
    role: typeof payload.role === "string" ? payload.role : "user",
  };
}

export type MobileUser = NonNullable<Awaited<ReturnType<typeof getMobileUser>>>;

export function getMobileUserFromPayload(payload: JWT) {
  if (payload.tokenType !== "mobile" || typeof payload.sub !== "string") return null;
  return {
    id: payload.sub,
    email: typeof payload.email === "string" ? payload.email : "",
    name: typeof payload.name === "string" ? payload.name : "",
    role: typeof payload.role === "string" ? payload.role : "user",
  };
}