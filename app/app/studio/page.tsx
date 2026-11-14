import { Suspense } from "react";
import type { Metadata } from "next";
import { StudioPage } from "@/components/studio/studio-page";

export const metadata: Metadata = { title: "Recording Studio" };

export default function Page() {
  return (
    <Suspense>
      <StudioPage />
    </Suspense>
  );
}
