// Puts each top-level clause of a SELECT on its own line for display. Clauses
// inside parentheses (subqueries) stay on the line they are in.
const CLAUSES = ['FROM', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT']

const CLAUSE_PATTERN = new RegExp(`^(${CLAUSES.join('|')})\\b`, 'i')

export function formatSql(sql: string): string {
  let out = ''
  let depth = 0
  let quote: string | null = null
  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i] as string
    if (quote) {
      out += char
      if (char === quote) quote = null
      continue
    }
    if (char === "'" || char === '"') {
      quote = char
      out += char
      continue
    }
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    const clause = depth === 0 && char === ' ' ? CLAUSE_PATTERN.exec(sql.slice(i + 1))?.[0] : undefined
    if (clause) {
      out += `\n${clause}`
      i += clause.length
      continue
    }
    out += char
  }
  return out
}
