import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem().singleton('siteSettings'),
      S.divider(),
      S.documentTypeListItem('page').title('Pages'),
      S.documentTypeListItem('report').title('Reports'),
      S.divider(),
      S.documentTypeListItem('redirect').title('Redirects'),
    ])
