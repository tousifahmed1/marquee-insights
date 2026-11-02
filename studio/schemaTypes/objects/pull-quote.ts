import {BlockquoteIcon} from '@sanity/icons/Blockquote'
import {defineField, defineType} from 'sanity'

export const pullQuote = defineType({
  name: 'pullQuote',
  title: 'Pull quote',
  type: 'object',
  icon: BlockquoteIcon,
  description: 'A short line from the report, set large to break up long text.',
  fields: [
    defineField({
      name: 'text',
      title: 'Quote',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(280),
    }),
    defineField({
      name: 'attribution',
      title: 'Attribution',
      type: 'string',
      description: 'Optional. Who said it, like "Panel respondent, 34, Leeds".',
    }),
  ],
  preview: {
    select: {title: 'text', subtitle: 'attribution'},
  },
})
