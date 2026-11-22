import { handler, rateLimit } from "@/lib/server/http";
import { setNewsEmails, validUnsubscribe } from "@/lib/server/email-prefs";

const page = (title: string, body: string) =>
  new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,sans-serif;background:#F6F3EE;color:#29272B;display:grid;place-items:center;min-height:100vh;margin:0}main{max-width:440px;padding:32px;text-align:center}h1{font-family:Georgia,serif;font-weight:400;font-size:28px}p{color:#68645F;line-height:1.5}</style></head><body><main><h1>${title}</h1><p>${body}</p></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });

/** One-click unsubscribe from news and offers (the link in those emails). */
async function handle(req: Request) {
  rateLimit(req, "unsubscribe", 60, 3_600_000);
  const url = new URL(req.url);
  const u = url.searchParams.get("u") ?? "", t = url.searchParams.get("t") ?? "";
  if (!u || !validUnsubscribe(u, t)) return page("This Link Isn’t Valid", "You can turn news and offers emails off in Settings › Notifications.");
  await setNewsEmails(u, false);
  return page("You’re Unsubscribed", "You won’t get news or offers emails from AstrologersDirect any more. Emails about your account, like sign-in links, still arrive. You can turn news back on in Settings › Notifications.");
}
export const GET = handler(handle);
// Mail apps' one-click unsubscribe (RFC 8058) posts to the same address.
export const POST = handler(handle);
