'use client'

import type {Meta, StoryObj} from '@storybook/react'

import {NetworkSwitcher} from './network-switcher'

const meta: Meta<typeof NetworkSwitcher> = {
  title: 'Web3/NetworkSwitcher',
  component: NetworkSwitcher,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A network switching component that allows users to switch between supported blockchain networks (Ethereum, Polygon, Arbitrum).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showCurrentOnly: {
      control: {type: 'boolean'},
      description: 'When true, shows only the current network badge without switch buttons',
    },
    className: {
      control: {type: 'text'},
      description: 'Additional CSS classes to apply',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    showCurrentOnly: false,
  },
}

export const CurrentNetworkOnly: Story = {
  args: {
    showCurrentOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows only the current network badge without the ability to switch.',
      },
    },
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Full Switcher</div>
        <NetworkSwitcher />
      </div>
      <div>
        <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Current Network Only</div>
        <NetworkSwitcher showCurrentOnly />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of full switcher vs current network only display.',
      },
    },
  },
}

export const InContext: Story = {
  render: () => (
    <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-br from-violet-50 to-blue-50 p-6 dark:from-violet-950 dark:to-blue-950">
      <div className="text-sm font-medium text-violet-800 dark:text-violet-200">Select Network</div>
      <NetworkSwitcher />
      <div className="text-xs text-violet-600 dark:text-violet-400">Choose which network to dispose tokens on</div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Network switcher in Token Toilet context with violet branding.',
      },
    },
  },
}
