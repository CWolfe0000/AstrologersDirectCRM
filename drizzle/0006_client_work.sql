CREATE TABLE "client_work" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_work_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "work_responses" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_responses_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
ALTER TABLE "client_work" ADD CONSTRAINT "client_work_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_responses" ADD CONSTRAINT "work_responses_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_work_client_idx" ON "client_work" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "client_work_updated_idx" ON "client_work" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "work_responses_client_idx" ON "work_responses" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "work_responses_updated_idx" ON "work_responses" USING btree ("practice_id","updated_at");