import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig(
  {
    name: 'tokentoilet',
    ignores: [
      '.github/copilot-instructions.md',
      '.github/prompts',
      'AGENTS.md',
      'llms.txt',
      '.ai/',
      'docs/**/*.md',
      'CONTRIBUTING.md',
      'CHANGELOG.md',
    ],
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

      // Design System & Web3 Pattern Enforcement Rules
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
            // Restrict direct wagmi hooks in favor of useWallet abstraction
            {
              name: 'wagmi',
              importNames: ['useAccount', 'useBalance', 'useChainId', 'useConnect', 'useDisconnect', 'useSwitchChain'],
              message:
                'Use the useWallet hook from @/hooks/use-wallet instead of direct wagmi hooks for better error handling and consistency.',
            },
            {
              name: '@reown/appkit/react',
              importNames: ['useAppKitAccount', 'useAppKitNetwork'],
              message:
                'Use the useWallet hook from @/hooks/use-wallet instead of direct AppKit hooks for consistent wallet abstraction.',
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
        // Web3 Error Handling Pattern Enforcement
        {
          selector: 'ThrowStatement:has(CallExpression[callee.property.name="connect"])',
          message:
            'Web3 connection operations should use console.error + graceful fallbacks instead of throwing. Follow pattern: connect().catch(error => console.error("Failed to connect:", error))',
        },
        {
          selector: 'ThrowStatement:has(CallExpression[callee.property.name="disconnect"])',
          message:
            'Web3 disconnection operations should use console.error + graceful fallbacks instead of throwing. Follow pattern: disconnect().catch(error => console.error("Failed to disconnect:", error))',
        },
      ],

      // Development quality rules
      'prefer-const': 'error',
      'no-console': ['warn', {allow: ['warn', 'error']}],
    },
  },
  // Override rules for hooks that need to use direct wagmi hooks
  {
    files: ['hooks/use-wallet.ts', 'hooks/use-*.ts', 'lib/web3/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // Override rules for Web3 provider components that need direct access
  {
    files: ['components/web3/web3-provider.tsx', 'lib/web3/config.ts'],
    rules: {
      'no-restricted-imports': 'off',
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
  // Override rules for test files - they need mock patterns and direct imports
  {
    files: ['**/*.test.tsx', '**/*.test.ts', '**/*.spec.tsx', '**/*.spec.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  // Enforce 'use client' directive for Web3 components
  {
    files: ['components/web3/**/*.tsx'],
    ignores: ['components/web3/**/*.test.tsx', 'components/web3/**/*.stories.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program:not(:has(Literal[value="use client"]))',
          message:
            'Web3 components must include "use client" directive at the top of the file for client-side wallet interactions.',
        },
      ],
    },
  },
)
