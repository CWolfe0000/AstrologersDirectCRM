import type { Metadata } from "next";
import { PageIntro, FinalCta } from "@/components/marketing/section";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = { title: "Pricing" };

const FAQ = [
  { q: "When will pricing be announced?", a: "Plans and prices are still being shaped with working astrologers. Everything shown here is a placeholder. Early-access members will hear first and help decide what each plan includes." },
  { q: "Can I import my existing clients and charts?", a: "Yes — importing client lists and birth data is planned for every plan. Import formats for popular astrology software are being reviewed with practitioners." },
  { q: "Which calculation engine does AstrologersDirect use?", a: "AstrologersDirect is designed to reuse established, professional-grade calculation engines through an abstraction layer. The prototype uses clearly labelled demonstration positions only." },
  { q: "Do my clients need to pay for the client portal?", a: "No. The client portal is part of your subscription. Clients are invited by you and sign in for free." },
  { q: "Who can see my observations?", a: "Only you. Observations, preparation notes and session notes are private practitioner records and never appear in the client portal." },
  { q: "What happens to my data if I leave?", a: "You will always be able to export your clients, charts, observations and delivered files. Your professional knowledge belongs to you." },
  { q: "Is there a free trial?", a: "Trial terms will be announced with pricing. In the meantime, the prototype is free to explore." },
];

export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Pricing"
        title="Simple plans for independent practices."
        body="AstrologersDirect is in development. Plans below show the intended structure — prices, storage and usage limits have not been finalised."
      />
      <section className="container py-16 md:py-20">
        <PricingPlans />
      </section>
      <section className="container pb-8">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow mb-3 text-accent">FAQ</p>
            <h2 className="font-serif text-[32px] leading-tight text-ink md:text-[40px]">Frequently asked questions</h2>
            <p className="mt-3 text-[14.5px] text-muted">Can’t find what you’re looking for? <a href="/contact" className="text-accent underline underline-offset-2">Contact us</a>.</p>
          </div>
          <Faq items={FAQ} />
        </div>
      </section>
      <FinalCta title="Help shape the plans." body="Join the early-access list and tell us what your practice needs. Founding practitioners will help set plan limits." />
    </>
  );
}
