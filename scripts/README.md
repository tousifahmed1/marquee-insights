# scripts

Seed scripts and other one-off tooling.

- `seed-content/`: writes site settings, pages and reports to Sanity. Run `pnpm seed:content` after `pnpm dlx sanity@latest login`; it uses your CLI login, so no write token is needed. Safe to re-run: documents have fixed IDs and are replaced.
- `seed.ts` and `survey-data/`: clears and reloads the Neon survey data (40 fictional shows, 50,000 responses over the last 12 complete months). Run `pnpm seed` after `pnpm db:migrate`; it needs `DATABASE_URL` in `.env`. Generation uses a fixed random seed, so the numbers only change when the months roll over. Everything runs in one transaction, so a failed run leaves the old data in place.
