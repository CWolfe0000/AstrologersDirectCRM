import type {
  ClientWork, WorkResponse, Activity, AppNotification, ChartRecord, ClientFile, Consultation, Observation, PortalNotification, Reading, Recording, Task } from "./types";

// ——— Charts ———————————————————————————————————————————————————————————
export const charts: ChartRecord[] = [
  { id: "ch1", title: "Amelia Hart — Natal", type: "natal", personIds: ["c1"], clientId: "c1", createdAt: "2023-02-10", updatedAt: "2026-11-12T16:20:00", lastOpenedAt: "2026-11-13T15:05:00", favorite: true },
  { id: "ch2", title: "Amelia — Transits Nov 2026", type: "transits", personIds: ["c1"], clientId: "c1", refDate: "2026-11-14", createdAt: "2026-11-01", updatedAt: "2026-11-13T10:12:00", lastOpenedAt: "2026-11-13T10:12:00", favorite: true },
  { id: "ch3", title: "Amelia & Daniel — Synastry", type: "synastry", personIds: ["c1", "p1"], clientId: "c1", createdAt: "2025-06-02", updatedAt: "2026-10-29T11:00:00", lastOpenedAt: "2026-11-12T09:40:00" },
  { id: "ch4", title: "Amelia & Daniel — Composite", type: "composite", personIds: ["c1", "p1"], clientId: "c1", createdAt: "2025-06-02", updatedAt: "2026-10-29T11:30:00" },
  { id: "ch5", title: "Daniel Reyes — Natal", type: "natal", personIds: ["p1"], clientId: "c1", createdAt: "2025-06-02", updatedAt: "2025-06-02" },
  { id: "ch6", title: "Amelia — Solar Return 2027", type: "solar-return", personIds: ["c1"], clientId: "c1", refDate: "2027-03-14", createdAt: "2026-11-08", updatedAt: "2026-11-08", savedConfig: "Relocated: Lisbon" },
  { id: "ch7", title: "Jonah Whitaker — Natal", type: "natal", personIds: ["c2"], clientId: "c2", createdAt: "2024-05-03", updatedAt: "2026-10-20T13:00:00", lastOpenedAt: "2026-11-10T14:00:00", favorite: true },
  { id: "ch8", title: "Jonah — Progressions 2026–27", type: "progressions", personIds: ["c2"], clientId: "c2", refDate: "2026-11-17", createdAt: "2026-10-20", updatedAt: "2026-11-10T14:30:00", lastOpenedAt: "2026-11-10T14:30:00" },
  { id: "ch9", title: "Jonah — Solar Arcs 2026", type: "solar-arc", personIds: ["c2"], clientId: "c2", refDate: "2026-11-17", createdAt: "2026-10-20", updatedAt: "2026-10-20" },
  { id: "ch10", title: "Priya Natarajan — Natal", type: "natal", personIds: ["c3"], clientId: "c3", createdAt: "2025-01-18", updatedAt: "2026-09-02", lastOpenedAt: "2026-11-11T11:00:00" },
  { id: "ch11", title: "Priya & Arjun — Synastry", type: "synastry", personIds: ["c3", "p4"], clientId: "c3", createdAt: "2025-03-11", updatedAt: "2026-09-02" },
  { id: "ch12", title: "Marcus Delacroix — Natal (approx. time)", type: "natal", personIds: ["c4"], clientId: "c4", createdAt: "2026-11-06", updatedAt: "2026-11-06", lastOpenedAt: "2026-11-13T17:30:00", settings: { houseSystem: "whole-sign" } },
  { id: "ch13", title: "Sofia Lindqvist — Natal", type: "natal", personIds: ["c5"], clientId: "c5", createdAt: "2024-09-22", updatedAt: "2026-08-14" },
  { id: "ch14", title: "Sofia — Solar Return 2026", type: "solar-return", personIds: ["c5"], clientId: "c5", refDate: "2026-09-30", createdAt: "2026-09-01", updatedAt: "2026-09-25" },
  { id: "ch15", title: "Theo Abernathy — Natal", type: "natal", personIds: ["c6"], clientId: "c6", createdAt: "2022-06-14", updatedAt: "2024-01-10" },
  { id: "ch16", title: "Hannah Okafor — Natal", type: "natal", personIds: ["c7"], clientId: "c7", createdAt: "2023-10-01", updatedAt: "2026-11-02", favorite: true },
  { id: "ch17", title: "Hannah — Transits Winter 2026", type: "transits", personIds: ["c7"], clientId: "c7", refDate: "2026-12-21", createdAt: "2026-11-02", updatedAt: "2026-11-02" },
  { id: "ch18", title: "Rafael Moreno — Natal", type: "natal", personIds: ["c8"], clientId: "c8", createdAt: "2025-04-12", updatedAt: "2026-07-01" },
  { id: "ch19", title: "Rafael & Lucía — Synastry", type: "synastry", personIds: ["c8", "p5"], clientId: "c8", createdAt: "2025-04-30", updatedAt: "2026-07-01", savedConfig: "Business partnership" },
  { id: "ch20", title: "Grace Liu — Natal", type: "natal", personIds: ["c9"], clientId: "c9", createdAt: "2026-10-28", updatedAt: "2026-11-11", lastOpenedAt: "2026-11-11T16:00:00" },
  { id: "ch21", title: "Naomi Feldman — Natal", type: "natal", personIds: ["c11"], clientId: "c11", createdAt: "2021-08-19", updatedAt: "2026-05-23" },
  { id: "ch22", title: "Elliot Brandt — Natal (noon, whole sign)", type: "natal", personIds: ["c12"], clientId: "c12", createdAt: "2026-03-30", updatedAt: "2026-06-11", settings: { houseSystem: "whole-sign" } },
  { id: "ch23", title: "William Prescott — Natal", type: "natal", personIds: ["c10"], clientId: "c10", createdAt: "2019-03-03", updatedAt: "2019-03-03" },
  { id: "ch24", title: "Clara Whitaker — Natal", type: "natal", personIds: ["p3"], clientId: "c2", createdAt: "2025-02-14", updatedAt: "2025-02-14" },
];

