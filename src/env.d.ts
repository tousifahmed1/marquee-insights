interface ImportMetaEnv {
  readonly SANITY_STUDIO_PROJECT_ID?: string
  readonly SANITY_STUDIO_DATASET?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'cloudflare:workers' {
  export const env: Readonly<Record<string, unknown>>
  export function waitUntil(promise: Promise<unknown>): void
}
