import { getCliClient } from 'sanity/cli'

// Points the home page's closing banner ("Ask the panel your own question")
// at /ask with copy that fits the feature. Patches only that section, so
// editor changes elsewhere on the page survive. Safe to re-run.
// Run: pnpm --filter studio exec sanity exec ../scripts/seed-content/point-home-to-ask.ts --with-user-token

const client = getCliClient({ apiVersion: '2026-11-01' })

const HEADING = 'Ask the panel your own question'
const TEXT =
  'Type a question in plain English and get the answer straight from the survey data, with the SQL that produced it.'
const BUTTON = { _type: 'link', label: 'Ask a question', href: '/ask' }

type Banner = { _key: string; _type: string; heading?: string; text?: string; button?: { label?: string; href?: string } }
type Page = { _id: string; sections?: Banner[] }

async function main() {
  const page = await client.fetch<Page | null>(
    '*[_type == "page" && slug.current == "home"][0]{ _id, sections[]{ _key, _type, heading, text, button } }',
  )
  if (!page) throw new Error('No home page document; run pnpm seed:content first.')
  const banner = page.sections?.find(
    (section) => section._type === 'ctaBanner' && (section.heading === HEADING || section.button?.href === '/explore'),
  )
  if (!banner) throw new Error('The home page has no "Ask the panel your own question" banner.')

  const upToDate =
    banner.text === TEXT && banner.button?.href === BUTTON.href && banner.button?.label === BUTTON.label
  if (upToDate) {
    console.log('The home page banner already points to /ask.')
    return
  }
  const path = `sections[_key == "${banner._key}"]`
  await client
    .patch(page._id)
    .set({ [`${path}.heading`]: HEADING, [`${path}.text`]: TEXT, [`${path}.button`]: BUTTON })
    .commit()
  console.log(`Updated the banner on ${page._id}: "${BUTTON.label}" -> ${BUTTON.href}.`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
