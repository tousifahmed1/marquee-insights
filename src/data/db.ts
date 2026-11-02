import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import { serverSecret } from '@/lib/server-env'

import * as schema from './schema'

export function getDb() {
  const url = serverSecret('DATABASE_URL')
  if (!url) throw new Error('DATABASE_URL is not set')
  return drizzle({ client: neon(url), schema })
}

export type Db = ReturnType<typeof getDb>
