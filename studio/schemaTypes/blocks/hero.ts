import {PresentationIcon} from '@sanity/icons/Presentation'
import {defineField, defineType} from 'sanity'

export const hero = defineType({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  icon: PresentationIcon,
  description: 'The opening section of a page. Use once, at the top.',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Optional. A short line above the heading, like "Autumn 2026 panel".',
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The main message of the page. Becomes the page’s only H1.',
      validation: (rule) => rule.required().max(90),
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 3,
      description: 'One or two sentences that back up the heading.',
      validation: (rule) => rule.max(280),
    }),
    defineField({
      name: 'primaryCta',
      title: 'Primary button',
      type: 'link',
      description: 'Optional. The main action you want visitors to take.',
    }),
    defineField({
      name: 'secondaryCta',
      title: 'Secondary button',
      type: 'link',
      description: 'Optional. A lower-key alternative, shown as an outline button.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'accessibleImage',
      description: 'Optional. Shown beside the text on wide screens.',
    }),
  ],
  preview: {
    select: {title: 'heading', subtitle: 'eyebrow', media: 'image'},
    prepare: ({title, subtitle, media}) => ({
      title: title || 'Untitled hero',
      subtitle: subtitle ? `Hero · ${subtitle}` : 'Hero',
      media,
    }),
  },
})
