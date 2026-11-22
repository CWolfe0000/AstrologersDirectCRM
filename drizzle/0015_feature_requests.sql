CREATE TABLE "feature_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"practice_id" text,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"area" text NOT NULL,
	"text" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feature_requests_created_idx" ON "feature_requests" USING btree ("created_at");