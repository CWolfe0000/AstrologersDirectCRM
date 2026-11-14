"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChartSettings } from "@/lib/astro/types";
import { DEFAULT_SETTINGS } from "@/lib/astro/meta";
import { associatedPeople, clientPeople, clients as seedClients, practitioner as seedPractitioner } from "./data/people";
import * as seed from "./data/records";
import type {
  Activity, AppNotification, ChartRecord, Client, ClientFile, Consultation, Observation, Person, PortalNotification,
  Practitioner, Reading, Recording, Task,
} from "./data/types";
import { DEMO_TODAY, uid } from "./utils";

/**
 * Prototype data store.
 *
 * All data is seeded from lib/data and persisted to localStorage so changes
 * (new clients, observations, deliveries…) survive reloads. In production
 * each slice maps onto an API resource; components already go through these
 * actions rather than mutating data directly.
 */

export interface DemoState {
  practitioner: Practitioner;
  defaults: ChartSettings;
  people: Person[];
  clients: Client[];
  charts: ChartRecord[];
  consultations: Consultation[];
  observations: Observation[];
  tasks: Task[];
  readings: Reading[];
  recordings: Recording[];
  files: ClientFile[];
  notifications: AppNotification[];
  activity: Activity[];
  portalNotifications: PortalNotification[];
  /** Toasts are transient (not persisted). */
  toasts: { id: string; title: string; body?: string; tone?: "default" | "success" | "error" }[];

  // generic helpers
  toast: (title: string, body?: string, tone?: "default" | "success" | "error") => void;
  dismissToast: (id: string) => void;
  log: (a: Omit<Activity, "id" | "at">) => void;

  addPerson: (p: Omit<Person, "id"> & { id?: string }) => Person;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  addClient: (c: Omit<Client, "id" | "createdAt">, person: Omit<Person, "id">) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;

  addChart: (c: Omit<ChartRecord, "id" | "createdAt" | "updatedAt">) => ChartRecord;
  updateChart: (id: string, patch: Partial<ChartRecord>) => void;
  touchChart: (id: string) => void;

  upsertObservation: (o: Partial<Observation> & Pick<Observation, "chartId" | "clientId" | "personIds" | "scope">, revisionSummary?: string) => Observation;
  deleteObservation: (id: string) => void;

  addConsultation: (c: Omit<Consultation, "id">) => Consultation;
  updateConsultation: (id: string, patch: Partial<Consultation>) => void;

  addTask: (t: Omit<Task, "id" | "history" | "checklist"> & Partial<Pick<Task, "checklist">>) => Task;
  updateTask: (id: string, patch: Partial<Task>, historyText?: string) => void;
  toggleChecklist: (taskId: string, itemId: string) => void;

  addReading: (r: Omit<Reading, "id" | "createdAt">) => Reading;
  updateReading: (id: string, patch: Partial<Reading>) => void;
  deliverReading: (id: string) => void;

