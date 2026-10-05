import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, generateWebhookSecret, parseEncryptionKey } from "./crypto.js";

const key = randomBytes(32);

describe("token encryption", () => {
  it("round-trips a token", () => {
    const token = "123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw";
    const encrypted = encryptSecret(token, key);
    expect(encrypted).not.toContain(token);
    expect(decryptSecret(encrypted, key)).toBe(token);
  });

  it("uses a fresh IV every time", () => {
    expect(encryptSecret("same", key)).not.toBe(encryptSecret("same", key));
  });

  it("rejects a wrong key", () => {
    const encrypted = encryptSecret("secret", key);
    expect(() => decryptSecret(encrypted, randomBytes(32))).toThrow();
  });

  it("rejects tampered ciphertext", () => {
    const [v, iv, tag, data] = encryptSecret("secret", key).split(":");
    const flipped = Buffer.from(data!, "base64");
    flipped[0] = flipped[0]! ^ 1;
    expect(() => decryptSecret([v, iv, tag, flipped.toString("base64")].join(":"), key)).toThrow();
  });

  it("validates the key", () => {
    expect(() => parseEncryptionKey(undefined)).toThrow(/not set/);
    expect(() => parseEncryptionKey(randomBytes(16).toString("base64"))).toThrow(/32 bytes/);
    expect(parseEncryptionKey(key.toString("base64"))).toEqual(key);
  });

  it("generates url-safe webhook secrets", () => {
    const secret = generateWebhookSecret();
    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateWebhookSecret()).not.toBe(secret);
  });
});
