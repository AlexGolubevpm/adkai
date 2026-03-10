import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Auth disabled — enable when PostgreSQL + users are set up
  // To re-enable: uncomment the block below
  /*
  const token = request.cookies.get("auth-token")?.value;
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (isLoginPage || isApiAuth) {
    return NextResponse.next();
  }

  if (isApi && !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