// ——— Consultations ———————————————————————————————————————————————————
export const consultations: Consultation[] = [
  // Today (Sat Nov 14 2026)
  { id: "k1", clientId: "c1", type: "Transit Review", start: "2026-11-14T10:00:00", durationMin: 75, status: "scheduled", location: "Video call", chartIds: ["ch1", "ch2", "ch6"], readingIds: [], recordingIds: [], prepNotes: "Saturn now within 2° of natal Moon — revisit last year's observation about the family-home question. Bring up the 2027 solar return relocated to Lisbon. Ask how the conversation with Daniel went after October." },
  { id: "k2", clientId: "c4", type: "First Natal Reading", start: "2026-11-14T13:30:00", durationMin: 90, status: "scheduled", location: "Video call", chartIds: ["ch12"], readingIds: [], recordingIds: [], prepNotes: "Birth time approximate (around 1 PM). Using whole-sign houses for now. Ask about major life events for rectification: moves, career changes, relationships. Explain uncertainty of angles up front." },
  { id: "k3", clientId: "c9", type: "Natal Follow-up", start: "2026-11-14T16:00:00", durationMin: 45, status: "scheduled", location: "Phone", chartIds: ["ch20"], readingIds: [], recordingIds: [], prepNotes: "Follow-up questions from the gift reading — mostly about the Saturn return timing and study plans." },
  // Upcoming
  { id: "k4", clientId: "c2", type: "Career Timing Consultation", start: "2026-11-17T09:30:00", durationMin: 60, status: "scheduled", location: "Video call", chartIds: ["ch7", "ch8", "ch9"], readingIds: [], recordingIds: [], prepNotes: "Progressed Moon changing signs early 2027. Compare with solar arc MC. He wants to know about launching his own studio in spring." },
  { id: "k5", clientId: "c7", type: "Transit Review", start: "2026-11-18T08:00:00", durationMin: 60, status: "scheduled", location: "Video call", chartIds: ["ch16", "ch17"], readingIds: [], recordingIds: [] },
  { id: "k6", clientId: "c3", type: "Relationship Synastry", start: "2026-11-19T17:00:00", durationMin: 90, status: "scheduled", location: "Video call", chartIds: ["ch10", "ch11"], readingIds: [], recordingIds: [], prepNotes: "Arjun will join for the second half. Keep natal notes separate from synastry notes." },
  { id: "k7", clientId: "c8", type: "Business Partnership Review", start: "2026-11-21T11:00:00", durationMin: 60, status: "scheduled", location: "Video call", chartIds: ["ch18", "ch19"], readingIds: [], recordingIds: [] },
  { id: "k8", clientId: "c11", type: "Annual Review", start: "2026-11-24T14:00:00", durationMin: 75, status: "scheduled", location: "In person", chartIds: ["ch21"], readingIds: [], recordingIds: [] },
  { id: "k9", clientId: "c5", type: "Solar Return Reading", start: "2026-11-26T10:00:00", durationMin: 60, status: "scheduled", location: "Video call", chartIds: ["ch13", "ch14"], readingIds: [], recordingIds: [] },
  { id: "k10", clientId: "c12", type: "Rectification Session", start: "2026-12-02T15:00:00", durationMin: 90, status: "scheduled", location: "Video call", chartIds: ["ch22"], readingIds: [], recordingIds: [] },
  { id: "k11", clientId: "c1", type: "Relationship Synastry", start: "2026-12-09T10:00:00", durationMin: 90, status: "scheduled", location: "Video call", chartIds: ["ch3", "ch4"], readingIds: [], recordingIds: [], prepNotes: "Joint session with Daniel. Focus on composite Moon and relocation timing." },
  // Past
  { id: "k12", clientId: "c1", type: "Natal Reading", start: "2023-02-24T10:00:00", durationMin: 90, status: "completed", location: "Video call", chartIds: ["ch1"], readingIds: ["r1"], recordingIds: [], sessionNotes: "First full natal reading. Strong response to the discussion of the 4th-house Moon and family obligations. Wants to revisit annually.", sharedSummary: "Full natal reading covering temperament, relationships, vocation and the home/family axis." },
  { id: "k13", clientId: "c1", type: "Relationship Synastry", start: "2025-06-12T10:00:00", durationMin: 90, status: "completed", location: "Video call", chartIds: ["ch3", "ch4"], readingIds: ["r2"], recordingIds: [], sessionNotes: "Joint session with Daniel. Composite Sun–Saturn discussed as shared responsibility. Daniel resonated with the Venus–Mars contacts.", sharedSummary: "Synastry and composite overview for Amelia and Daniel." },
  { id: "k14", clientId: "c1", type: "Transit Review", start: "2026-10-08T10:00:00", durationMin: 60, status: "completed", location: "Video call", chartIds: ["ch2"], readingIds: ["r3"], recordingIds: ["rec1"], sessionNotes: "Talked about the Lisbon idea seriously for the first time. Saturn approaching natal Moon — she named 'feeling responsible for everyone'. Follow-up: solar return relocated to Lisbon.", sharedSummary: "Autumn transit review: Saturn to the Moon, timing for the Lisbon decision." },
  { id: "k15", clientId: "c2", type: "Natal Reading", start: "2024-05-20T09:00:00", durationMin: 90, status: "completed", location: "Video call", chartIds: ["ch7"], readingIds: ["r5"], recordingIds: [], sessionNotes: "Strong 10th-house emphasis. Discussed his father's influence on his career definition.", sharedSummary: "Natal reading with vocational emphasis." },
  { id: "k16", clientId: "c2", type: "Career Timing Consultation", start: "2026-10-27T09:30:00", durationMin: 60, status: "completed", location: "Video call", chartIds: ["ch8"], readingIds: [], recordingIds: [], sessionNotes: "Discussed contract renewal. Wants written summary of progressions + solar arcs before Nov 17 call." },
  { id: "k17", clientId: "c7", type: "Transit Review", start: "2026-11-02T08:00:00", durationMin: 60, status: "completed", location: "Video call", chartIds: ["ch16", "ch17"], readingIds: ["r6"], recordingIds: ["rec2"], sessionNotes: "Health stress and workload. Recommended pacing through December.", sharedSummary: "Transit review heading into winter." },
  { id: "k18", clientId: "c3", type: "Career Consultation", start: "2026-09-02T17:00:00", durationMin: 60, status: "completed", location: "Video call", chartIds: ["ch10"], readingIds: ["r7"], recordingIds: [], sessionNotes: "Considering a design lead role. Jupiter transit to MC discussed.", sharedSummary: "Career timing for the design lead decision." },
  { id: "k19", clientId: "c9", type: "Gift Natal Reading", start: "2026-11-04T16:00:00", durationMin: 75, status: "completed", location: "Video call", chartIds: ["ch20"], readingIds: ["r8"], recordingIds: ["rec3"], sessionNotes: "Very engaged. Many questions about Saturn return. Scheduled follow-up.", sharedSummary: "First natal reading (gift)." },
  { id: "k20", clientId: "c5", type: "Creative Timing", start: "2026-08-14T10:00:00", durationMin: 60, status: "completed", location: "Video call", chartIds: ["ch13"], readingIds: ["r9"], recordingIds: [], sharedSummary: "Timing for the album release." },
  { id: "k21", clientId: "c8", type: "Natal Reading", start: "2025-04-25T11:00:00", durationMin: 90, status: "completed", location: "Video call", chartIds: ["ch18"], readingIds: [], recordingIds: [], sessionNotes: "Business-focused natal reading." },
  { id: "k22", clientId: "c6", type: "Retirement Timing", start: "2024-01-10T15:00:00", durationMin: 60, status: "completed", location: "Video call", chartIds: ["ch15"], readingIds: [], recordingIds: [] },
  { id: "k23", clientId: "c11", type: "Annual Review", start: "2025-11-20T14:00:00", durationMin: 75, status: "completed", location: "In person", chartIds: ["ch21"], readingIds: ["r10"], recordingIds: [], sharedSummary: "2025–26 annual review." },
  { id: "k24", clientId: "c12", type: "Natal Reading (unknown time)", start: "2026-06-11T15:00:00", durationMin: 75, status: "completed", location: "Video call", chartIds: ["ch22"], readingIds: [], recordingIds: [], sessionNotes: "Worked from noon chart. Discussed rectification process." },
  { id: "k25", clientId: "c7", type: "Natal Follow-up", start: "2026-11-11T08:00:00", durationMin: 30, status: "cancelled", location: "Phone", chartIds: ["ch16"], readingIds: [], recordingIds: [] },
  { id: "k26", clientId: "c2", type: "Family Chart Session", start: "2026-12-04T09:30:00", durationMin: 60, status: "scheduled", location: "Video call", chartIds: ["ch24"], readingIds: [], recordingIds: [] },
];

