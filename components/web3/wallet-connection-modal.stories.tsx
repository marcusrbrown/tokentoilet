import type {Meta, StoryObj} from '@storybook/react'
import {WalletConnectionModal} from './wallet-connection-modal'

const meta: Meta<typeof WalletConnectionModal> = {
  title: 'Web3/WalletConnectionModal',
  component: WalletConnectionModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Enhanced wallet connection modal with provider selection, network switching, and persistence options. Built for Token Toilet with violet branding and glass morphism design.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls modal visibility',
    },
    showNetworkSelection: {
      control: 'boolean',
      description: 'Show network selection section',
    },
    showPersistenceOptions: {
      control: 'boolean',
      description: 'Show auto-reconnect persistence options',
    },
    onClose: {action: 'onClose'},
    onConnectionSuccess: {action: 'onConnectionSuccess'},
    onConnectionError: {action: 'onConnectionError'},
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Basic modal with all features
export const Default: Story = {
  args: {
    open: true,
    showNetworkSelection: true,
    showPersistenceOptions: true,
  },
}

// Minimal modal with just provider selection
export const MinimalModal: Story = {
  args: {
    open: true,
    showNetworkSelection: false,
    showPersistenceOptions: false,
  },
}

// Network selection focused
export const NetworkSelectionOnly: Story = {
  args: {
    open: true,
    showNetworkSelection: true,
    showPersistenceOptions: false,
  },
}

// Persistence options focused
export const PersistenceOptionsOnly: Story = {
  args: {
    open: true,
    showNetworkSelection: false,
    showPersistenceOptions: true,
  },
}

// Closed modal (for testing visibility toggle)
export const Closed: Story = {
  args: {
    open: false,
    showNetworkSelection: true,
    showPersistenceOptions: true,
  },
}
