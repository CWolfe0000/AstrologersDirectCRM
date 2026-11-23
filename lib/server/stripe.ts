import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "./http";

/**
 * Stripe's REST API, called directly (form-encoded). Payments are taken on
 * each astrologer's own connected account (Stripe Connect, direct charges).
 *   STRIPE_SECRET_KEY      sk_live_… / sk_test_…   (unset: online payments are off)
 *   STRIPE_WEBHOOK_SECRET  whsec_…  for the Connect webhook endpoint
 *   PLATFORM_FEE_PERCENT   AstrologersDirect's share of each booking (default 0)
 *   STRIPE_API_BASE        tests only: a stand-in for api.stripe.com
 */
export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
export const platformFeePercent = () => Math.min(50, Math.max(0, Number(process.env.PLATFORM_FEE_PERCENT ?? 0) || 0));

type Params = Record<string, unknown>;

/** { a: { b: 1 }, c: [ { d: 2 } ] } → a[b]=1&c[0][d]=2 */
function encode(params: Params, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === "object" ? encode(x as Params, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(x))));
    else if (typeof v === "object") encode(v as Params, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export class StripeError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

export async function stripe<T = Record<string, unknown>>(method: "GET" | "POST" | "DELETE", path: string, params: Params = {}, opts: { account?: string; idempotencyKey?: string } = {}): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(503, "Online payments aren’t set up yet.");
  const base = (process.env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/$/, "");
  const body = encode(params).toString();
  const url = `${base}/v1${path}${method === "GET" && body ? `?${body}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Stripe-Version": "2024-06-20",
      ...(method !== "GET" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(opts.account ? { "Stripe-Account": opts.account } : {}),
      ...(opts.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : {}),
    },
    body: method !== "GET" ? body : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; code?: string } };
  if (!res.ok) throw new StripeError(data.error?.message ?? `Stripe error ${res.status}`, res.status, data.error?.code);
  return data;
}

/** Check a webhook's Stripe-Signature header (t=…,v1=…) against the raw body; 5-minute tolerance. */
export function verifyWebhook(raw: string, header: string | null, now = Date.now()) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new HttpError(503, "Webhooks aren’t configured.");
  const parts = Object.fromEntries((header ?? "").split(",").map((p) => p.split("=") as [string, string]).filter((p) => p.length === 2)) as Record<string, string>;
  const sigs = (header ?? "").split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!t || !sigs.length) throw new HttpError(400, "Missing signature.");
  if (Math.abs(now / 1000 - t) > 300) throw new HttpError(400, "Signature too old.");
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex"));
  if (!sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), expected))) throw new HttpError(400, "Bad signature.");
  return JSON.parse(raw) as { id: string; type: string; account?: string; data: { object: Record<string, unknown> } };
}
