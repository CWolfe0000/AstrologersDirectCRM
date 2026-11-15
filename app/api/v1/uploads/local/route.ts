import { handler, HttpError, json, requireUser } from "@/lib/server/http";
import { keyBelongs, receiveLocalUpload, storageDriver } from "@/lib/server/storage";

/** Development stand-in for the storage bucket (STORAGE_DRIVER=local). */
export const PUT = handler(async (req) => {
  if (storageDriver() !== "local") throw new HttpError(404, "Not found.");
  const user = await requireUser("owner");
  const ticket = new URL(req.url).searchParams.get("ticket") ?? "";
  try {
    const r = await receiveLocalUpload(ticket, req.body);
    if (!keyBelongs(r.key, user.practiceId)) throw new HttpError(403, "Not allowed.");
    return json({ ok: true, key: r.key, bytes: r.bytes });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (e instanceof HttpError) throw e;
    throw new HttpError(err.status ?? 500, err.message);
  }
});
