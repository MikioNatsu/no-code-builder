# CLAUDE.md

No-code Telegram bot builder. The full product plan is in `docs/PLAN.md`; read it before starting a feature.

## Status

Phase 0 (project setup) done. Next: Phase 1 from the roadmap in `docs/PLAN.md` §11 (Login with Telegram, connect bot token, webhook routing in the engine).

## Layout

pnpm workspace, Node 22, TypeScript 6, ESM.

- `packages/core`: shared logic with no I/O: bot definition schema (`definition.ts`, zod), token encryption (`crypto.ts`), BotFather token parsing (`token.ts`), plan limits (`plans.ts`).
- `packages/db`: Drizzle ORM schema (`schema.ts`), client, migrations in `migrations/`.
- `apps/engine`: multi-tenant bot engine (grammY), one HTTP server for all bots' webhooks.
- `apps/web`: Next.js website (App Router).
- `docker-compose.yml`: PostgreSQL, Redis, self-hosted Bot API server.

Workspace packages export `src/*.ts` for types and `dist/*.js` at runtime, so run `pnpm build` before running the apps.

## Commands

- `pnpm install`, `pnpm build`, `pnpm typecheck`, `pnpm test`
- `pnpm dev:web`, `pnpm dev:engine`
- `pnpm db:generate` after changing `packages/db/src/schema.ts` (never hand-edit migrations), then `pnpm db:migrate`
- Database tests run only when `TEST_DATABASE_URL` points to a throwaway database; CI sets it.

## Planned stack

- TypeScript everywhere
- Website: Next.js
- Bot engine: Node.js + grammY, one multi-tenant process serving all bots over webhooks
- Database: PostgreSQL; queue/cache: Redis
- Flow canvas: React Flow
- Self-hosted Telegram Bot API server
- Docker on a single VPS (Germany)

## Rules

- Every bot is one JSON **bot definition** (settings, tables, flows, texts, roles, limits). Templates, easy mode, the flow editor, custom code, and the AI builder all read and write that same definition.
- Plan and limits live on the account in the database, not in the definition, so definitions can be copied between bots.
- The built-in database stores rows in `table_rows` as JSON keyed by field id; the tables and fields themselves are defined in the bot definition.
- Every row of per-bot data is scoped by bot ID. Cross-bot access must be impossible.
- Bot tokens are encrypted at rest. Webhook URLs use secret paths/tokens.
- Website languages: Uzbek (Latin only), Russian, English.
- Digital goods and subscriptions inside bots are paid in Telegram Stars (XTR).
- Write tests for the engine and for permission rules.
- Small tasks, one feature per session, commit after each.
