const BASE_URL = (process.argv[2] ?? 'https://marquee-insights.tousifahmed.workers.dev').replace(/\/$/, '')

type Check = {
  path: string
  status: number
  expect?: (html: string) => string | null
}

const firstHeading = (html: string) =>
  /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1].replace(/<[^>]+>/g, '').trim() ?? null

const has = (pattern: RegExp, message: string) => (html: string) =>
  pattern.test(html) ? null : message

async function firstReportPath(): Promise<string | null> {
  const html = await (await fetch(`${BASE_URL}/reports`)).text()
  return /href="(\/reports\/[a-z0-9-]+)"/.exec(html)?.[1] ?? null
}

async function run(check: Check): Promise<boolean> {
  const started = performance.now()
  const response = await fetch(`${BASE_URL}${check.path}`, { redirect: 'manual' })
  const html = await response.text()
  const ms = Math.round(performance.now() - started)
  const problems = [
    response.status === check.status ? null : `status ${response.status}, expected ${check.status}`,
    firstHeading(html) ? null : 'no h1',
    check.expect?.(html) ?? null,
  ].filter((problem) => problem !== null)

  const headers = ['cache-control', 'x-cache', 'cf-placement']
    .map((name) => `${name}=${response.headers.get(name) ?? '-'}`)
    .join(' ')
  const mark = problems.length === 0 ? 'ok  ' : 'FAIL'
  console.log(`${mark} ${response.status} ${String(ms).padStart(5)}ms ${check.path}`)
  console.log(`       h1="${firstHeading(html) ?? ''}" ${headers}`)
  for (const problem of problems) console.log(`       ${problem}`)
  return problems.length === 0
}

async function main() {
  const report = await firstReportPath()
  const checks: Check[] = [
    { path: '/', status: 200 },
    { path: '/about', status: 200 },
    { path: '/contact', status: 200 },
    { path: '/reports', status: 200, expect: () => (report ? null : 'no report links') },
    ...(report ? [{ path: report, status: 200, expect: has(/<article/, 'no article') }] : []),
    {
      path: '/explore',
      status: 200,
      expect: has(/Showing 1–25 of/, 'no server-rendered explorer rows'),
    },
    {
      path: '/explore?platform=tidewell&sort=intent',
      status: 200,
      expect: has(/Showing 1–25 of/, 'no server-rendered explorer rows'),
    },
    { path: '/ask', status: 200, expect: has(/Try an example/, 'no example questions') },
    { path: '/reports/no-such-report', status: 404 },
    { path: '/no-such-page', status: 404 },
  ]

  console.log(`Checking ${BASE_URL}\n`)
  const results = []
  for (const check of checks) results.push(await run(check))
  const failed = results.filter((ok) => !ok).length
  console.log(failed === 0 ? '\nAll routes ok' : `\n${failed} route(s) failed`)
  process.exitCode = failed === 0 ? 0 : 1
}

void main()
