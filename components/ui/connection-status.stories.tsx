import type {Meta, StoryObj} from '@storybook/react'
import {ConnectionStatus} from './connection-status'

const meta: Meta<typeof ConnectionStatus> = {
  title: 'UI/ConnectionStatus',
  component: ConnectionStatus,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A Web3 connection status component for visualizing wallet connection state. Displays current wallet connection status with appropriate icons, badges, and actions. Note: This component adapts to the actual wallet connection state via useWallet hook.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: ['default', 'card', 'compact', 'glass'],
      description: 'Visual style variant of the connection status',
    },
    size: {
      control: {type: 'select'},
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the connection status',
    },
    showNetworkSwitch: {
      control: {type: 'boolean'},
      description: 'Show network switching button when on unsupported network',
    },
    showErrorDetails: {
      control: {type: 'boolean'},
      description: 'Show detailed error messages',
    },
    hideBadge: {
      control: {type: 'boolean'},
      description: 'Hide status badge',
    },
    hideAddress: {
      control: {type: 'boolean'},
      description: 'Hide wallet address when connected',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default connection status that adapts to the actual wallet state from useWallet hook.',
      },
    },
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Connection Status Variants</div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Default</h3>
          <ConnectionStatus variant="default" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Card</h3>
          <ConnectionStatus variant="card" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Compact</h3>
          <ConnectionStatus variant="compact" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Glass</h3>
          <ConnectionStatus variant="glass" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'All available connection status variants. The actual content will depend on the current wallet connection state.',
      },
    },
  },
}

export const SizeVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Size Variants</div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Small</h3>
          <ConnectionStatus variant="card" size="sm" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Medium (Default)</h3>
          <ConnectionStatus variant="card" size="md" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Large</h3>
          <ConnectionStatus variant="card" size="lg" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All available size variants for the connection status component.',
      },
    },
  },
}

export const FeatureOptions: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Feature Options</div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">With Network Switch</h3>
          <ConnectionStatus variant="card" showNetworkSwitch />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">With Error Details</h3>
          <ConnectionStatus variant="card" showErrorDetails />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Hidden Badge</h3>
          <ConnectionStatus variant="card" hideBadge />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Hidden Address</h3>
          <ConnectionStatus variant="card" hideAddress />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Various feature options and configurations for the connection status component.',
      },
    },
  },
}

export const Web3DeFiUseCase: Story = {
  render: () => (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Token Toilet</h2>
        <p className="text-gray-600 dark:text-gray-400">Dispose of unwanted tokens for charity</p>
      </div>

      <ConnectionStatus variant="glass" size="lg" showNetworkSwitch showErrorDetails />

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        * Connection status adapts to actual wallet state
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Complete Web3 DeFi use case showing connection status in the Token Toilet application context.',
      },
    },
  },
}
