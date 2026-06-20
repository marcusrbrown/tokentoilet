import type {Meta, StoryObj} from '@storybook/react'
import {Toaster} from 'react-hot-toast'

import toastNotifications from './toast-notifications'

/**
 * Wrapper component to demonstrate toast notifications in Storybook.
 * Renders a Toaster and a set of trigger buttons for each notification type.
 */
function ToastNotificationsDemo() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Toaster position="top-right" />

      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Click buttons to trigger toast notifications
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          onClick={() => toastNotifications.success('Token disposal completed successfully!', {title: 'Success'})}
        >
          Success Toast
        </button>

        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          onClick={() => toastNotifications.error('Transaction failed. Please try again.', {title: 'Error'})}
        >
          Error Toast
        </button>

        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 transition-colors"
          onClick={() => toastNotifications.warning('Please switch to Ethereum Mainnet', {title: 'Network Warning'})}
        >
          Warning Toast
        </button>

        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          onClick={() => toastNotifications.info('Transaction submitted to the network', {title: 'Info'})}
        >
          Info Toast
        </button>

        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          onClick={() => toastNotifications.web3('Wallet connected via WalletConnect', {title: 'Web3'})}
        >
          Web3 Toast
        </button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Transaction Notifications</div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
            onClick={() => toastNotifications.transaction.pending('0xabc123def456')}
          >
            Tx Pending
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            onClick={() => toastNotifications.transaction.confirmed('0xabc123def456')}
          >
            Tx Confirmed
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            onClick={() => toastNotifications.transaction.failed('Insufficient gas', '0xabc123def456')}
          >
            Tx Failed
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Wallet Notifications</div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
            onClick={() => toastNotifications.wallet.connected('MetaMask')}
          >
            Wallet Connected
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            onClick={() => toastNotifications.wallet.disconnected()}
          >
            Wallet Disconnected
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            onClick={() => toastNotifications.wallet.connectionError('User rejected the request')}
          >
            Connection Error
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 transition-colors"
            onClick={() => toastNotifications.wallet.networkSwitch('Ethereum Mainnet')}
          >
            Network Switch
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          onClick={() => toastNotifications.dismissAll()}
        >
          Dismiss All
        </button>
      </div>
    </div>
  )
}

const meta: Meta<typeof ToastNotificationsDemo> = {
  title: 'UI/ToastNotifications',
  component: ToastNotificationsDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toast notification system for Token Toilet. Provides success, error, warning, info, and Web3-specific notifications. Includes transaction lifecycle notifications (pending, confirmed, failed) and wallet event notifications (connected, disconnected, network switch).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo of all toast notification types. Click buttons to trigger each notification.',
      },
    },
  },
}

export const SuccessToast: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <Toaster position="top-right" />
      <button
        type="button"
        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
        onClick={() =>
          toastNotifications.success('100 USDC successfully donated to charity!', {
            title: 'Donation Complete',
            action: {label: 'View on Explorer', onClick: () => {}},
          })
        }
      >
        Trigger Success with Action
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success toast with optional title and action button for block explorer links.',
      },
    },
  },
}

export const TransactionLifecycle: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <Toaster position="top-right" />
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Simulate a transaction lifecycle</div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          onClick={() => toastNotifications.transaction.pending('0xdeadbeef')}
        >
          1. Pending
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          onClick={() => toastNotifications.transaction.confirmed('0xdeadbeef')}
        >
          2. Confirmed
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          onClick={() => toastNotifications.transaction.failed('Out of gas', '0xdeadbeef')}
        >
          2. Failed
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Transaction lifecycle notifications. Pending uses the same toast ID as confirmed/failed, so confirming or failing replaces the pending toast.',
      },
    },
  },
}

export const WalletEvents: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <Toaster position="top-right" />
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wallet event notifications</div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          onClick={() => toastNotifications.wallet.connected('MetaMask')}
        >
          Connected
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          onClick={() => toastNotifications.wallet.disconnected()}
        >
          Disconnected
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          onClick={() => toastNotifications.wallet.connectionError('User rejected the request')}
        >
          Error
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 transition-colors"
          onClick={() => toastNotifications.wallet.networkSwitch('Ethereum Mainnet')}
        >
          Network Switch
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Wallet event notifications for connection state changes and network switching.',
      },
    },
  },
}
