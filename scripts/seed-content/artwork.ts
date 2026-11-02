import sharp from 'sharp'

const NAVY = ['#0f1b30', '#142340', '#1b2d50', '#26395f', '#344a75']
const ACCENTS = ['#ffb627', '#5fa8e8', '#e77a8c', '#7fbf95', '#a391e6']
const PAPER = '#f4eee2'

function random(seed: string) {
  let h = 2166136261
  for (const char of seed) h = Math.imul(h ^ char.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

export type CoverStyle = 'bulbs' | 'bars' | 'arcs'

export function coverSvg(seed: string, style: CoverStyle, accentIndex: number): string {
  const rand = random(seed)
  const accent = ACCENTS[accentIndex % ACCENTS.length]
  const shapes: string[] = []

  if (style === 'bulbs') {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 16; col++) {
        const lit = rand() > 0.55 - row * 0.04
        const fill = lit ? accent : NAVY[3]
        const opacity = lit ? (0.55 + rand() * 0.45).toFixed(2) : '1'
        shapes.push(`<circle cx="${100 + col * 93}" cy="${120 + row * 95}" r="26" fill="${fill}" fill-opacity="${opacity}"/>`)
      }
    }
  } else if (style === 'bars') {
    const count = 14
    for (let i = 0; i < count; i++) {
      const height = 160 + rand() * 600 + i * 12
      const fill = i % 4 === 3 ? accent : NAVY[4]
      shapes.push(`<rect x="${110 + i * 100}" y="${900 - height}" width="64" height="${height}" fill="${fill}"/>`)
    }
    shapes.push(`<rect x="80" y="900" width="1440" height="6" fill="${PAPER}" fill-opacity="0.35"/>`)
  } else {
    for (let i = 0; i < 9; i++) {
      const r = 120 + i * 85
      const stroke = i === 4 ? accent : NAVY[3 + (i % 2)]
      const dash = Math.round(80 + rand() * 400)
      shapes.push(`<circle cx="1180" cy="760" r="${r}" fill="none" stroke="${stroke}" stroke-width="34" stroke-dasharray="${dash} 40"/>`)
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <rect width="1600" height="1000" fill="${NAVY[1]}"/>
  ${shapes.join('\n  ')}
</svg>`
}

export type ChartDatum = { label: string; value: number }

export function chartSvg(title: string, data: ChartDatum[], unit = '%'): string {
  const max = Math.max(...data.map((d) => d.value))
  const rows = data
    .map((d, i) => {
      const y = 170 + i * 110
      const width = Math.round((d.value / max) * 900)
      const fill = i === 0 ? ACCENTS[0] : NAVY[4]
      return `<text x="80" y="${y + 42}" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="${PAPER}">${d.label}</text>
  <rect x="420" y="${y}" width="${width}" height="64" fill="${fill}"/>
  <text x="${440 + width}" y="${y + 44}" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="bold" fill="${PAPER}">${d.value}${unit}</text>`
    })
    .join('\n  ')
  const height = 220 + data.length * 110
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${height}" viewBox="0 0 1600 ${height}">
  <rect width="1600" height="${height}" fill="${NAVY[1]}"/>
  <text x="80" y="100" font-family="Georgia, serif" font-size="44" fill="${PAPER}">${title}</text>
  ${rows}
</svg>`
}

export function toPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer()
}
