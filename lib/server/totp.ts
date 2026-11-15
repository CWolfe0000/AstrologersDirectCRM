import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** RFC 6238 time-based one-time passwords (30 s, 6 digits, SHA-1 — what authenticator apps expect). */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string) {
  const clean = s.replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) throw new Error("Invalid base32");
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function newSecret() {
  return base32Encode(randomBytes(20));
}

export function hotp(secret: string, counter: number) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", base32Decode(secret)).update(buf).digest();
  const offset = h[h.length - 1]! & 15;
  const code = ((h.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
  return code;
}

export function totp(secret: string, at = Date.now()) {
  return hotp(secret, Math.floor(at / 30_000));
}

/** The time step the code matches (current, or one either side for clock drift), or null. */
export function matchTotpStep(secret: string, code: string, at = Date.now()): number | null {
  const c = String(code).replace(/\s+/g, "");
  if (!/^\d{6}$/.test(c)) return null;
  const step = Math.floor(at / 30_000);
  for (const d of [-1, 0, 1]) {
    if (timingSafeEqual(Buffer.from(hotp(secret, step + d)), Buffer.from(c))) return step + d;
  }
  return null;
}

/** Accepts the current code and one step either side (clock drift). */
export function verifyTotp(secret: string, code: string, at = Date.now()) {
  return matchTotpStep(secret, code, at) !== null;
}

export function otpauthUrl(secret: string, account: string, issuer = "AstrologersDirect") {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function newRecoveryCodes(n = 10) {
  return Array.from({ length: n }, () => {
    const s = base32Encode(randomBytes(5)).toLowerCase();
    return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
  });
}
