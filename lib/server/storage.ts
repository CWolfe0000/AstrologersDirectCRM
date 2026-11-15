import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomBytes } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";
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
 * authorised against the record that references the key.
 */

export const MAX_UPLOAD_BYTES = 2 * 1024 ** 3; // 2 GB
export const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/heic",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/ogg",
  "audio/webm",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "text/plain",
];

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
  const base = name.normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").slice(-120);
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
const tickets = new Map<string, { key: string; contentType: string; size: number; expires: number }>();

export async function createUpload(practiceId: string, fileName: string, contentType: string, size: number) {
  const key = newKey(practiceId, fileName);
  if (driver() === "s3") {
    const url = await getSignedUrl(s3Client(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ContentLength: size }), { expiresIn: 3600 });
    return { key, url, method: "PUT" as const, headers: { "Content-Type": contentType } };
  }
  const { raw, hash } = newToken();
  tickets.set(hash, { key, contentType, size, expires: Date.now() + 3600_000 });
  return { key, url: `/api/v1/uploads/local?ticket=${raw}`, method: "PUT" as const, headers: { "Content-Type": contentType } };
}

/** Local driver only: stream an upload body to disk, enforcing the ticket. */
export async function receiveLocalUpload(rawTicket: string, body: ReadableStream<Uint8Array> | null) {
  const t = tickets.get(sha256(rawTicket));
  if (!t || t.expires < Date.now()) throw Object.assign(new Error("Upload link expired. Try again."), { status: 400 });
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

/**
 * Serve an object. S3: redirect to a short-lived signed URL.
 * Local: stream from disk with HTTP Range support (so audio/video can seek).
 */
export async function serveObject(req: Request, key: string, opts: { download: boolean; fileName: string; contentType?: string }) {
  const disposition = `${opts.download ? "attachment" : "inline"}; filename="${safeName(opts.fileName)}"`;
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
