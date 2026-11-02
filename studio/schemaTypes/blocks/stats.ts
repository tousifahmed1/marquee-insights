import {BarChartIcon} from '@sanity/icons/BarChart'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const stats = defineType({
  name: 'stats',
  title: 'Stats',
  type: 'object',
  icon: BarChartIcon,
  description: 'Two to four headline numbers from the research.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Optional. Introduces the numbers.',
      validation: (rule) => rule.max(90),
    }),
    defineField({
      name: 'items',
      title: 'Numbers',
      type: 'array',
      validation: (rule) => rule.required().min(2).max(4),
      of: [
        defineArrayMember({
          name: 'statItem',
          title: 'Number',
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'The figure as it should appear, like "12,400" or "38%".',
              validation: (rule) => rule.required().max(12),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'What the number measures, in a few words.',
              validation: (rule) => rule.required().max(80),
            }),
          ],
          preview: {
            select: {title: 'value', subtitle: 'label'},
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'heading', items: 'items'},
    prepare: ({title, items}) => ({
      title: title || 'Stats',
      subtitle: `Stats · ${Array.isArray(items) ? items.length : 0} numbers`,
    }),
  },
})
