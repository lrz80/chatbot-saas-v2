import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protege todo lo que esté dentro de /dashboard
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("token")?.value;

    // Si no hay token, redirige a login
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Aplica solo a rutas necesarias
export const config = {
  matcher: ["/dashboard/:path*", "/upgrade"],
};
