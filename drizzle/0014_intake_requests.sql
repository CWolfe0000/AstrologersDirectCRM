CREATE TABLE "intake_requests" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intake_requests_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
ALTER TABLE "intake_requests" ADD CONSTRAINT "intake_requests_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "intake_requests_client_idx" ON "intake_requests" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "intake_requests_updated_idx" ON "intake_requests" USING btree ("practice_id","updated_at");