import { getCliClient } from 'sanity/cli'

import { key } from './portable-text'

// Adds the "Ask" header link after "Explore" and the "Ask the data" footer
// link after "Explore the data" in the live site settings, without touching
// anything else (pnpm seed:content would replace every seeded document).
// Safe to re-run: a link that already exists is left alone.
// Run: pnpm --filter studio exec sanity exec ../scripts/seed-content/add-nav-link.ts --with-user-token

const client = getCliClient({ apiVersion: '2026-11-01' })

type Link = { _key: string; label?: string; href?: string }
type Settings = { navLinks?: Link[]; footerLinks?: Link[] }

const ADDITIONS = [
  { field: 'navLinks', after: '/explore', link: { _type: 'link', label: 'Ask', href: '/ask' } },
  { field: 'footerLinks', after: '/explore', link: { _type: 'link', label: 'Ask the data', href: '/ask' } },
] as const

async function main() {
  const settings = await client.fetch<Settings | null>('*[_id == "siteSettings"][0]{ navLinks, footerLinks }')
  if (!settings) throw new Error('No siteSettings document; run pnpm seed:content first.')

  for (const { field, after, link } of ADDITIONS) {
    const links = settings[field] ?? []
    if (links.some((item) => item.href === link.href)) {
      console.log(`${field}: "${link.label}" is already there.`)
      continue
    }
    const anchor = links.findIndex((item) => item.href === after)
    const position = anchor === -1 ? links.length : anchor + 1
    await client
      .patch('siteSettings')
      .setIfMissing({ [field]: [] })
      .insert('after', `${field}[${position - 1}]`, [{ _key: key('it'), ...link }])
      .commit()
    console.log(`${field}: added "${link.label}" at position ${position + 1} of ${links.length + 1}.`)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
