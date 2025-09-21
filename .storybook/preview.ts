import type {Preview} from '@storybook/react'
import {WagmiAdapter} from '@reown/appkit-adapter-wagmi'
import {arbitrum, mainnet, polygon, type AppKitNetwork} from '@reown/appkit/networks'
import {createAppKit} from '@reown/appkit/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ThemeProvider} from 'next-themes'
import React from 'react'
import {http, WagmiProvider} from 'wagmi'
import './storybook.css'

// Set up environment variables for Storybook before any imports that use env.ts
if (globalThis.process === undefined) {
  globalThis.process = {
    env: {
      NEXT_PUBLIC_APP_URL: 'http://localhost:6006',
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: 'a1b2c3d4e5f6789012345678901234567890abcd',
      NEXT_PUBLIC_ENABLE_ANALYTICS: 'false',
      NEXT_PUBLIC_ENABLE_TESTNETS: 'false',
      NODE_ENV: 'development',
      SKIP_ENV_VALIDATION: 'true', // This will skip env validation in Storybook
    },
  } as unknown as NodeJS.Process
}

// Define networks for Storybook with proper typing
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, polygon, arbitrum]

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: 'a1b2c3d4e5f6789012345678901234567890abcd', // Mock project ID
  ssr: false, // Disable SSR for Storybook
  transports: {
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/demo'),
    [polygon.id]: http('https://polygon-mainnet.g.alchemy.com/v2/demo'),
    [arbitrum.id]: http('https://arb-mainnet.g.alchemy.com/v2/demo'),
  },
})

// Initialize AppKit for Storybook to prevent useAppKit errors
let appKitInitialized = false
if (typeof window !== 'undefined' && !appKitInitialized) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId: 'a1b2c3d4e5f6789012345678901234567890abcd', // Mock project ID
    metadata: {
      name: 'TokenToilet Storybook',
      description: 'Storybook for TokenToilet components',
      url: 'http://localhost:6006',
      icons: ['/toilet.svg'],
    },
    features: {
      analytics: false,
    },
    themeMode: 'light',
    themeVariables: {
      '--w3m-font-family': 'Inter, sans-serif',
      '--w3m-accent': 'rgb(124 58 237)',
      '--w3m-border-radius-master': '8px',
    },
  })
  appKitInitialized = true
}

const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {retry: false},
    mutations: {retry: false},
  },
})

const preview: Preview = {
  parameters: {
    // Next.js App Router support
    nextjs: {
      appDirectory: true,
    },
    // Actions configuration
    actions: {argTypesRegex: '^on[A-Z].*'},
    // Controls configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Layout configuration
    layout: 'centered',
    // Backgrounds configuration for light/dark theme testing
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'violet-light',
          value: '#f5f3ff',
        },
        {
          name: 'violet-dark',
          value: '#2d1b69',
        },
      ],
    },
    // Viewport configuration for responsive design testing
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
    },
  },
  // Global decorators
  decorators: [
    // Web3 provider decorator - must come first to provide context
    (StoryComponent, _context) => {
      return React.createElement(
        WagmiProvider,
        {config: wagmiAdapter.wagmiConfig},
        React.createElement(QueryClientProvider, {client: testQueryClient}, React.createElement(StoryComponent)),
      )
    },
    // Theme provider decorator for dark/light mode support
    (StoryComponent, context) => {
      const theme = (context.globals.theme as string) || 'light'

      return React.createElement(
        ThemeProvider,
        {
          attribute: 'class',
          defaultTheme: 'light',
          enableSystem: false,
          forcedTheme: theme,
        },
        React.createElement(
          'div',
          {
            className: `min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 dark:from-slate-900 dark:to-violet-900 p-4`,
            'data-theme': theme,
          },
          React.createElement(StoryComponent),
        ),
      )
    },
  ],
  // Global types for toolbar controls
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          {value: 'light', icon: 'sun', title: 'Light'},
          {value: 'dark', icon: 'moon', title: 'Dark'},
        ],
        dynamicTitle: true,
      },
    },
  },
}

export default preview
