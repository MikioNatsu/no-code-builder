import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const env = {
  DATABASE_URL: "postgres://x",
  REDIS_URL: "redis://x",
  BOT_API_URL: "http://localhost:8081",
  PUBLIC_WEBHOOK_BASE_URL: "https://example.com",
  TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
};

describe("loadConfig", () => {
  it("reads the environment", () => {
    expect(loadConfig(env).port).toBe(3001);
    expect(loadConfig({ ...env, ENGINE_PORT: "4000" }).port).toBe(4000);
  });

  it("fails fast on missing values", () => {
    expect(() => loadConfig({ ...env, DATABASE_URL: "" })).toThrow("DATABASE_URL is not set");
    expect(() => loadConfig({ ...env, TOKEN_ENCRYPTION_KEY: undefined })).toThrow(/TOKEN_ENCRYPTION_KEY/);
  });
});
