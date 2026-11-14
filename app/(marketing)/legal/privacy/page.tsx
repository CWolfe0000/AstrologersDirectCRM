import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="November 14, 2026"
      sections={[
        { h: "Who we are", p: "AstrologersDirect provides practice-management software for astrologers. Practitioners are the controllers of their clients’ data; AstrologersDirect processes it on their behalf." },
        { h: "Information we collect", p: "Account details for practitioners; client records, birth data, charts, notes and files that practitioners choose to store; and limited technical information needed to operate the service." },
        { h: "Private practitioner records", p: "Observations, preparation notes and session notes are visible only to the practitioner. They are never shown in the client portal." },
        { h: "How information is used", p: "To provide and secure the service, deliver readings to clients, send notifications you’ve enabled, and improve the product. We do not sell personal information." },
        { h: "Intelligent assistance", p: "Assistance features operate on the practitioner’s own data, at the practitioner’s request. Any future anonymised research features will be opt-in." },
        { h: "Your rights", p: "Practitioners can export or delete their data at any time. Clients can contact their practitioner, or us, to exercise their rights." },
        { h: "Contact", p: "Questions about privacy can be sent through the contact page." },
      ]}
    />
  );
}
