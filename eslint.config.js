import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import pluginRouter from '@tanstack/eslint-plugin-router'
import pluginQuery from '@tanstack/eslint-plugin-query'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      'dist',
      '.output',
      '.wrangler',
      '.tanstack',
      'playwright-report',
      'test-results',
      'src/routeTree.gen.ts',
      'studio',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  ...pluginRouter.configs['flat/recommended'],
  ...pluginQuery.configs['flat/recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
)
