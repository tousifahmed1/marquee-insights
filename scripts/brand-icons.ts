import { mkdirSync, writeFileSync } from 'node:fs'

import sharp from 'sharp'

// Draws the favicon, touch icon and organisation logo into public/: an amber
// "M" over a row of marquee bulbs on navy. Re-run after changing the mark.
const NAVY = '#142340'
const AMBER = '#ffb627'

function markSvg(rounded: boolean): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    `<rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="${NAVY}"/>`,
    `<path d="M16 43V17l16 19 16-19v26" fill="none" stroke="${AMBER}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
    ...[20, 28, 36, 44].map((x) => `<circle cx="${x}" cy="53" r="2.5" fill="${AMBER}"/>`),
    '</svg>',
  ].join('')
}

const png = (svg: string, size: number) =>
  sharp(Buffer.from(svg), { density: (72 * size) / 64 }).resize(size, size).png().toBuffer()

// An .ico file holding PNG images, which every current browser accepts.
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = 6 + 16 * images.length
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size % 256, 0)
    entry.writeUInt8(size % 256, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)])
}

async function main() {
  mkdirSync('public', { recursive: true })
  writeFileSync('public/favicon.svg', markSvg(true))
  writeFileSync(
    'public/favicon.ico',
    ico([
      { size: 16, data: await png(markSvg(true), 16) },
      { size: 32, data: await png(markSvg(true), 32) },
    ]),
  )
  writeFileSync('public/apple-touch-icon.png', await png(markSvg(false), 180))
  writeFileSync('public/logo.png', await png(markSvg(false), 512))
  console.log('Wrote favicon.svg, favicon.ico, apple-touch-icon.png and logo.png to public/')
}

void main()
