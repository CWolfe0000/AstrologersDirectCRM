import { json } from "@/lib/server/http";
import { callsEnabled } from "@/lib/server/calls";

/** Whether live sessions can happen on AstrologersDirect's own calls (no secrets: just on or off). */
export async function GET() {
  return json({ enabled: callsEnabled() });
}
