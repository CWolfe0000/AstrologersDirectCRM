CREATE TABLE "observation_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"observation_id" text NOT NULL,
	"sealed" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tombstones" (
	"practice_id" text NOT NULL,
	"collection" text NOT NULL,
	"id" text NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tombstones_practice_id_collection_id_pk" PRIMARY KEY("practice_id","collection","id")
);
--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "charts" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_notifications" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "readings" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "recordings" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "observation_snapshots" ADD CONSTRAINT "observation_snapshots_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tombstones" ADD CONSTRAINT "tombstones_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "observation_snapshots_obs_idx" ON "observation_snapshots" USING btree ("practice_id","observation_id","created_at");--> statement-breakpoint
CREATE INDEX "tombstones_deleted_idx" ON "tombstones" USING btree ("practice_id","deleted_at");--> statement-breakpoint
CREATE INDEX "activity_updated_idx" ON "activity" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "charts_updated_idx" ON "charts" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "clients_updated_idx" ON "clients" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "consultations_updated_idx" ON "consultations" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "files_updated_idx" ON "files" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "notifications_updated_idx" ON "notifications" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "observations_updated_idx" ON "observations" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "people_updated_idx" ON "people" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "portal_notifications_updated_idx" ON "portal_notifications" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "readings_updated_idx" ON "readings" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "recordings_updated_idx" ON "recordings" USING btree ("practice_id","updated_at");--> statement-breakpoint
CREATE INDEX "tasks_updated_idx" ON "tasks" USING btree ("practice_id","updated_at");