/**
 * Switch a practice between the standard and Premium plans (until billing exists).
 *   DATABASE_URL=… npm run plan -- someone@example.com premium
 *   DATABASE_URL=… npm run plan -- someone@example.com standard
 */
import pg from "pg";

const [email, plan] = process.argv.slice(2);
if (!email || !["standard", "premium"].includes(plan)) {
  console.error("Usage: npm run plan -- <owner email> <standard|premium>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const r = await client.query(
  `UPDATE practices SET plan = $2 WHERE id = (SELECT practice_id FROM users WHERE email = lower($1) AND role = 'owner') RETURNING id, name`,
  [email.trim(), plan],
);
await client.end();
if (r.rowCount === 0) {
  console.error(`No practice owner with the email ${email}.`);
  process.exit(1);
}
console.log(`${r.rows[0].name} (${r.rows[0].id}) is now on ${plan === "premium" ? "Premium" : "Standard"}.`);
