import type { Metadata } from "next";
import { PageIntro, FinalCta } from "@/components/marketing/section";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = { title: "Pricing" };

const FAQ = [
  { q: "When will pricing be announced?", a: "Plans and prices are being shaped with working astrologers. Early-access members will hear first, and help decide what each plan includes." },
  { q: "Can I import my existing clients?", a: "Yes. You can import your client list and birth data from a spreadsheet (CSV) on every plan. Import formats for other astrology software are being reviewed with practitioners." },
  { q: "Which calculation engine does AstrologersDirect use?", a: "Swiss Ephemeris, the professional standard, with Astrodienst’s data files. We’re checking results against reference charts from established software; until that’s complete, charts carry a small “not yet checked” label." },
  { q: "Do my clients need to pay for the client portal?", a: "No. The client portal is part of your subscription. Clients are invited by you and sign in for free." },
  { q: "Who can see my observations?", a: "Only you. Observations, preparation notes and session notes are private practitioner records and never appear in the client portal." },
  { q: "What happens to my data if I leave?", a: "You can export all of your practice data at any time from Settings: clients, people, charts, observations, consultations, tasks and delivery records. Your professional knowledge belongs to you." },
  { q: "Is there a free trial?", a: "Trial terms will be announced with pricing. During the private beta, early-access members use AstrologersDirect free." },
];

export default function PricingPage() {
  return (
    <>
      <PageIntro eyebrow="Pricing" title="Invest in Your Practice. Build on Your Expertise.">
        <div className="mt-5 max-w-2xl space-y-3 text-[17px] leading-relaxed text-muted">
          <p>Your tools should help your practice grow without making it more complicated.</p>
          <p>Whether you’re building your first client base or running an established practice, AstrologersDirect is designed to grow with you. Simple plans. Professional capabilities. Your knowledge always belongs to you.</p>
          <p className="text-[14.5px]">Pricing is being finalized. Join early access to help shape the plans.</p>
        </div>
      </PageIntro>
      <section className="container py-16 md:py-20">
        <PricingPlans />
      </section>
      <section className="container pb-16 md:pb-20">
        <div className="grid gap-10 rounded-2xl border border-line bg-surface p-8 md:p-12 lg:grid-cols-2 lg:gap-16">
          <h2 className="font-serif text-[30px] leading-tight text-ink md:text-[38px]">Your Knowledge Should Never Be Locked Inside Your Software.</h2>
          <div className="space-y-3 text-[15.5px] leading-relaxed text-ink-3">
            <p>Your client records, observations and professional work are yours.</p>
            <p>You can export all of your practice data at any time, from Settings.</p>
            <p className="font-medium text-ink">Because the value of your practice belongs to you, not to the platform you use.</p>
          </div>
        </div>
      </section>
      <section className="container pb-8">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow mb-3 text-accent">FAQ</p>
            <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">Frequently Asked Questions</h2>
            <p className="mt-3 text-[14.5px] text-muted">Can’t find what you’re looking for? <a href="/contact" className="text-accent underline underline-offset-2">Contact us</a>.</p>
          </div>
          <Faq items={FAQ} />
        </div>
      </section>
      <FinalCta title="Help Shape What Comes Next." body="We’re working with professional astrologers to decide the right features, limits and pricing. Join the early-access community and help us build a platform worth investing in." />
    </>
  );
}
