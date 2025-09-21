import type {Meta, StoryObj} from '@storybook/react'
import {NetworkBadge} from './network-badge'

const meta: Meta<typeof NetworkBadge> = {
  title: 'UI/NetworkBadge',
  component: NetworkBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A Web3 network indicator and switcher component that shows the current blockchain network with interactive switching capabilities. Features violet branding and glass morphism effects.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: ['default', 'interactive', 'card', 'glass'],
      description: 'Visual style variant of the network badge',
    },
    size: {
      control: {type: 'select'},
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the network badge',
    },
    showSwitcher: {
      control: {type: 'boolean'},
      description: 'Whether to show the network switcher dropdown',
    },
    showIcon: {
      control: {type: 'boolean'},
      description: 'Whether to show the network icon',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default network badge story
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    showSwitcher: false,
    showIcon: true,
  },
}

// Network badge variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Network Badge Variants</div>
      <div className="space-y-3">
        <NetworkBadge variant="default" showIcon />
        <NetworkBadge variant="interactive" showIcon showSwitcher />
        <NetworkBadge variant="card" showIcon />
        <NetworkBadge variant="glass" showIcon />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available network badge variants with different visual treatments.',
      },
    },
  },
}

// Size variants
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <NetworkBadge size="sm" showIcon />
      <NetworkBadge size="md" showIcon />
      <NetworkBadge size="lg" showIcon />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available network badge sizes from small to large.',
      },
    },
  },
}

// Network switcher
export const WithSwitcher: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Interactive Network Switcher</div>
      <NetworkBadge variant="interactive" showIcon showSwitcher />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Network badge with interactive switcher dropdown for changing blockchain networks.',
      },
    },
  },
}

// Token Toilet network integration
export const TokenToiletNetwork: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950 dark:to-blue-950 rounded-xl">
      <div className="text-sm font-medium text-violet-800 dark:text-violet-200">Current Network</div>
      <NetworkBadge variant="glass" size="lg" showIcon showSwitcher />
      <div className="text-xs text-violet-600 dark:text-violet-400">
        Switch networks to dispose tokens on different chains
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Token Toilet application example showing network badge with violet branding and glass morphism.',
      },
    },
  },
}
