# Deploying AstrologersDirect

This guide uses four services, all with free or low-cost starter tiers. Expect about an hour the first time.

| Need | Service | Why this one |
|---|---|---|
| Database | **Neon** (Postgres) | You already use it for Sky. It has a free tier and branches for testing. |
| Web app | **Vercel** | The natural host for Next.js. It deploys automatically on every push to GitHub. |
| Email | **Resend** | You already use it for Sky. |
| File storage | **Cloudflare R2** | S3-compatible with no download (egress) fees, which matters for audio and video readings. |

> Before real client data goes in, get a professional security review. See `docs/PLAN.md`.

## 1. Database: Neon

1. Create a project called `astrologersdirect`, in a region near most of your users.
2. Copy the **pooled** connection string (it contains `-pooler`). It looks like:
   `postgres://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
3. Create the tables from your computer, or let me do it in a session:
   ```bash
   DATABASE_URL="<connection string>" npm run db:migrate
   ```

## 2. Encryption key

Generate a key once and keep it somewhere safe, such as a password manager:

```bash
openssl rand -base64 32
```

This is `APP_ENCRYPTION_KEY`. **If it is lost or changed, encrypted client data (birth data, notes, observations) cannot be read.** Never commit it.

## 3. File storage: Cloudflare R2

1. In Cloudflare, go to **R2 → Create bucket** and name it `astrologersdirect-files`. Leave the bucket **private**, without public access.
2. Go to **R2 → Manage API tokens → Create token** with *Object Read & Write* permission for that bucket only. Note the **Access Key ID**, the **Secret Access Key**, and the **S3 endpoint** (`https://<account-id>.r2.cloudflarestorage.com`).
3. Allow browsers to upload directly. Open **Bucket → Settings → CORS policy** and set the policy below, replacing the domain with yours:
   ```json
   [
     {
       "AllowedOrigins": ["https://app.astrologersdirect.com"],
       "AllowedMethods": ["PUT", "GET", "HEAD"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
   Uploads fail with a network error if this policy is missing.

## 4. Email: Resend

1. Add and verify a sending domain, for example `mail.astrologersdirect.com`. Resend lists the DNS records to add.
2. Create an API key with *Sending access* only.

## 5. Web app: Vercel

1. **Add New → Project →** import `CWolfe0000/AstrologersDirectCRM` and choose the branch to deploy. The production branch is set under **Settings → Git**.
2. Framework preset: **Next.js**. Set the build command to `npm run ephemeris && npm run build`. This downloads the Swiss Ephemeris data files (about 2 MB, checksum-verified, the same files Sky uses) before building, and the build bundles them with the chart endpoints.
3. Add these environment variables under **Settings → Environment Variables**:

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `APP_ENCRYPTION_KEY` | from step 2 |
| `APP_URL` | `https://<your domain>` (used in email links) |
| `NEXT_PUBLIC_DATA_MODE` | `server` |
| `RESEND_API_KEY` | from step 4 |
| `EMAIL_FROM` | `AstrologersDirect <no-reply@mail.astrologersdirect.com>` |
| `STORAGE_DRIVER` | `s3` |
| `S3_BUCKET` | `astrologersdirect-files` |
| `S3_REGION` | `auto` |
| `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY_ID` | from step 3 |
| `S3_SECRET_ACCESS_KEY` | from step 3 |
| `CRON_SECRET` | another random value (`openssl rand -base64 32`). Vercel sends it to the reminder job. |
| `SWISS_EPHEMERIS_LICENSE` | `staging` while testing; `confirmed` once you have checked the Professional License covers AstrologersDirect (the entity and the product). Charts, the timeline and solar returns stay off in production until this is set. |

4. Deploy, then add your domain under **Settings → Domains**.

## 6. First checks after deploying

- [ ] Sign up, and receive and click the verification email
- [ ] Load sample data, edit something, reload, and confirm the change is still there
- [ ] Upload a small PDF on the Reading Delivery screen and send it to a test client whose email address you control
- [ ] Accept the portal invitation from that address and open the reading
- [ ] Turn on two-factor in Settings → Security, then sign out and back in
- [ ] Open a sample client's natal chart and the Timeline, and compare a few positions with your usual software

## Notes

- **Swiss Ephemeris** runs inside the web app through the `sweph` package, which compiles a native module during `npm install`. This works on Vercel's Node runtime, but has not been tried there yet: if the first deploy fails at install or on the chart endpoints, tell me the error. Moving calculations to a separate service (for example on Render, next to Sky) is the fallback.

- **Reminder emails** come from a scheduled job (`vercel.json`) that runs hourly. Vercel's free Hobby plan only runs scheduled jobs once a day: reminders still go out, but up to a day early rather than at the chosen time. The Pro plan runs them hourly.

- **Migrations:** run `npm run db:migrate` against Neon whenever `drizzle/` changes. A future improvement is to run this automatically before each production deploy.
- **Backups:** Neon keeps point-in-time history according to your plan. R2 does not keep backups by default, so consider bucket replication once real readings are stored there.
- **Rate limits** are kept in each server instance's memory. That is fine for a beta. With heavy traffic, move them to Redis (for example Upstash).
- **The demo prototype** is unaffected. It is a separate single-file build (`npm run build:standalone`).
