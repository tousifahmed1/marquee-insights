import { env } from 'cloudflare:workers'

export type ServerSecret =
  | 'DATABASE_URL'
  | 'SANITY_READ_TOKEN'
  | 'SANITY_PREVIEW_SECRET'
  | 'SANITY_WEBHOOK_SECRET'

// Every secret read goes through here, from the Worker bindings. An empty value
// counts as missing. Only import this from server-only code.
export function serverSecret(name: ServerSecret): string | undefined {
  const value: unknown = env[name]
  return typeof value === 'string' && value !== '' ? value : undefined
}
