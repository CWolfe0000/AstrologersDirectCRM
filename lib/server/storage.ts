import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomBytes } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";
import { ALLOWED_TYPES } from "@/lib/media-types";
import { newToken, sha256 } from "./crypto";

/**
 * File storage for readings, recordings and client files.
 *
 * - "local" (default in development): files on disk under STORAGE_DIR.
 *   Uploads go to /api/v1/uploads/local (a stand-in for the bucket).
 * - "s3" (production): any S3-compatible bucket (AWS S3, Cloudflare R2, …).
 *   Browsers upload straight to the bucket with a short-lived signed URL, so
 *   large files never pass through the web server (Vercel caps request bodies).
 *
 * Object keys always start with the practice id; every download is
 * authorized against the record that references the key.
 */

export const MAX_UPLOAD_BYTES = 2 * 1024 ** 3; // 2 GB
export { ALLOWED_TYPES };

type Driver = "local" | "s3";
function driver(): Driver {
  return process.env.STORAGE_DRIVER === "s3" ? "s3" : "local";
}
export function storageDriver() {
  return driver();
}

function localDir() {
  return path.resolve(process.env.STORAGE_DIR || ".uploads");
}

let s3: S3Client | undefined;
function s3Client() {
  if (!s3) {
    s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID || "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "" },
      // Recent AWS SDKs add a CRC32 checksum to every request by default. In a presigned upload URL that
      // checksum is computed for an empty body, so R2 rejects the real upload. Only send checksums when
      // an operation requires them.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return s3;
}
function bucket() {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error("Set S3_BUCKET (and S3_* credentials) to use STORAGE_DRIVER=s3.");
  return b;
}

export function safeName(name: string) {
  const base = name.normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").replace(/^\.+/, "").slice(-120);
  return base || "file";
}

export function newKey(practiceId: string, fileName: string) {
  return `${practiceId}/${randomBytes(12).toString("base64url")}/${safeName(fileName)}`;
}

/** Key belongs to this practice and has no path tricks. */
export function keyBelongs(key: unknown, practiceId: string): key is string {
  return typeof key === "string" && key.startsWith(practiceId + "/") && !key.includes("..") && key.split("/").length === 3;
}

// ——— Local upload tickets (signed, single key, short-lived) ———————————————
const tickets = new Map<string, { key: string; practiceId: string; contentType: string; size: number; expires: number }>();

export async function createUpload(practiceId: string, fileName: string, contentType: string, size: number) {
  const key = newKey(practiceId, fileName);
  if (driver() === "s3") {
    const url = await getSignedUrl(s3Client(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ContentLength: size }), { expiresIn: 3600 });
    return { key, url, method: "PUT" as const, headers: { "Content-Type": contentType } };
  }
  const { raw, hash } = newToken();
  tickets.set(hash, { key, practiceId, contentType, size, expires: Date.now() + 3600_000 });
  return { key, url: `/api/v1/uploads/local?ticket=${raw}`, method: "PUT" as const, headers: { "Content-Type": contentType } };
}

/** Local driver only: stream an upload body to disk, enforcing the ticket. */
export async function receiveLocalUpload(rawTicket: string, practiceId: string, contentType: string | null, body: ReadableStream<Uint8Array> | null) {
  const t = tickets.get(sha256(rawTicket));
  if (!t || t.expires < Date.now()) throw Object.assign(new Error("Upload link expired. Try again."), { status: 400 });
  // Checked before anything is written: the ticket belongs to this practice and this file type.
  if (t.practiceId !== practiceId) throw Object.assign(new Error("Not allowed."), { status: 403 });
  if ((contentType ?? "").split(";")[0]!.trim() !== t.contentType) throw Object.assign(new Error("File type doesn’t match the upload."), { status: 415 });
  tickets.delete(sha256(rawTicket));
  if (!body) throw Object.assign(new Error("Empty upload."), { status: 400 });
  const file = path.join(localDir(), t.key);
  await mkdir(path.dirname(file), { recursive: true });
  let bytes = 0;
  const limit = Math.min(t.size + 1024, MAX_UPLOAD_BYTES);
  const counted = Readable.fromWeb(body as never).on("data", (chunk: Buffer) => {
    bytes += chunk.length;
    if (bytes > limit) counted.destroy(Object.assign(new Error("File is larger than declared."), { status: 413 }));
  });
  try {
    await pipeline(counted, createWriteStream(file));
  } catch (e) {
    await rm(file, { force: true });
    throw e;
  }
  return { key: t.key, bytes };
}

