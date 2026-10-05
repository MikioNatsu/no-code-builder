# no-code-builder

Build Telegram bots without code: templates, a visual flow editor, a built-in database and an auto-generated `/admin` panel for every bot.

See [`docs/PLAN.md`](docs/PLAN.md) for the product plan and [`CLAUDE.md`](CLAUDE.md) for the code layout.

## Run locally

```sh
cp .env.example .env              # fill in passwords, TOKEN_ENCRYPTION_KEY, Telegram API id/hash
docker compose up -d postgres redis bot-api
pnpm install
pnpm build
pnpm db:migrate
pnpm dev:web                      # http://localhost:3000
pnpm dev:engine                   # http://localhost:3001/health
```
