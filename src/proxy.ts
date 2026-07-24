import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session;
  const isAdmin = (session?.user as any)?.role === "admin";

  // Admin routes — require admin role
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL(`/login?callbackUrl=/admin`, req.url));
    if (!isAdmin) return NextResponse.redirect(new URL("/home", req.url));
  }

  // Protected routes — require auth
  const protectedRoutes = ["/home", "/movies", "/anime", "/watchlist", "/profile", "/search"];
  if (protectedRoutes.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
    }
  }

  // Auth routes — redirect if already logged in
  if ((pathname.startsWith("/login") || pathname.startsWith("/signup")) && isLoggedIn) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/home/:path*", "/movies/:path*", "/anime/:path*", "/watchlist/:path*", "/profile/:path*", "/search/:path*", "/login", "/signup"],
};