// ——— Observations ———————————————————————————————————————————————————
export const observations: Observation[] = [
  {
    id: "o1", title: "4th-house Moon and the pull of family duty", scope: "natal", chartId: "ch1", personIds: ["c1"], clientId: "c1", consultationId: "k12",
    body: "<p>Moon in the 4th, square Saturn. In both sessions Amelia described herself as the one who <strong>holds the family together</strong>, especially for her mother.</p><p>She experiences rest as something that has to be earned. Worth watching when Saturn transits this Moon (late 2026).</p>",
    planets: ["moon", "saturn"], aspects: ["square"], houses: [4], tags: ["family", "responsibility"], createdAt: "2023-02-24T12:00:00", updatedAt: "2026-10-08T12:30:00", pinned: true,
    revisions: [{ at: "2023-02-24T12:00:00", summary: "Created after first natal reading" }, { at: "2026-10-08T12:30:00", summary: "Added note about the Saturn transit timing" }],
  },
  {
    id: "o2", title: "Venus in the 11th — friendship as the root of partnership", scope: "natal", chartId: "ch1", personIds: ["c1"], clientId: "c1",
    body: "<p>She consistently describes her best relationships as beginning as friendships. Venus trine Jupiter supports a generous, sociable style.</p>",
    planets: ["venus", "jupiter"], aspects: ["trine"], houses: [11], tags: ["relationships"], createdAt: "2023-02-24T12:20:00", updatedAt: "2023-02-24T12:20:00",
    revisions: [{ at: "2023-02-24T12:20:00", summary: "Created" }],
  },
  {
    id: "o3", title: "Mercury–Neptune: how she processes decisions", scope: "natal", chartId: "ch1", personIds: ["c1"], clientId: "c1",
    body: "<p>Prefers to sit with decisions; written summaries help. She told me she rereads her readings several times. <em>Deliver written summaries alongside recordings.</em></p>",
    planets: ["mercury", "neptune"], aspects: ["sextile"], houses: [12], tags: ["communication", "process"], createdAt: "2024-03-01T10:00:00", updatedAt: "2025-06-12T14:00:00",
    revisions: [{ at: "2024-03-01T10:00:00", summary: "Created" }, { at: "2025-06-12T14:00:00", summary: "Added delivery preference" }],
  },
  {
    id: "o4", title: "Composite Sun–Saturn: shared responsibility", scope: "relationship", chartId: "ch4", personIds: ["c1", "p1"], clientId: "c1", consultationId: "k13",
    body: "<p>The relationship takes itself seriously. Both partners described a feeling of 'building something'. Risk: the relationship becomes a project rather than a refuge.</p>",
    planets: ["sun", "saturn"], aspects: ["conjunction"], houses: [10], tags: ["commitment"], createdAt: "2025-06-12T13:00:00", updatedAt: "2025-06-12T13:00:00",
    revisions: [{ at: "2025-06-12T13:00:00", summary: "Created during joint session" }],
  },
  {
    id: "o5", title: "Daniel's Mars to Amelia's Venus", scope: "relationship", chartId: "ch3", personIds: ["c1", "p1"], clientId: "c1", consultationId: "k13",
    body: "<p>Strong attraction contact both recognised immediately. Daniel initiates; Amelia responds. Under stress this becomes a pursuit/withdraw dynamic.</p>",
    planets: ["mars", "venus"], aspects: ["conjunction"], houses: [7], tags: ["attraction", "dynamics"], createdAt: "2025-06-12T13:10:00", updatedAt: "2026-10-29T11:00:00",
    revisions: [{ at: "2025-06-12T13:10:00", summary: "Created" }, { at: "2026-10-29T11:00:00", summary: "Expanded stress pattern" }],
  },
  {
    id: "o6", title: "Saturn approaching natal Moon — autumn 2026", scope: "timing", chartId: "ch2", personIds: ["c1"], clientId: "c1", consultationId: "k14",
    body: "<p>She named 'feeling responsible for everyone' before I mentioned the transit. Links directly to the natal 4th-house Moon observation. Lisbon question is really a question about permission to leave.</p>",
    planets: ["saturn", "moon"], aspects: ["conjunction"], houses: [4], tags: ["relocation", "family"], createdAt: "2026-10-08T12:00:00", updatedAt: "2026-11-13T10:12:00", pinned: true,
    revisions: [{ at: "2026-10-08T12:00:00", summary: "Created during October session" }, { at: "2026-11-13T10:12:00", summary: "Prep notes for Nov 14 session" }],
  },
  {
    id: "o7", title: "10th-house Sun and the father's definition of success", scope: "natal", chartId: "ch7", personIds: ["c2"], clientId: "c2", consultationId: "k15",
    body: "<p>Jonah's ambition is entangled with his father's expectations. He wants a career that is <strong>his</strong>. The Saturn opposition shows up as self-imposed timelines.</p>",
    planets: ["sun", "saturn"], aspects: ["opposition"], houses: [10, 4], tags: ["career", "family"], createdAt: "2024-05-20T11:00:00", updatedAt: "2024-05-20T11:00:00",
    revisions: [{ at: "2024-05-20T11:00:00", summary: "Created" }],
  },
  {
    id: "o8", title: "Progressed Moon into a new sign — early 2027", scope: "timing", chartId: "ch8", personIds: ["c2"], clientId: "c2", consultationId: "k16",
    body: "<p>Emotional tone shifts from duty to initiative. Lines up with his spring launch idea. Cross-check solar arc MC before Nov 17.</p>",
    planets: ["moon"], aspects: [], houses: [10], tags: ["career", "timing"], createdAt: "2026-10-27T11:00:00", updatedAt: "2026-11-10T14:30:00",
    revisions: [{ at: "2026-10-27T11:00:00", summary: "Created" }, { at: "2026-11-10T14:30:00", summary: "Added solar-arc cross-check reminder" }],
  },
  {
    id: "o9", title: "Mars in the 1st — directness that reads as intensity", scope: "natal", chartId: "ch10", personIds: ["c3"], clientId: "c3",
    body: "<p>Colleagues read her as intense; she experiences herself as efficient. Useful framing for the design-lead role.</p>",
    planets: ["mars"], aspects: [], houses: [1], tags: ["career", "self-presentation"], createdAt: "2025-01-30T10:00:00", updatedAt: "2026-09-02T18:30:00",
    revisions: [{ at: "2025-01-30T10:00:00", summary: "Created" }],
  },
  {
    id: "o10", title: "Priya & Arjun — Moon–Moon trine", scope: "relationship", chartId: "ch11", personIds: ["c3", "p4"], clientId: "c3",
    body: "<p>Easy emotional rhythm at home. They rarely fight about domestic life — tension is about pace of career change.</p>",
    planets: ["moon"], aspects: ["trine"], houses: [4], tags: ["home"], createdAt: "2025-03-20T10:00:00", updatedAt: "2025-03-20T10:00:00",
    revisions: [{ at: "2025-03-20T10:00:00", summary: "Created" }],
  },
  {
    id: "o11", title: "Approximate birth time — angles uncertain", scope: "natal", chartId: "ch12", personIds: ["c4"], clientId: "c4",
    body: "<p>Birth time is 'around lunch'. Do not lean on house placements of the Moon or the angles until rectified. Whole-sign houses for the first session.</p>",
    planets: [], aspects: [], houses: [], tags: ["rectification", "data quality"], createdAt: "2026-11-06T15:00:00", updatedAt: "2026-11-13T17:30:00",
    revisions: [{ at: "2026-11-06T15:00:00", summary: "Created at intake" }],
  },
  {
    id: "o12", title: "Saturn return questions", scope: "natal", chartId: "ch20", personIds: ["c9"], clientId: "c9", consultationId: "k19",
    body: "<p>Grace is anxious about the Saturn return — frame it as structure-building, not punishment. She is planning graduate study.</p>",
    planets: ["saturn"], aspects: [], houses: [9], tags: ["education", "saturn return"], createdAt: "2026-11-04T17:30:00", updatedAt: "2026-11-11T16:00:00",
    revisions: [{ at: "2026-11-04T17:30:00", summary: "Created" }],
  },
  {
    id: "o13", title: "Neptune on the MC — creative vocation", scope: "natal", chartId: "ch13", personIds: ["c5"], clientId: "c5",
    body: "<p>Music career; public image tends to be projected onto her. Benefits from clear boundaries around releases.</p>",
    planets: ["neptune"], aspects: ["conjunction"], houses: [10], tags: ["creative", "career"], createdAt: "2024-09-30T10:00:00", updatedAt: "2026-08-14T12:00:00",
    revisions: [{ at: "2024-09-30T10:00:00", summary: "Created" }],
  },
  {
    id: "o14", title: "6th-house emphasis and health routines", scope: "natal", chartId: "ch16", personIds: ["c7"], clientId: "c7",
    body: "<p>Hannah's wellbeing is closely tied to daily structure. When work overwhelms routines, symptoms follow.</p>",
    planets: ["sun", "mercury"], aspects: ["conjunction"], houses: [6], tags: ["health", "routine"], createdAt: "2023-10-10T10:00:00", updatedAt: "2026-11-02T09:30:00",
    revisions: [{ at: "2023-10-10T10:00:00", summary: "Created" }],
  },
  {
    id: "o15", title: "Rafael & Lucía — Jupiter contacts in business", scope: "relationship", chartId: "ch19", personIds: ["c8", "p5"], clientId: "c8",
    body: "<p>Optimism compounds between them; neither is the natural sceptic. Suggested bringing in an outside financial adviser.</p>",
    planets: ["jupiter", "sun"], aspects: ["trine"], houses: [2], tags: ["business", "finance"], createdAt: "2025-04-30T14:00:00", updatedAt: "2026-07-01T10:00:00",
    revisions: [{ at: "2025-04-30T14:00:00", summary: "Created" }],
  },
  {
    id: "o16", title: "Venus–Saturn: commitment comes slowly", scope: "natal", chartId: "ch21", personIds: ["c11"], clientId: "c11",
    body: "<p>Naomi trusts slowly and deeply. Long friendships; late, stable partnership.</p>",
    planets: ["venus", "saturn"], aspects: ["square"], houses: [7], tags: ["relationships"], createdAt: "2021-09-01T10:00:00", updatedAt: "2025-11-20T15:30:00",
    revisions: [{ at: "2021-09-01T10:00:00", summary: "Created" }],
  },
];

