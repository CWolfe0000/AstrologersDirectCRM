import type { Metadata } from "next";
import { ReportsPage } from "@/components/reports/reports-page";

export const metadata: Metadata = { title: "Reports & Insights" };

export default function Page() {
  return <ReportsPage />;
}
