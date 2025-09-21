import type {Decorator, Meta, StoryObj} from '@storybook/react'
import {WagmiAdapter} from '@reown/appkit-adapter-wagmi'
import {arbitrum, mainnet, polygon, type AppKitNetwork} from '@reown/appkit/networks'
import {createAppKit} from '@reown/appkit/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {http, WagmiProvider} from 'wagmi'
import {WalletConnectionModal} from './wallet-connection-modal'

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

// Create Wagmi Adapter for Storybook with mock config
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

// Initialize AppKit for Storybook (this prevents the useAppKit error)
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

// Create test QueryClient with retry disabled for faster feedback
const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// Provider decorator using actual providers with proper AppKit initialization
const withWeb3Provider: Decorator = story => (
  <WagmiProvider config={wagmiAdapter.wagmiConfig}>
    <QueryClientProvider client={testQueryClient}>{story()}</QueryClientProvider>
  </WagmiProvider>
)

const meta: Meta<typeof WalletConnectionModal> = {
  title: 'Web3/WalletConnectionModal',
  component: WalletConnectionModal,
  decorators: [withWeb3Provider],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Enhanced wallet connection modal with provider selection, network switching, and persistence options. Built for Token Toilet with violet branding and glass morphism design.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls modal visibility',
    },
    showNetworkSelection: {
      control: 'boolean',
      description: 'Show network selection section',
    },
    showPersistenceOptions: {
      control: 'boolean',
      description: 'Show auto-reconnect persistence options',
    },
    onClose: {action: 'onClose'},
    onConnectionSuccess: {action: 'onConnectionSuccess'},
    onConnectionError: {action: 'onConnectionError'},
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Basic modal with all features
export const Default: Story = {
  args: {
    open: true,
    showNetworkSelection: true,
    showPersistenceOptions: true,
  },
}

// Minimal modal with just provider selection
export const MinimalModal: Story = {
  args: {
    open: true,
    showNetworkSelection: false,
    showPersistenceOptions: false,
  },
}

// Network selection focused
export const NetworkSelectionOnly: Story = {
  args: {
    open: true,
    showNetworkSelection: true,
    showPersistenceOptions: false,
  },
}

// Persistence options focused
export const PersistenceOptionsOnly: Story = {
  args: {
    open: true,
    showNetworkSelection: false,
    showPersistenceOptions: true,
  },
}

// Closed modal (for testing visibility toggle)
export const Closed: Story = {
  args: {
    open: false,
    showNetworkSelection: true,
    showPersistenceOptions: true,
  },
}
