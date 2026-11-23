import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/server/db";
import { destroySession } from "@/lib/server/auth";
import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { getRecord, upsertRecord } from "@/lib/server/records";
import { linksFor } from "@/lib/server/clientaccess";
import { link, sendMail } from "@/lib/server/mail";
import { newId } from "@/lib/server/crypto";
import { nowLocal } from "@/lib/utils";

/**
 * A client closes their portal login: every astrologer they see is told (and
 * can delete their professional records if asked), portal access is turned off
 * on each client record, and the login and its sessions are deleted.
 * Requires { confirm: "CLOSE" }.
 */
export const DELETE = handler(async (req: Request) => {
  rateLimit(req, "portal-close", 5, 3_600_000);
  const user = await requireUser("client");
  const { confirm, deleteRecords } = (await readJson(req)) as { confirm?: string; deleteRecords?: boolean };
  if (confirm !== "CLOSE") throw new HttpError(400, "Type CLOSE to confirm.");
  for (const l of await linksFor(user.id)) {
    const client = await getRecord(l.practiceId, "clients", l.clientId);
    const person = await getRecord(l.practiceId, "people", l.clientId);
    const name = `${person?.firstName ?? ""} ${person?.lastName ?? ""}`.trim() || user.name;
    if (client) await upsertRecord(l.practiceId, "clients", { ...client, portalAccess: "none" });
    const ask = deleteRecords ? " They asked for their records to be deleted too." : "";
    await upsertRecord(l.practiceId, "notifications", {
      id: newId("n"),
      type: "client",
      title: deleteRecords ? "Client asked for deletion" : "Client closed their portal",
      body: `${name} closed their client portal account.${ask}`,
      at: nowLocal(),
      read: false,
      href: `/app/clients/${l.clientId}`,
    });
    const [owner] = await db().select({ email: schema.users.email }).from(schema.users).where(and(eq(schema.users.practiceId, l.practiceId), eq(schema.users.role, "owner"))).limit(1);
    if (owner)
      await sendMail(
        owner.email,
        deleteRecords ? `${name} Asked You to Delete Their Records` : `${name} Closed Their Client Portal`,
        `${name} closed their AstrologersDirect client portal account. Their portal access is now off; your records are unchanged.${
          deleteRecords
            ? `\n\nThey also asked you to delete the records you hold about them. As their astrologer, that decision and any legal obligations are yours. You can archive or delete the client from their record:\n${link(`/app/clients/${l.clientId}`)}`
            : ""
        }\n\nReply to this email to contact them.\n`,
        { replyTo: user.email },
      );
  }
  await destroySession();
  await db().delete(schema.users).where(and(eq(schema.users.id, user.id), eq(schema.users.role, "client")));
  return json({ ok: true });
});
