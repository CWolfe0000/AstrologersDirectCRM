CREATE TABLE "booking_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"stripe_account_id" text NOT NULL,
	"checkout_session_id" text,
	"payment_intent_id" text,
	"status" text NOT NULL,
	"amount" integer NOT NULL,
	"refunded" integer DEFAULT 0 NOT NULL,
	"currency" text NOT NULL,
	"service_name" text NOT NULL,
	"client_name" text NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"sealed" text NOT NULL,
	"consultation_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_accounts" (
	"practice_id" text PRIMARY KEY NOT NULL,
	"stripe_account_id" text NOT NULL,
	"charges_enabled" integer DEFAULT 0 NOT NULL,
	"details_submitted" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_payments_session_idx" ON "booking_payments" USING btree ("checkout_session_id");--> statement-breakpoint
CREATE INDEX "booking_payments_practice_idx" ON "booking_payments" USING btree ("practice_id","created_at");--> statement-breakpoint
CREATE INDEX "booking_payments_consultation_idx" ON "booking_payments" USING btree ("practice_id","consultation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_accounts_stripe_idx" ON "payment_accounts" USING btree ("stripe_account_id");