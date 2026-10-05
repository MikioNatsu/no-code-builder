# Telegram Bot Builder: Project Plan (Draft v0.1)

> **Status:** draft built from the first 48 questions. Items marked **[CONFIRM]** are assumptions or readings of short answers. Items marked **[VERIFY]** are facts to double-check before launch.
> **Project name:** TBD

---

## 1. Vision

A website where **non-technical people build any Telegram bot without coding**, starting from ready templates, rearranging them on a visual flow canvas, and (later) adding custom code. Every bot comes with its own built-in database, an auto-generated admin panel, multi-language support, and payments.

**Promise to the user:** "Describe what you want, pick a template, click a few things, and your bot is live."

## 2. Definition of done for the MVP (the test case)

> A non-coder builds a working **anime/movie bot** with multiple languages and a `/admin` panel, **without writing code**.

The MVP is done when one real person can do this end to end, starting from a template, in a reasonable time (target: under 1 hour for a first small version).

## 3. Key decisions so far

| Topic | Decision |
|---|---|
| Main user | Non-technical people (no-code first) |
| Product form | Website with a visual builder (a "builder bot" inside Telegram may come later) |
| Building modes | Templates + flow editor + custom code, **all usable together**; one bot = one shared definition |
| Hosting | We host bots; users can also export (export is post-MVP) **[CONFIRM]** |
| Connecting a bot | User pastes the BotFather token |
| Sign-up | Login with Telegram only |
| Website languages | Uzbek (Latin only), Russian, English |
| Multiple bots per account | Yes, with limits on the free plan |
| Free plan | 1 bot, up to **500 end users per bot** |
| Paid plans | Tiers TBD; activated manually at first **[CONFIRM]** |
| Telegram coverage | Goal: every Bot API feature, delivered in layers (see 5.2) |
| Dev setup | Solo builder, Claude Code Pro, about 8 hours per day |
| Server | VPS in Germany, 12 GB RAM, 1 TB SSD **[CONFIRM specs]** |
| Stack | TypeScript everywhere |

## 4. Users and roles

**Platform level**
- **Bot owner:** signs up on the website, creates and manages bots.
- **Platform admin:** owner panel to activate plans, suspend bots, and handle abuse reports.

**Inside each bot** (same powers in the website dashboard and in Telegram `/admin`)
- **Owner:** everything, including billing and deleting the bot.
- **Admin:** manage content, users, broadcasts, subscriptions, stats.
- **Moderator:** manage content and ban users.
- **End user:** whoever chats with the bot.

## 5. Product scope

### 5.1 Website

1. Login with Telegram.
2. Dashboard with a list of the user's bots, and a plan/limits indicator.
3. Create-bot flow: paste token, choose template, set languages.
4. **Easy mode:** template settings as simple forms (texts, buttons, prices) **[CONFIRM]**.
5. **Flow editor:** visual canvas of blocks and connections for advanced changes.
6. **Content manager:** the built-in database as friendly tables (add, edit, delete, bulk import).
7. Texts editor with **uz / ru / en tabs**; owners type translations themselves.
8. Broadcasts, users list, conversation history, statistics.
9. "Test bot" mode: run a draft version on a separate test token before publishing.
10. Billing page (manual activation first).

### 5.2 Telegram coverage strategy

"Every Telegram feature" is a long-term goal. One person cannot hand-build every screen, so:

- **Layer 1 (hand-made, polished):** messages, inline buttons, reply keyboards, photos/videos/files, broadcasts, deep links, channel-join checks, Stars payments, polls/quizzes, scheduled posts.
- **Layer 2 (auto-generated):** a basic block for every Bot API method, generated from Telegram's Bot API documentation (parsed into a machine-readable spec). Every feature works from day one as a plain form and gets polished later by popularity.
- **Layer 3 (later):** Mini Apps, inline mode, Business mode, group/channel management extras.
- Anything the Bot API cannot do, we cannot offer.

### 5.3 Bot definition (the core idea)

Every bot is stored as **one structured definition** (JSON) containing:
- settings and languages
- database tables (schema)
- flows (blocks + connections)
- texts per language
- roles and access rules
- plan and limits

Templates, the easy mode, the flow editor, custom code, and the future AI builder all read and write this same definition. That is what lets all modes work together.

### 5.4 Built-in database for every bot

