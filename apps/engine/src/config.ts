import { parseEncryptionKey } from "@ncb/core";

export interface EngineConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  botApiUrl: string;
  publicWebhookBaseUrl: string;
  tokenEncryptionKey: Buffer;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): EngineConfig {
  const required = (name: string): string => {
    const value = env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
  };
  return {
    port: Number(env.ENGINE_PORT ?? 3001),
    databaseUrl: required("DATABASE_URL"),
    redisUrl: required("REDIS_URL"),
    botApiUrl: required("BOT_API_URL"),
    publicWebhookBaseUrl: required("PUBLIC_WEBHOOK_BASE_URL"),
    tokenEncryptionKey: parseEncryptionKey(env.TOKEN_ENCRYPTION_KEY),
  };
}
