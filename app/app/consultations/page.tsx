import { Suspense } from "react";
import type { Metadata } from "next";
import { ConsultationsPage } from "@/components/consultations/consultations-page";

export const metadata: Metadata = { title: "Consultations & Calendar" };

export default function Page() {
  return (
    <Suspense>
      <ConsultationsPage />
    </Suspense>
  );
}
