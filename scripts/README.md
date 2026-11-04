# scripts

Seed scripts and other one-off tooling.

- `seed-content/`: writes site settings, pages and reports to Sanity. Run `pnpm seed:content` after `pnpm dlx sanity@latest login`; it uses your CLI login, so no write token is needed. Safe to re-run: documents have fixed IDs and are replaced.
- `seed.ts` and `survey-data/`: clears and reloads the Neon survey data (the 40 fictional shows in `src/data/catalogue.ts`, 50,000 responses over the last 12 complete months). Run `pnpm seed` after `pnpm db:migrate`; it needs `DATABASE_URL` in `.env`. Generation uses a fixed random seed, so the numbers only change when the months roll over. Everything runs in one transaction, so a failed run leaves the old data in place.
- `check-production.ts`: requests every route on the live site (or the URL you pass) and checks the status, an h1, report links, server-rendered explorer rows and 404s. Prints `cache-control`, `x-cache` and `cf-placement` for each. Run `pnpm check:prod` after every deploy, or `pnpm check:prod http://localhost:3000` locally.
- `ask-prompt-tokens.ts`: counts the tokens in the Ask the data schema context and examples with the Gemini tokenizer. Run `pnpm ask:tokens` after editing `src/data/ask/schema-context.ts`; keep the total under about 2,000.
- `warm-ask.ts`: runs every Ask the data example question once through the live pipeline so the buttons on `/ask` answer from the cache. Run `pnpm warm:ask` after a deploy (pass a URL for another server) and `pnpm warm:ask --reset` after `pnpm seed`, which bumps the data version first. Needs `ASK_ADMIN_SECRET` in `.env`.
- `eval-ask.ts`: runs the Ask the data evaluation set in `tests/ask/` through the real pipeline and scores it against the reference SQL. `pnpm eval:ask [--provider gemini|groq] [--only-failed] [--check]`. Every case spends a model call from the same daily quota as visitors.
- `brand-icons.ts`: draws `public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png` and `logo.png` (used in the Organization JSON-LD) from one SVG mark. Run `pnpm exec tsx scripts/brand-icons.ts` after changing the mark.
