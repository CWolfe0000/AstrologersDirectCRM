import { verifyWebhook } from "@/lib/server/stripe";
import { checkoutCompleted } from "@/lib/server/booking";
import { accountUpdated } from "@/lib/server/payments";
import { HttpError } from "@/lib/server/http";

/**
 * Stripe Connect webhook (events from astrologers' connected accounts).
 * Subscribe it to: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.expired, account.updated.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  let event;
  try {
    event = verifyWebhook(raw, req.headers.get("stripe-signature"));
  } catch (e) {
    return new Response((e as Error).message, { status: e instanceof HttpError ? e.status : 400 });
  }
  const obj = event.data.object as Record<string, unknown>;
  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.expired":
        await checkoutCompleted(obj as { id: string; payment_status: string; payment_intent: string | null; status: string });
        break;
      case "account.updated":
        await accountUpdated(obj as { id: string });
        break;
    }
  } catch (e) {
    console.error("[stripe webhook]", event.type, e);
    await import("@/lib/server/errors").then((m) => m.recordError("server", { message: `Stripe webhook ${event.type}: ${(e as Error).message}`, stack: (e as Error).stack, url: "/api/stripe/webhook" })).catch(() => {});
    return new Response("Error", { status: 500 }); // Stripe retries
  }
  return Response.json({ received: true });
}
