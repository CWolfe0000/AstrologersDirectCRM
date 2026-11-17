import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { getRecord, upsertRecord } from "@/lib/server/records";
import { linksFor } from "@/lib/server/clientaccess";

const Body = z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().max(100) }).strict();

/** A client updates the name on their own records, with every astrologer they see. (Email changes go through the practitioner for now.) */
export const PUT = handler(async (req) => {
  const user = await requireUser("client");
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, "Please enter your name.");
  // The name is the client's own: update it with every astrologer they see.
  const links = await linksFor(user.id);
  let found = false;
  for (const l of links) {
    const p = await getRecord(l.practiceId, "people", l.clientId);
    if (!p) continue;
    found = true;
    await upsertRecord(l.practiceId, "people", { ...p, ...parsed.data });
  }
  if (!found) throw new HttpError(404, "Profile not found.");
  await db().update(schema.users).set({ name: `${parsed.data.firstName} ${parsed.data.lastName}`.trim() }).where(eq(schema.users.id, user.id));
  return json({ ok: true });
});
