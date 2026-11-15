import { sha256 } from "@/lib/server/crypto";
import { feedPracticeId, practiceCalendar } from "@/lib/server/calendar";

/** Calendar apps fetch this without cookies; the unguessable token in the URL is the credential. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const raw = token.replace(/\.ics$/, "");
  const practiceId = /^[\w-]{20,100}$/.test(raw) ? await feedPracticeId(sha256(raw)) : null;
  if (!practiceId) return new Response("Calendar link not found. Create a new one in AstrologersDirect → Settings.", { status: 404 });
  return new Response(await practiceCalendar(practiceId), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="consultations.ics"',
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
