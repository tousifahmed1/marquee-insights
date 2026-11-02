import {ThListIcon} from '@sanity/icons/ThList'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {FEATURE_ICONS} from '../constants'

export const featureGrid = defineType({
  name: 'featureGrid',
  title: 'Feature grid',
  type: 'object',
  icon: ThListIcon,
  description: 'Three to six short points, each with an icon.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (rule) => rule.required().max(90),
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      validation: (rule) => rule.required().min(3).max(6),
      of: [
        defineArrayMember({
          name: 'featureItem',
          title: 'Item',
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              description: 'Pick the icon that best matches the point.',
              options: {list: FEATURE_ICONS},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required().max(60),
            }),
            defineField({
              name: 'text',
              title: 'Text',
              type: 'text',
              rows: 3,
              description: 'One or two sentences.',
              validation: (rule) => rule.required().max(220),
            }),
          ],
          preview: {
            select: {title: 'title', subtitle: 'icon'},
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'heading', items: 'items'},
    prepare: ({title, items}) => ({
      title: title || 'Untitled feature grid',
      subtitle: `Feature grid · ${Array.isArray(items) ? items.length : 0} items`,
    }),
  },
})
