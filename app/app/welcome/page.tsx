import type { Metadata } from "next";
import { SetupWizard } from "@/components/onboarding/setup-wizard";

export const metadata: Metadata = { title: "Set Up Your Practice" };

export default function Page() {
  return <SetupWizard />;
}
