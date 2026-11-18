CREATE TABLE "booking_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"consultation_id" text NOT NULL,
	"service_id" text NOT NULL,
	"client_email" text NOT NULL,
	"client_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_tokens" ADD CONSTRAINT "booking_tokens_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_tokens_consultation_idx" ON "booking_tokens" USING btree ("practice_id","consultation_id");