import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import {defineCliConfig} from 'sanity/cli'

const rootEnvFile = resolve(process.cwd(), '../.env')
if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile)

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },
  deployment: {
    autoUpdates: true,
  },
})
