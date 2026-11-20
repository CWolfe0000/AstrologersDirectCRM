"use client";

import type { IntakeForm, IntakeRequest } from "@/lib/data/types";
import { useStore } from "@/lib/store";
import { flushNow } from "@/lib/sync";
import { api } from "@/lib/api";
import { DATA_MODE, nowLocal, uid } from "@/lib/utils";

/**
 * Send an intake form to a client: a copy of the form is saved with their
 * record, then they're told in their portal and by email (or invited to the
 * portal, if they aren't in it yet). Returns how they were reached.
 */
export async function sendIntakeForm(form: IntakeForm, clientId: string): Promise<"portal" | "invite" | "demo"> {
  const now = nowLocal();
  const req: IntakeRequest = { id: uid("iq"), clientId, formId: form.id, title: form.title, ...(form.intro ? { intro: form.intro } : {}), sections: form.sections, status: "sent", sentAt: now, createdAt: now, updatedAt: now };
  useStore.setState((s) => ({ intakeRequests: [req, ...s.intakeRequests] }));
  if (DATA_MODE !== "server") return "demo";
  try {
    await flushNow();
    const r = await api<{ via: "portal" | "invite" }>("/api/v1/intake/send", { body: { requestId: req.id } });
    if (r.via === "invite") useStore.setState((s) => ({ clients: s.clients.map((c) => (c.id === clientId && c.portalAccess === "none" ? { ...c, portalAccess: "invited" } : c)) }));
    return r.via;
  } catch (e) {
    // Not delivered: take the copy back so it isn't left waiting unseen.
    useStore.setState((s) => ({ intakeRequests: s.intakeRequests.filter((x) => x.id !== req.id) }));
    throw e;
  }
}
