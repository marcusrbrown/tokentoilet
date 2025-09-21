import type {Decorator, Meta, StoryObj} from '@storybook/react'

import {WagmiAdapter} from '@reown/appkit-adapter-wagmi'
import {arbitrum, mainnet, polygon, type AppKitNetwork} from '@reown/appkit/networks'
import {createAppKit} from '@reown/appkit/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {http, WagmiProvider} from 'wagmi'

import {
  FailedTransactionQueue,
  PendingTransactionQueue,
  TransactionQueue,
  TransactionQueueSummary,
} from './transaction-queue'

// Set up environment variables for Storybook before any imports that use env.ts
if (globalThis.process === undefined) {
  globalThis.process = {
    env: {
      NEXT_PUBLIC_APP_URL: 'http://localhost:6006',
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: 'a1b2c3d4e5f6789012345678901234567890abcd',
      NEXT_PUBLIC_ENABLE_ANALYTICS: 'false',
      NEXT_PUBLIC_ENABLE_TESTNETS: 'false',
      NODE_ENV: 'development',
      SKIP_ENV_VALIDATION: 'true',
    },
  } as unknown as NodeJS.Process
}

// Define networks for Storybook with proper typing
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, polygon, arbitrum]

// Create Wagmi Adapter for Storybook with mock config
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: 'a1b2c3d4e5f6789012345678901234567890abcd',
  ssr: false,
  transports: {
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/demo'),
    [polygon.id]: http('https://polygon-mainnet.g.alchemy.com/v2/demo'),
    [arbitrum.id]: http('https://arb-mainnet.g.alchemy.com/v2/demo'),
  },
})

// Initialize AppKit for Storybook
let appKitInitialized = false
if (typeof window !== 'undefined' && !appKitInitialized) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId: 'a1b2c3d4e5f6789012345678901234567890abcd',
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
    queries: {retry: false},
    mutations: {retry: false},
  },
})

// Provider decorator with mocked hooks
const withWeb3Provider: Decorator = story => {
  // Note: In a real implementation, the transaction queue would be mocked at the module level
  // For Storybook purposes, we provide sample data through the decorator
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={testQueryClient}>{story()}</QueryClientProvider>
    </WagmiProvider>
  )
}

const meta: Meta<typeof TransactionQueue> = {
  title: 'Web3/TransactionQueue',
  component: TransactionQueue,
  decorators: [withWeb3Provider],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A comprehensive transaction queue component for managing and displaying Web3 transactions. Shows pending, confirmed, and failed transactions with filtering, statistics, and management actions. Part of the Token Toilet transaction monitoring system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    chainId: {
      control: {type: 'select'},
      options: [undefined, 1, 137, 42161],
      description: 'Filter transactions by specific chain ID',
    },
    statusFilter: {
      control: {type: 'select'},
      options: [undefined, 'pending', 'confirmed', 'failed', 'cancelled', 'replaced', 'timeout'],
      description: 'Filter transactions by status',
    },
    typeFilter: {
      control: {type: 'select'},
      options: [undefined, 'transfer', 'approval', 'swap', 'dispose', 'donate', 'unknown'],
      description: 'Filter transactions by type',
    },
    maxItems: {
      control: {type: 'number'},
      description: 'Maximum number of transactions to display',
    },
    showStats: {
      control: {type: 'boolean'},
      description: 'Show transaction queue statistics',
    },
    showActions: {
      control: {type: 'boolean'},
      description: 'Show transaction action buttons',
    },
    showDetails: {
      control: {type: 'boolean'},
      description: 'Show detailed transaction information',
    },
    variant: {
      control: {type: 'select'},
      options: ['default', 'compact', 'minimal'],
      description: 'Visual style variant for transaction cards',
    },
    hideWhenEmpty: {
      control: {type: 'boolean'},
      description: 'Hide the queue when no transactions are present',
    },
    onRemoveTransaction: {
      action: 'transaction-removed',
      description: 'Callback when a transaction is removed',
    },
    onTransactionClick: {
      action: 'transaction-clicked',
      description: 'Callback when a transaction is clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default transaction queue with all transactions
export const Default: Story = {
  args: {
    showStats: true,
    showActions: true,
    showDetails: false,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default transaction queue showing all transactions with statistics and actions.',
      },
    },
  },
}

