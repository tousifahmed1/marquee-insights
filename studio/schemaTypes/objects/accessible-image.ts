import {defineField, defineType} from 'sanity'

import {requiredWhenImageSet} from '../validation'

export const accessibleImage = defineType({
  name: 'accessibleImage',
  title: 'Image',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'Describe what the image shows for people who cannot see it. Required whenever an image is set.',
      validation: (rule) => rule.custom(requiredWhenImageSet),
    }),
  ],
})