// ——— Tasks ————————————————————————————————————————————————————————————
export const tasks: Task[] = [
  { id: "t1", title: "Send Jonah written summary of progressions", description: "He asked for a written summary before the Nov 17 call. Combine progressed Moon notes with solar arc MC.", due: "2026-11-13", priority: "high", status: "in-progress", clientId: "c2", consultationId: "k16", chartId: "ch8", checklist: [{ id: "a", label: "Review progressed Moon timing", done: true }, { id: "b", label: "Cross-check solar arc MC", done: false }, { id: "c", label: "Export PDF and upload to Reading Delivery", done: false }], history: [{ at: "2026-10-27T11:30:00", text: "Created from consultation" }, { at: "2026-11-10T14:30:00", text: "Moved to In progress" }] },
  { id: "t2", title: "Rectification questionnaire for Marcus", description: "Send life-events questionnaire before or after first session.", due: "2026-11-12", priority: "medium", status: "todo", clientId: "c4", chartId: "ch12", checklist: [{ id: "a", label: "Customise questionnaire", done: false }, { id: "b", label: "Send via portal", done: false }], history: [{ at: "2026-11-06T15:10:00", text: "Created at intake" }] },
  { id: "t3", title: "Prepare relocated solar return (Lisbon)", due: "2026-11-14", priority: "high", status: "done", clientId: "c1", consultationId: "k1", chartId: "ch6", checklist: [{ id: "a", label: "Create solar return chart", done: true }, { id: "b", label: "Save Lisbon configuration", done: true }], history: [{ at: "2026-10-08T12:40:00", text: "Created from consultation" }, { at: "2026-11-08T16:00:00", text: "Completed" }], completedAt: "2026-11-08T16:00:00" },
  { id: "t4", title: "Review Amelia's prep notes before 10:00", due: "2026-11-14", priority: "high", status: "todo", clientId: "c1", consultationId: "k1", checklist: [{ id: "a", label: "Re-read Saturn/Moon observations", done: false }, { id: "b", label: "Open transit chart", done: false }], history: [{ at: "2026-11-13T09:00:00", text: "Created" }] },
  { id: "t5", title: "Upload Hannah's December pacing notes", due: "2026-11-16", priority: "medium", status: "todo", clientId: "c7", consultationId: "k17", checklist: [], history: [{ at: "2026-11-02T09:30:00", text: "Created" }] },
  { id: "t6", title: "Confirm Arjun can join Priya's session", due: "2026-11-17", priority: "low", status: "todo", clientId: "c3", consultationId: "k6", checklist: [], history: [{ at: "2026-11-09T12:00:00", text: "Created" }] },
  { id: "t7", title: "Re-send Rafael's partnership reading (upload failed)", due: "2026-11-15", priority: "high", status: "todo", clientId: "c8", checklist: [{ id: "a", label: "Re-export video at lower bitrate", done: false }, { id: "b", label: "Retry delivery", done: false }], history: [{ at: "2026-11-12T19:00:00", text: "Created after failed upload" }] },
  { id: "t8", title: "Draft Grace's Saturn return follow-up points", due: "2026-11-14", priority: "medium", status: "in-progress", clientId: "c9", consultationId: "k3", checklist: [{ id: "a", label: "List study-timing windows", done: true }, { id: "b", label: "Note questions from gift reading", done: false }], history: [{ at: "2026-11-04T17:40:00", text: "Created" }] },
  { id: "t9", title: "Annual review prep for Naomi", due: "2026-11-22", priority: "low", status: "todo", clientId: "c11", consultationId: "k8", checklist: [], history: [{ at: "2026-11-01T10:00:00", text: "Created" }] },
  { id: "t10", title: "Solar return reading outline — Sofia", due: "2026-11-24", priority: "medium", status: "todo", clientId: "c5", consultationId: "k9", chartId: "ch14", checklist: [], history: [{ at: "2026-11-01T10:00:00", text: "Created" }] },
  { id: "t11", title: "Archive inactive client files (2022)", due: "2026-11-30", priority: "low", status: "todo", checklist: [], history: [{ at: "2026-11-01T10:00:00", text: "Created" }] },
  { id: "t12", title: "Send Hannah her transit review recording", due: "2026-11-03", priority: "medium", status: "done", clientId: "c7", consultationId: "k17", checklist: [], history: [{ at: "2026-11-02T09:30:00", text: "Created" }, { at: "2026-11-03T10:00:00", text: "Completed" }], completedAt: "2026-11-03T10:00:00" },
  { id: "t13", title: "Follow up with Theo about returning", due: "2026-11-10", priority: "low", status: "todo", clientId: "c6", checklist: [], history: [{ at: "2026-10-15T10:00:00", text: "Created" }] },
];

