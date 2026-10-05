CREATE TYPE "public"."bot_role" AS ENUM('owner', 'admin', 'moderator');--> statement-breakpoint
CREATE TYPE "public"."bot_status" AS ENUM('active', 'paused', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."definition_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."plan_id" AS ENUM('free');--> statement-breakpoint
CREATE TYPE "public"."website_language" AS ENUM('uz', 'ru', 'en');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" bigint NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"username" text,
	"photo_url" text,
	"language" "website_language" DEFAULT 'uz' NOT NULL,
	"plan" "plan_id" DEFAULT 'free' NOT NULL,
	"plan_expires_at" timestamp with time zone,
	"is_platform_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"bot_id" uuid,
	"actor_telegram_id" bigint,
	"action" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" "definition_status" NOT NULL,
	"definition" jsonb NOT NULL,
	"created_by_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bot_members" (
	"bot_id" uuid NOT NULL,
	"telegram_user_id" bigint NOT NULL,
	"role" "bot_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bot_members_bot_id_telegram_user_id_pk" PRIMARY KEY("bot_id","telegram_user_id")
);
--> statement-breakpoint
CREATE TABLE "bots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"telegram_bot_id" bigint NOT NULL,
	"username" text NOT NULL,
	"token_encrypted" text NOT NULL,
	"webhook_secret" text NOT NULL,
	"test_token_encrypted" text,
	"test_webhook_secret" text,
	"status" "bot_status" DEFAULT 'active' NOT NULL,
	"suspended_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bots_telegram_bot_id_unique" UNIQUE("telegram_bot_id"),
	CONSTRAINT "bots_webhook_secret_unique" UNIQUE("webhook_secret"),
	CONSTRAINT "bots_test_webhook_secret_unique" UNIQUE("test_webhook_secret")
);
--> statement-breakpoint
CREATE TABLE "end_users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"bot_id" uuid NOT NULL,
	"telegram_user_id" bigint NOT NULL,
	"first_name" text NOT NULL,
	"username" text,
	"language" text,
	"is_banned" boolean DEFAULT false NOT NULL,
	"has_blocked_bot" boolean DEFAULT false NOT NULL,
	"referred_by_end_user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "table_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_id" uuid NOT NULL,
	"table_id" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_definitions" ADD CONSTRAINT "bot_definitions_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_definitions" ADD CONSTRAINT "bot_definitions_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_members" ADD CONSTRAINT "bot_members_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "end_users" ADD CONSTRAINT "end_users_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_rows" ADD CONSTRAINT "table_rows_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_bot_created_idx" ON "audit_log" USING btree ("bot_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bot_definitions_version_uq" ON "bot_definitions" USING btree ("bot_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "bot_definitions_one_published_uq" ON "bot_definitions" USING btree ("bot_id") WHERE "bot_definitions"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "bot_definitions_one_draft_uq" ON "bot_definitions" USING btree ("bot_id") WHERE "bot_definitions"."status" = 'draft';--> statement-breakpoint
CREATE INDEX "bots_owner_idx" ON "bots" USING btree ("owner_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "end_users_bot_user_uq" ON "end_users" USING btree ("bot_id","telegram_user_id");--> statement-breakpoint
CREATE INDEX "end_users_bot_created_idx" ON "end_users" USING btree ("bot_id","created_at");--> statement-breakpoint
CREATE INDEX "table_rows_bot_table_idx" ON "table_rows" USING btree ("bot_id","table_id","created_at");--> statement-breakpoint
CREATE INDEX "table_rows_data_gin_idx" ON "table_rows" USING gin ("data");