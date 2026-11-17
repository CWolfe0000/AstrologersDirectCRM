import "server-only";
import { HttpError, requireUser } from "./http";
import { getRecord } from "./records";
import { keyBelongs, serveObject } from "./storage";
import { isExpired } from "./portal";
import { resolveScoped, SEP } from "./clientaccess";

/**
 * Who may open a stored file:
 *  - the practitioner: any file in their practice
 *  - a client: only their own delivered, unexpired readings, and their own
 *    non-private files; downloading a reading also requires allowDownload.
 */
export async function serveMedia(req: Request, kind: "readings" | "files" | "recordings", rawId: string) {
  const user = await requireUser();
  // Clients use ids scoped by practice (one portal across every astrologer they see).
  const decoded = decodeURIComponent(rawId);
  const where =
    user.role === "client"
      ? await resolveScoped(user, decoded)
      : // A practitioner previewing a client's portal uses ids scoped with their own practice.
        { practiceId: user.practiceId, clientId: null, id: decoded.startsWith(user.practiceId + SEP) ? decoded.slice(user.practiceId.length + SEP.length) : decoded };
  const rec = await getRecord(where.practiceId, kind, where.id);
  if (!rec || !keyBelongs(rec.fileKey, where.practiceId)) throw new HttpError(404, "File not found.");
  const wantsDownload = new URL(req.url).searchParams.get("download") === "1";
  if (user.role === "client") {
    // Raw recordings are practitioner-only; clients get them as delivered readings.
    if (kind === "recordings" || rec.clientId !== where.clientId) throw new HttpError(404, "File not found.");
    if (kind === "readings") {
      if (rec.status !== "delivered") throw new HttpError(404, "File not found.");
      if (isExpired(rec.expiresAt)) throw new HttpError(410, "This reading’s access period has ended. Ask your astrologer to share it again.");
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
