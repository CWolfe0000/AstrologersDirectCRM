import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { deleteRecord, getRecord, isCollection, isFileReferenced, snapshotObservation, upsertRecord } from "@/lib/server/records";
import { notifyDelivered, notifyWorkShared } from "@/lib/server/notify";
import { removeClientAccess } from "@/lib/server/clientaccess";
import { keyBelongs, removeObject } from "@/lib/server/storage";

type Ctx = { params: Promise<{ collection: string; id: string }> };

async function target(ctx: Ctx) {
  const { collection, id } = await ctx.params;
  if (!isCollection(collection)) throw new HttpError(404, "Unknown collection.");
  // Clients' own responses are written only through the portal; practitioners can read them, not change them.
  if (collection === "workResponses") throw new HttpError(403, "Client responses can’t be changed.");
  return { collection, id };
}

/** Create or replace one record in the signed-in practice. */
export const PUT = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireUser("owner");
  const { collection, id } = await target(ctx);
  const body = (await readJson(req, 2_000_000)) as Record<string, unknown>;
  if (body?.id !== id) throw new HttpError(400, "Record id does not match the URL.");
  if ((collection === "readings" || collection === "files" || collection === "recordings") && body.fileKey !== undefined && !keyBelongs(body.fileKey, user.practiceId))
    throw new HttpError(422, "That file doesn’t belong to this practice.");
  const withFiles = collection === "readings" || collection === "files" || collection === "recordings";
  const before = withFiles || collection === "clients" || collection === "observations" || collection === "clientWork" ? await getRecord(user.practiceId, collection, id) : null;
  // Edit-conflict protection: the client says which version its change is based on.
  const baseHeader = req.headers.get("x-base-version");
  const baseVersion = baseHeader === null ? undefined : Number.parseInt(baseHeader, 10);
  if (baseVersion !== undefined && (!Number.isInteger(baseVersion) || baseVersion < 0)) throw new HttpError(400, "Invalid version.");
  const saved = await upsertRecord(user.practiceId, collection, body, { baseVersion });
  if (collection === "observations" && (before === null || before.body !== saved.body || before.title !== saved.title)) {
    await snapshotObservation(user.practiceId, id, String(saved.title ?? ""), String(saved.body ?? ""));
  }
  if (collection === "readings" && saved.status === "delivered" && before?.status !== "delivered") {
    await notifyDelivered(user.practiceId, saved);
  }
  if (collection === "clientWork" && saved.status === "shared" && before?.status !== "shared" && !before?.sharedAt) {
    await notifyWorkShared(user.practiceId, saved);
  }
  // Portal access turned off (or client archived): remove their login, which ends their sessions.
  if (collection === "clients" && (saved.portalAccess === "none" || saved.status === "archived") && before && (before.portalAccess !== saved.portalAccess || before.status !== saved.status)) {
    await removeClientAccess(user.practiceId, id);
  }
  // Replaced file: remove the old object.
  if (before?.fileKey && before.fileKey !== saved.fileKey && keyBelongs(before.fileKey, user.practiceId) && !(await isFileReferenced(user.practiceId, before.fileKey as string)))
    await removeObject(before.fileKey as string);
  return json({ ok: true, version: saved.__version });
});

export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser("owner");
  const { collection, id } = await target(ctx);
  const existing = collection === "readings" || collection === "files" || collection === "recordings" ? await getRecord(user.practiceId, collection, id) : null;
  await deleteRecord(user.practiceId, collection, id);
  // Remove the stored file unless another record (e.g. the reading made from a recording) still uses it.
  if (existing?.fileKey && keyBelongs(existing.fileKey, user.practiceId) && !(await isFileReferenced(user.practiceId, existing.fileKey as string)))
    await removeObject(existing.fileKey as string);
  if (collection === "clients") {
    // Deleting a client removes this practice from their portal (and the login, if no other astrologer uses it).
    await removeClientAccess(user.practiceId, id);
  }
  return json({ ok: true });
});