// ——— Readings (deliveries) ——————————————————————————————————————————
export const readings: Reading[] = [
  { id: "r1", clientId: "c1", chartId: "ch1", consultationId: "k12", title: "Your Natal Chart — Full Reading", kind: "pdf", fileName: "Hart_Natal_Reading_2023.pdf", sizeMB: 2.4, pages: 18, message: "Amelia, here is the written companion to our session. Take your time with it — the section on home and family is the one I'd return to.", status: "delivered", createdAt: "2023-02-25", deliveredAt: "2023-02-25T10:00:00", allowDownload: true, notification: "opened", openedAt: "2023-02-25T19:12:00" },
  { id: "r2", clientId: "c1", chartId: "ch3", consultationId: "k13", title: "Amelia & Daniel — Relationship Reading", kind: "audio", fileName: "Hart_Reyes_Synastry.m4a", sizeMB: 64, durationSec: 4980, message: "The recording from our joint session. I've included the composite chart PDF as an attachment.", status: "delivered", createdAt: "2025-06-13", deliveredAt: "2025-06-13T09:00:00", allowDownload: true, notification: "opened", openedAt: "2025-06-13T20:30:00", attachments: [{ name: "Composite_Chart.pdf", kind: "pdf", sizeMB: 0.6 }] },
  { id: "r3", clientId: "c1", chartId: "ch2", consultationId: "k14", title: "Autumn 2026 Transit Review", kind: "video", fileName: "Hart_Transits_Oct2026.mp4", sizeMB: 412, durationSec: 2710, message: "Here's the chart walkthrough I recorded after our October session, focusing on Saturn and the Lisbon timing.", status: "delivered", createdAt: "2026-10-09", deliveredAt: "2026-10-09T11:00:00", allowDownload: false, notification: "opened", openedAt: "2026-10-09T21:45:00" },
  { id: "r4", clientId: "c1", chartId: "ch6", title: "Solar Return 2027 — Relocated to Lisbon", kind: "pdf", fileName: "Hart_SR2027_Lisbon.pdf", sizeMB: 1.1, pages: 9, message: "Ahead of our call, here are the relocated solar return notes so you can read them beforehand.", status: "ready", createdAt: "2026-11-13", allowDownload: true, notification: "pending" },
  { id: "r5", clientId: "c2", chartId: "ch7", consultationId: "k15", title: "Natal Reading — Vocation & Direction", kind: "pdf", fileName: "Whitaker_Natal.pdf", sizeMB: 1.9, pages: 14, message: "Jonah — the written reading from our session.", status: "delivered", createdAt: "2024-05-21", deliveredAt: "2024-05-21T09:00:00", allowDownload: true, notification: "opened", openedAt: "2024-05-21T12:00:00" },
  { id: "r6", clientId: "c7", chartId: "ch17", consultationId: "k17", title: "Winter Transit Review", kind: "audio", fileName: "Okafor_Winter_Transits.m4a", sizeMB: 41, durationSec: 3320, message: "Hannah, the recording of our review. Be gentle with December.", status: "delivered", createdAt: "2026-11-03", deliveredAt: "2026-11-03T10:00:00", allowDownload: true, notification: "sent" },
  { id: "r7", clientId: "c3", chartId: "ch10", consultationId: "k18", title: "Career Timing — Design Lead Decision", kind: "document", fileName: "Natarajan_Career_Timing.docx", sizeMB: 0.4, pages: 6, message: "Priya, a short summary of the windows we discussed.", status: "delivered", createdAt: "2026-09-03", deliveredAt: "2026-09-03T08:00:00", allowDownload: true, notification: "opened", openedAt: "2026-09-03T09:10:00" },
  { id: "r8", clientId: "c9", chartId: "ch20", consultationId: "k19", title: "Your First Natal Reading", kind: "video", fileName: "Liu_Natal_Reading.mp4", sizeMB: 520, durationSec: 4410, message: "Grace, it was a pleasure to meet you. Here is the full recording of your reading.", status: "delivered", createdAt: "2026-11-05", deliveredAt: "2026-11-05T09:00:00", allowDownload: true, notification: "opened", openedAt: "2026-11-05T22:00:00" },
  { id: "r9", clientId: "c5", chartId: "ch13", consultationId: "k20", title: "Album Release Timing", kind: "link", url: "https://example.com/shared/lindqvist-timing", message: "Sofia — the shared notes are at this link, as discussed.", status: "delivered", createdAt: "2026-08-15", deliveredAt: "2026-08-15T10:00:00", allowDownload: false, notification: "opened", openedAt: "2026-08-15T11:00:00" },
  { id: "r10", clientId: "c11", chartId: "ch21", consultationId: "k23", title: "Annual Review 2025–26", kind: "pdf", fileName: "Feldman_Annual_2025.pdf", sizeMB: 1.6, pages: 12, message: "Naomi, your annual review.", status: "delivered", createdAt: "2025-11-21", deliveredAt: "2025-11-21T10:00:00", allowDownload: true, notification: "opened", openedAt: "2025-11-21T18:00:00" },
  { id: "r11", clientId: "c8", chartId: "ch19", title: "Partnership Reading — Rafael & Lucía", kind: "video", fileName: "Moreno_Ferrer_Partnership.mp4", sizeMB: 1840, durationSec: 3900, message: "Rafael, the partnership walkthrough we discussed.", status: "failed", createdAt: "2026-11-12", allowDownload: true, notification: "failed", failureReason: "Upload interrupted — file exceeds 1.5 GB single-upload limit (simulated)." },
  { id: "r12", clientId: "c2", chartId: "ch8", title: "Progressions & Solar Arcs Summary", kind: "pdf", message: "Jonah — the written summary you asked for ahead of our call.", status: "draft", createdAt: "2026-11-11", allowDownload: true, notification: "pending" },
  { id: "r13", clientId: "c9", chartId: "ch20", title: "Saturn Return — Study Windows", kind: "audio", fileName: "Liu_SaturnReturn_notes.m4a", sizeMB: 12, durationSec: 840, message: "", status: "draft", createdAt: "2026-11-12", allowDownload: true, notification: "pending" },
];

