import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { MotionConfig } from 'motion/react'

import { Footer } from '@/components/footer'
import { HydrationMarker } from '@/components/hydration-marker'
import { Nav } from '@/components/nav'
import { ErrorPage } from '@/components/error-page'
import { NotFound } from '@/components/not-found'
import { siteSettingsQueryOptions } from '@/content/query-options'
import { mapSiteSettings } from '@/content/mappers'
import { resolveSeo, seoHead, statusSeo } from '@/lib/seo'
import { organizationJsonLd } from '@/lib/structured-data'
import { DEFAULT_THEME, THEME_COLORS, THEME_INIT_SCRIPT } from '@/lib/theme'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import displayFont from '@fontsource/gloock/files/gloock-latin-400-normal.woff2?url'
import sansFont from '@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2?url'

import appCss from '../styles/app.css?url'

import type { QueryClient } from '@tanstack/react-query'

import type { SiteSettings } from '@/content'

// Self-hosted (Fontsource, latin subset) so text never waits on another origin.
// The files the first screen needs are preloaded; app.css declares them.
const PRELOADED_FONTS = [displayFont, sansFont]

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context }) => ({
    siteSettings: await context.queryClient.ensureQueryData(siteSettingsQueryOptions),
  }),
  head: ({ match, matches }) => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { name: 'theme-color', content: THEME_COLORS[DEFAULT_THEME] },
      ...seoHead(rootSeo(match.context.siteSettings, matches)).meta,
      organizationJsonLd(match.context.siteSettings ?? FALLBACK_SETTINGS),
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ...PRELOADED_FONTS.map((href) => ({
        rel: 'preload',
        href,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous' as const,
      })),
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
})

const FALLBACK_SETTINGS = mapSiteSettings(undefined)

// Child routes skip their head when they have no data, so the root sets the
// title for 404 and error pages.
function rootSeo(
  settings: SiteSettings | undefined,
  matches: { status: string; _notFound?: boolean }[],
) {
  const resolved = settings ?? FALLBACK_SETTINGS
  if (matches.some((match) => match.status === 'notFound' || match._notFound)) {
    return statusSeo(resolved, 'Page not found')
  }
  if (matches.some((match) => match.status === 'error')) {
    return statusSeo(resolved, 'Something went wrong')
  }
  return resolveSeo(resolved)
}

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
        <MotionConfig reducedMotion="user">
          <Nav />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </MotionConfig>
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
