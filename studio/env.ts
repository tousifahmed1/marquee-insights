const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

if (!projectId || !dataset) {
  throw new Error('Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET in the root .env file')
}

export const studioEnv = {projectId, dataset}
