import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/auth";
import { searchPlaces } from "@/lib/server/places";

/** Birthplace search for the place picker. */
export async function GET(req: Request) {
  if (!(await rateLimit("places", 240, 600_000))) return NextResponse.json({ error: "Too many searches. Try again in a few minutes." }, { status: 429 });
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 80) ?? "";
  return NextResponse.json({ results: await searchPlaces(q) }, { headers: { "Cache-Control": "private, max-age=3600" } });
}
