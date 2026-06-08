import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth/jwt";

const PROTECTED_ROUTES = ["/dashboard", "/review"];
const AUTH_ROUTES = ["/login", "/signup"];

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

async function getAuthStatus(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("accessToken")?.value;
  if (!token) return false;
  try {
    await verifyToken(token, "access");
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname) && !isAuthRoute(pathname)) {
    return NextResponse.next();
  }

  const authenticated = await getAuthStatus(request);

  if (isProtected(pathname) && !authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute(pathname) && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
