import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "./env";

/**
 * Field-level encryption (AES-256-GCM). Ciphertext format:
 *   v1.<iv b64url>.<tag b64url>.<ciphertext b64url>
 * The version prefix leaves room for key rotation.
 */
let key: Buffer | undefined;
function getKey() {
  if (!key) {
    key = Buffer.from(env.encryptionKey, "base64");
    if (key.length !== 32) throw new Error("APP_ENCRYPTION_KEY must be 32 bytes, base64-encoded (openssl rand -base64 32).");
  }
  return key;
}

export function seal(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function unseal<T = unknown>(sealed: string): T {
  const [v, iv, tag, ct] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("Unrecognised ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  const pt = Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]);
  return JSON.parse(pt.toString("utf8")) as T;
}

/** Random token for cookies / emailed links (returned raw) and its stored hash. */
export function newToken() {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: sha256(raw) };
}

export function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export function newId(prefix: string) {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}