// ——— Recordings ——————————————————————————————————————————————————————
export const recordings: Recording[] = [
  { id: "rec1", clientId: "c1", chartId: "ch2", title: "Autumn 2026 Transit Review", mode: "screen-webcam", durationSec: 2710, createdAt: "2026-10-09T09:30:00", status: "delivered", readingId: "r3" },
  { id: "rec2", clientId: "c7", chartId: "ch17", title: "Winter Transit Review", mode: "audio", durationSec: 3320, createdAt: "2026-11-02T09:10:00", status: "delivered", readingId: "r6" },
  { id: "rec3", clientId: "c9", chartId: "ch20", title: "Your First Natal Reading", mode: "screen-webcam", durationSec: 4410, createdAt: "2026-11-04T17:20:00", status: "delivered", readingId: "r8" },
  { id: "rec4", clientId: "c9", chartId: "ch20", title: "Saturn return — study windows (draft)", mode: "audio", durationSec: 840, createdAt: "2026-11-12T08:15:00", status: "saved" },
  { id: "rec5", clientId: "c8", chartId: "ch19", title: "Partnership walkthrough", mode: "screen", durationSec: 3900, createdAt: "2026-11-12T17:40:00", status: "saved" },
];

// ——— Files ————————————————————————————————————————————————————————————
export const files: ClientFile[] = [
  { id: "f1", clientId: "c1", name: "Birth certificate scan.jpg", kind: "image", sizeKB: 820, uploadedAt: "2023-02-10", private: true, note: "Confirms 7:42 AM" },
  { id: "f2", clientId: "c1", name: "Intake questionnaire.pdf", kind: "pdf", sizeKB: 210, uploadedAt: "2023-02-10", private: true },
  { id: "f3", clientId: "c1", name: "Lisbon neighbourhoods (from client).pdf", kind: "pdf", sizeKB: 1540, uploadedAt: "2026-10-20", private: false },
  { id: "f4", clientId: "c1", name: "Session prep — Nov 2026.docx", kind: "doc", sizeKB: 48, uploadedAt: "2026-11-13", private: true },
  { id: "f5", clientId: "c2", name: "Intake questionnaire.pdf", kind: "pdf", sizeKB: 198, uploadedAt: "2024-05-03", private: true },
  { id: "f6", clientId: "c4", name: "Life events timeline (draft).docx", kind: "doc", sizeKB: 36, uploadedAt: "2026-11-07", private: true },
  { id: "f7", clientId: "c3", name: "Role description — Design Lead.pdf", kind: "pdf", sizeKB: 310, uploadedAt: "2026-08-30", private: false },
];

