import {ImageIcon} from '@sanity/icons/Image'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {isLinkTarget} from '../validation'

export const reportBody = defineType({
  name: 'reportBody',
  title: 'Report body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Paragraph', value: 'normal'},
        {title: 'Heading 2', value: 'h2'},
        {title: 'Heading 3', value: 'h3'},
        {title: 'Heading 4', value: 'h4'},
      ],
      lists: [
        {title: 'Bullets', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'Destination',
                type: 'string',
                description: 'A site path like /reports, or a full https:// address.',
                validation: (rule) => rule.required().custom(isLinkTarget),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      name: 'image',
      title: 'Image',
      type: 'image',
      icon: ImageIcon,
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe what the image shows for people who cannot see it.',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          description: 'Optional. Shown under the image.',
        }),
      ],
    }),
    defineArrayMember({type: 'pullQuote'}),
  ],
})
