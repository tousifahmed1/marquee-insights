export const SANITY_API_VERSION = '2026-11-01'

export const REPORTS_PAGE_SIZE = 6

export function getSanityConfig() {
  const projectId = import.meta.env.SANITY_STUDIO_PROJECT_ID
  const dataset = import.meta.env.SANITY_STUDIO_DATASET
  if (!projectId || !dataset) {
    throw new Error('Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET')
  }
  return { projectId, dataset, apiVersion: SANITY_API_VERSION }
}
