# Working with Claude Code

The project was built with Claude Code as the main pair. What kept it productive:

- **`CLAUDE.md` holds the rules, not just the commands:** folder boundaries, the server-rendering rule, the caching rules and why they exist, the security rules, and gotchas found along the way (for example, Recharts 3 renders nothing on the server). When something goes wrong, the fix and its reason go into `CLAUDE.md`.
- **`pnpm verify` is the definition of done:** typecheck (including Sanity typegen), lint, the unit tests and the Playwright suite. A task is not finished until it passes, and a check is never weakened to make it pass.
- **Each feature is a numbered step that stops for review, and each step is its own commit.**
- **Deploys and secrets stay with a person.** Secrets are never printed; they move from `.env` straight to Wrangler.
- **`pnpm check:prod` runs after every deploy,** because local and production can disagree.

## A lesson: the secret that was set but empty

After the first deploy, `/explore` returned 500 with `DATABASE_URL is not set`, although `wrangler secret list` showed the secret. The agent assumed `process.env` was empty on Workers, rewrote every secret read, and confirmed the fix in a local production build, where the old code had also worked. The deploy still failed.

The secrets existed by name but held empty strings, from an interactive `wrangler secret put` prompt that received nothing. Re-uploading them with `wrangler secret bulk` fixed it at once.

What changed: secrets are uploaded from `.env` with `wrangler secret bulk`, `pnpm check:prod` runs after every deploy, and `CLAUDE.md` says to check a secret's value before changing code. When something works locally and fails in production, compare the environments before rewriting.
