import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db, schema } from "@/lib/server/db";
import { handler, HttpError, json, requireUser } from "@/lib/server/http";
import { newSecret, otpauthUrl } from "@/lib/server/totp";
import { sealSecret } from "@/lib/server/twofactor";

/** Start setup: creates a pending secret and returns it with a QR code. */
export const POST = handler(async () => {
  const u = await requireUser();
  if (u.twoFactor) throw new HttpError(400, "Two-factor authentication is already on.");
  const secret = newSecret();
  await db().update(schema.users).set({ totpSecret: sealSecret(secret), totpEnabledAt: null }).where(eq(schema.users.id, u.id));
  const url = otpauthUrl(secret, u.email);
  return json({ secret, otpauth: url, qr: await QRCode.toDataURL(url, { margin: 1, width: 220 }) });
});
