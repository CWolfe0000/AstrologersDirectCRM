/**
 * The website and the app can live on different hosts (astrologersdirect.com
 * and app.astrologersdirect.com). Links between them use these; when unset
 * (local, CI, previews) everything is one host and links stay relative.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
/** Where "Join the Beta" goes: account sign-up on the app host. */
export const SIGNUP_URL = `${APP_URL}/auth/signup`;

/** The company that runs AstrologersDirect. */
export const LEGAL_NAME = "Astrologers Direct, LLC";

/** The business's postal address: on the website, the legal pages and every news email. */
export const BUSINESS_ADDRESS = ["2976 E State St", "Ste 120, Unit #2224", "Eagle, ID 83616"] as const;
export const BUSINESS_ADDRESS_LINE = BUSINESS_ADDRESS.join(", ");
