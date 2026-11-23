"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { DATA_MODE, relTime } from "@/lib/utils";
import { DEFAULT_REFUND_POLICY, money, refundPolicyText, type RefundPolicy } from "@/lib/booking/payments";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SimulatedNote } from "@/components/ui/misc";
import { SaveBar } from "./save-bar";
import { Unavailable, useBookingProfile } from "./booking-section";

type Payment = { id: string; status: string; amount: number; refunded: number; currency: string; service: string; client: string; paidAt: string | null };
type Status = { available: false } | { available: true; connected: boolean; ready: boolean; submitted: boolean; needsInfo: boolean; currency: string; feePercent: number; payments: Payment[] };

export function usePaymentStatus() {
  const [s, setS] = React.useState<Status | null>(null);
  const load = React.useCallback(() => api<Status>("/api/v1/payments").then(setS, () => setS({ available: false })), []);
  React.useEffect(() => { if (DATA_MODE !== "demo") void load(); }, [load]);
  return { s, reload: load };
}

/** Send the astrologer to Stripe's onboarding (or back to it). */
export function ConnectStripeButton({ label = "Set Up Payments With Stripe", variant, returnTo, beforeLeave }: { label?: string; variant?: "secondary"; returnTo?: "setup"; beforeLeave?: () => Promise<unknown> }) {
  const [busy, setBusy] = React.useState(false);
  const toast = useStore((x) => x.toast);
  return (
    <Button variant={variant} disabled={busy} onClick={async () => {
      setBusy(true);
      try {
        await beforeLeave?.();
        window.location.assign((await api<{ url: string }>("/api/v1/payments/connect", { body: { returnTo } })).url);
      }
      catch (e) { toast("Couldn’t Open Stripe", (e as Error).message, "error"); setBusy(false); }
    }}>
      {busy ? <Loader2 className="animate-spin" /> : <CreditCard />} {label}
    </Button>
  );
}

const HOURS = [0, 12, 24, 48, 72, 168];
const hoursLabel = (h: number) => (h === 0 ? "Any time before" : h % 24 === 0 ? `${h / 24} day${h === 24 ? "" : "s"} before` : `${h} hours before`);

/** The refund policy, as two plain choices. Used in Settings and in first-run setup. */
export function RefundPolicyFields({ value, onChange }: { value: RefundPolicy; onChange: (v: RefundPolicy) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Refund If Canceled" htmlFor="rp-hours">
          <Select id="rp-hours" value={value.fullRefundHours} onChange={(e) => onChange({ ...value, fullRefundHours: Number(e.target.value) })}>
            {HOURS.map((h) => <option key={h} value={h}>{hoursLabel(h)}</option>)}
          </Select>
        </Field>
        <Field label="Later Cancellations Get Back" htmlFor="rp-late">
          <Select id="rp-late" value={value.lateRefundPercent} disabled={value.fullRefundHours === 0} onChange={(e) => onChange({ ...value, lateRefundPercent: Number(e.target.value) })}>
            {[0, 25, 50, 75].map((p) => <option key={p} value={p}>{p === 0 ? "Nothing" : `${p}%`}</option>)}
          </Select>
        </Field>
      </div>
      <p className="rounded-lg bg-canvas-2 px-3 py-2 text-[13px] text-ink-3"><span className="font-medium text-ink">Clients see:</span> {refundPolicyText(value)}</p>
    </div>
  );
}