  addRecording: (r: Omit<Recording, "id" | "createdAt">) => Recording;
  updateRecording: (id: string, patch: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;

  addFile: (f: Omit<ClientFile, "id" | "uploadedAt">) => void;

  markNotification: (id: string, read: boolean) => void;
  markAllNotifications: () => void;
  markPortalNotification: (id: string) => void;

  updatePractitioner: (patch: Partial<Practitioner>) => void;
  updateDefaults: (patch: Partial<ChartSettings>) => void;

  resetDemo: () => void;
}

/** Demo clock: starts at DEMO_TODAY (09:00) when the page loads and advances in real time. */
const SESSION_START = Date.now();
const NOW = () => {
  const d = new Date(DEMO_TODAY.getTime() + (Date.now() - SESSION_START));
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

function seedState() {
  return {
    practitioner: seedPractitioner,
    defaults: DEFAULT_SETTINGS,
    people: [...clientPeople, ...associatedPeople],
    clients: seedClients,
    charts: seed.charts,
    consultations: seed.consultations,
    observations: seed.observations,
    tasks: seed.tasks,
    readings: seed.readings,
    recordings: seed.recordings,
    files: seed.files,
    notifications: seed.notifications,
    activity: seed.activity,
    portalNotifications: seed.portalNotifications,
  };
}

export const useStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...seedState(),
      toasts: [],

      toast: (title, body, tone = "default") => {
        const id = uid("toast");
        set((s) => ({ toasts: [...s.toasts, { id, title, body, tone }] }));
        setTimeout(() => get().dismissToast(id), 4200);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      log: (a) => set((s) => ({ activity: [{ ...a, id: uid("a"), at: NOW() }, ...s.activity] })),

      addPerson: (p) => {
        const person: Person = { ...p, id: p.id ?? uid("p") };
        set((s) => ({ people: [...s.people, person] }));
        return person;
      },
      updatePerson: (id, patch) => set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      addClient: (c, person) => {
        const id = uid("c");
        const client: Client = { ...c, id, createdAt: NOW().slice(0, 10) };
        set((s) => ({ clients: [client, ...s.clients], people: [...s.people, { ...person, id }] }));
        get().log({ kind: "client", text: `Added new client ${person.firstName} ${person.lastName}`, clientId: id, href: `/app/clients/${id}` });
        return client;
      },
      updateClient: (id, patch) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      addChart: (c) => {
        const chart: ChartRecord = { ...c, id: uid("ch"), createdAt: NOW(), updatedAt: NOW(), lastOpenedAt: NOW() };
        set((s) => ({ charts: [chart, ...s.charts] }));
        get().log({ kind: "chart", text: `Created chart “${chart.title}”`, clientId: chart.clientId, href: `/app/charts/${chart.id}` });
        return chart;
      },
      updateChart: (id, patch) => set((s) => ({ charts: s.charts.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: NOW() } : c)) })),
      touchChart: (id) => set((s) => ({ charts: s.charts.map((c) => (c.id === id ? { ...c, lastOpenedAt: NOW() } : c)) })),

      upsertObservation: (o, revisionSummary) => {
        const existing = o.id ? get().observations.find((x) => x.id === o.id) : undefined;
        if (existing) {
          const updated: Observation = {
            ...existing,
            ...o,
            updatedAt: NOW(),
            revisions: revisionSummary ? [...existing.revisions, { at: NOW(), summary: revisionSummary, body: existing.body }] : existing.revisions,
          } as Observation;
          set((s) => ({ observations: s.observations.map((x) => (x.id === existing.id ? updated : x)) }));
          return updated;
        }
        const created: Observation = {
          planets: [],
          aspects: [],
          houses: [],
          tags: [],
          ...o,
          id: uid("o"),
          title: o.title || "Untitled observation",
          body: o.body ?? "",
          createdAt: NOW(),
          updatedAt: NOW(),
          revisions: [{ at: NOW(), summary: "Created" }],
        } as Observation;
        set((s) => ({ observations: [created, ...s.observations] }));
        get().log({ kind: "observation", text: `Added observation “${created.title}”`, clientId: created.clientId, href: `/app/observations?id=${created.id}` });
        return created;
      },
      deleteObservation: (id) => set((s) => ({ observations: s.observations.filter((o) => o.id !== id) })),

      addConsultation: (c) => {
        const k: Consultation = { ...c, id: uid("k") };
        set((s) => ({ consultations: [...s.consultations, k] }));
        get().log({ kind: "consultation", text: `Scheduled “${k.type}”`, clientId: k.clientId, href: `/app/consultations?id=${k.id}` });
        return k;
      },
      updateConsultation: (id, patch) => set((s) => ({ consultations: s.consultations.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      addTask: (t) => {
        const task: Task = { checklist: [], ...t, id: uid("t"), history: [{ at: NOW(), text: "Created" }] };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        get().log({ kind: "task", text: `Created task “${task.title}”`, clientId: task.clientId, href: `/app/tasks?id=${task.id}` });
        return task;
      },
      updateTask: (id, patch, historyText) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...patch,
                  completedAt: patch.status === "done" ? NOW() : patch.status ? undefined : t.completedAt,
                  history: historyText ? [...t.history, { at: NOW(), text: historyText }] : t.history,
                }
              : t,
          ),
        })),
      toggleChecklist: (taskId, itemId) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, checklist: t.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)) } : t)),
        })),

      addReading: (r) => {
        const reading: Reading = { ...r, id: uid("r"), createdAt: NOW() };
        set((s) => ({ readings: [reading, ...s.readings] }));
        return reading;
      },
      updateReading: (id, patch) => set((s) => ({ readings: s.readings.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deliverReading: (id) => {
        const r = get().readings.find((x) => x.id === id);
        if (!r) return;
        set((s) => ({
          readings: s.readings.map((x) => (x.id === id ? { ...x, status: "delivered", deliveredAt: NOW(), notification: "sent", failureReason: undefined } : x)),
          // Simulated client notification — appears in the client portal for the demo client.
          portalNotifications: [{ id: uid("pn"), title: "New reading available", body: `“${r.title}” has been shared with you.`, at: NOW(), read: false, href: `/portal/readings/${r.id}` }, ...s.portalNotifications],
          notifications: [{ id: uid("n"), type: "delivery", title: "Reading delivered", body: `“${r.title}” was delivered to the client portal.`, at: NOW(), read: false, href: `/app/delivery?id=${r.id}` }, ...s.notifications],
        }));
        get().log({ kind: "reading", text: `Delivered “${r.title}”`, clientId: r.clientId, href: `/app/delivery?id=${r.id}` });
      },

      addRecording: (r) => {
        const rec: Recording = { ...r, id: uid("rec"), createdAt: NOW() };
        set((s) => ({ recordings: [rec, ...s.recordings] }));
        get().log({ kind: "recording", text: `Recorded “${rec.title}”`, clientId: rec.clientId, href: "/app/studio" });
        return rec;
      },
      updateRecording: (id, patch) => set((s) => ({ recordings: s.recordings.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRecording: (id) => set((s) => ({ recordings: s.recordings.filter((r) => r.id !== id) })),

      addFile: (f) => set((s) => ({ files: [{ ...f, id: uid("f"), uploadedAt: NOW().slice(0, 10) }, ...s.files] })),

      markNotification: (id, read) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read } : n)) })),
      markAllNotifications: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      markPortalNotification: (id) => set((s) => ({ portalNotifications: s.portalNotifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      updatePractitioner: (patch) => set((s) => ({ practitioner: { ...s.practitioner, ...patch } })),
      updateDefaults: (patch) => set((s) => ({ defaults: { ...s.defaults, ...patch, orbs: { ...s.defaults.orbs, ...(patch.orbs ?? {}) } } })),

      resetDemo: () => {
        set({ ...seedState() });
        get().toast("Demo data reset", "All demonstration data has been restored.", "success");
      },
    }),
    {
      name: "astrologersdirect-demo-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ toasts, ...rest }) => {
        void toasts;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function"));
      },
    },
  ),
);

/** Rehydrates persisted demo data after first paint (avoids SSR mismatch). */
export function StoreHydrator() {
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);
  return null;
}

// ——— Selectors / lookup helpers ————————————————————————————————————————
export function personName(p?: Pick<Person, "firstName" | "lastName">) {
  return p ? `${p.firstName} ${p.lastName}` : "Unknown";
}

export function usePerson(id?: string) {
  return useStore((s) => s.people.find((p) => p.id === id));
}

export function useClientName(id?: string) {
  return useStore((s) => personName(s.people.find((p) => p.id === id)));
}

/** Non-hook lookup when you already have state. */
export function lookup(s: Pick<DemoState, "people" | "clients" | "charts">) {
  return {
    person: (id?: string) => s.people.find((p) => p.id === id),
    name: (id?: string) => personName(s.people.find((p) => p.id === id)),
    client: (id?: string) => s.clients.find((c) => c.id === id),
    chart: (id?: string) => s.charts.find((c) => c.id === id),
  };
}
