/** What's New: recent releases, newest first. Each item is something the app does now. */
export interface Release { date: string; title: string; items: string[] }

export const CHANGELOG: Release[] = [
  {
    date: "2026-11-22",
    title: "Your Page, Your Setup, Your Formats",
    items: [
      "Share Cards: Instagram-ready images from a client’s chart (Big Three, chart wheel) or today’s sky (Moon phase, this week’s aspects), with your name and booking link.",
      "Full asteroid catalog: add any numbered asteroid to your charts by name or number, with positions from NASA JPL.",
      "Session formats: Live Session, Recorded Reading (audio or video) and Written Reading, each with its own instructions for clients. Recorded and written readings get a ready-by date instead of a time slot.",
      "A link-in-bio public profile: your photo, links, services and bio, at astrologersdirect.com/your-name.",
      "A guided setup for new practices: profile, services, intake forms, hours and your page in five steps.",
      "Search engines can list your page if you choose.",
      "Suggest a Feature, right from the app.",
      "Clearer multi-wheel, with the degrees of the angles shown.",
    ],
  },
  {
    date: "2026-11-20",
    title: "Intake Forms and the Client Portal",
    items: [
      "Intake forms: as many as you like, from ready-made starters, with optional life events (single dates or periods). Link a form to a service and it goes out when someone books.",
      "Life events show on the Convergence Timeline and feed Rectification.",
      "Invite imported clients to their portal in one go.",
      "Messaging between you and your clients, shared charts in the portal, and a Book a Session button.",
      "The Convergence Timeline judges each contact on its whole pass; solar arcs show as a single pass with time-based phases.",
      "A detailed, colorful chart wheel, with your own colors if you like.",
      "Forecast windows, couple timing, midpoints and fixed stars.",
    ],
  },
  {
    date: "2026-11-19",
    title: "Rectification, Horary and Traditional Techniques",
    items: [
      "Birth-time rectification from life events, with primary directions and birth circumstances.",
      "Horary judgment: significators, perfection, strength, timing and an outcome log.",
      "Traditional techniques on natal charts, natal promise by house, returns, Davison charts and chart import from Solar Fire (AAF).",
      "A Technical Breakdown beside every interpretation.",
    ],
  },
  {
    date: "2026-11-18",
    title: "Online Booking and the Private Beta",
    items: [
      "Online booking: services, hours and rules, with self-service reschedule and cancel links.",
      "Electional astrology, horary charts and astrocartography.",
      "The Convergence Timeline’s Client Activation overview.",
    ],
  },
];
