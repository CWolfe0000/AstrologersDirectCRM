import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal";
import { BUSINESS_ADDRESS_LINE, LEGAL_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="November 14, 2026"
      sections={[
        { h: "The Service", p: `AstrologersDirect is provided by ${LEGAL_NAME}, ${BUSINESS_ADDRESS_LINE}. It is software for managing an astrology practice. It does not provide astrological advice; interpretations are the responsibility of the practitioner.` },
        { h: "Accounts", p: "You are responsible for keeping your account credentials secure and for the activity on your account, including access you give to clients through the portal." },
        { h: "Your Content", p: "You own the client records, charts, observations and files you store. You grant us only the permissions needed to operate the service." },
        { h: "Acceptable Use", p: "Do not use the service unlawfully, upload content you have no right to share, or attempt to access other practitioners’ data." },
        { h: "Plans and Billing", p: "Plans, prices and allowances will be published before general availability. The beta is free." },
        { h: "Changes and Termination", p: "We may update these terms with notice. You can close your account at any time and export your data first." },
      ]}
    />
  );
}
