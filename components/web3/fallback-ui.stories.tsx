import type {Meta, StoryObj} from '@storybook/react'

import {
  FallbackUI,
  TokenDetailFallback,
  TokenListFallback,
  TransactionQueueFallback,
  WalletDashboardFallback,
} from './fallback-ui'

const meta: Meta<typeof FallbackUI> = {
  title: 'Components/Web3/FallbackUI',
  component: FallbackUI,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof FallbackUI>

export const Default: Story = {
  args: {
    title: 'Component Unavailable',
    message: 'This component could not be loaded. Please try refreshing the page.',
  },
}

export const WithAction: Story = {
  args: {
    title: 'Feature Temporarily Unavailable',
    message: 'We are experiencing technical difficulties. Please try again in a few moments.',
    action: {
      label: 'Refresh Page',
      onClick: () => {
        // Action handler for demo purposes
      },
    },
  },
}

export const WithExternalLink: Story = {
  args: {
    title: 'Transaction History Unavailable',
    message: 'Unable to load transaction history. You can view your transactions on Etherscan.',
    action: {
      label: 'View on Etherscan',
      href: 'https://etherscan.io',
    },
  },
}

export const TokenList: StoryObj = {
  render: () => <TokenListFallback />,
}

export const TokenDetail: StoryObj = {
  render: () => <TokenDetailFallback />,
}

export const WalletDashboard: StoryObj = {
  render: () => <WalletDashboardFallback />,
}

export const TransactionQueue: StoryObj = {
  render: () => <TransactionQueueFallback />,
}

export const AllFallbacks: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Token List Fallback</h3>
        <TokenListFallback />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Token Detail Fallback</h3>
        <TokenDetailFallback />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Wallet Dashboard Fallback</h3>
        <WalletDashboardFallback />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction Queue Fallback</h3>
        <TransactionQueueFallback />
      </div>
    </div>
  ),
}
