import type {SchemaTypeDefinition} from 'sanity'

import {ctaBanner} from './blocks/cta-banner'
import {featureGrid} from './blocks/feature-grid'
import {hero} from './blocks/hero'
import {quote} from './blocks/quote'
import {stats} from './blocks/stats'
import {page} from './documents/page'
import {redirect} from './documents/redirect'
import {report} from './documents/report'
import {siteSettings} from './documents/site-settings'
import {accessibleImage} from './objects/accessible-image'
import {link} from './objects/link'
import {pullQuote} from './objects/pull-quote'
import {reportBody} from './objects/report-body'
import {seo} from './objects/seo'

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  page,
  report,
  redirect,
  hero,
  featureGrid,
  stats,
  quote,
  ctaBanner,
  link,
  seo,
  accessibleImage,
  pullQuote,
  reportBody,
]
