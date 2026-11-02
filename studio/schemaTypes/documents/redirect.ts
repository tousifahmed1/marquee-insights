import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {defineField, defineType} from 'sanity'

import {isLinkTarget, isSitePath} from '../validation'

export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  icon: ArrowRightIcon,
  description: 'Send visitors from an old address to a new one.',
  fields: [
    defineField({
      name: 'from',
      title: 'From path',
      type: 'string',
      description: 'The old address on this site, like /reports/old-title.',
      validation: (rule) =>
        rule
          .required()
          .custom(isSitePath)
          .custom(async (value, context) => {
            if (!value) return true
            const id = context.document?._id.replace(/^drafts\./, '')
            const client = context.getClient({apiVersion: '2026-11-01'})
            const clash = await client.fetch<number>(
              'count(*[_type == "redirect" && from == $from && !(_id in [$id, $draftId])])',
              {from: value, id, draftId: `drafts.${id}`},
            )
            return clash === 0 || 'Another redirect already starts from this path'
          }),
    }),
    defineField({
      name: 'to',
      title: 'To path',
      type: 'string',
      description: 'Where visitors should land: a site path, or a full https:// address.',
      validation: (rule) =>
        rule
          .required()
          .custom(isLinkTarget)
          .custom((value, context) => {
            const from = (context.document as {from?: string} | undefined)?.from
            return !value || value !== from || 'A redirect cannot point to itself'
          }),
    }),
    defineField({
      name: 'permanent',
      title: 'Permanent',
      type: 'boolean',
      description:
        'On for a page that has moved for good (308). Off for a temporary move (307), so search engines keep the old address.',
      initialValue: true,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {from: 'from', to: 'to', permanent: 'permanent'},
    prepare: ({from, to, permanent}) => ({
      title: `${from || '?'} → ${to || '?'}`,
      subtitle: permanent ? 'Permanent' : 'Temporary',
    }),
  },
})
