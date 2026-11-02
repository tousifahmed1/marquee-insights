import {RocketIcon} from '@sanity/icons/Rocket'
import {defineField, defineType} from 'sanity'

export const ctaBanner = defineType({
  name: 'ctaBanner',
  title: 'Call to action banner',
  type: 'object',
  icon: RocketIcon,
  description: 'A closing prompt with one button. Usually the last section on a page.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (rule) => rule.required().max(90),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 3,
      description: 'Optional. One sentence on why to act now.',
      validation: (rule) => rule.max(220),
    }),
    defineField({
      name: 'button',
      title: 'Button',
      type: 'link',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare: ({title}) => ({title: title || 'Untitled banner', subtitle: 'Call to action banner'}),
  },
})
