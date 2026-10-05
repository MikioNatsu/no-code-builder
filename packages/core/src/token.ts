// BotFather tokens look like "123456789:AAH...". The part before the colon is the bot's Telegram ID.
const TOKEN_PATTERN = /^(\d{5,16}):[A-Za-z0-9_-]{30,}$/;

export function isValidBotToken(token: string): boolean {
  return TOKEN_PATTERN.test(token.trim());
}

export function botIdFromToken(token: string): number {
  const match = TOKEN_PATTERN.exec(token.trim());
  if (!match?.[1]) {
    throw new Error("Invalid bot token");
  }
  return Number(match[1]);
}
