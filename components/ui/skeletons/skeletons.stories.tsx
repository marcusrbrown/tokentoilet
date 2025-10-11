import type {Meta, StoryObj} from '@storybook/react'

import {
  GenericSkeleton,
  TokenDetailSkeleton,
  TokenListSkeleton,
  TokenSelectionSkeleton,
  TransactionQueueSkeleton,
  TransactionStatusSkeleton,
  WalletDashboardSkeleton,
} from './index'

const meta: Meta = {
  title: 'Components/UI/Skeletons',
  parameters: {
    layout: 'padded',
  },
}

export default meta

export const TokenList: StoryObj = {
  render: () => <TokenListSkeleton />,
}

export const TokenDetail: StoryObj = {
  render: () => <TokenDetailSkeleton />,
}

export const TokenSelection: StoryObj = {
  render: () => <TokenSelectionSkeleton />,
}

export const WalletDashboard: StoryObj = {
  render: () => <WalletDashboardSkeleton />,
}

export const TransactionQueue: StoryObj = {
  render: () => <TransactionQueueSkeleton />,
}

export const TransactionStatus: StoryObj = {
  render: () => <TransactionStatusSkeleton />,
}

export const Generic: StoryObj = {
  render: () => <GenericSkeleton />,
}

export const GenericTall: StoryObj = {
  render: () => <GenericSkeleton height="h-96" />,
}

export const AllSkeletons: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Token List Skeleton</h3>
        <TokenListSkeleton />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Token Detail Skeleton</h3>
        <TokenDetailSkeleton />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Wallet Dashboard Skeleton</h3>
        <WalletDashboardSkeleton />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction Queue Skeleton</h3>
        <TransactionQueueSkeleton />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction Status Skeleton</h3>
        <TransactionStatusSkeleton />
      </div>
    </div>
  ),
}
