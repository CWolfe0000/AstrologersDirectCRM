CREATE TABLE "access_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"practice" text NOT NULL,
	"website" text NOT NULL,
	"experience" text NOT NULL,
	"about" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invite_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" text
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "access_requests_email_idx" ON "access_requests" USING btree ("email");