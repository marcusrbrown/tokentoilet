import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig(
  {
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

      // Design System Enforcement Rules
      // Encourage design system component imports over external libraries
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@headlessui/*', '@radix-ui/*', '@mantine/*', '@chakra-ui/*'],
              message:
                'Use Token Toilet design system components from @/components/ui/* instead of external UI libraries.',
            },
          ],
          paths: [
            {
              name: 'react-hot-toast',
              importNames: ['toast'],
              message: 'Use the Toast component from @/components/ui/toast instead of react-hot-toast directly.',
            },
          ],
        },
      ],

      // Discourage raw HTML elements in favor of design system components
      'no-restricted-syntax': [
        'error',
        // Discourage raw button elements in application code only (exclude design system and tests)
        {
          selector:
            'JSXElement[openingElement.name.name="button"]:not([openingElement.attributes.*.name.name="data-testid"]):not([openingElement.attributes.*.name.name="type"])',
          message:
            'Use the Button component from @/components/ui/button instead of raw <button> elements. This ensures consistent styling and Web3 integration.',
        },
        // Discourage raw input elements
        {
          selector:
            'JSXElement[openingElement.name.name="input"]:not([openingElement.attributes.*.name.name="data-testid"])',
          message:
            'Use the Input or TokenInput components from @/components/ui/* instead of raw <input> elements. This ensures proper validation and design system integration.',
        },
        // Discourage certain div patterns that should use Card
        {
          selector:
            'JSXElement[openingElement.name.name="div"][openingElement.attributes.*.value.value*="bg-white"][openingElement.attributes.*.value.value*="backdrop-blur"]',
          message:
            'Use the Card component from @/components/ui/card instead of manual glass morphism div elements. This ensures consistent elevation and theming.',
        },
        // Discourage manual badge styling
        {
          selector:
            'JSXElement[openingElement.name.name="span"][openingElement.attributes.*.value.value*="bg-"][openingElement.attributes.*.value.value*="rounded"]',
          message: 'Use the Badge component from @/components/ui/badge for status indicators and labels.',
        },
        // Discourage manual skeleton styling
        {
          selector:
            'JSXElement[openingElement.name.name="div"][openingElement.attributes.*.value.value*="animate-pulse"]',
          message: 'Use the Skeleton component from @/components/ui/skeleton for loading states.',
        },
      ],

      // Development quality rules
      'prefer-const': 'error',
      'no-console': ['warn', {allow: ['warn', 'error']}],
    },
  },
  // Override rules for design system components themselves - they need to use raw elements
  {
    files: ['components/ui/**/*.tsx', 'components/ui/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['**/*.test.tsx', '**/*.test.ts', '**/*.spec.tsx', '**/*.spec.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
)
