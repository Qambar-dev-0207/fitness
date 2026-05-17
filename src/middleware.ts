import { NextRequest, NextResponse } from "next/server";
import { decrypt, updateSession } from "@/lib/auth";

const protectedRoutes = ["/protocol", "/uplink", "/journal"];
const publicRoutes = ["/login", "/register", "/"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get("session")?.value;
  let session = null;
  
  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch (e) {
      console.error("Session verification failed");
    }
  }

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicRoute && session && path !== "/") {
    return NextResponse.redirect(new URL("/protocol", req.nextUrl));
  }

  // Refresh the session if it exists
  if (session) {
    const res = await updateSession(req);
    if (res) return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\.png$).*)"],
};
