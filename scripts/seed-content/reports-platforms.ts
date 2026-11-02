import { bullets, h2, h3, numbered, p, pull } from './portable-text'
import type { SeedReport } from './report-types'

export const platformReports: SeedReport[] = [
  {
    slug: 'weekly-drops-against-the-binge',
    title: 'Weekly drops against the binge',
    publishedAt: '2026-10-13',
    category: 'streaming',
    cover: { style: 'bars', accent: 1, alt: 'Navy bars rising from left to right with every fourth bar in blue' },
    excerpt:
      'We compared release cadence across eleven streaming platforms. Weekly releases kept viewers for longer, but full-season drops were finished more often.',
    seoDescription: 'Weekly releases versus full-season drops across eleven streaming platforms.',
    charts: [
      {
        id: 'cadence-completion',
        title: 'Finished the season within eight weeks',
        data: [
          { label: 'Full season at once', value: 58 },
          { label: 'Two episodes a week', value: 49 },
          { label: 'One episode a week', value: 44 },
        ],
        alt: 'Bar chart of season completion within eight weeks by release pattern: full season at once 58%, two episodes a week 49%, one episode a week 44%.',
        caption: 'Base: 3,420 panel members who started a new series on Lumen+, Tidewell, Corvid TV or Quaystream, January to September 2026.',
      },
    ],
    body: (chart) => [
      p('Platforms keep switching between weekly releases and full-season drops. We looked at 64 new series released this year to see what each pattern actually does to viewing.'),
      h2('Completion favours the full drop'),
      chart('cadence-completion'),
      p('When a whole season arrives at once, more viewers finish it. But they finish it fast, and the conversation around the show ends within a fortnight.'),
      h2('Weekly releases stay in the conversation'),
      p('Weekly series were mentioned by panel members for **5.2 weeks** on average, against 2.1 weeks for full drops. For shows that rely on word of mouth, that matters more than completion.'),
      pull('Waiting for Friday was half the fun. We’d text each other theories all week.', 'Panel member, 23, Capital region'),
      h3('The hybrid pattern'),
      p('Releasing two or three episodes on launch day and then one a week performed best overall. It kept 49% completion and most of the extended conversation.'),
      bullets([
        'Best for mysteries and serialised drama: weekly or hybrid',
        'Best for comedy and reality: full season at once',
        'Avoid weekly releases for anything under six episodes',
      ]),
    ],
  },
  {
    slug: 'ad-tiers-after-the-first-year',
    title: 'Ad tiers after the first year',
    publishedAt: '2026-08-25',
    category: 'streaming',
    cover: { style: 'arcs', accent: 4, alt: 'Concentric dashed arcs in navy with one ring picked out in lilac' },
    excerpt:
      'One year on, 37% of the panel’s streaming subscriptions are on a plan with ads. Most switchers say they barely notice them. Their viewing data disagrees.',
    body: () => [
      p('A year after Tidewell and Quaystream launched cheaper plans with ads, we compared what subscribers on those plans said with what they actually watched.'),
      h2('Viewers say ads don’t bother them'),
      p('Seven in ten ad-tier subscribers said the ads made little or no difference to how much they watched.'),
      h2('Their viewing says otherwise'),
      p('Compared with similar viewers on ad-free plans, ad-tier subscribers watched **18% fewer hours** of drama and abandoned more films part way through. Comedy and reality viewing was unaffected.'),
      numbered([
        'Long dramas lose the most viewing on ad plans.',
        'Ad breaks in the first ten minutes have the biggest effect on abandonment.',
        'Viewers over 55 are the least sensitive to ads.',
      ]),
      pull('I don’t mind them, really. I just tend to pick something shorter.', 'Panel member, 38, Southern region'),
    ],
  },
  {
    slug: 'who-finishes-a-story-game',
    title: 'Who finishes a story game?',
    publishedAt: '2026-10-06',
    category: 'gaming',
    cover: { style: 'bulbs', accent: 4, alt: 'Rows of round lights, some lit in lilac, on a dark navy background' },
    excerpt:
      'Fewer than one in three players reach the end of a story-led game. We asked 1,400 of them where they stopped, and why.',
    seoDescription: 'Why fewer than one in three players finish story-led games, from a panel of 1,400 players.',
    body: () => [
      p('Story-led games take years to make and are sold on their endings. Yet in our panel, only 29% of players who started one of this year’s major story releases, including Tessellate Interactive’s *Ironbloom*, reached the credits.'),
      h2('Where players stop'),
      p('Most drop-off happens early. Half of the players who never finished stopped within the first five hours.'),
      bullets([
        'Ran out of time: 41%',
        'Started another game: 26%',
        'Got stuck on a difficult section: 19%',
        'Lost interest in the story: 14%',
      ]),
      h2('Shorter games are finished more often'),
      p('Games that take under 15 hours to finish had a completion rate of 47%. Above 40 hours, it fell to 18%.'),
      pull('I want to see how it ends. I just don’t have sixty hours.', 'Panel member, 36, Northern region'),
      p('Compare how running time affects cinema trips in [The ninety-minute comeback](/reports/the-ninety-minute-comeback).'),
    ],
  },
  {
    slug: 'watching-the-match-on-three-screens',
    title: 'Watching the match on three screens',
    publishedAt: '2026-09-15',
    category: 'sports',
    cover: { style: 'bars', accent: 0, alt: 'Navy bars rising from left to right with every fourth bar in amber' },
    excerpt:
      'Live sport is still watched on the biggest screen in the house. But 62% of fans now follow a second feed on their phone at the same time.',
    seoDescription: 'How sports fans combine the TV, their phone and a laptop during live matches.',
    body: () => [
      p('We surveyed 2,300 sports fans in the panel during the opening month of the Arden Cup and the new Northshore Netball League season.'),
      h2('The big screen still matters'),
      p('Nine in ten fans watched live matches on a television. Only 8% watched mainly on a phone, most of them while travelling.'),
      h2('The second screen is for other matches'),
      p('Of fans using a second screen, **54% were following a different match**, not chatting about the one in front of them. Fantasy league updates were the next most common use.'),
      pull('I’ve got the big game on the telly and the scores from the other grounds on my phone. That’s match day.', 'Panel member, 47, Coastal region'),
      h3('What this means for rights holders'),
      p('Fans want more matches at once, not more commentary. Multi-match views and score overlays were the most requested features in open responses.'),
    ],
  },
]