// Pending transactions only
export const PendingOnly: Story = {
  args: {
    statusFilter: 'pending',
    showStats: true,
    showActions: true,
    variant: 'default',
    title: 'Pending Transactions',
  },
  parameters: {
    docs: {
      description: {
        story: 'Transaction queue filtered to show only pending transactions.',
      },
    },
  },
}

// Failed transactions only
export const FailedOnly: Story = {
  args: {
    statusFilter: 'failed',
    showStats: true,
    showActions: true,
    variant: 'default',
    title: 'Failed Transactions',
  },
  parameters: {
    docs: {
      description: {
        story: 'Transaction queue filtered to show only failed transactions with retry options.',
      },
    },
  },
}

// Chain-specific transactions
export const ChainSpecific: Story = {
  args: {
    chainId: 137,
    showStats: true,
    showActions: true,
    variant: 'default',
    title: 'Polygon Transactions',
  },
  parameters: {
    docs: {
      description: {
        story: 'Transaction queue filtered to show only Polygon (chain ID 137) transactions.',
      },
    },
  },
}

// Compact variant
export const CompactVariant: Story = {
  args: {
    variant: 'compact',
    showStats: false,
    showActions: true,
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact transaction queue variant with limited items for space-constrained layouts.',
      },
    },
  },
}

// Specialized queue components
export const SpecializedQueues: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Specialized Queue Components</div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Transaction Queue Summary</h3>
          <TransactionQueueSummary className="max-w-md" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Pending Transaction Queue</h3>
          <PendingTransactionQueue showActions />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Failed Transaction Queue</h3>
          <FailedTransactionQueue showActions />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Specialized transaction queue components for specific use cases and statuses.',
      },
    },
  },
}

// Empty state
export const EmptyState: Story = {
  render: () => {
    // Note: In a real implementation, you would mock the transaction queue at the module level
    // For this story, we would need to adjust the queue props to show empty state
    return (
      <div className="max-w-2xl mx-auto p-6">
        <TransactionQueue
          showStats
          showActions
          title="Transaction History"
          emptyMessage="No transactions found. Start by disposing some tokens!"
        />
      </div>
    )
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Transaction queue empty state when no transactions are present.',
      },
    },
  },
}

// Transaction type filtering
export const TypeFiltering: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Transaction Type Filtering</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Disposal Transactions</h3>
          <TransactionQueue typeFilter="dispose" variant="compact" showActions title="Token Disposals" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Donation Transactions</h3>
          <TransactionQueue typeFilter="donate" variant="compact" showActions title="Charity Donations" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Approval Transactions</h3>
          <TransactionQueue typeFilter="approval" variant="compact" showActions title="Token Approvals" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Transfer Transactions</h3>
          <TransactionQueue typeFilter="transfer" variant="compact" showActions title="Token Transfers" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Transaction queue with different type filters to show specific transaction categories.',
      },
    },
  },
}

// Web3 DeFi dashboard use case
export const Web3DeFiDashboard: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Token Toilet Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your token disposal and charity contribution transactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">All Transactions</h3>
          <TransactionQueue showStats showActions showDetails variant="default" maxItems={10} />
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Queue Summary</h3>
            <TransactionQueueSummary />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Pending Actions</h3>
            <PendingTransactionQueue variant="compact" showActions />
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        * Real-time transaction monitoring with automatic status updates
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Complete Web3 DeFi dashboard showing transaction queue integration in the Token Toilet application.',
      },
    },
  },
}
