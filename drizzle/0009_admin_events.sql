CREATE TABLE "admin_events" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_email" text NOT NULL,
	"action" text NOT NULL,
	"practice_id" text NOT NULL,
	"detail" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
