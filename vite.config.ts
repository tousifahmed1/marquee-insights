import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  envPrefix: ['VITE_', 'SANITY_STUDIO_'],
  environments: {
    ssr: {
      optimizeDeps: {
        include: [
          'zod',
          '@neondatabase/serverless',
          'drizzle-orm',
          'drizzle-orm/neon-http',
          'drizzle-orm/pg-core',
        ],
      },
    },
  },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
