import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { Footer } from '@/components/footer'
import { HydrationMarker } from '@/components/hydration-marker'
import { Nav } from '@/components/nav'
import { NotFound } from '@/components/not-found'
import { siteSettingsQueryOptions } from '@/content/query-options'
import { resolveSeo, seoHead } from '@/lib/seo'
import { THEME_INIT_SCRIPT } from '@/lib/theme'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles/app.css?url'

import type { QueryClient } from '@tanstack/react-query'

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Gloock&family=Schibsted+Grotesk:wght@400..700&display=swap'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context }) => ({
    siteSettings: await context.queryClient.ensureQueryData(siteSettingsQueryOptions),
  }),
  head: ({ match }) => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seoHead(resolveSeo(match.context.siteSettings)).meta,
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      { rel: 'stylesheet', href: GOOGLE_FONTS_URL },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <HydrationMarker />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
