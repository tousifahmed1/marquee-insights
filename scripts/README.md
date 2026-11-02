# scripts

Seed scripts and other one-off tooling.

- `seed-content/`: writes site settings, pages and reports to Sanity. Run `pnpm seed:content` after `pnpm dlx sanity@latest login`; it uses your CLI login, so no write token is needed. Safe to re-run: documents have fixed IDs and are replaced.
