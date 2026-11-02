import {BlockquoteIcon} from '@sanity/icons/Blockquote'
import {defineField, defineType} from 'sanity'

export const quote = defineType({
  name: 'quote',
  title: 'Quote',
  type: 'object',
  icon: BlockquoteIcon,
  description: 'A testimonial or a line from a respondent.',
  fields: [
    defineField({
      name: 'text',
      title: 'Quote',
      type: 'text',
      rows: 4,
      description: 'Leave out quotation marks. The site adds them.',
      validation: (rule) => rule.required().max(400),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'Optional. Job title and organisation, like "Head of Audience, Northlight Studios".',
      validation: (rule) => rule.max(120),
    }),
  ],
  preview: {
    select: {title: 'text', subtitle: 'author'},
    prepare: ({title, subtitle}) => ({
      title: title || 'Empty quote',
      subtitle: subtitle ? `Quote · ${subtitle}` : 'Quote',
    }),
  },
})
