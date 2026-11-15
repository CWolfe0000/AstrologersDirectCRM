import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast gate for signed-in areas: without a session cookie, /app and /portal
 * redirect to the login page. The session itself is validated by every API
 * call, so this is a convenience, not the security boundary.
 * In demo mode (NEXT_PUBLIC_DATA_MODE=demo) everything is open.
 */
export function middleware(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "demo") return NextResponse.next();
  if (!req.cookies.get("ad_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*", "/app", "/portal/:path*", "/portal"] };
