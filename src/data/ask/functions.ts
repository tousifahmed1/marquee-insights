import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { ask } from './pipeline'
import type { AskOutcome } from './pipeline'
import { MAX_QUESTION_LENGTH } from './prompt'
import { getAskRunner, getLlm } from './server'
import { validateSql } from './validate'

const askInput = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
})

export type AskInput = z.infer<typeof askInput>

export const askTheData = createServerFn({ method: 'POST' })
  .validator((input: unknown) => askInput.parse(input))
  .handler(async ({ data }): Promise<AskOutcome> => {
    return ask(data.question, { llm: getLlm(), validate: validateSql, run: getAskRunner() })
  })