// ——— Notifications ——————————————————————————————————————————————————
export const notifications: AppNotification[] = [
  { id: "n1", type: "consultation", title: "Consultation in 1 hour", body: "Transit Review with Amelia Hart at 10:00 AM (video call).", at: "2026-11-14T09:00:00", read: false, href: "/app/consultations?id=k1" },
  { id: "n2", type: "upload", title: "Upload failed", body: "“Partnership Reading — Rafael & Lucía” could not be delivered. File exceeds the single-upload limit.", at: "2026-11-12T19:00:00", read: false, href: "/app/delivery?id=r11" },
  { id: "n3", type: "client", title: "Marcus Delacroix accepted the portal invitation", body: "Pending — invitation opened but account not yet created.", at: "2026-11-13T18:20:00", read: false, href: "/app/clients/c4" },
  { id: "n4", type: "task", title: "2 tasks overdue", body: "“Send Jonah written summary of progressions” and “Rectification questionnaire for Marcus”.", at: "2026-11-14T07:00:00", read: false, href: "/app/tasks?view=overdue" },
  { id: "n5", type: "delivery", title: "Reading opened", body: "Grace Liu opened “Your First Natal Reading”.", at: "2026-11-05T22:00:00", read: true, href: "/app/delivery?id=r8" },
  { id: "n6", type: "client", title: "New intake form submitted", body: "Grace Liu updated her birth time note.", at: "2026-11-11T15:42:00", read: true, href: "/app/clients/c9" },
  { id: "n7", type: "delivery", title: "Reading delivered", body: "“Winter Transit Review” delivered to Hannah Okafor.", at: "2026-11-03T10:00:00", read: true, href: "/app/delivery?id=r6" },
  { id: "n8", type: "account", title: "Storage at 38%", body: "You're using 19 GB of your demonstration storage allowance.", at: "2026-11-01T08:00:00", read: true, href: "/app/settings?section=subscription" },
  { id: "n9", type: "consultation", title: "Consultation cancelled", body: "Hannah Okafor cancelled the Nov 11 follow-up call.", at: "2026-11-10T16:00:00", read: true, href: "/app/consultations?id=k25" },
];

