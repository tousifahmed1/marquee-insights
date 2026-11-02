import { bullets, h2, h3, numbered, p, pull } from './portable-text'
import type { SeedReport } from './report-types'

export const screenReports: SeedReport[] = [
  {
    slug: 'the-second-season-slump',
    title: 'The second-season slump',
    publishedAt: '2026-10-27',
    category: 'tv',
    cover: { style: 'bulbs', accent: 0, alt: 'Rows of marquee lights, about half of them lit in amber' },
    excerpt:
      'A third of viewers who finish a first season drift away from the second by episode four. We followed 2,100 of them to find out why, and what brought some back.',
    seoDescription: 'Why a third of returning-series viewers leave by episode four, from a panel of 2,100 viewers.',
    charts: [
      {
        id: 'slump-reasons',
        title: 'Main reason for stopping a returning series',
        data: [
          { label: 'Forgot it was back', value: 34 },
          { label: 'Gap was too long', value: 27 },
          { label: 'Slow first episodes', value: 21 },
          { label: 'Cast changes', value: 11 },
          { label: 'Other', value: 7 },
        ],
        alt: 'Bar chart of the main reason viewers stopped a returning series: forgot it was back 34%, gap was too long 27%, slow first episodes 21%, cast changes 11%, other 7%.',
        caption: 'Base: 2,104 panel members who finished season one but not season two. Fieldwork August to October 2026.',
      },
    ],
    body: (chart) => [
      p('Every autumn, a handful of returning dramas lose a large share of the audience that made them a hit. Commissioners tend to blame the gap between seasons. Our panel suggests the gap matters, but not in the way most people assume.'),
      h2('Who leaves, and when'),
      p('We tracked 2,104 panel members who finished the first season of one of eleven returning dramas, including *The Velmont Files* and *Saltgrass*. Of these, **33% did not reach episode four** of the new season. Most of them never started it at all.'),
      chart('slump-reasons'),
      p('The most common reason was not boredom. A third of lapsed viewers told us they simply had not noticed the show was back. Among viewers under 35 that rose to 41%.'),
      pull('I loved the first one. I didn’t know the second one was out until my sister spoiled the ending.', 'Panel member, 29, Coastal region'),
      h2('What brought viewers back'),
      p('Around one in five lapsed viewers returned within six weeks. Three things were linked to a return:'),
      bullets([
        'A recap episode or video released the week before launch',
        'A friend or family member recommending the new season directly',
        'The first season being promoted again on the home screen of the platform',
      ]),
      h3('What did not help'),
      p('Trailers released more than a month before launch had no measurable effect on return rates. Neither did cast interviews.'),
      h2('What this means for launches'),
      numbered([
        'Plan the reminder, not just the launch. Viewers need to be told the show is back in the place they already watch.',
        'Keep the gap under 18 months where you can. Return rates fell sharply after that point.',
        'Lead with story in the first episode. Slow openings cost a fifth of the returning audience.',
      ]),
      p('The full tables, including breakdowns by platform and region, are available in the [data explorer](/explore).'),
    ],
  },
  {
    slug: 'comfort-viewing-in-a-crowded-autumn',
    title: 'Comfort viewing in a crowded autumn',
    publishedAt: '2026-09-29',
    category: 'tv',
    cover: { style: 'arcs', accent: 3, alt: 'Concentric dashed arcs in navy with one ring picked out in green' },
    excerpt:
      'Rewatching rose for the third year running. We looked at who rewatches, what they choose and when in the week they do it.',
    body: () => [
      p('Despite the busiest autumn schedule we have recorded, 46% of the panel rewatched at least one series in September. That is up from 39% two years ago.'),
      h2('The comfort shortlist'),
      p('Rewatching is concentrated. Five long-running comedies, led by *Brindle Point*, account for more than half of all rewatch time. Most are over six seasons long and have self-contained episodes.'),
      pull('It’s what I put on when I’m too tired to pick something new.', 'Panel member, 44, Capital region'),
      h2('Sunday nights belong to old favourites'),
      p('Rewatching peaks on Sunday evenings and on weekday nights after 10pm. New releases dominate Friday and Saturday.'),
      bullets([
        'Sunday evening: 31% of viewing time is a rewatch',
        'Friday evening: 12% of viewing time is a rewatch',
        'Households with children under ten rewatch the most',
      ]),
      p('For schedulers, the lesson is that new drama does not compete well with comfort viewing on a Sunday. Read more on release timing in [Weekly drops against the binge](/reports/weekly-drops-against-the-binge).'),
    ],
  },
  {
    slug: 'the-ninety-minute-comeback',
    title: 'The ninety-minute comeback',
    publishedAt: '2026-10-20',
    category: 'film',
    cover: { style: 'bars', accent: 2, alt: 'Navy bars rising from left to right with every fourth bar in rose' },
    excerpt:
      'Shorter films are winning back casual cinemagoers. Viewers who saw a film under 100 minutes were twice as likely to book another within a month.',
    seoDescription: 'Shorter running times are bringing casual viewers back to the cinema, our panel shows.',
    charts: [
      {
        id: 'runtime-return',
        title: 'Booked another cinema trip within 30 days',
        data: [
          { label: 'Under 100 mins', value: 38 },
          { label: '100 to 130 mins', value: 24 },
          { label: 'Over 130 mins', value: 17 },
        ],
        alt: 'Bar chart showing the share of viewers who booked another cinema trip within 30 days, by running time of the last film seen: under 100 minutes 38%, 100 to 130 minutes 24%, over 130 minutes 17%.',
        caption: 'Base: 1,860 panel members who went to the cinema between June and September 2026.',
      },
    ],
    body: (chart) => [
      p('Running times have grown for a decade. This summer, a run of shorter releases from smaller studios, including Fenwick Hollow Pictures’ *Quarry Light*, tested whether audiences had noticed.'),
      h2('Short films bring people back'),
      chart('runtime-return'),
      p('Casual cinemagoers, who go fewer than four times a year, were the most sensitive to length. Among them, a long film made a second trip within the month half as likely.'),
      pull('Two and a half hours is a whole evening once you add the trailers and the drive.', 'Panel member, 52, Northern region'),
      h2('Length matters less to regulars'),
      p('Frequent cinemagoers did not care much. Their return rate barely changed with running time. For them, the deciding factors were the venue and who they went with.'),
      p('See how this compares with home viewing in [The second-season slump](/reports/the-second-season-slump).'),
    ],
  },
  {
    slug: 'field-notes-festival-audiences',
    title: 'Field notes: festival audiences',
    publishedAt: '2026-09-08',
    category: 'film',
    body: () => [
      p('A short note from our team at three regional film festivals this summer. We interviewed 140 attendees between screenings. A full report will follow once the panel data for the autumn release window is in.'),
      p('Early signs: festival attendees were far more likely than the wider panel to say they choose films by director rather than by cast.'),
    ],
  },
]
