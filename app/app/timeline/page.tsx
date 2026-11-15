import type { Metadata } from "next";
import { TimelinePage } from "@/components/timeline/timeline-page";

export const metadata: Metadata = { title: "Convergence Timeline" };

export default function Page() {
  return <TimelinePage />;
}
