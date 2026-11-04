import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server'
import { z } from 'zod'

import { handleAsk } from './handle'
import type { AskOutcome } from './pipeline'
import { MAX_QUESTION_LENGTH } from './prompt'
import { askDeps } from './server'

const askInput = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
  turnstileToken: z.string().max(4096).optional(),
})

export type AskInput = z.infer<typeof askInput>

export const askTheData = createServerFn({ method: 'POST' })
  .validator((input: unknown) => askInput.parse(input))
  .handler(async ({ data }): Promise<AskOutcome> => {
    // Cloudflare sets cf-connecting-ip; the helper covers other hosts.
    const ip = getRequestHeader('cf-connecting-ip') ?? getRequestIP() ?? null
    return handleAsk({ ...data, ip }, askDeps())
  })
