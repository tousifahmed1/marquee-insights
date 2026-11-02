import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineField, defineType} from 'sanity'

import {REPORT_CATEGORIES} from '../constants'

export const report = defineType({
  name: 'report',
  title: 'Report',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      description: 'The report lives at /reports/<this value>. Changing it breaks shared links.',
      group: 'content',
      options: {source: 'title', maxLength: 80},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publish date',
      type: 'date',
      description: 'Shown on the report. Reports are listed newest first.',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Visitors can filter the reports list by category.',
      group: 'content',
      options: {list: REPORT_CATEGORIES, layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      description: 'Shown at the top of the report and on report cards.',
      group: 'content',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe what the image shows for people who cannot see it.',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'A one or two sentence summary, shown in the reports list.',
      group: 'content',
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'reportBody',
      group: 'content',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  orderings: [
    {
      title: 'Publish date, newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', date: 'publishedAt', category: 'category', media: 'coverImage'},
    prepare: ({title, date, category, media}) => {
      const label = REPORT_CATEGORIES.find((item) => item.value === category)?.title
      return {
        title: title || 'Untitled report',
        subtitle: [label, date].filter(Boolean).join(' · ') || 'No date or category',
        media,
      }
    },
  },
})
