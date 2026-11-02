import {CogIcon} from '@sanity/icons/Cog'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'navigation', title: 'Navigation', default: true},
    {name: 'seo', title: 'SEO defaults'},
  ],
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site name',
      type: 'string',
      description: 'Shown in the header and at the end of every browser tab title.',
      group: 'navigation',
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: 'navLinks',
      title: 'Header links',
      type: 'array',
      description: 'The main menu, in order. Keep it to six or fewer so it fits on one line.',
      group: 'navigation',
      of: [defineArrayMember({type: 'link'})],
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: 'footerLinks',
      title: 'Footer links',
      type: 'array',
      description: 'Links at the bottom of every page.',
      group: 'navigation',
      of: [defineArrayMember({type: 'link'})],
      validation: (rule) => rule.max(10),
    }),
    defineField({
      name: 'defaultSeoTitle',
      title: 'Default search title',
      type: 'string',
      description: 'Used when a page has no search title of its own.',
      group: 'seo',
      validation: (rule) =>
        rule.required().max(60).warning('Search engines cut titles after about 60 characters'),
    }),
    defineField({
      name: 'defaultSeoDescription',
      title: 'Default search description',
      type: 'text',
      rows: 3,
      description: 'Used when a page has no search description of its own.',
      group: 'seo',
      validation: (rule) =>
        rule.required().max(160).warning('Search engines cut descriptions after about 160 characters'),
    }),
    defineField({
      name: 'defaultOgImage',
      title: 'Default social sharing image',
      type: 'accessibleImage',
      description: 'Used when a shared page has no image of its own. Use 1200 × 630 pixels.',
      group: 'seo',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Site settings'}),
  },
})
