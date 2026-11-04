import { LocalTokenizer } from '@google/genai/tokenizer'

import { EXAMPLES_CONTEXT, SCHEMA_CONTEXT } from '../src/data/ask/schema-context'

// Prints the token count of the schema context and examples sent on every
// uncached question, with the Gemini tokenizer. Keep the total under ~2,000.
async function main() {
  const tokenizer = new LocalTokenizer('gemini-2.5-flash')
  const parts = { schema: SCHEMA_CONTEXT, examples: EXAMPLES_CONTEXT }
  let total = 0
  for (const [name, text] of Object.entries(parts)) {
    const { totalTokens = 0 } = await tokenizer.countTokens(text)
    total += totalTokens
    console.log(`${name.padEnd(9)} ${String(totalTokens).padStart(5)} tokens  (${text.length} chars)`)
  }
  console.log(`${'total'.padEnd(9)} ${String(total).padStart(5)} tokens`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
