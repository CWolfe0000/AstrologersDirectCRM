import { z } from "zod";
import { handler, HttpError, json, readJson, requireUser } from "@/lib/server/http";
import { refundPayment } from "@/lib/server/payments";

const body = z.object({ id: z.string().max(80), amount: z.number().int().positive().optional() }).strict();

/** The astrologer refunds a payment, in full or in part. */
export const POST = handler(async (req: Request) => {
  const user = await requireUser("owner");
  const p = body.safeParse(await readJson(req, 2_000));
  if (!p.success) throw new HttpError(422, "Choose a payment to refund.");
  return json({ refunded: await refundPayment(user.practiceId, p.data.id, p.data.amount) });
});
