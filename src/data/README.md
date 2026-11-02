# data

All Neon Postgres access. Filtering, sorting and pagination happen here, in SQL.

- `schema.ts`: Drizzle tables, enums and indexes. Migrations live in `/drizzle`.
- `dimensions.ts`: values and labels for every filter dimension.
- `filters.ts`: Zod schemas for explorer filters, sort and pagination.
- `query-builder.ts`: turns validated filters into `WHERE` and `ORDER BY` clauses.
- `queries.ts`: the Drizzle queries; `results.ts` shapes their output.
- `functions.ts`: the server functions routes call.
