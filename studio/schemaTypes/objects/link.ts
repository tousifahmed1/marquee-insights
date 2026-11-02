import {LinkIcon} from '@sanity/icons/Link'
import {defineField, defineType} from 'sanity'

import {isLinkTarget} from '../validation'

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'The text people click. Say where it goes, like "Read the reports".',
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: 'href',
      title: 'Destination',
      type: 'string',
      description: 'A site path like /reports, or a full https:// address for other sites.',
      validation: (rule) => rule.required().custom(isLinkTarget),
    }),
  ],
  preview: {
    select: {title: 'label', subtitle: 'href'},
  },
})