/** Settings › Payments: Stripe account, taking payment at booking, refund policy, recent payments. */
export function PaymentsSection() {
  const b = useBookingProfile();
  const { s, reload } = usePaymentStatus();
  const params = useSearchParams();
  const back = params.get("stripe");
  const toast = useStore((x) => x.toast);
  const [refunding, setRefunding] = React.useState<string | null>(null);
  const [dash, setDash] = React.useState(false);

  if (DATA_MODE === "demo")
    return <Card><CardHeader title="Payments" /><CardBody><SimulatedNote>In the live app, clients pay when they book, straight into your own Stripe account.</SimulatedNote></CardBody></Card>;
  if (!b.p || !s) return <Unavailable error={b.error} />;
  const p = b.p;
  const policy = p.refundPolicy ?? DEFAULT_REFUND_POLICY;

  const refund = async (pay: Payment) => {
    if (!window.confirm(`Refund ${money(pay.amount - pay.refunded, pay.currency)} to ${pay.client}?`)) return;
    setRefunding(pay.id);
    try {
      const r = await api<{ refunded: number }>("/api/v1/payments/refund", { body: { id: pay.id } });
      toast("Refunded", `${money(r.refunded, pay.currency)} is on its way back to ${pay.client}.`, "success");
      await reload();
    } catch (e) { toast("Refund Didn’t Go Through", (e as Error).message, "error"); }
    finally { setRefunding(null); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Your Stripe Account" description={`Clients pay when they book, straight into your own Stripe account, and Stripe pays out to your bank. ${s.available && s.feePercent ? `AstrologersDirect’s fee is ${s.feePercent}% of each booking.` : "AstrologersDirect takes no cut."}`} />
        <CardBody className="space-y-4">
          {!s.available ? (
            <p className="text-[13.5px] text-muted">Online payments are coming soon.</p>
          ) : s.ready ? (
            <>
              <p className="flex items-center gap-2 text-[14px] font-medium text-sage-dark"><CheckCircle2 className="size-4" /> Connected: you can take payments.</p>
              <Button variant="secondary" disabled={dash} onClick={async () => {
                setDash(true);
                try { window.open((await api<{ url: string }>("/api/v1/payments/dashboard", { body: {} })).url, "_blank", "noopener"); }
                catch (e) { toast("Couldn’t Open Stripe", (e as Error).message, "error"); }
                finally { setDash(false); }
              }}><ExternalLink /> Open Stripe Dashboard</Button>
              <p className="text-[12.5px] text-muted">Payouts, receipts, disputes and your bank details live in Stripe.</p>
            </>
          ) : s.connected ? (
            <>
              <p className="text-[14px] text-ink">{s.submitted ? "Stripe is reviewing your details. This usually takes a few minutes; we’ll check again when you come back." : "You’ve started setting up Stripe. Finish to start taking payments."}</p>
              {back === "return" && !s.submitted && <p className="text-[13px] text-muted">It looks like a few details are still needed.</p>}
              <ConnectStripeButton label={s.submitted ? "Update Details in Stripe" : "Continue Setting Up Stripe"} />
            </>
          ) : (
            <>
              <p className="text-[14px] text-ink-3">It takes about five minutes: Stripe asks for your name, address, the last four digits of your SSN (or your EIN) and the bank account for payouts. Stripe charges its standard card fee on each payment.</p>
              <ConnectStripeButton />
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Taking Payment" description="What clients pay when they book, and what they get back if they cancel." />
        <CardBody className="space-y-5">
          <Field label="Take Payment When Clients Book" htmlFor="pay-on" hint={s.available && s.ready ? "For services with a price. Services without one (or marked “Free”) are booked without payment." : "Turns on once your Stripe account is connected."}>
            <Switch id="pay-on" checked={p.takePayments !== false} onCheckedChange={(v) => b.set({ takePayments: v })} />
          </Field>
          <div>
            <p className="mb-2 text-[14px] font-semibold text-ink">Cancellation and Refund Policy</p>
            <p className="mb-3 text-[13px] text-muted">When a client cancels from their booking link, they’re refunded automatically under this policy. You can always refund more yourself below.</p>
            <RefundPolicyFields value={policy} onChange={(v) => b.set({ refundPolicy: v })} />
          </div>
        </CardBody>
      </Card>

      {s.available && s.connected && (
        <Card>
          <CardHeader title="Recent Payments" />
          {s.payments.length === 0 ? (
            <CardBody><p className="text-[13.5px] text-muted">No payments yet.</p></CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {s.payments.map((pay) => (
                <li key={pay.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px]">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{pay.client} · {pay.service}</span>
                    <span className="block text-[12.5px] text-muted">{pay.paidAt ? relTime(pay.paidAt, new Date()) : ""}{pay.refunded ? ` · ${money(pay.refunded, pay.currency)} refunded` : ""}</span>
                  </span>
                  <span className="font-medium text-ink">{money(pay.amount, pay.currency)}</span>
                  <Badge tone={pay.status === "paid" ? "sage" : "neutral"}>{pay.status === "paid" ? "Paid" : pay.status === "refunded" ? "Refunded" : "Partly Refunded"}</Badge>
                  {pay.status !== "refunded" && (
                    <Button size="sm" variant="ghost" disabled={refunding === pay.id} onClick={() => void refund(pay)} aria-label={`Refund ${pay.client}`}>
                      {refunding === pay.id ? <Loader2 className="animate-spin" /> : <RotateCcw />} Refund
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <SaveBar dirty={b.dirty} busy={b.busy} error={b.error} onSave={() => void b.save({}, "Your payment settings are saved.")} onDiscard={b.discard} />
    </div>
  );
}
