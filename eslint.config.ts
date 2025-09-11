import {defineConfig, GLOB_SRC, type Config} from '@bfra.me/eslint-config'
import pluginNext from '@next/eslint-plugin-next'

const normalizeRules = (rules: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(rules).map(([key, value]) => [key, typeof value === 'string' ? [value] : value]),
  )
}

export default defineConfig(
  {
    name: 'tokentoilet',
    ignores: ['.github/copilot-instructions.md', '.github/prompts', 'llms.txt', '.ai/'],
    typescript: {
      tsconfigPath: './tsconfig.json',
    },
  },
  {
    name: 'tokentoilet/next/setup',
    plugins: {'@next/next': pluginNext},
  } as Config,
  {
    name: 'tokentoilet/next/rules',
    files: [GLOB_SRC],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: 'module',
    },
    rules: {
      ...normalizeRules(pluginNext.configs.recommended.rules),
      ...normalizeRules(pluginNext.configs['core-web-vitals'].rules),
      '@next/next/no-img-element': 'error',
      '@typescript-eslint/no-use-before-define': 'off',
      // Next.js build says 'node:process' is not handled by plugins
      'node/prefer-global/process': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
)
