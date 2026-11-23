"use client";

import * as React from "react";
import { Globe, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { squarePhoto } from "@/lib/photo";
import type { Practitioner } from "@/lib/data/types";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SaveBar } from "./save-bar";

type Form = Pick<Practitioner, "name" | "title" | "bio" | "email" | "phone" | "website" | "photo" | "links">;
const pick = (p: Practitioner): Form => ({ name: p.name, title: p.title, bio: p.bio, email: p.email, phone: p.phone, website: p.website, photo: p.photo, links: p.links ?? [] });
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/**
 * Your Profile: the one place for who you are to clients. Your booking page,
 * client portal, delivered readings and share cards all use it.
 */
export function YourProfileSection() {
  const p = useStore((s) => s.practitioner);
  const update = useStore((s) => s.updatePractitioner);
  const toast = useStore((s) => s.toast);
  const [f, setF] = React.useState<Form>(() => pick(p));
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => setF(pick(p)), [p]);
  const dirty = JSON.stringify(f) !== JSON.stringify(pick(p));
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const links = f.links ?? [];

  const save = () => {
    if (!f.name.trim()) return setError("Add your name.");
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return setError("Check the contact email address.");
    const bad = links.find((l) => (l.label.trim() || l.url.trim()) && (!l.label.trim() || !/^https:\/\/\S+$/.test(l.url.trim())));
    if (bad) return setError("Each link needs a label and an address starting with https://.");
    setError(null);
    update({ ...f, name: f.name.trim(), firstName: f.name.trim().split(/\s+/)[0] ?? "", title: f.title.trim(), bio: f.bio.trim(), email: f.email.trim(), phone: f.phone.trim(), website: f.website.trim(), links: links.filter((l) => l.label.trim() && l.url.trim()).map((l) => ({ label: l.label.trim(), url: l.url.trim() })) });
    toast("Profile Saved", "Your booking page and client portal show the update.", "success");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader title="About You" description="Shown at the top of your booking page and in your clients’ portal." />
          <CardBody className="space-y-5">
            <div className="flex items-center gap-4">
              {f.photo ? <img src={f.photo} alt="Your profile photo" className="size-20 rounded-full object-cover" /> : <span className="flex size-20 items-center justify-center rounded-full bg-accent font-serif text-[26px] text-white" aria-hidden>{initials(f.name) || "?"}</span>}
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink hover:bg-canvas-2 focus-within:ring-2 focus-within:ring-accent/40">
                  <ImagePlus className="size-4" /> {f.photo ? "Change Photo" : "Add a Photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Profile Photo" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { set("photo", await squarePhoto(file)); } catch (err) { toast("Photo Not Added", (err as Error).message, "error"); } }} />
                </label>
                {f.photo && <Button variant="ghost" size="sm" onClick={() => set("photo", undefined)}><Trash2 /> Remove</Button>}
                <p className="w-full text-[12px] text-muted">Cropped to a square from the middle of the photo.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your Name" htmlFor="pf-name"><Input id="pf-name" maxLength={120} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Headline" htmlFor="pf-title" hint="One line under your name."><Input id="pf-title" maxLength={160} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Evolutionary astrologer · Timing & life direction" /></Field>
              <Field label="Bio" htmlFor="pf-bio" className="sm:col-span-2" hint="A few sentences: how you work and who you work with. Long bios show a “Read More” link.">
                <Textarea id="pf-bio" rows={5} maxLength={4000} value={f.bio} onChange={(e) => set("bio", e.target.value)} />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Contact" description="How clients reach you. Your contact email also receives your booking, message and form notifications." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact Email" htmlFor="pf-email"><Input id="pf-email" type="email" maxLength={200} value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Phone" htmlFor="pf-phone" optional hint="Shown to your clients in their portal."><Input id="pf-phone" type="tel" maxLength={60} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Website" htmlFor="pf-web" optional className="sm:col-span-2" hint="Shown first among your links."><Input id="pf-web" maxLength={200} value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="yourpractice.com" /></Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Links" description="Instagram, a newsletter, a podcast: buttons under your name on your booking page." />
          <CardBody className="space-y-2">
            {links.length === 0 && <p className="text-[13px] text-muted">No links yet.</p>}
            {links.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
                <Input aria-label={`Link ${i + 1} label`} placeholder="e.g. Instagram" maxLength={60} value={l.label} onChange={(e) => set("links", links.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                <Input aria-label={`Link ${i + 1} address`} type="url" placeholder="https://" maxLength={500} value={l.url} onChange={(e) => set("links", links.map((x, k) => (k === i ? { ...x, url: e.target.value.trim() } : x)))} />
                <Button variant="ghost" size="icon-sm" aria-label={`Remove link ${i + 1}`} onClick={() => set("links", links.filter((_, k) => k !== i))}><Trash2 /></Button>
              </div>
            ))}
            {links.length < 8 && <Button variant="secondary" size="sm" onClick={() => set("links", [...links, { label: "", url: "" }])}><Plus /> Add Link</Button>}
          </CardBody>
        </Card>

        <SaveBar dirty={dirty} error={error} onSave={save} onDiscard={() => { setF(pick(p)); setError(null); }} saveLabel="Save Profile" />
      </div>

      {/* How it looks to clients. */}
      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <p className="eyebrow mb-2">Preview</p>
          <div className="rounded-2xl border border-line bg-canvas p-5 text-center">
            {f.photo ? <img src={f.photo} alt="" className="mx-auto size-16 rounded-full object-cover" /> : <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent font-serif text-[22px] text-white">{initials(f.name) || "?"}</span>}
            <p className="mt-3 font-serif text-[20px] leading-tight text-ink">{f.name || "Your Name"}</p>
            {f.title && <p className="mt-0.5 text-[12.5px] text-ink-3">{f.title}</p>}
            <div className="mt-3 space-y-1.5">
              {[...(f.website.trim() ? [{ label: "Website", url: f.website }] : []), ...links.filter((l) => l.label.trim())].slice(0, 4).map((l, i) => (
                <span key={i} className="flex items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[12px] font-medium text-ink"><Globe className="size-3 text-muted" /> {l.label}</span>
              ))}
            </div>
            {f.bio && <p className="mt-3 line-clamp-4 text-left text-[12px] leading-relaxed text-muted">{f.bio}</p>}
          </div>
          <p className="mt-2 text-[11.5px] text-muted">Your booking page also lists your services.</p>
        </div>
      </aside>
    </div>
  );
}
