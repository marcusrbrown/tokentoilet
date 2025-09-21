import type {QueuedTransaction} from '@/lib/web3/transaction-queue'
import type {Meta, StoryObj} from '@storybook/react'
import type {Hash} from 'viem'

import {TransactionStatusCard} from './transaction-status'

// Sample transaction data for stories
const SAMPLE_TRANSACTIONS: QueuedTransaction[] = [
  {
    id: 'tx-pending-001',
    hash: '0x742d35cc6644c35532b7c3b8b2b1aab1b0c0c935742d35cc6644c35532b7c3b8' as Hash,
    chainId: 1,
    status: 'pending',
    type: 'dispose',
    title: 'Dispose SHIB Tokens',
    description: 'Disposing 1,000 SHIB tokens to charity',
    value: BigInt('1000000000000000000000'),
    submittedAt: Date.now() - 2 * 60 * 1000, // 2 minutes ago
    retryCount: 0,
    to: '0xa0b86a33e6441bb6bb0874b298f3a4e5e9b9b0e5',
    from: '0x742d35Cc6644C35532B7c3B8b2b1Aab1B0c0c935',
  },
  {
    id: 'tx-confirmed-001',
    hash: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f9841f9840a85d5af5bf1d1762f9' as Hash,
    chainId: 137,
    status: 'confirmed',
    type: 'donate',
    title: 'Charity Donation',
    description: 'Donated 50 DAI to selected charity',
    value: BigInt('50000000000000000000'),
    submittedAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
    confirmedAt: Date.now() - 58 * 60 * 1000, // 58 minutes ago
    retryCount: 0,
    blockNumber: BigInt('45123456'),
    gasUsed: BigInt('85000'),
    to: '0x6b175474e89094c44da98b954eedeac495271d0f',
    from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  },
  {
    id: 'tx-failed-001',
    hash: '0x8076c74c5e3f5852037f31ff0093eeb8c8add8d38076c74c5e3f5852037f31ff' as Hash,
    chainId: 42161,
    status: 'failed',
    type: 'approval',
    title: 'Token Approval Failed',
    description: 'Failed to approve SAFEMOON tokens',
    value: BigInt('0'),
    submittedAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    retryCount: 2,
    error: new Error('Transaction reverted: insufficient balance'),
    to: '0xa0b86a33e6441bb6bb0874b298f3a4e5e9b9b0e5',
    from: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  },
  {
    id: 'tx-timeout-001',
    hash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234' as Hash,
    chainId: 1,
    status: 'timeout',
    type: 'transfer',
    title: 'Transfer Timeout',
    description: 'Token transfer timed out',
    value: BigInt('25000000000000000000'),
    submittedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
    retryCount: 3,
    to: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    from: '0x742d35Cc6644C35532B7c3B8b2b1Aab1B0c0c935',
  },
]

const meta: Meta<typeof TransactionStatusCard> = {
  title: 'Web3/TransactionStatusCard',
  component: TransactionStatusCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A transaction status card component for displaying individual queued transactions with status indicators, actions, and detailed information. Part of the Token Toilet transaction monitoring system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: ['default', 'compact', 'minimal'],
      description: 'Visual style variant of the transaction status card',
    },
    status: {
      control: {type: 'select'},
      options: ['pending', 'confirmed', 'failed', 'cancelled', 'replaced', 'timeout'],
      description: 'Transaction status that affects visual appearance',
    },
    showActions: {
      control: {type: 'boolean'},
      description: 'Show transaction action buttons (remove, retry)',
    },
    showDetails: {
      control: {type: 'boolean'},
      description: 'Show detailed transaction information',
    },
    showCopy: {
      control: {type: 'boolean'},
      description: 'Show copy button for transaction hash',
    },
    showExplorer: {
      control: {type: 'boolean'},
      description: 'Show link to block explorer',
    },
    onRemove: {
      action: 'transaction-removed',
      description: 'Callback when transaction is removed',
    },
    onTransactionClick: {
      action: 'transaction-clicked',
      description: 'Callback when transaction card is clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default pending transaction
export const Default: Story = {
  args: {
    transaction: SAMPLE_TRANSACTIONS[0],
    variant: 'default',
    showActions: true,
    showDetails: false,
    showCopy: true,
    showExplorer: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default transaction status card showing a pending token disposal transaction.',
      },
    },
  },
}

