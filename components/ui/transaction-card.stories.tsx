import type {Meta, StoryObj} from '@storybook/react'
import {TransactionCard, type TransactionData} from './transaction-card'

// Sample transaction data for stories
const SAMPLE_TRANSACTIONS: TransactionData[] = [
  {
    txHash: '0x742d35cc6644c35532b7c3b8b2b1aab1b0c0c935742d35cc6644c35532b7c3b8',
    chainId: 1,
    user: '0x742d35Cc6644C35532B7c3B8b2b1Aab1B0c0c935',
    actionType: 'disposal',
    tokens: [
      {
        address: '0xa0b86a33e6441bb6bb0874b298f3a4e5e9b9b0e5',
        amount: '1000000000000000000000',
        symbol: 'SHIB',
        name: 'Shiba Inu',
        decimals: 18,
      },
    ],
    timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    status: 'confirmed',
    blockNumber: 18500000,
    gasUsed: '120000',
    confirmations: 12,
  },
  {
    txHash: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f9841f9840a85d5af5bf1d1762f9',
    chainId: 137,
    user: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    actionType: 'contribution',
    tokens: [
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        amount: '50000000000000000000',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
      },
    ],
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    status: 'pending',
    confirmations: 0,
  },
  {
    txHash: '0x8076c74c5e3f5852037f31ff0093eeb8c8add8d38076c74c5e3f5852037f31ff',
    chainId: 42161,
    user: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    actionType: 'approval',
    tokens: [
      {
        address: '0xa0b86a33e6441bb6bb0874b298f3a4e5e9b9b0e5',
        amount: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
        symbol: 'SAFEMOON',
        name: 'SafeMoon',
        decimals: 9,
      },
    ],
    timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    status: 'failed',
    errorMessage: 'Transaction reverted: insufficient balance',
  },
  {
    txHash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
    chainId: 1,
    user: '0x742d35Cc6644C35532B7c3B8b2b1Aab1B0c0c935',
    actionType: 'transfer',
    tokens: [
      {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        amount: '25000000000000000000',
        symbol: 'UNI',
        name: 'Uniswap',
        decimals: 18,
      },
    ],
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
    status: 'confirmed',
    blockNumber: 18495000,
    gasUsed: '85000',
    confirmations: 1250,
  },
]

const meta: Meta<typeof TransactionCard> = {
  title: 'UI/TransactionCard',
  component: TransactionCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A transaction card component for displaying transaction history and status in Web3 DeFi applications. Shows transaction details, status indicators, and provides interactive features like copying transaction hashes and opening block explorer links.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: ['default', 'compact', 'detailed', 'interactive'],
      description: 'Visual style variant of the transaction card',
    },
    status: {
      control: {type: 'select'},
      options: ['pending', 'confirmed', 'failed'],
      description: 'Transaction status that affects visual appearance',
    },
    showDetails: {
      control: {type: 'boolean'},
      description: 'Show detailed transaction information',
    },
    showCopyButton: {
      control: {type: 'boolean'},
      description: 'Show copy button for transaction hash',
    },
    showExplorerLink: {
      control: {type: 'boolean'},
      description: 'Show link to block explorer',
    },
    onClick: {
      action: 'card-clicked',
      description: 'Click handler for interactive variant',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default transaction card story
export const Default: Story = {
  args: {
    transaction: SAMPLE_TRANSACTIONS[0],
    variant: 'default',
    showDetails: false,
    showCopyButton: true,
    showExplorerLink: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default transaction card showing a successful token disposal transaction.',
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
          <TransactionCard transaction={SAMPLE_TRANSACTIONS[1]} showDetails showCopyButton showExplorerLink />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Confirmed Transaction</h3>
          <TransactionCard transaction={SAMPLE_TRANSACTIONS[0]} showDetails showCopyButton showExplorerLink />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Failed Transaction</h3>
          <TransactionCard transaction={SAMPLE_TRANSACTIONS[2]} showDetails showCopyButton showExplorerLink />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All transaction status variants showing pending, confirmed, and failed states.',
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
          <TransactionCard transaction={SAMPLE_TRANSACTIONS[0]} variant="default" showCopyButton showExplorerLink />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Compact Variant</h3>
          <TransactionCard transaction={SAMPLE_TRANSACTIONS[0]} variant="compact" showCopyButton />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Detailed Variant</h3>
          <TransactionCard
            transaction={SAMPLE_TRANSACTIONS[0]}
            variant="detailed"
            showDetails
            showCopyButton
            showExplorerLink
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Interactive Variant (Hover to see effect)
          </h3>
          <TransactionCard
            transaction={SAMPLE_TRANSACTIONS[0]}
            variant="interactive"
            showCopyButton
            showExplorerLink
            onClick={() => {
              /* Handle click */
            }}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All available card variants with different visual treatments and interaction styles.',
      },
    },
  },
}

// Transaction history list
export const TransactionHistory: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Transaction History</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your recent token disposal and charity contribution transactions
        </p>
      </div>

      <div className="space-y-3">
        {SAMPLE_TRANSACTIONS.map(transaction => (
          <TransactionCard
            key={transaction.txHash}
            transaction={transaction}
            variant="compact"
            showCopyButton
            showExplorerLink
          />
        ))}
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Transaction history list showing multiple transactions in a compact format.',
      },
    },
  },
}

// Different action types
export const ActionTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Transaction Action Types</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Token Disposal</h3>
          <TransactionCard transaction={SAMPLE_TRANSACTIONS[0]} showDetails showCopyButton />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Charity Contribution</h3>
          <TransactionCard transaction={SAMPLE_TRANSACTIONS[1]} showDetails showCopyButton />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Token Approval</h3>
          <TransactionCard transaction={SAMPLE_TRANSACTIONS[2]} showDetails showCopyButton />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Token Transfer</h3>
          <TransactionCard transaction={SAMPLE_TRANSACTIONS[3]} showDetails showCopyButton />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Different transaction action types supported by the Token Toilet application.',
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
          <TransactionCard
            transaction={{...SAMPLE_TRANSACTIONS[0], chainId: 1}}
            showDetails
            showCopyButton
            showExplorerLink
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Polygon</h3>
          <TransactionCard
            transaction={{...SAMPLE_TRANSACTIONS[1], chainId: 137}}
            showDetails
            showCopyButton
            showExplorerLink
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Arbitrum</h3>
          <TransactionCard
            transaction={{...SAMPLE_TRANSACTIONS[2], chainId: 42161}}
            showDetails
            showCopyButton
            showExplorerLink
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

// Web3 DeFi use case
export const Web3DeFiUseCase: Story = {
  render: () => (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Disposal</h2>
        <p className="text-gray-600 dark:text-gray-400">Your latest token disposal transaction</p>
      </div>

      <TransactionCard
        transaction={SAMPLE_TRANSACTIONS[0]}
        variant="detailed"
        showDetails
        showCopyButton
        showExplorerLink
      />

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Track all your charitable contributions in the transaction history
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Complete Web3 DeFi use case showing transaction details in the Token Toilet application context.',
      },
    },
  },
}
