import { normalizeQuestion } from './cache'

// The example buttons on /ask. pnpm warm:ask runs them once after a deploy so
// they are always answered from the cache; they also skip Turnstile and the
// per-IP limit because they are ours, not the visitor's.
export const EXAMPLE_QUESTIONS = [
  'Which platform has the highest intent to watch among 18 to 34 year olds?',
  'How has awareness of Ironbloom changed over the last six waves?',
  'Top five shows by satisfaction in the Midwest',
  'Compare intent to watch between men and women on Lumen+',
  'Which genre do viewers over 55 rate highest?',
  "What will next month's top show be?",
] as const

const NORMALIZED = new Set(EXAMPLE_QUESTIONS.map(normalizeQuestion))

export function isExampleQuestion(question: string): boolean {
  return NORMALIZED.has(normalizeQuestion(question))
}
