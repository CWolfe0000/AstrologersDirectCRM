import "server-only";
import { NextResponse } from "next/server";
import { getUser, type SessionUser } from "./auth";
import { env } from "./env";
import { ValidationError } from "./records";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Reject cross-site state-changing requests (defence in depth on top of SameSite cookies). */
export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let ok = false;
  try {
    const o = new URL(origin);
    ok = o.host === host || origin === new URL(env.appUrl).origin;
  } catch {
    ok = false;
  }
  if (!ok) throw new HttpError(403, "Cross-site request blocked.");
}

export async function readJson(req: Request, maxBytes = 1_000_000): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "Request too large.");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "Malformed JSON.");
  }
}

export async function requireUser(role?: "owner" | "client"): Promise<SessionUser> {
  const u = await getUser();
  if (!u) throw new HttpError(401, "Please sign in.");
  if (role && u.role !== role) throw new HttpError(403, "Not allowed.");
  return u;
}

/** Wrap a route handler with consistent error responses. */
export function handler<A extends unknown[]>(fn: (req: Request, ...rest: A) => Promise<Response>) {
  return async (req: Request, ...rest: A) => {
    try {
      assertSameOrigin(req);
      return await fn(req, ...rest);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, details: e.details }, e.status);
      if (e instanceof ValidationError) return json({ error: "Some fields are invalid.", details: e.issues }, 422);
      console.error(e);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}

/** Very small fixed-window rate limiter (per server instance). */
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(req: Request, key: string, limit: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const k = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(k);
  if (!b || b.reset < now) {
    buckets.set(k, { n: 1, reset: now + windowMs });
    return;
  }
  if (++b.n > limit) throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
}
