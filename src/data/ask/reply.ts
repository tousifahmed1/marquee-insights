import { z } from 'zod'

// The model's JSON, checked at runtime whatever the provider promised.
const replySchema = z.object({
  answerable: z.boolean(),
  sql: z.string(),
  answer_template: z.string(),
  chart: z.enum(['bar', 'line', 'none']),
  reason: z.string(),
})

export type ModelReply = z.infer<typeof replySchema>
export type ChartKind = ModelReply['chart']

// Some models wrap JSON in a code fence despite the schema; strip it.
function stripFence(text: string): string {
  const trimmed = text.trim()
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed)
  return match?.[1] ?? trimmed
}

export function parseReply(text: string): ModelReply | null {
  let json: unknown
  try {
    json = JSON.parse(stripFence(text))
  } catch {
    return null
  }
  const result = replySchema.safeParse(json)
  if (!result.success) return null
  return { ...result.data, sql: result.data.sql.trim().replace(/;\s*$/, '') }
}
