import { existsSync } from 'node:fs'

// Runs every example question once through the deployed pipeline so the
// buttons on /ask are served from the cache. Usage:
//   pnpm warm:ask [url] [--reset]
// --reset bumps the data version first; run it after pnpm seed.

if (existsSync('.env')) process.loadEnvFile('.env')

const args = process.argv.slice(2)
const reset = args.includes('--reset')
const baseUrl = (args.find((arg) => !arg.startsWith('--')) ?? 'https://marquee-insights.tousifahmed.workers.dev').replace(/\/$/, '')
const secret = process.env.ASK_ADMIN_SECRET
if (!secret) throw new Error('ASK_ADMIN_SECRET is not set. Add it to .env.')

type Result = { question: string; status: string; cached: boolean; modelCalls: number; ms: number }

async function main() {
  const started = performance.now()
  const response = await fetch(`${baseUrl}/api/ask/warm`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-ask-admin': secret as string },
    body: JSON.stringify({ reset }),
  })
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
  const body = (await response.json()) as { dataVersion: string; reset: boolean; results: Result[] }
  console.log(`${baseUrl}  data version ${body.dataVersion}${body.reset ? ' (reset)' : ''}`)
  let calls = 0
  for (const result of body.results) {
    calls += result.modelCalls
    const mark = result.status === 'failed' || result.status === 'out-of-capacity' ? 'FAIL' : 'ok  '
    const source = result.cached ? 'cached ' : 'fresh  '
    console.log(`${mark} ${result.status.padEnd(10)} ${source} ${String(result.ms).padStart(6)}ms  ${result.question}`)
  }
  console.log(`${calls} model calls, ${Math.round(performance.now() - started)}ms`)
  if (body.results.some((result) => result.status === 'failed' || result.status === 'out-of-capacity')) {
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
