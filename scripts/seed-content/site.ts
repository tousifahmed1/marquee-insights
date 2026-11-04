import { key } from './portable-text'

const link = (label: string, href: string) => ({ _type: 'link', label, href })
const image = (assetId: string, alt: string) => ({
  _type: 'accessibleImage',
  asset: { _type: 'reference', _ref: assetId },
  alt,
})
const items = <T extends object>(list: T[]) => list.map((item) => ({ _key: key('it'), ...item }))
const section = <T extends object>(_type: string, fields: T) => ({ _key: key('sec'), _type, ...fields })

export type SiteImages = { aboutHero: string; ogDefault: string }

export function siteSettings(images: SiteImages) {
  return {
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteName: 'Marquee Insights',
    navLinks: items([
      link('Home', '/'),
      link('Reports', '/reports'),
      link('Explore', '/explore'),
      link('Ask', '/ask'),
      link('About', '/about'),
      link('Contact', '/contact'),
    ]),
    footerLinks: items([
      link('Reports', '/reports'),
      link('Explore the data', '/explore'),
      link('About us', '/about'),
      link('Contact', '/contact'),
    ]),
    defaultSeoTitle: 'Marquee Insights | Audience research',
    defaultSeoDescription:
      'Audience research for film, television, streaming, gaming and sport, from a panel of 12,400 viewers surveyed in monthly waves.',
    defaultOgImage: image(
      images.ogDefault,
      'Rows of amber marquee lights on a dark navy background',
    ),
  }
}

export function homePage() {
  return {
    _id: 'page-home',
    _type: 'page',
    title: 'Home',
    slug: { _type: 'slug', current: 'home' },
    sections: [
      section('hero', {
        eyebrow: 'Monthly viewing panel',
        heading: 'What audiences watch, and why they stay.',
        subheading:
          'Marquee Insights surveys a panel of 12,400 viewers every month across film, television, streaming, gaming and sport. Studios and platforms use our research to decide what to make, when to release it and who it is for.',
        primaryCta: link('Explore the data', '/explore'),
        secondaryCta: link('Read the reports', '/reports'),
      }),
      section('stats', {
        heading: 'The panel at a glance',
        items: items([
          { value: '12,400', label: 'viewers surveyed every month' },
          { value: '4', label: 'regions, weighted to census age and income' },
          { value: '12', label: 'survey waves a year, one a month' },
          { value: '7 yrs', label: 'of continuous tracking to compare against' },
        ]),
      }),
      section('featureGrid', {
        heading: 'What we measure',
        items: items([
          { icon: 'tv', title: 'Reach and completion', text: 'Who starts a title, who finishes it, and where in the run they leave.' },
          { icon: 'users', title: 'Audience profiles', text: 'Age, household, region and viewing habits for every title we track.' },
          { icon: 'trending-up', title: 'Momentum', text: 'Month-on-month change in awareness, intent to watch and word of mouth.' },
          { icon: 'message', title: 'Open responses', text: 'What viewers say in their own words, coded and searchable by theme.' },
          { icon: 'clock', title: 'Release timing', text: 'How launch day, cadence and competing titles shape the first month.' },
          { icon: 'globe', title: 'Regional splits', text: 'The same question answered for each region, so national averages don’t hide anything.' },
        ]),
      }),
      section('quote', {
        text: 'We used to argue about whether a show was working. Now we open the monthly wave and look at who came back for episode four.',
        author: 'Imani Okafor',
        role: 'Head of Audience Strategy, Lumen+',
      }),
      section('ctaBanner', {
        heading: 'Ask the panel your own question',
        text: 'Filter every survey wave by age, region, platform and genre, and share the exact view you found.',
        button: link('Explore the data', '/explore'),
      }),
    ],
    seo: {
      _type: 'seo',
      title: 'Marquee Insights | Audience research',
      description:
        'What audiences watch, and why they stay. Monthly research waves from a panel of 12,400 viewers.',
      noindex: false,
    },
  }
}

