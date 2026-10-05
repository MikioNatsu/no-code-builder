import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Encrypts secrets (bot tokens) at rest with AES-256-GCM.
// Stored format: "v1:<iv>:<authTag>:<ciphertext>", each part base64.

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";
const IV_BYTES = 12;

export function parseEncryptionKey(base64Key: string | undefined): Buffer {
  if (!base64Key) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  }
  return key;
}

export function encryptSecret(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptSecret(encrypted: string, key: Buffer): string {
  const [version, iv, tag, ciphertext] = encrypted.split(":");
  if (version !== VERSION || !iv || !tag || ciphertext === undefined) {
    throw new Error("Unsupported encrypted secret format");
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
}

/** Random URL-safe secret for webhook paths and Telegram's secret_token header. */
export function generateWebhookSecret(): string {
  return randomBytes(32).toString("base64url");
}
