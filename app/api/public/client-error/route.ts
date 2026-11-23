import { handler, json, rateLimit, readJson } from "@/lib/server/http";
import { recordError } from "@/lib/server/errors";

/** Errors from people's browsers (no client data: the message, the code location and the page path). */
export const POST = handler(async (req: Request) => {
  rateLimit(req, "client-error", 30, 3_600_000);
  const b = (await readJson(req, 20_000)) as { message?: unknown; stack?: unknown; url?: unknown };
  const message = typeof b.message === "string" ? b.message : "";
  if (!message) return json({ ok: true });
  // Browser noise that isn't ours to fix.
  if (/ResizeObserver loop|Script error\.?$|extension:\/\/|NetworkError when attempting|Load failed|Failed to fetch/i.test(message)) return json({ ok: true });
  await recordError("browser", { message, stack: typeof b.stack === "string" ? b.stack : null, url: typeof b.url === "string" ? b.url : null });
  return json({ ok: true });
});
