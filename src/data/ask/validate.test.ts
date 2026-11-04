import { describe, expect, it } from 'vitest'

import { EXAMPLES } from './schema-context'
import { validateSql } from './validate'

const ok = (sql: string) => {
  const result = validateSql(sql)
  if (!result.ok) throw new Error(`expected ${sql} to pass: ${result.error}`)
  return result.sql
}
const rejected = (sql: string) => {
  const result = validateSql(sql)
  if (result.ok) throw new Error(`expected ${sql} to be rejected, got ${result.sql}`)
  return result.error
}

describe('validateSql', () => {
  it('accepts every example query', () => {
    for (const example of EXAMPLES) ok(example.sql)
  })

  it('accepts joins, subqueries, CASE, FILTER, EXTRACT, casts and intervals over the allowed tables', () => {
    ok("select s.genre, round(avg(r.intent), 1) as avg_intent from responses r left join shows s on s.id = r.show_id where r.wave > (select max(wave) from responses) - interval '3 months' group by s.genre having count(*) > 10 order by avg_intent desc")
    ok('select count(*) filter (where would_recommend) as recommenders, extract(month from wave) as month, wave::text as label from responses group by wave')
    ok("select date_trunc('month', wave) as month, round(avg(case when would_recommend then 1 else 0 end) * 100, 1) as pct from responses group by 1")
    ok('select platform, count(*) as responses from (select platform from responses where intent > 50) as hot group by platform')
    ok("select coalesce(max(awareness), 0) as top from responses where region in ('south', 'west') and gender is not null")
  })

  it('adds LIMIT 100 when there is none and the result is not a single aggregate row', () => {
    expect(ok('select platform, count(*) as responses from responses group by platform')).toMatch(/LIMIT 100$/)
    expect(ok('select title from shows')).toMatch(/LIMIT 100$/)
    expect(ok('select title from shows limit 5')).toMatch(/LIMIT 5$/)
    expect(ok('select title from shows limit 500')).toMatch(/LIMIT 100$/)
  })

  it('leaves a single aggregate row without a LIMIT', () => {
    expect(ok('select round(avg(intent), 1) as avg_intent, count(*) as responses from responses')).not.toMatch(/LIMIT/)
    expect(ok('select count(*) as responses from responses where region = \'south\'')).not.toMatch(/LIMIT/)
  })

  it('rejects writes and DDL', () => {
    expect(rejected("insert into shows (title) values ('x')")).toMatch(/SELECT/)
    expect(rejected('update responses set intent = 0')).toMatch(/SELECT/)
    expect(rejected('delete from responses')).toMatch(/SELECT/)
    expect(rejected('drop table shows')).toMatch(/SELECT/)
    expect(rejected('truncate responses')).toMatch(/SELECT|parsed/)
  })

  it('rejects multiple statements and comments', () => {
    expect(rejected('select count(*) from responses; drop table shows')).toMatch(/one statement/)
    expect(rejected('select count(*) from responses -- hi')).toMatch(/comments/)
    expect(rejected('select /* x */ count(*) from responses')).toMatch(/comments/)
  })

  it('rejects functions off the allowlist', () => {
    expect(rejected('select pg_sleep(10)')).toMatch(/pg_sleep is not allowed/)
    expect(rejected('select count(*) from responses where pg_sleep(1) is null')).toMatch(/pg_sleep/)
    expect(rejected('select version() as v from shows')).toMatch(/version is not allowed/)
    expect(rejected('select generate_series(1, 10) as n from shows')).toMatch(/generate_series/)
  })

  it('rejects other tables and system catalogs', () => {
    expect(rejected('select * from users')).toMatch(/table users is not allowed/)
    expect(rejected('select * from pg_catalog.pg_tables')).toMatch(/schema pg_catalog/)
    expect(rejected('select * from pg_tables')).toMatch(/table pg_tables/)
    expect(rejected('select * from information_schema.tables')).toMatch(/schema information_schema/)
    expect(rejected('select * from drizzle.__drizzle_migrations')).toMatch(/schema drizzle/)
    expect(rejected('select title from shows where id in (select id from users)')).toMatch(/table users/)
  })

  it('rejects set operations, WITH and window functions', () => {
    expect(rejected('select title from shows union select tablename from pg_tables')).toMatch(/UNION/)
    expect(rejected('select title from shows union all select title from shows')).toMatch(/UNION/)
    expect(rejected('with x as (select 1) select * from x')).toMatch(/WITH/)
    expect(rejected('select title, row_number() over (order by id) as n from shows')).toMatch(/not allowed/)
    expect(rejected('select avg(intent) over (partition by platform) as a from responses')).toMatch(/window/)
  })

  it('rejects unknown columns and aliases', () => {
    expect(rejected('select password from shows')).toMatch(/column password does not exist/)
    expect(rejected('select r.secret from responses r')).toMatch(/column secret does not exist on responses/)
    expect(rejected('select x.title from shows s')).toMatch(/unknown table or alias/)
    expect(rejected('select s.wave from shows s')).toMatch(/column wave does not exist on shows/)
  })

  it('rejects a FROM-less select and non-numeric limits', () => {
    expect(rejected('select 1')).toMatch(/must read from/)
    expect(rejected('select count(*) as responses from responses limit all')).toMatch(/LIMIT|parsed/)
  })

  it('quotes the show alias, which the parser treats as a keyword', () => {
    expect(ok('select s.title as show, count(*) as responses from responses r join shows s on s.id = r.show_id group by s.title')).toContain('AS "show"')
  })

  it('prints the checked tree back as the SQL to run', () => {
    expect(ok("select region, count(*) as responses from responses where region = 'south' group by region")).toBe(
      `SELECT region, COUNT(*) AS "responses" FROM "responses" WHERE region = 'south' GROUP BY region LIMIT 100`,
    )
  })
})
