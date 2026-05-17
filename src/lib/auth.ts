import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "fitai_secret_key_bespoke_100k"; // In production, use process.env.JWT_SECRET
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as Record<string, unknown>;
}

export async function login(user: Record<string, unknown>) {
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const session = await encrypt({ user, expires });

  const cookieStore = await cookies();
  cookieStore.set("session", session, { 
    expires, 
    httpOnly: true, 
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0), path: "/" });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return res;
}
