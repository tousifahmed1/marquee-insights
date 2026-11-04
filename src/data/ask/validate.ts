import { getTableColumns } from 'drizzle-orm'
import * as sqlParser from 'node-sql-parser/build/postgresql'

import { responses, shows } from '../schema'

import type { Validation } from './pipeline'

// The model's SQL is never trusted. It is parsed in Postgres mode and walked
// node by node: anything not on the allowlists below (tables, columns,
// functions, operators, expression kinds) is rejected with a reason the retry
// prompt can use. What runs is the SQL printed back from the checked tree.

// The build is a CommonJS bundle, so Node sees only a default export while
// Vite sees named ones.
const { Parser } = ('default' in sqlParser
  ? (sqlParser as unknown as { default: typeof sqlParser }).default
  : sqlParser) as typeof sqlParser

const parser = new Parser()
const PARSE_OPTIONS = { database: 'postgresql' }

export const MAX_LIMIT = 100

const TABLES: Record<string, Set<string>> = {
  shows: new Set(Object.values(getTableColumns(shows)).map((column) => column.name)),
  responses: new Set(Object.values(getTableColumns(responses)).map((column) => column.name)),
}
const SCHEMAS = new Set([null, undefined, 'public'])

const AGGREGATES = new Set(['AVG', 'COUNT', 'SUM', 'MIN', 'MAX'])
const FUNCTIONS = new Set([
  'round', 'coalesce', 'nullif', 'abs', 'floor', 'ceil', 'ceiling', 'greatest', 'least',
  'date_trunc', 'to_char', 'lower', 'upper',
])
const OPERATORS = new Set([
  '=', '<>', '!=', '<', '<=', '>', '>=', 'AND', 'OR', '+', '-', '*', '/',
  'IN', 'NOT IN', 'LIKE', 'ILIKE', 'NOT LIKE', 'NOT ILIKE', 'IS', 'IS NOT', 'BETWEEN', 'NOT BETWEEN',
])
const LITERALS = new Set(['number', 'single_quote_string', 'string', 'bool', 'null', 'star'])

class Rejected extends Error {}
// Typed explicitly so TypeScript narrows after a call.
const reject: (message: string) => never = (message) => {
  throw new Rejected(message)
}

type Node = Record<string, unknown>
type Scope = { tables: Map<string, string>; aliases: Set<string>; parent?: Scope }

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null

