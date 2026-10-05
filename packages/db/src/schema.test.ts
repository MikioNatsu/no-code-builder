import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { emptyBotDefinition } from "@ncb/core";
import { createDb } from "./client.js";
import { accounts, botDefinitions, bots, endUsers, tableRows } from "./schema.js";

// Integration tests against a real PostgreSQL. Set TEST_DATABASE_URL to a throwaway database.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("database schema", () => {
  const { db, sql: client } = createDb(url);

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)) });
  });
  beforeEach(async () => {
    await db.execute(sql`TRUNCATE accounts, bots, bot_definitions, bot_members, end_users, table_rows, audit_log CASCADE`);
  });
  afterAll(() => client.end());

  async function createBot(telegramBotId = 111) {
    const [account] = await db
      .insert(accounts)
      .values({ telegramId: 1000 + telegramBotId, firstName: "Owner" })
      .returning();
    const [bot] = await db
      .insert(bots)
      .values({
        ownerAccountId: account!.id,
        telegramBotId,
        username: `bot${telegramBotId}`,
        tokenEncrypted: "v1:x:y:z",
        webhookSecret: `secret-${telegramBotId}`,
      })
      .returning();
    return bot!;
  }

  it("stores and reads back a bot definition as JSON", async () => {
    const bot = await createBot();
    const definition = emptyBotDefinition();
    await db.insert(botDefinitions).values({ botId: bot.id, version: 1, status: "draft", definition });
    const [row] = await db.select().from(botDefinitions).where(eq(botDefinitions.botId, bot.id));
    expect(row?.definition).toEqual(definition);
  });

  it("allows only one published and one draft definition per bot", async () => {
    const bot = await createBot();
    const definition = emptyBotDefinition();
    await db.insert(botDefinitions).values([
      { botId: bot.id, version: 1, status: "published", definition },
      { botId: bot.id, version: 2, status: "draft", definition },
      { botId: bot.id, version: 3, status: "archived", definition },
    ]);
    await expect(
      db.insert(botDefinitions).values({ botId: bot.id, version: 4, status: "published", definition }),
    ).rejects.toThrow();
    await expect(
      db.insert(botDefinitions).values({ botId: bot.id, version: 5, status: "draft", definition }),
    ).rejects.toThrow();
  });

  it("keeps end users separate per bot", async () => {
    const a = await createBot(111);
    const b = await createBot(222);
    await db.insert(endUsers).values([
      { botId: a.id, telegramUserId: 42, firstName: "Ali" },
      { botId: b.id, telegramUserId: 42, firstName: "Ali" },
    ]);
    await expect(db.insert(endUsers).values({ botId: a.id, telegramUserId: 42, firstName: "Ali" })).rejects.toThrow();
  });

  it("deletes a bot's data when the bot is deleted", async () => {
    const bot = await createBot();
    await db.insert(endUsers).values({ botId: bot.id, telegramUserId: 42, firstName: "Ali" });
    await db.insert(tableRows).values({ botId: bot.id, tableId: "titles", data: { name: { uz: "Naruto" } } });
    await db.delete(bots).where(eq(bots.id, bot.id));
    expect(await db.select().from(endUsers)).toEqual([]);
    expect(await db.select().from(tableRows)).toEqual([]);
  });

  it("does not let an account with bots be deleted", async () => {
    const bot = await createBot();
    await expect(db.delete(accounts).where(eq(accounts.id, bot.ownerAccountId))).rejects.toThrow();
  });
});
