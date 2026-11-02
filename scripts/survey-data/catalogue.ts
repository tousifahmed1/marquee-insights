import type { Genre, Platform } from '../../src/data/dimensions'

export type CatalogueShow = {
  title: string
  genre: Genre
  platform: Platform
  releaseYear: number
}

export const CATALOGUE: readonly CatalogueShow[] = [
  { title: 'The Velmont Files', genre: 'crime', platform: 'lumen-plus', releaseYear: 2023 },
  { title: 'Saltgrass', genre: 'drama', platform: 'tidewell', releaseYear: 2024 },
  { title: 'Ironbloom', genre: 'sci-fi', platform: 'quaystream', releaseYear: 2026 },
  { title: 'Brindle Point', genre: 'thriller', platform: 'corvid-tv', releaseYear: 2022 },
  { title: 'Copperline Kitchen', genre: 'reality', platform: 'parcel-play', releaseYear: 2021 },
  { title: 'Quarry Light', genre: 'drama', platform: 'harbourline', releaseYear: 2025 },
  { title: 'The Lantern Keepers', genre: 'animation', platform: 'lumen-plus', releaseYear: 2024 },
  { title: 'Wickerby Hall', genre: 'comedy', platform: 'corvid-tv', releaseYear: 2019 },
  { title: 'Starling Deep', genre: 'sci-fi', platform: 'tidewell', releaseYear: 2025 },
  { title: 'The Marrowfield Inquest', genre: 'crime', platform: 'harbourline', releaseYear: 2024 },
  { title: 'Lowtide Love', genre: 'reality', platform: 'quaystream', releaseYear: 2026 },
  { title: 'Night Ferry to Osk', genre: 'thriller', platform: 'lumen-plus', releaseYear: 2025 },
  { title: 'Tallow & Thistle', genre: 'comedy', platform: 'tidewell', releaseYear: 2023 },
  { title: 'Glasshouse Year', genre: 'drama', platform: 'corvid-tv', releaseYear: 2022 },
  { title: 'The Quiet Arithmetic', genre: 'documentary', platform: 'harbourline', releaseYear: 2025 },
  { title: 'Mossback & Pip', genre: 'animation', platform: 'parcel-play', releaseYear: 2020 },
  { title: 'Halcyon Drift', genre: 'sci-fi', platform: 'lumen-plus', releaseYear: 2021 },
  { title: 'Ashgrove Assizes', genre: 'crime', platform: 'corvid-tv', releaseYear: 2018 },
  { title: 'Feast of Small Towns', genre: 'reality', platform: 'harbourline', releaseYear: 2024 },
  { title: 'The Tamsin Protocol', genre: 'thriller', platform: 'quaystream', releaseYear: 2024 },
  { title: 'Fennimore Junction', genre: 'comedy', platform: 'parcel-play', releaseYear: 2025 },
  { title: 'Bellwether Shoals', genre: 'drama', platform: 'lumen-plus', releaseYear: 2020 },
  { title: 'Rivers Under Thornmouth', genre: 'documentary', platform: 'tidewell', releaseYear: 2023 },
  { title: 'Patchwork Planet', genre: 'animation', platform: 'quaystream', releaseYear: 2022 },
  { title: 'Varnish', genre: 'crime', platform: 'tidewell', releaseYear: 2026 },
  { title: 'Orbit of Wren', genre: 'sci-fi', platform: 'harbourline', releaseYear: 2019 },
  { title: 'Second Kiln', genre: 'reality', platform: 'tidewell', releaseYear: 2022 },
  { title: 'Gallowmere', genre: 'thriller', platform: 'parcel-play', releaseYear: 2023 },
  { title: 'The Orchard Ledger', genre: 'drama', platform: 'quaystream', releaseYear: 2021 },
  { title: 'Odd Socks Society', genre: 'comedy', platform: 'lumen-plus', releaseYear: 2026 },
  { title: 'Snowmelt Choir', genre: 'documentary', platform: 'corvid-tv', releaseYear: 2024 },
  { title: 'Kettle & Comet', genre: 'animation', platform: 'harbourline', releaseYear: 2018 },
  { title: 'The Ninefold Gate', genre: 'sci-fi', platform: 'corvid-tv', releaseYear: 2023 },
  { title: "Dredger's Bend", genre: 'crime', platform: 'parcel-play', releaseYear: 2022 },
  { title: 'House of Larkspur', genre: 'drama', platform: 'parcel-play', releaseYear: 2017 },
  { title: 'The Understudy Club', genre: 'comedy', platform: 'quaystream', releaseYear: 2020 },
  { title: 'Meridian Static', genre: 'thriller', platform: 'harbourline', releaseYear: 2021 },
  { title: 'Field Guide to Strangers', genre: 'documentary', platform: 'quaystream', releaseYear: 2019 },
  { title: 'Cinderpath', genre: 'drama', platform: 'corvid-tv', releaseYear: 2016 },
  { title: 'The Peregrine Accord', genre: 'sci-fi', platform: 'parcel-play', releaseYear: 2020 },
]
