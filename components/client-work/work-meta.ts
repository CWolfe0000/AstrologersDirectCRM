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

/** Starting points every practice gets; a practitioner's own templates appear alongside. */
export const STARTER_TEMPLATES: { id: string; kind: WorkKind; title: string; instructions: string }[] = [
  {
    id: "starter-saturn",
    kind: "journal",
    title: "What is Saturn asking of you?",
    instructions: "Over the next few weeks, notice where you feel pressure, responsibility or delay. Each time, write a few lines: what happened, how you responded, and what it seems to be asking you to build, or to let go of.",
  },
  {
    id: "starter-moon",
    kind: "journal",
    title: "A week of Moon notes",
    instructions: "Each day this week, write one or two words for your mood, and anything that stood out. At the end of the week, read them back and notice any patterns. We’ll look at them together alongside the Moon’s movement through your chart.",
  },
  {
    id: "starter-moments",
    kind: "assignment",
    title: "Three moments",
    instructions: "Before our next session, write down three moments when you felt most like yourself, and three when you didn’t. Include roughly when they happened. We’ll look at them alongside your chart.",
  },
  {
    id: "starter-step",
    kind: "goal",
    title: "One small step",
    instructions: "Choose one small, concrete step toward what we talked about, and take it before we meet again. Add a line here when you’ve done it: what you did, and how it felt.",
  },
  {
    id: "starter-new-moon",
    kind: "activity",
    title: "New Moon intentions",
    instructions: "At the next New Moon, set aside fifteen quiet minutes. Write up to three intentions for the month ahead, as specific as you can make them. Come back to them at the Full Moon and add a note on how they’re unfolding.",
  },
];