// All transaction status variants
export const StatusVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Transaction Status Variants</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Pending Transaction</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[0]} showActions showDetails showCopy showExplorer />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Confirmed Transaction</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[1]} showActions showDetails showCopy showExplorer />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Failed Transaction</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[2]} showActions showDetails showCopy showExplorer />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Timeout Transaction</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[3]} showActions showDetails showCopy showExplorer />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All transaction status variants showing different states with appropriate styling and icons.',
      },
    },
  },
}

// All card variants
export const CardVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Transaction Card Variants</div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Default Variant</h3>
          <TransactionStatusCard
            transaction={SAMPLE_TRANSACTIONS[0]}
            variant="default"
            showActions
            showCopy
            showExplorer
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Compact Variant</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[1]} variant="compact" showCopy showExplorer />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Minimal Variant</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[2]} variant="minimal" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All available card variants with different levels of detail and visual treatment.',
      },
    },
  },
}

// Transaction types showcase
export const TransactionTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Transaction Types</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Token Disposal</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[0]} showDetails showCopy showExplorer />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Charity Donation</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[1]} showDetails showCopy showExplorer />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Token Approval</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[2]} showDetails showCopy showExplorer />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Token Transfer</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[3]} showDetails showCopy showExplorer />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Different transaction types supported by the Token Toilet application.',
      },
    },
  },
}

// Multi-chain support
export const MultiChain: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Multi-Chain Transactions</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Ethereum Mainnet</h3>
          <TransactionStatusCard
            transaction={{...SAMPLE_TRANSACTIONS[0], chainId: 1}}
            showDetails
            showCopy
            showExplorer
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Polygon</h3>
          <TransactionStatusCard
            transaction={{...SAMPLE_TRANSACTIONS[1], chainId: 137}}
            showDetails
            showCopy
            showExplorer
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Arbitrum</h3>
          <TransactionStatusCard
            transaction={{...SAMPLE_TRANSACTIONS[2], chainId: 42161}}
            showDetails
            showCopy
            showExplorer
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Transactions across different blockchain networks with appropriate explorer links.',
      },
    },
  },
}

// Interactive features
export const InteractiveFeatures: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Interactive Features</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">With Actions</h3>
          <TransactionStatusCard
            transaction={SAMPLE_TRANSACTIONS[0]}
            showActions
            showCopy
            showExplorer
            onRemove={undefined}
            onTransactionClick={undefined}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Copy & Explorer Only</h3>
          <TransactionStatusCard
            transaction={SAMPLE_TRANSACTIONS[1]}
            showCopy
            showExplorer
            onTransactionClick={undefined}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Read-only</h3>
          <TransactionStatusCard transaction={SAMPLE_TRANSACTIONS[2]} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Different levels of interactivity and available actions for transaction cards.',
      },
    },
  },
}

// Web3 DeFi use case
export const Web3DeFiUseCase: Story = {
  render: () => (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
        <p className="text-gray-600 dark:text-gray-400">Your token disposal activity</p>
      </div>

      <div className="space-y-3">
        {SAMPLE_TRANSACTIONS.slice(0, 3).map(transaction => (
          <TransactionStatusCard
            key={transaction.id}
            transaction={transaction}
            variant="compact"
            showCopy
            showExplorer
            onTransactionClick={undefined}
          />
        ))}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Track all your charitable contributions in real-time
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Complete Web3 DeFi use case showing transaction monitoring in the Token Toilet application context.',
      },
    },
  },
}
