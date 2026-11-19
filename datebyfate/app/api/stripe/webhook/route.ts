import { NextResponse } from "next/server";
import { handleStripeEvent, stripe } from "@/lib/server/billing";
import { env } from "@/lib/server/env";

/** Stripe → Datebyfate. The signature proves the event came from Stripe. */
export async function POST(req: Request) {
  if (!env.stripe.secretKey || !env.stripe.webhookSecret) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  let event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), signature, env.stripe.webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  try {
    await handleStripeEvent(event);
  } catch (e) {
    console.error("Stripe webhook failed", event.type, e);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
