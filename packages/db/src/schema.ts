import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { BotDefinition } from "@ncb/core";

// Telegram user and chat IDs fit in 52 bits, so they are safe as JS numbers.
const telegramId = (name: string) => bigint(name, { mode: "number" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const websiteLanguage = pgEnum("website_language", ["uz", "ru", "en"]);
export const planId = pgEnum("plan_id", ["free"]);
export const botStatus = pgEnum("bot_status", ["active", "paused", "suspended"]);
export const botRole = pgEnum("bot_role", ["owner", "admin", "moderator"]);
export const definitionStatus = pgEnum("definition_status", ["draft", "published", "archived"]);

/** People who log in to the website (Login with Telegram). */
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegramId: telegramId("telegram_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  username: text("username"),
  photoUrl: text("photo_url"),
  language: websiteLanguage("language").notNull().default("uz"),
  plan: planId("plan").notNull().default("free"),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** A Telegram bot connected by its owner. Tokens are stored encrypted (see @ncb/core crypto). */
export const bots = pgTable(
  "bots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerAccountId: uuid("owner_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    telegramBotId: telegramId("telegram_bot_id").notNull().unique(),
    username: text("username").notNull(),
    tokenEncrypted: text("token_encrypted").notNull(),
    /** Secret used in the webhook URL path and as Telegram's secret_token header. */
    webhookSecret: text("webhook_secret").notNull().unique(),
    /** Optional second bot used to run the draft definition ("Test bot" mode). */
    testTokenEncrypted: text("test_token_encrypted"),
    testWebhookSecret: text("test_webhook_secret").unique(),
    status: botStatus("status").notNull().default("active"),
    suspendedReason: text("suspended_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("bots_owner_idx").on(t.ownerAccountId)],
);

/** Versioned bot definitions. At most one published and one draft per bot. */
export const botDefinitions = pgTable(
  "bot_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: definitionStatus("status").notNull(),
    definition: jsonb("definition").$type<BotDefinition>().notNull(),
    createdByAccountId: uuid("created_by_account_id").references(() => accounts.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("bot_definitions_version_uq").on(t.botId, t.version),
    uniqueIndex("bot_definitions_one_published_uq").on(t.botId).where(sql`${t.status} = 'published'`),
    uniqueIndex("bot_definitions_one_draft_uq").on(t.botId).where(sql`${t.status} = 'draft'`),
  ],
);

/** Staff of a bot, identified by Telegram user ID so they can use /admin without a website account. */
export const botMembers = pgTable(
  "bot_members",
  {
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    telegramUserId: telegramId("telegram_user_id").notNull(),
    role: botRole("role").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.botId, t.telegramUserId] })],
);

/** People who chat with a bot. Store only what the bot needs. */
export const endUsers = pgTable(
  "end_users",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    telegramUserId: telegramId("telegram_user_id").notNull(),
    firstName: text("first_name").notNull(),
    username: text("username"),
    /** Language the user picked in the bot; falls back to their Telegram language. */
    language: text("language"),
    isBanned: boolean("is_banned").notNull().default(false),
    /** Set when Telegram reports the user blocked the bot; skipped in broadcasts. */
    hasBlockedBot: boolean("has_blocked_bot").notNull().default(false),
    referredByEndUserId: bigint("referred_by_end_user_id", { mode: "number" }),
    createdAt: createdAt(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("end_users_bot_user_uq").on(t.botId, t.telegramUserId),
    index("end_users_bot_created_idx").on(t.botId, t.createdAt),
  ],
);

/**
 * Rows of each bot's built-in database (docs/PLAN.md §5.4).
 * Tables and fields are defined in the bot definition; values live here as JSON keyed by field id.
 */
export const tableRows = pgTable(
  "table_rows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    tableId: text("table_id").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("table_rows_bot_table_idx").on(t.botId, t.tableId, t.createdAt),
    index("table_rows_data_gin_idx").using("gin", t.data),
  ],
);

/** Who did what: admin actions on the website, in /admin, and by the platform admin. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    botId: uuid("bot_id").references(() => bots.id, { onDelete: "cascade" }),
    actorTelegramId: telegramId("actor_telegram_id"),
    action: text("action").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("audit_log_bot_created_idx").on(t.botId, t.createdAt)],
);
