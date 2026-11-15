import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { HttpError } from "./http";
import type { Plan } from "@/lib/plan";

export async function practicePlan(practiceId: string): Promise<Plan> {
  const [p] = await db().select({ plan: schema.practices.plan }).from(schema.practices).where(eq(schema.practices.id, practiceId));
  return p?.plan === "premium" ? "premium" : "standard";
}

/** 402 unless the practice is on Premium. */
export async function requirePremium(practiceId: string) {
  if ((await practicePlan(practiceId)) !== "premium") throw new HttpError(402, "This is a Premium feature.", { premium: true });
}

/** Plan for new sign-ups (DEFAULT_PLAN, default "standard"). */
export function defaultPlan(): Plan {
  return process.env.DEFAULT_PLAN === "premium" ? "premium" : "standard";
}
