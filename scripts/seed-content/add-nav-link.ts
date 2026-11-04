import { getCliClient } from 'sanity/cli'

import { key } from './portable-text'

// Adds the "Ask" header link after "Explore" in the live site settings
// without touching anything else (pnpm seed:content would replace every
// seeded document). Safe to re-run: it does nothing when the link exists.
// Run: pnpm --filter studio exec sanity exec ../scripts/seed-content/add-nav-link.ts --with-user-token

const client = getCliClient({ apiVersion: '2026-11-01' })
const ASK = { _type: 'link', label: 'Ask', href: '/ask' }

async function main() {
  const settings = await client.fetch<{ navLinks?: { _key: string; href?: string }[] } | null>(
    '*[_id == "siteSettings"][0]{ navLinks }',
  )
  if (!settings) throw new Error('No siteSettings document; run pnpm seed:content first.')
  const links = settings.navLinks ?? []
  if (links.some((link) => link.href === ASK.href)) {
    console.log('The Ask link is already in the header.')
    return
  }
  const explore = links.findIndex((link) => link.href === '/explore')
  const position = explore === -1 ? links.length : explore + 1
  await client
    .patch('siteSettings')
    .setIfMissing({ navLinks: [] })
    .insert('after', `navLinks[${position - 1}]`, [{ _key: key('it'), ...ASK }])
    .commit()
  console.log(`Added the Ask link at position ${position + 1} of ${links.length + 1}.`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
