import { neon, types } from '@neondatabase/serverless'

// Every query from this feature runs on the read-only role, inside a READ ONLY
// transaction, with a 3 second statement timeout. The validator runs first;
// these are the layers below it.
export const STATEMENT_TIMEOUT = '3s'

export type Row = Record<string, unknown>

export type QueryResult = {
  columns: string[]
  rows: Row[]
  rowCount: number
}

export type RunQuery = (sql: string) => Promise<QueryResult>

const INT8 = 20
const NUMERIC = 1700
const DATE = 1082
const TIMESTAMP = 1114
const TIMESTAMPTZ = 1184

// Counts and rounded averages come back as numbers, dates as the text Postgres
// sent (no time zone shifts), everything else as node-postgres would parse it.
function getTypeParser(id: number, format?: 'text' | 'binary') {
  if (id === INT8 || id === NUMERIC) return Number
  if (id === DATE || id === TIMESTAMP || id === TIMESTAMPTZ) return (value: string) => value
  return types.getTypeParser(id, format)
}

export function createReadOnlyRunner(url: string): RunQuery {
  const sql = neon(url, { fullResults: true })
  return async (query) => {
    // The parsers only apply when passed on the query itself.
    const [, result] = await sql.transaction(
      [
        sql.query(`set local statement_timeout = '${STATEMENT_TIMEOUT}'`),
        sql.query(query, [], { types: { getTypeParser } }),
      ],
      { readOnly: true },
    )
    return {
      columns: result.fields.map((field) => field.name),
      rows: result.rows as Row[],
      rowCount: result.rowCount ?? result.rows.length,
    }
  }
}