export function aboutPage(images: SiteImages) {
  return {
    _id: 'page-about',
    _type: 'page',
    title: 'About us',
    slug: { _type: 'slug', current: 'about' },
    sections: [
      section('hero', {
        eyebrow: 'About Marquee Insights',
        heading: 'Research that starts with the viewer, not the schedule.',
        subheading:
          'We are a team of 26 researchers, statisticians and former commissioners. Since 2019 we have asked the same panel what they watch every month, so we can tell a passing spike from a real change in habit.',
        primaryCta: link('Talk to the team', '/contact'),
        image: image(
          images.aboutHero,
          'Concentric amber and navy arcs, an abstract pattern used across Marquee Insights reports',
        ),
      }),
      section('featureGrid', {
        heading: 'How we work',
        items: items([
          { icon: 'search', title: 'Same people, every month', text: 'A fixed panel lets us follow individual viewers over time instead of guessing from snapshots.' },
          { icon: 'layers', title: 'Weighted, then checked', text: 'Each wave is weighted to population benchmarks and checked against the previous four before release.' },
          { icon: 'chart', title: 'Methods in the open', text: 'Every report lists its sample, question wording and margin of error. If a number is shaky, we say so.' },
        ]),
      }),
      section('stats', {
        heading: 'Since 2019',
        items: items([
          { value: '90+', label: 'monthly survey waves completed' },
          { value: '91%', label: 'of panel members still active after a year' },
        ]),
      }),
      section('quote', {
        text: 'Their sample sizes for regional sport finally let us stop treating the whole country as one audience.',
        author: 'Tomasz Wren',
        role: 'Commissioning Editor, Corvid TV',
      }),
      section('ctaBanner', {
        heading: 'Commission a study',
        text: 'Most custom studies are in field within two weeks.',
        button: link('Contact us', '/contact'),
      }),
    ],
    seo: {
      _type: 'seo',
      title: 'About us | Marquee Insights',
      description:
        'A team of researchers and statisticians tracking what a fixed panel of 12,400 viewers watch, every month since 2019.',
      noindex: false,
    },
  }
}

export function contactPage() {
  return {
    _id: 'page-contact',
    _type: 'page',
    title: 'Contact',
    slug: { _type: 'slug', current: 'contact' },
    sections: [
      section('hero', {
        heading: 'Talk to the research team.',
        subheading:
          'Tell us what you are trying to decide. We will reply within two working days with whether the panel can answer it, and roughly what it would cost.',
        primaryCta: link('Email the team', 'mailto:research@marquee-insights.example'),
        secondaryCta: link('Browse the reports first', '/reports'),
      }),
      section('featureGrid', {
        heading: 'Who to contact',
        items: items([
          { icon: 'chart', title: 'Custom studies', text: 'Concept tests, launch tracking and audience sizing. research@marquee-insights.example' },
          { icon: 'message', title: 'Press', text: 'Charts and comment on published reports. press@marquee-insights.example' },
          { icon: 'users', title: 'Joining the panel', text: 'The panel is invitation only, but you can register interest. panel@marquee-insights.example' },
        ]),
      }),
      section('stats', {
        items: items([
          { value: '2 days', label: 'to a first reply' },
          { value: '10 days', label: 'from brief to first results, on average' },
        ]),
      }),
      section('quote', {
        text: 'The brief was half a page. Ten days later we had a sizing we could take to the board.',
        author: 'Priya Raman',
        role: 'VP Insight, Fenwick Hollow Pictures',
      }),
      section('ctaBanner', {
        heading: 'Not sure what to ask?',
        text: 'Start with the explorer. Most questions we get are already answered in last month’s wave.',
        button: link('Explore the data', '/explore'),
      }),
    ],
    seo: {
      _type: 'seo',
      title: 'Contact | Marquee Insights',
      description: 'Commission a study, ask about a report or register interest in joining the panel.',
      noindex: false,
    },
  }
}

export function redirects() {
  return [
    {
      _id: 'redirect-research',
      _type: 'redirect',
      from: '/research',
      to: '/reports',
      permanent: true,
    },
    {
      _id: 'redirect-methodology',
      _type: 'redirect',
      from: '/methodology',
      to: '/about',
      permanent: false,
    },
  ]
}
