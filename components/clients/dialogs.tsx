"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import type { BirthData } from "@/lib/astro";
import type { Client, ClientStatus, Person } from "@/lib/data/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PlaceLookup, type PlaceValue } from "./place-lookup";

export function EditClientDialog({ open, onOpenChange, client, person }: { open: boolean; onOpenChange: (o: boolean) => void; client: Client; person: Person }) {
  const s = useStore();
  const [f, setF] = React.useState({ ...person, ...client, tagsText: client.tags.join(", ") });
  const [place, setPlace] = React.useState<PlaceValue>({ place: person.birth.place, lat: person.birth.lat, lon: person.birth.lon, tz: person.birth.tz });
  const [birth, setBirth] = React.useState(person.birth);
  React.useEffect(() => {
    if (open) {
      setF({ ...person, ...client, tagsText: client.tags.join(", ") });
      setBirth(person.birth);
      setPlace({ place: person.birth.place, lat: person.birth.lat, lon: person.birth.lon, tz: person.birth.tz });
    }
  }, [open, client, person]);

  const save = () => {
    s.updatePerson(person.id, { firstName: f.firstName, lastName: f.lastName, birth: { ...birth, ...place } });
    s.updateClient(client.id, {
      email: f.email,
      phone: f.phone,
      pronouns: f.pronouns,
      status: f.status,
      tags: f.tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      summary: f.summary,
    });
    const birthChanged = JSON.stringify(birth) !== JSON.stringify(person.birth) || place.place !== person.birth.place;
    s.toast("Profile updated", birthChanged ? "Birth data changed — linked charts now use the new data." : undefined, "success");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Edit profile"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save}>Save changes</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></Field>
          <Field label="Last name"><Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></Field>
          <Field label="Email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Pronouns"><Input value={f.pronouns ?? ""} onChange={(e) => setF({ ...f, pronouns: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as ClientStatus })}>
              <option value="active">Active</option>
              <option value="new">New</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <Field label="Tags" hint="Comma-separated" className="sm:col-span-2"><Input value={f.tagsText} onChange={(e) => setF({ ...f, tagsText: e.target.value })} /></Field>
          <Field label="Summary" className="sm:col-span-2"><Textarea value={f.summary ?? ""} onChange={(e) => setF({ ...f, summary: e.target.value })} /></Field>
        </div>
        <p className="eyebrow mb-3 mt-6">Birth data</p>
        <BirthFields birth={birth} setBirth={setBirth} place={place} setPlace={setPlace} />
      </DialogContent>
    </Dialog>
  );
}

function BirthFields({ birth, setBirth, place, setPlace }: { birth: BirthData; setBirth: (b: BirthData) => void; place: PlaceValue | null; setPlace: (p: PlaceValue) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Date"><Input type="date" value={birth.date} onChange={(e) => setBirth({ ...birth, date: e.target.value })} /></Field>
      <Field label="Time"><Input type="time" value={birth.time} onChange={(e) => setBirth({ ...birth, time: e.target.value })} /></Field>
      <Field label="Time accuracy">
        <Select value={birth.timeAccuracy} onChange={(e) => setBirth({ ...birth, timeAccuracy: e.target.value as BirthData["timeAccuracy"] })}>
          <option value="exact">Exact</option>
          <option value="approximate">Approximate</option>
          <option value="unknown">Unknown</option>
        </Select>
      </Field>
      <Field label="Place" className="sm:col-span-3"><PlaceLookup value={place} onChange={setPlace} /></Field>
    </div>
  );
}

export function AddPersonDialog({ open, onOpenChange, clientId }: { open: boolean; onOpenChange: (o: boolean) => void; clientId: string }) {
  const s = useStore();
  const empty = { firstName: "", lastName: "", relationship: "Partner", notes: "" };
  const [f, setF] = React.useState(empty);
  const [birth, setBirth] = React.useState<BirthData>({ date: "", time: "12:00", timeAccuracy: "exact", place: "", lat: 0, lon: 0, tz: "" });
  const [place, setPlace] = React.useState<PlaceValue | null>(null);
  React.useEffect(() => {
    if (open) {
      setF(empty);
      setPlace(null);
      setBirth({ date: "", time: "12:00", timeAccuracy: "exact", place: "", lat: 0, lon: 0, tz: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const ok = f.firstName && f.lastName && birth.date && place;

  const save = () => {
    if (!place) return;
    const p = s.addPerson({ firstName: f.firstName, lastName: f.lastName, relationship: f.relationship, notes: f.notes || undefined, clientId, birth: { ...birth, ...place } });
    s.addChart({ title: `${p.firstName} ${p.lastName} — Natal`, type: "natal", personIds: [p.id], clientId });
    s.toast("Person added", `${p.firstName}'s natal chart was created and linked to this client.`, "success");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Add associated person"
        description="Partners, family members or others relevant to this client's consultations."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!ok} onClick={save}>Add person & create natal chart</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="First name"><Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></Field>
          <Field label="Last name"><Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></Field>
          <Field label="Relationship">
            <Select value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value })}>
              {["Partner", "Spouse", "Mother", "Father", "Daughter", "Son", "Sibling", "Friend", "Business partner", "Other"].map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
        </div>
        <p className="eyebrow mb-3 mt-6">Birth data</p>
        <BirthFields birth={birth} setBirth={setBirth} place={place} setPlace={setPlace} />
        <Field label="Notes" optional className="mt-4"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </DialogContent>
    </Dialog>
  );
}
