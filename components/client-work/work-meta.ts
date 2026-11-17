import { BookHeart, ClipboardList, Footprints, Target } from "lucide-react";
import type { ClientWork, WorkKind, WorkResponse } from "@/lib/data/types";

export const WORK_KINDS: { id: WorkKind; label: string; icon: typeof BookHeart; hint: string; respond: string }[] = [
  { id: "assignment", label: "Assignment", icon: ClipboardList, hint: "Something to do or prepare before the next session.", respond: "Send a response" },
  { id: "journal", label: "Journaling prompt", icon: BookHeart, hint: "A question to reflect on and write about over time.", respond: "Add a journal entry" },
  { id: "goal", label: "Goal", icon: Target, hint: "An intention to work toward, with updates along the way.", respond: "Add an update" },
  { id: "activity", label: "Follow-up activity", icon: Footprints, hint: "A practice or observation to try between sessions.", respond: "Add a note" },
];

export const kindMeta = (k: WorkKind) => WORK_KINDS.find((x) => x.id === k)!;

/** Whether the work is done (by the practitioner, or the client's latest done/undone mark), and its entries. */
export function workState(w: ClientWork, responses: WorkResponse[]) {
  const mine = responses.filter((r) => r.workId === w.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const marks = mine.filter((r) => r.type !== "entry");
  const lastMark = marks[marks.length - 1];
  const clientDone = lastMark?.type === "done";
  return {
    entries: mine.filter((r) => r.type === "entry"),
    timeline: mine,
    done: w.status === "completed" || clientDone,
    doneBy: w.status === "completed" ? ("practitioner" as const) : clientDone ? ("client" as const) : null,
    doneAt: w.status === "completed" ? w.completedAt : clientDone ? lastMark?.createdAt : undefined,
    lastActivity: mine[mine.length - 1]?.createdAt,
  };
}

export function isOverdue(w: ClientWork, done: boolean, today: string) {
  return !done && !!w.dueDate && w.dueDate < today;
}
