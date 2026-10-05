import { describe, expect, it } from "vitest";
import { botIdFromToken, isValidBotToken } from "./token.js";

describe("bot tokens", () => {
  it("accepts a BotFather token and extracts the bot id", () => {
    const token = "123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw";
    expect(isValidBotToken(token)).toBe(true);
    expect(botIdFromToken(` ${token} `)).toBe(123456789);
  });

  it.each(["", "abc", "123456789", "123456789:short", "abc:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"])(
    "rejects %j",
    (token) => {
      expect(isValidBotToken(token)).toBe(false);
      expect(() => botIdFromToken(token)).toThrow();
    },
  );
});
