import { Suspense } from "react";
import type { Metadata } from "next";
import { TasksPage } from "@/components/tasks/tasks-page";

export const metadata: Metadata = { title: "Tasks & Follow-Ups" };

export default function Page() {
  return (
    <Suspense>
      <TasksPage />
    </Suspense>
  );
}
