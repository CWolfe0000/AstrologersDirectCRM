import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { deleteRecord, getRecord, isCollection, upsertRecord } from "@/lib/server/records";
import { notifyDelivered } from "@/lib/server/notify";
import { keyBelongs, removeObject } from "@/lib/server/storage";

type Ctx = { params: Promise<{ collection: string; id: string }> };

async function target(ctx: Ctx) {
  const { collection, id } = await ctx.params;
  if (!isCollection(collection)) throw new HttpError(404, "Unknown collection.");
  return { collection, id };
}

/** Create or replace one record in the signed-in practice. */
export const PUT = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireUser("owner");
  const { collection, id } = await target(ctx);
  const body = (await readJson(req, 2_000_000)) as Record<string, unknown>;
  if (body?.id !== id) throw new HttpError(400, "Record id does not match the URL.");
  if ((collection === "readings" || collection === "files") && body.fileKey !== undefined && !keyBelongs(body.fileKey, user.practiceId))
    throw new HttpError(422, "That file doesn’t belong to this practice.");
  const before = collection === "readings" || collection === "files" ? await getRecord(user.practiceId, collection, id) : null;
  const saved = await upsertRecord(user.practiceId, collection, body);
  if (collection === "readings" && saved.status === "delivered" && before?.status !== "delivered") {
    await notifyDelivered(user.practiceId, saved);
  }
  // Replaced file: remove the old object.
  if (before?.fileKey && before.fileKey !== saved.fileKey && keyBelongs(before.fileKey, user.practiceId)) await removeObject(before.fileKey as string);
  return json({ ok: true });
});

export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser("owner");
  const { collection, id } = await target(ctx);
  const existing = collection === "readings" || collection === "files" ? await getRecord(user.practiceId, collection, id) : null;
  await deleteRecord(user.practiceId, collection, id);
  if (existing?.fileKey && keyBelongs(existing.fileKey, user.practiceId)) await removeObject(existing.fileKey as string);
  if (collection === "clients") {
    // Deleting a client removes their portal login as well.
    await db().delete(schema.users).where(and(eq(schema.users.practiceId, user.practiceId), eq(schema.users.clientId, id)));
  }
  return json({ ok: true });
});