// ——— Activity ————————————————————————————————————————————————————————
export const activity: Activity[] = [
  { id: "a1", kind: "observation", text: "Updated observation “Saturn approaching natal Moon — autumn 2026”", at: "2026-11-13T10:12:00", clientId: "c1", href: "/app/observations?id=o6" },
  { id: "a2", kind: "chart", text: "Opened chart “Marcus Delacroix — Natal (approx. time)”", at: "2026-11-13T17:30:00", clientId: "c4", href: "/app/charts/ch12" },
  { id: "a3", kind: "reading", text: "Prepared “Solar Return 2027 — Relocated to Lisbon” for delivery", at: "2026-11-13T16:00:00", clientId: "c1", href: "/app/delivery?id=r4" },
  { id: "a4", kind: "reading", text: "Delivery failed: “Partnership Reading — Rafael & Lucía”", at: "2026-11-12T19:00:00", clientId: "c8", href: "/app/delivery?id=r11" },
  { id: "a5", kind: "recording", text: "Recorded “Partnership walkthrough” (65 min)", at: "2026-11-12T17:40:00", clientId: "c8", href: "/app/studio" },
  { id: "a6", kind: "chart", text: "Edited chart “Amelia Hart — Natal”", at: "2026-11-12T16:20:00", clientId: "c1", href: "/app/charts/ch1" },
  { id: "a7", kind: "observation", text: "Added observation “Saturn return questions”", at: "2026-11-11T16:00:00", clientId: "c9", href: "/app/observations?id=o12" },
  { id: "a8", kind: "consultation", text: "Scheduled “Relationship Synastry” with Amelia Hart for Dec 9", at: "2026-11-10T12:00:00", clientId: "c1", href: "/app/consultations?id=k11" },
  { id: "a9", kind: "client", text: "Added new client Marcus Delacroix", at: "2026-11-06T15:00:00", clientId: "c4", href: "/app/clients/c4" },
  { id: "a10", kind: "reading", text: "Delivered “Your First Natal Reading” to Grace Liu", at: "2026-11-05T09:00:00", clientId: "c9", href: "/app/delivery?id=r8" },
];

// ——— Client-portal notifications (for the demo client, Amelia Hart) —————
export const portalNotifications: PortalNotification[] = [
  { id: "pn1", clientId: "c1", title: "Upcoming consultation today", body: "Transit Review with Celeste Morrow at 10:00 AM.", at: "2026-11-14T08:00:00", read: false, href: "/portal/consultations" },
  { id: "pn2", clientId: "c1", title: "Session scheduled", body: "Relationship Synastry on Wednesday, December 9 at 10:00 AM.", at: "2026-11-10T12:00:00", read: false, href: "/portal/consultations" },
  { id: "pn3", clientId: "c1", title: "New reading available", body: "“Autumn 2026 Transit Review” is ready to watch.", at: "2026-10-09T11:00:00", read: true, href: "/portal/readings/r3" },
];

/** Between-session work shared with Amelia (and one draft). */
export const clientWork: ClientWork[] = [
  {
    id: "w1", clientId: "c1", kind: "journal", title: "What is Saturn asking of you?",
    instructions: "Over the next two weeks, write a few lines whenever you notice a familiar pressure: a responsibility you want to put down, or a structure you want to build.\n\nNo need to interpret it. Just note the date, what happened and how it felt. We'll look at the pattern together next session.",
    dueDate: "2026-11-28", consultationId: "k14", status: "shared", sharedAt: "2026-11-03T15:10:00", createdAt: "2026-11-03T15:05:00", updatedAt: "2026-11-03T15:10:00",
  },
  {
    id: "w2", clientId: "c1", kind: "assignment", title: "Lisbon or Portland: what does each place give you?",
    instructions: "Make two short lists: what Lisbon offers you, and what Portland offers you. Then circle the three things that matter most.\n\nBring both lists to our relocation session.",
    dueDate: "2026-12-05", status: "shared", sharedAt: "2026-11-12T10:20:00", createdAt: "2026-11-12T10:15:00", updatedAt: "2026-11-12T10:20:00",
  },
  {
    id: "w3", clientId: "c1", kind: "goal", title: "Have the conversation about the move",
    instructions: "Before the new moon on the 20th, have one honest conversation with Daniel about the move: not to decide, just to share where you are.",
    dueDate: "2026-11-20", status: "shared", sharedAt: "2026-10-29T11:40:00", createdAt: "2026-10-29T11:35:00", updatedAt: "2026-10-29T11:40:00",
  },
  {
    id: "w4", clientId: "c1", kind: "activity", title: "Track your energy around the full moon",
    instructions: "For three days either side of the full moon, rate your energy from 1 to 5 each evening.",
    status: "draft", createdAt: "2026-11-13T17:00:00", updatedAt: "2026-11-13T17:00:00",
  },
];

/** Amelia's responses (written in her portal). */
export const workResponses: WorkResponse[] = [
  { id: "wr1", workId: "w1", clientId: "c1", type: "entry", text: "Nov 6: Offered to take on the team reorganisation at work, then felt instantly heavy about it. Same feeling as last year when I said yes to the board role.", createdAt: "2026-11-06T21:12:00" },
  { id: "wr2", workId: "w1", clientId: "c1", type: "entry", text: "Nov 10: Turned down a weekend commitment for the first time in months. Relief, then guilt, then relief again.", createdAt: "2026-11-10T22:03:00" },
  { id: "wr3", workId: "w3", clientId: "c1", type: "entry", text: "We talked on Sunday. Daniel is more open to Lisbon than I expected.", createdAt: "2026-11-09T19:30:00" },
  { id: "wr4", workId: "w3", clientId: "c1", type: "done", createdAt: "2026-11-09T19:31:00" },
];
