import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // proteger upgrade y dashboard
  const protectedRoute =
    pathname === "/upgrade" ||
    pathname.startsWith("/upgrade/") ||
    pathname.startsWith("/dashboard");

  if (protectedRoute && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/upgrade", "/upgrade/:path*", "/dashboard/:path*"],
};
