CREATE TABLE "booking_holds" (
	"practice_id" text NOT NULL,
	"block" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_holds_practice_id_block_pk" PRIMARY KEY("practice_id","block")
);
--> statement-breakpoint
CREATE TABLE "booking_profiles" (
	"practice_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"enabled" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_holds" ADD CONSTRAINT "booking_holds_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_profiles" ADD CONSTRAINT "booking_profiles_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_profiles_slug_idx" ON "booking_profiles" USING btree ("slug");