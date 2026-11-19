import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Terms" };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-9 text-2xl font-semibold">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-ink-2">{children}</p>;

/** Plain-language summary of how the service works. Full legal terms from the operator still need adding. */
export default function Terms() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-3xl py-14">
        <h1 className="text-4xl font-semibold sm:text-5xl">Terms</h1>
        <H>What Datebyfate is</H>
        <P>Datebyfate provides astrological readings for reflection and entertainment. It does not predict events or behaviour, and it is not advice from a therapist, doctor, lawyer or financial adviser. Decisions about your relationships are yours.</P>
        <H>Your account</H>
        <P>You must be 18 or older. Keep your password to yourself. Add only people you have a personal reason to add, and use a nickname for them.</P>
        <H>Subscriptions</H>
        <P>Subscriptions renew automatically each month or year until you cancel. You can cancel at any time under Account, and you keep access until the end of the period you have paid for.</P>
      </main>
    </>
  );
}
