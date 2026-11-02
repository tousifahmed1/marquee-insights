import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  description: 'How this page appears in search results and when shared. Empty fields use the site defaults.',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'title',
      title: 'Search title',
      type: 'string',
      description:
        'Shown as the headline in search results, followed by "| Marquee Insights", which is added for you. Leave empty to use the page title.',
      validation: (rule) => rule.max(60).warning('Search engines cut titles after about 60 characters'),
    }),
    defineField({
      name: 'description',
      title: 'Search description',
      type: 'text',
      rows: 3,
      description: 'One or two sentences shown under the title in search results.',
      validation: (rule) =>
        rule.max(160).warning('Search engines cut descriptions after about 160 characters'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Social sharing image',
      type: 'accessibleImage',
      description: 'Shown when the page is shared on social media. Use 1200 × 630 pixels.',
    }),
    defineField({
      name: 'noindex',
      title: 'Hide from search engines',
      type: 'boolean',
      description: 'Turn on for pages that should not appear in search results.',
      initialValue: false,
    }),
  ],
})
