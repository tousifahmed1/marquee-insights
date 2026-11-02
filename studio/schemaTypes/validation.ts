import type {CustomValidator} from 'sanity'

export const isLinkTarget: CustomValidator<string | undefined> = (value) => {
  if (!value) return true
  if (/^\/(?!\/)/.test(value) || /^https?:\/\//.test(value) || value.startsWith('mailto:')) {
    return true
  }
  return 'Use a site path like /reports, a full https:// address or a mailto: link'
}

export const isSitePath: CustomValidator<string | undefined> = (value) => {
  if (!value) return true
  if (!/^\/(?!\/)/.test(value)) return 'Start with a single slash, like /old-page'
  if (/[?#\s]/.test(value)) return 'Use the path only, without spaces, query strings or #anchors'
  return true
}

export const requiredWhenImageSet: CustomValidator<string | undefined> = (value, context) => {
  const parent = context.parent as {asset?: unknown} | undefined
  if (parent?.asset && !value?.trim()) {
    return 'Describe the image for people using screen readers'
  }
  return true
}
