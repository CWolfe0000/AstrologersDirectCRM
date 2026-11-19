// Complimentary access for staff and testers:  npm run plan -- <email> <premium|free>
import pg from "pg";

const [email, plan] = process.argv.slice(2);
if (!email || !["premium", "free"].includes(plan)) {
  console.error("Usage: npm run plan -- <email> <premium|free>");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/datebyfate" });
const r = await pool.query("update users set comp_premium = $2 where email = $1 returning email", [email.toLowerCase(), plan === "premium"]);
console.log(r.rowCount ? `${email}: complimentary access ${plan === "premium" ? "on" : "off"}` : `No account with email ${email}`);
await pool.end();