The owner defines tables with simple forms (for example Titles, Episodes, Users, Orders). The `/admin` panel and the website content manager are **generated automatically** from these tables. Includes: field types, relations, search, filters, import from CSV/Excel, export.

### 5.5 Languages

- Website: uz (Latin), ru, en.
- Each bot: owner selects which languages it supports; every text has a tab per language, filled in by the owner. The bot detects the user's Telegram language and lets them switch.
- Content can have **many language versions** (see the anime template); the owner needs good UX for adding them.

### 5.6 Payments

- **Digital goods and services in bots (premium access, subscriptions) must be paid in Telegram Stars** (currency XTR). This is a Telegram rule, so the subscription features are built on Stars. **[VERIFY]** how smoothly Stars can be withdrawn from Uzbekistan.
- **Physical goods (shop template):** Telegram payment providers where supported, or manual confirmation / cash on delivery **[VERIFY]** whether Payme and Click appear as providers in BotFather.
- Each bot owner connects **their own** merchant account or Stars balance. We never collect and pay out end customers' money.
- Payment blocks automatically include the `/paysupport`, `/support`, and `/terms` commands that Telegram expects **[VERIFY]**.
- Our own plans: manual activation at first; automatic payments later.

### 5.7 AI

- **Knowledge-base bot:** answers from the owner's own documents (post-MVP, early).
- **AI builder:** "make me an anime bot in 3 languages" generates a bot definition. Planned **right after the MVP**, because it needs a stable definition format first.

## 6. Templates

**MVP templates**
1. **Anime / movie bot** (the test case, details in section 7)
2. **Subscriptions and paid access** (Stars-based)
3. **Shop / orders**
4. **Admin panel module:** reusable and attached to the templates above, not a separate bot.

**Later templates:** customer support/FAQ, booking/appointments, lead collection, quiz/survey, channel auto-posting, group moderation, AI assistant.

## 7. Anime / movie template

**Features (all included):** search, genres, episode lists, "continue watching", favorites, ratings, comments, new-episode alerts, random pick, referral links, required-channel subscription, premium content.

**Content model**
- Title → Seasons (optional) → Episodes → **Versions** (language, dub or subtitles, quality, `file_id` or external link).
- Supporting data: Genres, Users, Favorites, Ratings, Comments, Watch progress, Subscriptions, Payments, Required channels, Referrals.

**Access rules:** each title or episode can be free or premium. Premium is unlocked by an active subscription (weekly / monthly / lifetime) or a single purchase, paid in Stars. **[CONFIRM]**

**Adding content (owner UX)**
1. Owner forwards videos to a private channel or to the bot. The platform registers the file IDs automatically.
2. Owner fills in titles, descriptions, languages in the content manager.
3. Second way: bulk import from a spreadsheet.

**Videos:** stored on Telegram's servers; we store file IDs, with external links as a second option. Files over 50 MB need our **own Bot API server** (raises the upload limit to 2000 MB).

**`/admin` in Telegram:** add/edit/delete content, broadcasts, stats, ban users, manage subscriptions, export users.

**Default stats:** new and active users per day/week, top titles and episodes, views, income in Stars, user growth by language, retention. **[CONFIRM]**

## 8. Plans and limits

| | Free | Paid (TBD) |
|---|---|---|
| Bots | 1 | more |
| End users per bot | 500 | higher tiers |
| Behavior at the limit | **[CONFIRM]**: new users blocked, owner prompted to upgrade | |
| Custom code | later | later |

Prices and tier names are still open.

## 9. Technical architecture

**Stack:** Next.js (website), Node.js + grammY (bot engine), PostgreSQL, Redis, React Flow (canvas), a self-hosted Telegram Bot API server, Docker on the VPS.

**How bots run**
- One multi-tenant engine serves all bots through webhooks, with each bot's definition loaded from the database. This is cheaper and simpler than one process per bot.
- A job queue handles broadcasts and scheduled posts with Telegram's rate limits in mind.
- Bot tokens are **encrypted at rest**. Webhook URLs use secret paths/tokens.
- Every database row is scoped by bot ID. Cross-bot access must be impossible.
- Rate limiting per bot, audit log for admin actions, automatic backups (database dump to external storage).
- Custom code (post-MVP) runs in an isolated sandbox only.

**Server notes**
- The 1 TB SSD mostly holds the database, backups, and temporary upload files, because video lives on Telegram.
- Moving a bot between Telegram's cloud API and our local Bot API server requires a logout step, so choose one early. The plan is local from the start.

