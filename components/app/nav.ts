import {
  LayoutDashboard, Users, CircleDot, CalendarDays, NotebookPen, ListChecks, Send, Mic, BarChart3, Settings, Bell,
} from "lucide-react";

export const APP_NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/charts", label: "Charts", icon: CircleDot },
  { href: "/app/consultations", label: "Consultations & Calendar", short: "Calendar", icon: CalendarDays },
  { href: "/app/observations", label: "Notes & Observations", short: "Observations", icon: NotebookPen },
  { href: "/app/tasks", label: "Tasks & Follow-Ups", short: "Tasks", icon: ListChecks },
  { href: "/app/delivery", label: "Reading Delivery", icon: Send },
  { href: "/app/studio", label: "Recording Studio", icon: Mic },
  { href: "/app/reports", label: "Reports & Insights", icon: BarChart3 },
];

export const APP_NAV_SECONDARY = [
  { href: "/app/notifications", label: "Notifications", icon: Bell },
  { href: "/app/settings", label: "Settings", icon: Settings },
];
