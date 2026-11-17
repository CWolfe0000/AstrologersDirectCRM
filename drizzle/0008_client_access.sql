CREATE TABLE "client_access" (
	"user_id" text NOT NULL,
	"practice_id" text NOT NULL,
	"client_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_access_user_id_practice_id_pk" PRIMARY KEY("user_id","practice_id")
);
--> statement-breakpoint
ALTER TABLE "client_access" ADD CONSTRAINT "client_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_access" ADD CONSTRAINT "client_access_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_access_client_idx" ON "client_access" USING btree ("practice_id","client_id");--> statement-breakpoint
INSERT INTO "client_access" ("user_id", "practice_id", "client_id") SELECT "id", "practice_id", "client_id" FROM "users" WHERE "role" = 'client' AND "client_id" IS NOT NULL ON CONFLICT DO NOTHING;
