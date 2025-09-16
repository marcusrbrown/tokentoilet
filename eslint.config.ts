import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: 'tokentoilet',
  ignores: ['.github/copilot-instructions.md', '.github/prompts', 'AGENTS.md', 'llms.txt', '.ai/', 'docs/**/*.md'],
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  react: true,
  nextjs: true,
  rules: {
    '@next/next/no-img-element': 'error',
    '@typescript-eslint/no-use-before-define': 'off',
    // Next.js build says 'node:process' is not handled by plugins
    'node/prefer-global/process': 'off',
  },
})
