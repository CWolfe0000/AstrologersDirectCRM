import { NextResponse, type NextRequest } from "next/server";

/**
 * Two hosts, one app (when NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_APP_URL are set):
 *   astrologersdirect.com      the website; account and app pages move to the app host
 *   app.astrologersdirect.com  the product; "/" is sign-in, website pages move to the site host
 * Then the fast gate for signed-in areas: without a session cookie, /app and
 * /portal redirect to sign-in. The session itself is validated by every API
 * call, so this is a convenience, not the security boundary. Demo mode is open.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : null;
const APP = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : null;
const APP_AREAS = ["/app", "/portal", "/auth", "/book"];
const under = (path: string, roots: string[]) => roots.some((r) => path === r || path.startsWith(r + "/"));

function moveTo(origin: URL, req: NextRequest) {
  const url = new URL(req.nextUrl.pathname + req.nextUrl.search, origin);
  return NextResponse.redirect(url, 308);
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const signedIn = !!req.cookies.get("ad_session");

  if (SITE && APP && host === APP.host) {
    if (path === "/") {
      const url = req.nextUrl.clone();
      url.pathname = signedIn ? "/app" : "/auth/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (!under(path, APP_AREAS)) return moveTo(SITE, req);
  } else if (SITE && APP && host === SITE.host) {
    if (under(path, APP_AREAS)) return moveTo(APP, req);
  }

  if (process.env.NEXT_PUBLIC_DATA_MODE === "demo") return NextResponse.next();
  if (under(path, ["/app", "/portal"]) && !signedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?next=${encodeURIComponent(path + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Pages only: never API routes, Next internals or static files.
export const config = { matcher: ["/((?!api/|_next/|icons/|screenshots/|sw\\.js|manifest\\.webmanifest|favicon|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml|json|js|css|html|woff2?)$).*)"] };
