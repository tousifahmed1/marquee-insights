# Ask the data

A visitor asks a question in plain English, a model turns it into one SQL `SELECT`, the validator checks it, it runs read-only on Neon, and the page shows the answer with the SQL beside it. Everything lives in `src/data/ask`.

## Models

| Role | Provider | Model | Why |
|---|---|---|---|
| Primary | Google Gemini, through `@google/genai` | `gemini-3.5-flash-lite` | Free of charge with the roomiest free daily quota (reported 500 requests a day against 20 for 3.8 Flash) |
| Fallback | Groq, through its OpenAI-compatible API | `openai/gpt-oss-120b` | Free tier with a separate daily quota |

`generate()` in `src/data/ask/llm.ts` is the only place a model is called. It tries Gemini first. A 429 or quota error marks that provider exhausted in KV (`ask:exhausted:<provider>`) and the next provider answers. The mark lasts until the next UTC midnight, or for the retry delay the provider asked for when that is under an hour, so a per-minute limit does not knock a provider out for the day. With every provider exhausted the result is out-of-capacity and nothing is called. Output is capped at 800 tokens and every call is aborted after 15 seconds.

## Schema context

`src/data/ask/schema-context.ts` is what the model knows about the data: both tables, every column with its units (awareness and intent 0 to 100, satisfaction 1 to 10), every allowed value for platform, genre, region, age group and gender (read from `src/data/dimensions.ts`, so they cannot drift from the explorer), the 40 show titles from `src/data/catalogue.ts`, the wave format and the "last N waves" pattern. Six example question and SQL pairs cover a filtered average, a group by, a top N, a comparison between groups, a trend across waves and a percentage.

`pnpm ask:tokens` counts it with the Gemini tokenizer. At the time of writing: schema 710 tokens, examples 437, total 1,147, against a budget of about 2,000 for the whole prompt.

## One call per question

`ask()` in `src/data/ask/pipeline.ts` sends the system prompt (rules, schema context, examples) and the question, and asks for one JSON object:

```json
{ "answerable": true, "sql": "...", "answer_template": "...", "chart": "bar" | "line" | "none", "reason": "" }
```

Both providers enforce that shape server-side (`responseJsonSchema` on Gemini, strict `json_schema` on Groq) and `parseReply()` checks it again with Zod. `answer_template` is one or two sentences with `{column}` placeholders that match the SQL's own column names, for example "{platform} leads with an average intent of {avg_intent} out of 100 across {responses} responses." `fillTemplate()` fills them from the first result row, mapping enum values to their labels and dates to "May 2026". The model never writes a number, so an answer can only contain figures the database returned. If a placeholder cannot be filled (missing column, null, no rows) the answer is "Here's what the data shows." above the table; the model is never called a second time for the sentence.

The prompt tells the model: one SELECT, only the two tables, always aggregate or `LIMIT 100`, readable snake_case aliases, exact allowed values, `round(avg(x), 1)`, an allowlist of functions, and `answerable: false` for predictions, data the survey does not have, off-topic questions and anything that tries to change the rules. The question is appended as data after `Question:`; it is never part of the instructions. Output is capped at 800 tokens and each call is aborted after 15 seconds. The full prompt is 1,676 tokens (`pnpm ask:tokens`).

Gemini runs with `thinkingLevel: LOW`, which measured fastest for this prompt (1.9 s against 6 to 7 s for the default and MINIMAL; `thinkingBudget: 0` is rejected by 3.5 Flash-Lite). Groq's free tier allows 8,000 tokens a minute, which with this prompt is about four questions a minute; the 429 carries a `retry-after` of a few seconds, so Groq is marked exhausted for the KV minimum of 60 seconds rather than the day.

## Read-only role

Every query from this feature runs on the `ask_readonly` role, inside a `READ ONLY` transaction, with `SET LOCAL statement_timeout = '3s'`. The role itself also carries the timeout and read-only defaults, so the limits hold even if the code is wrong.

Run this once in the Neon SQL Editor as `neondb_owner`, with a password from `openssl rand -base64 24`:

```sql
create role ask_readonly with login password 'REPLACE_ME';
grant connect on database neondb to ask_readonly;
grant usage on schema public to ask_readonly;
revoke create on schema public from ask_readonly;
grant select on table public.shows, public.responses to ask_readonly;
alter role ask_readonly set statement_timeout = '3s';
alter role ask_readonly set default_transaction_read_only = on;
alter role ask_readonly set search_path = public;
```

The role can read nothing else: no other tables, no `drizzle` schema, no `CREATE`. Postgres lets every role read `pg_catalog` and `information_schema`, which is why the validator rejects system catalogs. `pnpm seed` truncates rather than drops the tables, so the grants survive a reseed; a migration that creates a new table does not grant it to this role, which is the point.

Then set `DATABASE_URL_READONLY` to the same pooled host as `DATABASE_URL` with the new user:

```
postgresql://ask_readonly:<password>@<pooled host>/neondb?sslmode=require
```

## Secrets

`GEMINI_API_KEY`, `GROQ_API_KEY` and `DATABASE_URL_READONLY` are read with `serverSecret()` like every other secret: from `.env` locally and from Worker secrets in production (the `wrangler secret bulk` command in the README uploads them). Cached answers, exhaustion marks and counters live in the `ASK_CACHE` KV namespace, separate from the page cache.
