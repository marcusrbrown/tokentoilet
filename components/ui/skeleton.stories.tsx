import type {Meta, StoryObj} from '@storybook/react'
import {Skeleton} from './skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A skeleton loading component for displaying placeholder content while data is loading. Perfect for Web3 operations like wallet connections and transaction processing.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: {type: 'text'},
      description: 'Additional CSS classes for styling',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default skeleton story
export const Default: Story = {
  args: {
    className: 'h-4 w-32',
  },
}

// Various skeleton shapes
export const Shapes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Skeleton Shapes</div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different skeleton shapes for various content types.',
      },
    },
  },
}

// Web3 wallet loading
export const WalletLoading: Story = {
  render: () => (
    <div className="space-y-4 p-6 bg-white/60 backdrop-blur-md border border-white/20 rounded-xl dark:bg-gray-800/60 dark:border-gray-700/40 max-w-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loading state for wallet connection component.',
      },
    },
    web3: {
      isConnecting: true,
    },
  },
}

// Transaction card loading
export const TransactionLoading: Story = {
  render: () => (
    <div className="space-y-4 p-6 bg-white border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-700 max-w-md">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loading state for transaction card component.',
      },
    },
    web3: {
      transaction: {
        status: 'pending',
      },
    },
  },
}

// Token list loading
export const TokenListLoading: Story = {
  render: () => (
    <div className="space-y-3 p-4 max-w-md">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading Tokens</div>
      {['usdc', 'dai', 'usdt', 'eth'].map(token => (
        <div key={token} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg dark:border-gray-700">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loading state for token list in Token Toilet portfolio.',
      },
    },
    web3: {
      isConnected: true,
      portfolio: {
        loading: true,
      },
    },
  },
}
