import "server-only";
import { HttpError, requireUser } from "./http";
import { getRecord } from "./records";
import { keyBelongs, serveObject } from "./storage";
import { nowLocal } from "@/lib/utils";

/**
 * Who may open a stored file:
 *  - the practitioner: any file in their practice
 *  - a client: only their own delivered, unexpired readings, and their own
 *    non-private files; downloading a reading also requires allowDownload.
 */
export async function serveMedia(req: Request, kind: "readings" | "files" | "recordings", id: string) {
  const user = await requireUser();
  const rec = await getRecord(user.practiceId, kind, id);
  if (!rec || !keyBelongs(rec.fileKey, user.practiceId)) throw new HttpError(404, "File not found.");
  const wantsDownload = new URL(req.url).searchParams.get("download") === "1";
  if (user.role === "client") {
    // Raw recordings are practitioner-only; clients get them as delivered readings.
    if (kind === "recordings" || rec.clientId !== user.clientId) throw new HttpError(404, "File not found.");
    if (kind === "readings") {
      if (rec.status !== "delivered") throw new HttpError(404, "File not found.");
      if (typeof rec.expiresAt === "string" && rec.expiresAt < nowLocal()) throw new HttpError(410, "This reading’s access period has ended. Ask your astrologer to share it again.");
      if (wantsDownload && !rec.allowDownload) throw new HttpError(403, "Your astrologer has shared this reading for viewing only.");
    } else if (rec.private) {
      throw new HttpError(404, "File not found.");
    }
  }
  return serveObject(req, rec.fileKey as string, {
    download: wantsDownload,
    fileName: String(rec.fileName ?? rec.name ?? rec.title ?? "file"),
    contentType: typeof rec.contentType === "string" ? rec.contentType : undefined,
  });
}