/** Does the object exist (after the browser says the upload finished)? */
export async function exists(key: string) {
  if (driver() === "s3") {
    try {
      await s3Client().send(new GetObjectCommand({ Bucket: bucket(), Key: key, Range: "bytes=0-0" }));
      return true;
    } catch {
      return false;
    }
  }
  return stat(path.join(localDir(), key)).then(() => true, () => false);
}

export async function removeObject(key: string) {
  if (driver() === "s3") await s3Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key })).catch(() => {});
  else await rm(path.join(localDir(), key), { force: true });
}

/** Delete every stored object belonging to a practice (account deletion / clearing records). */
export async function removePracticeObjects(practiceId: string) {
  if (!/^[\w-]+$/.test(practiceId)) throw new Error("Invalid practice id");
  if (driver() === "s3") {
    let token: string | undefined;
    do {
      const page = await s3Client().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: practiceId + "/", ContinuationToken: token }));
      const keys = (page.Contents ?? []).map((o) => o.Key!);
      // One request per object: the batch delete needs a checksum header that not every S3-compatible store accepts.
      for (let i = 0; i < keys.length; i += 20) await Promise.all(keys.slice(i, i + 20).map((Key) => s3Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key }))));
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return;
  }
  await rm(path.join(localDir(), practiceId), { recursive: true, force: true });
}

/**
 * Serve an object. S3: redirect to a short-lived signed URL.
 * Local: stream from disk with HTTP Range support (so audio/video can seek).
 */
const INLINE_TYPES = /^(application\/pdf|audio\/|video\/|image\/(jpeg|png))/;

export async function serveObject(req: Request, key: string, opts: { download: boolean; fileName: string; contentType?: string }) {
  // Only allowlisted types are served, and only media/PDF/images ever display inline.
  const type = opts.contentType && ALLOWED_TYPES.includes(opts.contentType) ? opts.contentType : "application/octet-stream";
  const inline = !opts.download && INLINE_TYPES.test(type);
  const disposition = `${inline ? "inline" : "attachment"}; filename="${safeName(opts.fileName)}"`;
  opts = { ...opts, contentType: type };
  if (driver() === "s3") {
    const url = await getSignedUrl(
      s3Client(),
      new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: disposition, ResponseContentType: opts.contentType }),
      { expiresIn: 300 },
    );
    return Response.redirect(url, 302);
  }
  const file = path.join(localDir(), key);
  const info = await stat(file).catch(() => null);
  if (!info) return new Response("Not found", { status: 404 });
  const size = info.size;
  const headers: Record<string, string> = {
    "Content-Type": opts.contentType || "application/octet-stream",
    "Content-Disposition": disposition,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    // Downloads can never run as a page on our origin. (Inline types are PDF/audio/video/images only.)
    ...(inline ? {} : { "Content-Security-Policy": "sandbox; default-src 'none'" }),
  };
  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    let start = range[1] ? parseInt(range[1], 10) : 0;
    let end = range[2] ? parseInt(range[2], 10) : size - 1;
    if (!range[1] && range[2]) {
      start = Math.max(0, size - parseInt(range[2], 10));
      end = size - 1;
    }
    if (start >= size || end < start) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    end = Math.min(end, size - 1);
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { status: 200, headers: { ...headers, "Content-Length": String(size) } });
}

export const storageInfo = { get driver() { return driver(); }, get appUrl() { return env.appUrl; } };
