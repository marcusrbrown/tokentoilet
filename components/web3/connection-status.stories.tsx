'use client'

import type {Meta, StoryObj} from '@storybook/react'
import {ConnectionStatus} from './connection-status'

const meta: Meta<typeof ConnectionStatus> = {
  title: 'Web3/ConnectionStatus',
  component: ConnectionStatus,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['compact', 'full'],
      description: 'Display variant',
    },
    showNetworkBadge: {
      control: 'boolean',
      description: 'Whether to show the network badge',
    },
  },
}

export default meta
type Story = StoryObj<typeof ConnectionStatus>

export const Disconnected: Story = {
  args: {
    variant: 'compact',
  },
}

export const DisconnectedFull: Story = {
  args: {
    variant: 'full',
  },
}

export const CompactVariant: Story = {
  args: {
    variant: 'compact',
    showNetworkBadge: true,
  },
}

export const FullVariant: Story = {
  args: {
    variant: 'full',
    showNetworkBadge: true,
  },
}

export const WithoutNetworkBadge: Story = {
  args: {
    variant: 'full',
    showNetworkBadge: false,
  },
}

export const CompactWithoutNetworkBadge: Story = {
  args: {
    variant: 'compact',
    showNetworkBadge: false,
  },
}
