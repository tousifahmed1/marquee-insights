# Ask the data evaluation

`cases.ts` holds 20 questions with hand-written reference SQL and 4 questions that must be refused.

```bash
pnpm eval:ask                      # both providers, Gemini first (the production order)
pnpm eval:ask --provider gemini    # one provider only
pnpm eval:ask --provider groq
pnpm eval:ask --only-failed        # rerun the failures from the last run
pnpm eval:ask --check              # run only the reference SQL, no model calls
```

The runner bypasses the cache, so every case costs a model call (two if the first SQL is rejected). It paces itself to the providers' free per-minute limits and prints the score, every mismatch and the number of model calls used. Rows are compared after normalising: numbers to one decimal (a fraction also matches its percentage), dates to year and month, text case-insensitively; the model's row may carry extra columns, the reference row's values must all be present. The last run's failures are kept in `.last-run-<provider>.json`.
