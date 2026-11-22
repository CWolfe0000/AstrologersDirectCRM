import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** The build that's live now (open tabs compare it with the one they loaded). */
export function GET() {
  return NextResponse.json({ build: process.env.NEXT_PUBLIC_BUILD_ID ?? "" }, { headers: { "Cache-Control": "no-store" } });
}
