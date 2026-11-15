import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { deleteRecord, getRecord, isCollection, upsertRecord } from "@/lib/server/records";
import { notifyDelivered } from "@/lib/server/notify";

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
  const before = collection === "readings" ? await getRecord(user.practiceId, "readings", id) : null;
  const saved = await upsertRecord(user.practiceId, collection, body);
  if (collection === "readings" && saved.status === "delivered" && before?.status !== "delivered") {
    await notifyDelivered(user.practiceId, saved);
  }
  return json({ ok: true });
});

export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser("owner");
  const { collection, id } = await target(ctx);
  await deleteRecord(user.practiceId, collection, id);
  if (collection === "clients") {
    // Deleting a client removes their portal login as well.
    await db().delete(schema.users).where(and(eq(schema.users.practiceId, user.practiceId), eq(schema.users.clientId, id)));
  }
  return json({ ok: true });
});
