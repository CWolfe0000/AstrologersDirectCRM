import "server-only";

/**
 * Server configuration. Values come from environment variables; see
 * `.env.example`. Fails fast on missing required values so misconfiguration
 * never reaches a request.
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name}. See .env.example.`);
  return v;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  /** 32-byte key, base64. Generate with: openssl rand -base64 32 */
  get encryptionKey() {
    return required("APP_ENCRYPTION_KEY");
  },
  get appUrl() {
    return process.env.APP_URL || "http://localhost:3000";
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY || "";
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "AstrologersDirect <no-reply@astrologersdirect.local>";
  },
  /** Where website contact-form messages go (e.g. hello@astrologersdirect.com). */
  get contactEmail() {
    return process.env.CONTACT_EMAIL || "";
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};
