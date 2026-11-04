import { LocalTokenizer } from '@google/genai/tokenizer'

import { SYSTEM_PROMPT } from '../src/data/ask/prompt'
import { EXAMPLES_CONTEXT, SCHEMA_CONTEXT } from '../src/data/ask/schema-context'

// Prints the token count of the system prompt (rules, schema context and
// examples) sent on every uncached question. Keep the total under ~2,000.
async function main() {
  const tokenizer = new LocalTokenizer('gemini-2.5-flash')
  const rules = SYSTEM_PROMPT.slice(0, SYSTEM_PROMPT.indexOf(SCHEMA_CONTEXT))
  const parts = { rules, schema: SCHEMA_CONTEXT, examples: EXAMPLES_CONTEXT, 'full prompt': SYSTEM_PROMPT }
  for (const [name, text] of Object.entries(parts)) {
    const { totalTokens = 0 } = await tokenizer.countTokens(text)
    console.log(`${name.padEnd(12)} ${String(totalTokens).padStart(5)} tokens  (${text.length} chars)`)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
