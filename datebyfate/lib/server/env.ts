import "server-only";

/** Server configuration from environment variables (see .env.example). */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name}. See .env.example.`);
  return v;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get encryptionKey() {
    return required("APP_ENCRYPTION_KEY");
  },
  get appUrl() {
    return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY || "";
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "Datebyfate <no-reply@datebyfate.local>";
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  stripe: {
    get secretKey() {
      return process.env.STRIPE_SECRET_KEY || "";
    },
    get webhookSecret() {
      return process.env.STRIPE_WEBHOOK_SECRET || "";
    },
    get priceMonthly() {
      return process.env.STRIPE_PRICE_MONTHLY || "";
    },
    get priceYearly() {
      return process.env.STRIPE_PRICE_YEARLY || "";
    },
  },
};