## 10. Legal and risk notes

- **Uzbek data law:** a recent amendment lets most personal data be stored abroad under conditions, while biometric, genetic, and telecom-related data must stay in-country. Our data is ordinary, but **[VERIFY]** with a local lawyer before launch.
- **Copyright:** users may upload content they don't own. Minimum safeguards: a clause in the terms, an abuse email address, a one-click "suspend this bot" in the owner panel. A hosting complaint could take down the whole server, so this protects every customer.
- **Terms of service and privacy policy** in uz / ru / en before the public launch.
- **Telegram rules:** follow Telegram's bot terms (spam limits, payment rules), or bots get banned.
- Do not store anything unnecessary about end users.

## 11. Roadmap (rough estimates)

Based on about 8 hours per day with AI-assisted coding. Claude Code Pro usage limits may slow some days. Expect roughly **3 months** for the MVP, give or take.

| Phase | What | Rough time |
|---|---|---|
| 0 | Project setup, server, domain, CI, CLAUDE.md, database design | Week 1 |
| 1 | Login with Telegram, accounts, connect bot token, engine skeleton with webhooks, local Bot API server | Weeks 2–3 |
| 2 | Bot definition format, core blocks, built-in database and content manager | Weeks 4–6 |
| 3 | Flow editor (canvas), easy mode, texts in 3 languages, test mode | Weeks 6–8 |
| 4 | Anime template + generated `/admin` + broadcasts + stats | Weeks 8–10 |
| 5 | Stars payments, subscriptions template, shop template | Weeks 10–12 |
| 6 | Hardening: security review, backups, limits, abuse tools, beta with real users | Weeks 12–14 |

**After the MVP:** AI builder, knowledge-base bot, custom code blocks, Mini Apps, more templates, automatic payments for our plans, template marketplace, export/self-host.

## 12. Working with Claude Code (tips)

- Keep a `CLAUDE.md` in the repo with the stack, rules, and folder layout, so every session starts with the same context.
- Work in small tasks, one feature per session, and commit after each.
- Write tests for the engine and for permission rules (these must not break silently).
- Let the Bot API spec drive code generation for Layer 2 blocks.
- Plan heavy sessions around usage limits.

## 13. Open questions

- Project name and domain
- Paid tiers: number, limits, prices
- Easy mode vs flow editor: how much the template owner sees by default
- Broadcast segments (by language, premium/free, activity)
- Shop template: physical only, digital too, which payment methods
- Support for the platform's own customers (idea: a support bot built with the platform itself)
- Exact server specs

## 14. Decision log (answers, condensed)

| # | Topic | Answer |
|---|---|---|
| 1 | User | Non-technical |
| 2 | Product | Website |
| 3 | Builder | Templates, then flow editor, then code |
| 4 | Hosting | Both (we host, export too) |
| 5 | Token | Paste BotFather token |
| 6, 14 | Templates | Anime/movie, admin panel, subscriptions, shop first |
| 7, 15 | Coverage | Everything Telegram allows, in layers |
| 9 | AI | Yes |
| 10 | Money | Free + paid tiers |
| 11 | Languages | Uzbek, Russian, English |
| 12 | Resources | Solo + Claude Code Pro |
| 13 | Modes | All usable together |
| 16 | Dashboard | Yes, plus notifications in Telegram |
| 17 | Multiple bots | Yes, with free-plan limits |
| 20 | Login | Telegram only |
| 21 | Customer payments | Owner's own merchant account |
| 24 | Done | Anime bot, multi-language, `/admin`, no coding |
| 25 | Database | Built-in per bot |
| 26 | Videos | Telegram file IDs + links, own Bot API server |
| 27 | Copyright | Minimal safeguards |
| 28 | Subscriptions | Channel join and paid premium |
| 30 | Admin actions | All |
| 31 | Translations | Owners type them |
| 32 | Uzbek | Latin only |
| 37 | Free limit | 1 bot, end-user cap |
| 38 | Server | Germany, 1 TB SSD, 12 GB RAM |
| 39 | Server specs | Confirmed |
| 40 | Free end users | 500 per bot |
| 41 | Languages in content | Many versions per episode, good UX needed |
| 42 | Anime features | All |
| 43 | Adding content | Forward videos + bulk import |
| 46 | Mini Apps | Later |
| 47 | First testers | Found by the project owner |
| 48 | Time | 8 hours/day |
