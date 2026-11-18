import { Users, CircleDot, NotebookPen, Sparkles, CalendarDays, Send, LayoutPanelTop, Mic, Sprout } from "lucide-react";

/**
 * Marketing copy for each feature: why it matters first, then what it does.
 * Keep every claim true for the live product; mark anything unfinished with `status`.
 */
export type Feature = {
  id: string;
  icon: typeof Users;
  title: string;
  headline: string;
  story: string[];
  close?: string;
  points: string[];
  detail: string[];
  shot: string;
  href: string;
  cta: string;
  status?: string;
};

export const FEATURES: Feature[] = [
  {
    id: "charts",
    icon: CircleDot,
    title: "Professional Chart Workspace",
    headline: "The chart is where the work begins. Not where it ends.",
    story: [
      "A chart holds the astronomical facts. Your experience gives them meaning.",
      "Work with natal charts, synastry, midpoint composites, transits, secondary progressions, solar arcs, solar returns, horary, electional charts and astrocartography in a workspace built for serious analysis. Every chart stays connected to the person it describes and the observations it inspired.",
    ],
    close: "Your techniques. Your settings. Your interpretation.",
    points: [
      "Natal, synastry, composite, transits, progressions, solar arcs, solar returns and horary",
      "Astrocartography: planetary lines on a world map, and the lines near any city",
      "Electional search: the best times in a date range, ranked by traditional rules and the client’s chart",
      "Calculated with Swiss Ephemeris",
      "Synastry aspect grid and house overlays in both directions",
      "Convergence timeline: transits, progressions, solar arcs and eclipses to the natal chart over any period",
    ],
    detail: ["Seven house systems; tropical or sidereal zodiac", "Choose your points, aspects and orbs", "Placements, aspects, houses, rulers and planetary condition"],
    shot: "/screenshots/chart-workspace.png",
    href: "/app/charts/ch1",
    cta: "Explore the Chart Workspace",
  },
  {
    id: "clients",
    icon: Users,
    title: "Client Management",
    headline: "Know the person, not just their birth data.",
    story: [
      "A client is more than a name and a chart. They have a history, relationships, questions and experiences that shape every consultation.",
      "Keep their charts, associated people, appointments, notes and delivered readings in one record.",
    ],
    close: "When they return, you already know where you left off.",
    points: ["One record per client, with partners and family as associated people", "Birth-time accuracy recorded with the data", "Import your existing client list from a spreadsheet"],
    detail: ["Status, tags and search", "Portal access for each client", "Export all of your practice data at any time"],
    shot: "/screenshots/client-profile.png",
    href: "/app/clients/c1",
    cta: "Explore Client Management",
  },
  {
    id: "observations",
    icon: NotebookPen,
    title: "Notes & Observations",
    headline: "Your experience should become more valuable with time.",
    story: [
      "Think of every interpretation you’ve made. Every pattern you’ve noticed. Every time a client came back with something that deepened your understanding of a configuration.",
      "Those observations are valuable. Save them directly to the natal, relationship or timing chart they belong to. Tag them by planet, aspect, house and theme. Find them again across your whole practice.",
    ],
    close: "What you learn today should strengthen what you understand tomorrow.",
    points: ["Autosave with full version history", "Tags for planets, aspects, houses and themes", "Search and filter across every client"],
    detail: ["Natal, relationship and timing observations kept separate", "Go from any observation to its chart or client", "Private to you, never shown to clients"],
    shot: "/screenshots/observations.png",
    href: "/app/observations",
    cta: "Explore Observations",
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "Intelligent Assistance",
    headline: "Artificial intelligence should support your intelligence.",
    story: [
      "An astrologer’s value isn’t simply knowing what a configuration means. It’s knowing what matters, recognizing context, and exercising judgment.",
      "We’re building an assistant that retrieves your past observations, organizes chart information and points out connections worth exploring. Calculated facts, your own notes and generated suggestions will always be clearly labeled.",
    ],
    close: "The assistant helps you find and organize. You decide what it means.",
    points: ["Retrieves your own observations in context", "Facts, your notes and suggestions always labeled", "You decide what is kept"],
    detail: ["In development: today’s responses are a preview"],
    shot: "/screenshots/chart-workspace.png",
    href: "/app/charts/ch1",
    cta: "Preview Intelligent Assistance",
    status: "In development",
  },
  {
    id: "consultations",
    icon: CalendarDays,
    title: "Consultations & Calendar",
    headline: "Every conversation is part of a larger story.",
    story: [
      "A consultation doesn’t exist in isolation. It builds on what came before, and it creates questions, goals and work for the future.",
      "Keep each appointment connected to its charts, preparation notes, session notes and follow-up tasks.",
    ],
    close: "Spend less time preparing your systems, and more time preparing for your clients.",
    points: ["Your own booking page: clients choose a session and a time, and their record, natal chart and appointment are created for you", "Preparation and session notes on every appointment", "Follow-up tasks created from the session", "Reminder emails to clients, if you want them"],
    detail: ["Month, week and day views", "A private feed for Google, Apple or Outlook calendars", "Every past consultation in the client’s history"],
    shot: "/screenshots/calendar.png",
    href: "/app/consultations",
    cta: "Explore Consultations",
  },
  {
    id: "between",
    icon: Sprout,
    title: "Between Sessions",
    headline: "The work continues after the session ends.",
    story: [
      "Clients reflect, make decisions and live through the patterns you discussed. The most valuable insight often arrives between consultations.",
      "Share an assignment, a journaling prompt, a goal or a follow-up activity. Your client sees it in their portal, writes their responses, and marks it done. You see everything on their record, ready for the next session.",
    ],
    close: "Every client can feel remembered, understood and supported, even between appointments.",
    points: ["Assignments, journaling prompts, goals and follow-up activities", "Clients respond and mark work done in their portal", "You’re notified when they respond"],
    detail: ["Save drafts privately; share when you’re ready", "Link work to the consultation it came from", "Responses are encrypted and only visible to you and your client"],
    shot: "/screenshots/between-sessions.png",
    href: "/app/clients/c1?tab=work",
    cta: "Explore Between Sessions",
  },
  {
    id: "recording",
    icon: Mic,
    title: "Recording Studio",
    headline: "Share your interpretation, your way.",
    story: [
      "Some insights are best written down. Others come alive when a client can hear your voice, or watch you work through their chart.",
      "Record audio, your webcam or your screen as you walk through the chart, right in the browser. Then save it to the client’s record, or deliver it.",
    ],
    points: ["Audio, webcam, screen, or screen and webcam", "Navigate the chart while you record", "Review, rename, save or deliver"],
    detail: ["Choose your microphone and camera", "Live microphone level", "Planned: transcription and captions"],
    shot: "/screenshots/studio.png",
    href: "/app/studio",
    cta: "Explore the Recording Studio",
  },
  {
    id: "delivery",
    icon: Send,
    title: "Reading Delivery",
    headline: "The experience should reflect the quality of your work.",
    story: [
      "The care you put into a reading shouldn’t end when the file is finished.",
      "Deliver written reports, audio, video or links through a private, professional experience. Add a personal message, decide whether it can be downloaded, and set when access ends.",
    ],
    close: "Give clients one reliable place to return to the work you’ve shared.",
    points: ["PDF, audio, video or a link", "Personal message, download permission and expiry", "Client notified by email"],
    detail: ["Draft, ready and delivered queues", "See when a reading has been opened", "Files stored privately and served only to that client"],
    shot: "/screenshots/delivery.png",
    href: "/app/delivery",
    cta: "Explore Reading Delivery",
  },
  {
    id: "portal",
    icon: LayoutPanelTop,
    title: "Client Portal",
    headline: "A professional experience for the people who trust you.",
    story: [
      "Your clients shouldn’t have to search their inbox for the reading you sent six months ago.",
      "Give them a private, mobile-friendly place for their readings, recordings and consultation history.",
    ],
    close: "Your professional notes stay private. Their materials stay easy to find.",
    points: ["Your practice’s name and color on every page", "Audio, video and documents play in the browser", "Your private notes never appear"],
    detail: ["Reading library filtered by type", "Consultation history with shared materials", "Free for your clients"],
    shot: "/screenshots/portal.png",
    href: "/portal",
    cta: "Explore the Client Portal",
  },
];
