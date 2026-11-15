CREATE TABLE "activity" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charts" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "charts_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultations_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "files_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "observations_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "portal_notifications" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_notifications_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "practice_settings" (
	"practice_id" text PRIMARY KEY NOT NULL,
	"practitioner" jsonb NOT NULL,
	"defaults" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practices" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readings" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "readings_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recordings_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"practice_id" text NOT NULL,
	"id" text NOT NULL,
	"client_id" text,
	"data" jsonb NOT NULL,
	"sealed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_practice_id_id_pk" PRIMARY KEY("practice_id","id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"practice_id" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"client_id" text,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charts" ADD CONSTRAINT "charts_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_notifications" ADD CONSTRAINT "portal_notifications_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_settings" ADD CONSTRAINT "practice_settings_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_client_idx" ON "activity" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "auth_tokens_user_idx" ON "auth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "charts_client_idx" ON "charts" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "clients_client_idx" ON "clients" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "consultations_client_idx" ON "consultations" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "files_client_idx" ON "files" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "notifications_client_idx" ON "notifications" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "observations_client_idx" ON "observations" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "people_client_idx" ON "people" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "portal_notifications_client_idx" ON "portal_notifications" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "readings_client_idx" ON "readings" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "recordings_client_idx" ON "recordings" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_client_idx" ON "tasks" USING btree ("practice_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_practice_idx" ON "users" USING btree ("practice_id");