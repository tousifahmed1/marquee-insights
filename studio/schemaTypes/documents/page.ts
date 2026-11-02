import {DocumentIcon} from '@sanity/icons/Document'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const SECTION_TYPES = ['hero', 'featureGrid', 'stats', 'quote', 'ctaBanner']

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'For editors and the browser tab. Visitors see the hero heading instead.',
      group: 'content',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      description: 'The page address. Use "home" for the home page, "about" for /about.',
      group: 'content',
      options: {source: 'title', maxLength: 64},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'The page content, top to bottom. Start with a hero.',
      group: 'content',
      of: SECTION_TYPES.map((type) => defineArrayMember({type})),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {title: 'title', slug: 'slug.current'},
    prepare: ({title, slug}) => ({
      title: title || 'Untitled page',
      subtitle: slug === 'home' ? '/' : slug ? `/${slug}` : 'No URL yet',
    }),
  },
})
