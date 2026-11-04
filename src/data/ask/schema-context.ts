import { CATALOGUE } from '../catalogue'
import { AGE_GROUPS, GENDERS, GENRES, PLATFORMS, REGIONS, values } from '../dimensions'

// The schema the model sees, built from the same lists the explorer uses so
// the allowed values can never drift. Keep it short: it is sent on every
// uncached question.

const list = (items: readonly string[]) => items.map((item) => `'${item}'`).join(', ')

const titles = CATALOGUE.map((show) => show.title).join(', ')

export const SCHEMA_CONTEXT = `Database: Postgres. Synthetic TV audience survey. Two tables.

shows: one row per show.
- id integer, primary key
- title text, exact, case-sensitive. Titles: ${titles}
- genre enum: ${list(values(GENRES))}
- platform enum: ${list(values(PLATFORMS))} (labels: ${PLATFORMS.map((p) => `${p.label}=${p.value}`).join(', ')})
- release_year integer

responses: one row per survey respondent per show (about 50,000 rows).
- id integer
- show_id integer, references shows.id
- platform enum, same values as shows.platform and always equal to the show's platform, so filter here without a join
- region enum: ${list(values(REGIONS))}
- age_group enum: ${list(values(AGE_GROUPS))} ("under 35" = '18-24','25-34'; "over 55" = '55+'; "45 and over" = '45-54','55+')
- gender enum: ${list(values(GENDERS))} ("men"='male', "women"='female')
- wave date, the first day of the survey month. 12 monthly waves; the newest is (select max(wave) from responses). "Last N waves": wave > (select max(wave) from responses) - interval 'N months'
- awareness integer 0-100, how aware the respondent is of the show
- intent integer 0-100, intent to watch
- satisfaction integer 1-10
- would_recommend boolean

Scores are per respondent: report them as averages (round to one decimal) with count(*) as responses. "Viewers" and "respondents" mean rows of responses. Percentages: round(100.0 * avg(case when <cond> then 1 else 0 end), 1).`

export type Example = { question: string; sql: string }

export const EXAMPLES: readonly Example[] = [
  {
    question: 'What is the average satisfaction with Saltgrass?',
    sql: "select round(avg(r.satisfaction), 1) as avg_satisfaction, count(*) as responses from responses r join shows s on s.id = r.show_id where s.title = 'Saltgrass'",
  },
  {
    question: 'How many responses are there per region?',
    sql: 'select region, count(*) as responses from responses group by region order by responses desc',
  },
  {
    question: 'Which five shows have the highest awareness?',
    sql: 'select s.title as show, round(avg(r.awareness), 1) as avg_awareness, count(*) as responses from responses r join shows s on s.id = r.show_id group by s.title order by avg_awareness desc limit 5',
  },
  {
    question: 'Do men or women have higher intent to watch on Tidewell?',
    sql: "select gender, round(avg(intent), 1) as avg_intent, count(*) as responses from responses where platform = 'tidewell' and gender in ('male', 'female') group by gender order by avg_intent desc",
  },
  {
    question: 'How has satisfaction with Varnish changed over the last six waves?',
    sql: "select r.wave, round(avg(r.satisfaction), 1) as avg_satisfaction, count(*) as responses from responses r join shows s on s.id = r.show_id where s.title = 'Varnish' and r.wave > (select max(wave) from responses) - interval '6 months' group by r.wave order by r.wave",
  },
  {
    question: 'What share of viewers aged 55 and over in the South would recommend a documentary?',
    sql: "select round(100.0 * avg(case when r.would_recommend then 1 else 0 end), 1) as recommend_pct, count(*) as responses from responses r join shows s on s.id = r.show_id where r.age_group = '55+' and r.region = 'south' and s.genre = 'documentary'",
  },
]

export const EXAMPLES_CONTEXT = EXAMPLES.map(
  (example) => `Q: ${example.question}\nSQL: ${example.sql}`,
).join('\n\n')
