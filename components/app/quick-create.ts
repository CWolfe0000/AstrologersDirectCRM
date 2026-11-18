import { UserPlus, CircleDot, CalendarPlus, NotebookPen, ListPlus, Mic, Send } from "lucide-react";

/**
 * Quick-create destinations. Pages honor these query params:
 *   /app/clients/new                      — new client wizard (Workflow A)
 *   /app/charts/new?client=<id>           — create chart
 *   /app/consultations?new=1&client=<id>  — open "New consultation" dialog
 *   /app/observations?new=1&chart=<id>    — open a new observation in the editor
 *   /app/tasks?new=1&client=<id>          — open "New task" dialog
 *   /app/studio?client=<id>&chart=<id>    — recording studio, preselected
 *   /app/delivery?new=1&client=<id>       — open "New delivery" flow
 */
export const QUICK_CREATE = [
  { label: "Add client", href: "/app/clients/new", icon: UserPlus },
  { label: "Create chart", href: "/app/charts/new", icon: CircleDot },
  { label: "Schedule consultation", href: "/app/consultations?new=1", icon: CalendarPlus },
  { label: "Add observation", href: "/app/observations?new=1", icon: NotebookPen },
  { label: "New task", href: "/app/tasks?new=1", icon: ListPlus },
  { label: "Record reading", href: "/app/studio", icon: Mic },
  { label: "Deliver reading", href: "/app/delivery?new=1", icon: Send },
];
