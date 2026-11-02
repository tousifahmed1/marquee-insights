import { env } from 'cloudflare:workers'

export type ServerSecret =
  | 'DATABASE_URL'
  | 'SANITY_READ_TOKEN'
  | 'SANITY_PREVIEW_SECRET'
  | 'SANITY_WEBHOOK_SECRET'

// Deployed Workers can start with an empty process.env, so secrets are read
// from the Worker bindings instead. Only import this from server-only code.
export function serverSecret(name: ServerSecret): string | undefined {
  const value: unknown = env[name]
  return typeof value === 'string' && value !== '' ? value : undefined
}
