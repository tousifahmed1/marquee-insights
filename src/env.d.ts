interface ImportMetaEnv {
  readonly SANITY_STUDIO_PROJECT_ID?: string
  readonly SANITY_STUDIO_DATASET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'cloudflare:workers' {
  export const env: Readonly<Record<string, unknown>>
}
