import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {studioEnv} from './env'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Marquee Insights',

  projectId: studioEnv.projectId,
  dataset: studioEnv.dataset,

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