export function validateSql(sql: string): Validation {
  try {
    if (/--|\/\*|#/.test(sql)) reject('comments are not allowed')
    if (sql.includes(';')) reject('only one statement is allowed; remove the semicolon')
    let ast: unknown
    try {
      ast = parser.astify(quoteReservedAliases(sql), PARSE_OPTIONS)
    } catch (error) {
      reject(`the SQL could not be parsed: ${error instanceof Error ? error.message.slice(0, 120) : 'syntax error'}`)
    }
    if (Array.isArray(ast)) {
      if (ast.length !== 1) reject('only one statement is allowed')
      ast = ast[0]
    }
    if (!isNode(ast) || ast.type !== 'select') reject('only a SELECT statement is allowed')
    const select = ast
    checkSelect(select, undefined)
    applyLimit(select)
    return { ok: true, sql: parser.sqlify(select as never, PARSE_OPTIONS) }
  } catch (error) {
    if (error instanceof Rejected) return { ok: false, error: error.message }
    throw error
  }
}

// "show" reads naturally as an alias for a title but is a keyword to the
// parser; quoting it keeps the model's SQL valid.
const RESERVED_ALIASES = /\b(as\s+)(show)\b/gi
function quoteReservedAliases(sql: string): string {
  return sql.replace(RESERVED_ALIASES, '$1"$2"')
}

function checkSelect(select: Node, parent: Scope | undefined) {
  if (select.with) reject('WITH is not allowed')
  if (select.set_op || select._next) reject('UNION, INTERSECT and EXCEPT are not allowed')
  if (isNode(select.into) && select.into.position) reject('SELECT INTO is not allowed')
  if (select.options) reject('SELECT options are not allowed')
  if (select.window) reject('window functions are not allowed')
  if (select.for) reject('FOR UPDATE is not allowed')

  const scope: Scope = { tables: new Map(), aliases: new Set(), parent }
  const from = Array.isArray(select.from) ? select.from : []
  for (const source of from) {
    if (!isNode(source)) reject('unsupported FROM clause')
    if (isNode(source.expr)) {
      // A subquery in FROM: checked on its own, then its alias is opaque.
      checkSubquery(source.expr, scope)
      if (typeof source.as !== 'string') reject('a subquery in FROM needs an alias')
      scope.tables.set(source.as, '*')
      continue
    }
    if (typeof source.table !== 'string') reject('unsupported FROM clause')
    if (!SCHEMAS.has(source.db as string | null | undefined)) {
      reject(`schema ${String(source.db)} is not allowed; only the shows and responses tables are`)
    }
    if (!(source.table in TABLES)) {
      reject(`table ${source.table} is not allowed; only shows and responses are`)
    }
    scope.tables.set(typeof source.as === 'string' ? source.as : source.table, source.table)
    if (source.join && !/^(INNER |LEFT |RIGHT |FULL )?(OUTER )?JOIN$/.test(String(source.join))) {
      reject(`${String(source.join)} is not allowed`)
    }
    if (source.on !== undefined && source.on !== null) checkExpr(source.on, scope)
    if (source.using) reject('JOIN USING is not allowed; use ON')
  }

  const columns = select.columns
  if (!Array.isArray(columns) || columns.length === 0) reject('the SELECT needs columns')
  for (const column of columns) {
    if (!isNode(column)) reject('unsupported select column')
    if (typeof column.as === 'string') scope.aliases.add(column.as)
  }
  for (const column of columns) {
    if (isNode(column) && isNode(column.expr)) checkExpr(column.expr, scope)
  }
  if (from.length === 0) reject('every SELECT must read from shows or responses')
  if (select.where !== null && select.where !== undefined) checkExpr(select.where, scope)
  if (isNode(select.groupby) && Array.isArray(select.groupby.columns)) {
    for (const column of select.groupby.columns) checkExpr(column, scope)
  }
  if (select.having !== null && select.having !== undefined) checkExpr(select.having, scope)
  if (Array.isArray(select.orderby)) {
    for (const item of select.orderby) if (isNode(item)) checkExpr(item.expr, scope)
  }
  if (isNode(select.limit) && Array.isArray(select.limit.value)) {
    for (const value of select.limit.value) {
      if (!isNode(value) || value.type !== 'number') reject('LIMIT must be a number')
    }
  }
}

function checkSubquery(node: Node, scope: Scope) {
  if (!isNode(node.ast)) reject('unsupported subquery')
  checkSelect(node.ast, scope)
}

function checkExpr(node: unknown, scope: Scope) {
  if (!isNode(node)) reject('unsupported expression')
  if (isNode(node.ast)) return checkSubquery(node, scope)
  const type = typeof node.type === 'string' ? node.type : ''
  if (LITERALS.has(type)) return
  switch (type) {
    case 'column_ref':
      return checkColumn(node, scope)
    case 'binary_expr': {
      if (!OPERATORS.has(String(node.operator))) reject(`operator ${String(node.operator)} is not allowed`)
      checkExpr(node.left, scope)
      checkExpr(node.right, scope)
      return
    }
    case 'unary_expr': {
      if (!['NOT', '-', '+'].includes(String(node.operator))) reject(`operator ${String(node.operator)} is not allowed`)
      return checkExpr(node.expr, scope)
    }
    case 'expr_list': {
      if (!Array.isArray(node.value)) reject('unsupported list')
      for (const item of node.value) checkExpr(item, scope)
      return
    }
    case 'aggr_func': {
      const name = String(node.name).toUpperCase()
      if (!AGGREGATES.has(name)) reject(`aggregate ${name} is not allowed`)
      if (node.over) reject('window functions are not allowed')
      if (!isNode(node.args)) reject('unsupported aggregate arguments')
      checkExpr(node.args.expr, scope)
      if (isNode(node.filter)) checkExpr(node.filter.where, scope)
      return
    }
    case 'function': {
      const name = functionName(node)
      if (!FUNCTIONS.has(name)) reject(`function ${name} is not allowed`)
      if (node.over) reject('window functions are not allowed')
      if (node.args !== undefined && node.args !== null) checkExpr(node.args, scope)
      return
    }
    case 'extract': {
      if (!isNode(node.args)) reject('unsupported EXTRACT')
      return checkExpr(node.args.source, scope)
    }
    case 'cast':
      return checkExpr(node.expr, scope)
    case 'case': {
      if (node.expr !== null && node.expr !== undefined) checkExpr(node.expr, scope)
      if (!Array.isArray(node.args)) reject('unsupported CASE')
      for (const arm of node.args) {
        if (!isNode(arm)) reject('unsupported CASE')
        if (arm.cond !== undefined) checkExpr(arm.cond, scope)
        checkExpr(arm.result, scope)
      }
      return
    }
    case 'interval':
      return checkExpr(node.expr, scope)
    default:
      reject(`${type || 'this'} expression is not allowed`)
  }
}

function functionName(node: Node): string {
  const name = isNode(node.name) && Array.isArray(node.name.name) ? node.name.name : []
  return name
    .map((part: unknown) => (isNode(part) ? String(part.value) : String(part)))
    .join('.')
    .toLowerCase()
}

function checkColumn(node: Node, scope: Scope) {
  const column = columnName(node)
  if (column === '*') return
  const table = typeof node.table === 'string' ? node.table : null
  if (table) {
    const resolved = lookup(scope, table)
    if (!resolved) reject(`${table}.${column} refers to an unknown table or alias`)
    if (resolved !== '*' && !TABLES[resolved]?.has(column)) {
      reject(`column ${column} does not exist on ${resolved}`)
    }
    return
  }
  if (scope.aliases.has(column)) return
  for (let s: Scope | undefined = scope; s; s = s.parent) {
    for (const resolved of s.tables.values()) {
      if (resolved === '*' || TABLES[resolved]?.has(column)) return
    }
  }
  reject(`column ${column} does not exist on shows or responses`)
}

function columnName(node: Node): string {
  if (typeof node.column === 'string') return node.column
  if (isNode(node.column) && isNode(node.column.expr)) return String(node.column.expr.value)
  return reject('unsupported column reference')
}

function lookup(scope: Scope, alias: string): string | undefined {
  for (let s: Scope | undefined = scope; s; s = s.parent) {
    const table = s.tables.get(alias)
    if (table) return table
  }
  return undefined
}

// A query that returns one aggregate row needs no LIMIT; everything else is
// capped at MAX_LIMIT rows.
function applyLimit(select: Node) {
  const limit = isNode(select.limit) ? select.limit : undefined
  const values = Array.isArray(limit?.value) ? limit.value : []
  const first = values[0]
  if (isNode(first) && Number(first.value) > MAX_LIMIT) {
    first.value = MAX_LIMIT
    return
  }
  if (values.length > 0 || isSingleAggregateRow(select)) return
  select.limit = { seperator: '', value: [{ type: 'number', value: MAX_LIMIT }] }
}

function isSingleAggregateRow(select: Node): boolean {
  if (select.groupby) return false
  const columns = Array.isArray(select.columns) ? select.columns : []
  let aggregates = 0
  for (const column of columns) {
    if (!isNode(column)) return false
    if (hasBareColumn(column.expr)) return false
    aggregates += countAggregates(column.expr)
  }
  return aggregates > 0
}

function hasBareColumn(node: unknown): boolean {
  if (!isNode(node)) return false
  if (node.type === 'aggr_func') return false
  if (node.type === 'column_ref') return true
  if (isNode(node.ast)) return false
  return Object.values(node).some((child) =>
    Array.isArray(child) ? child.some(hasBareColumn) : hasBareColumn(child),
  )
}

function countAggregates(node: unknown): number {
  if (!isNode(node)) return 0
  if (node.type === 'aggr_func') return 1
  if (isNode(node.ast)) return 0
  return Object.values(node).reduce<number>(
    (sum, child) =>
      sum + (Array.isArray(child) ? child.reduce<number>((s, c) => s + countAggregates(c), 0) : countAggregates(child)),
    0,
  )
}
