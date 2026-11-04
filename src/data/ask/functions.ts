import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { ask } from './pipeline'
import type { AskOutcome } from './pipeline'
import { MAX_QUESTION_LENGTH } from './prompt'
import { askDeps } from './server'

const askInput = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
})

export type AskInput = z.infer<typeof askInput>

export const askTheData = createServerFn({ method: 'POST' })
  .validator((input: unknown) => askInput.parse(input))
  .handler(async ({ data }): Promise<AskOutcome> => ask(data.question, askDeps()))
