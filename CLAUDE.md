# CLAUDE.md

No-code Telegram bot builder. The full product plan is in `docs/PLAN.md`; read it before starting a feature.

## Status

Planning stage. No application code yet. Next step is Phase 0 (project setup) from the roadmap in `docs/PLAN.md` §11.

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
- Every row of per-bot data is scoped by bot ID. Cross-bot access must be impossible.
- Bot tokens are encrypted at rest. Webhook URLs use secret paths/tokens.
- Website languages: Uzbek (Latin only), Russian, English.
- Digital goods and subscriptions inside bots are paid in Telegram Stars (XTR).
- Write tests for the engine and for permission rules.
- Small tasks, one feature per session, commit after each.
