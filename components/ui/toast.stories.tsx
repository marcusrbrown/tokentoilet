import type {Meta, StoryObj} from '@storybook/react'
import {Button} from './button'
import {toastNotifications} from './toast-notifications'

// Create a simple wrapper component for Storybook
const ToastDemo = ({variant, title, description}: {variant: string; title: string; description: string}) => {
  const handleClick = () => {
    if (variant === 'success') {
      toastNotifications.success(description, {title})
    } else if (variant === 'error') {
      toastNotifications.error(description, {title})
    } else if (variant === 'warning') {
      toastNotifications.warning(description, {title})
    } else if (variant === 'info') {
      toastNotifications.info(description, {title})
    }
  }

  return (
    <Button onClick={handleClick} variant="outline">
      Show {variant} toast
    </Button>
  )
}

const meta: Meta<typeof ToastDemo> = {
  title: 'UI/Toast',
  component: ToastDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A toast notification system for displaying transaction updates, connection status, and system messages. Features Web3-specific variants and violet branding.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: ['success', 'error', 'warning', 'info'],
      description: 'Visual style variant of the toast',
    },
    title: {
      control: {type: 'text'},
      description: 'Toast title',
    },
    description: {
      control: {type: 'text'},
      description: 'Toast description',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default toast story
export const Default: Story = {
  args: {
    title: 'Notification',
    description: 'This is a default toast notification.',
    variant: 'info',
  },
}

// Transaction success
export const TransactionSuccess: Story = {
  args: {
    title: 'Transaction Confirmed',
    description: '100 USDC successfully donated to Against Malaria Foundation!',
    variant: 'success',
  },
  parameters: {
    docs: {
      description: {
        story: 'Success toast for confirmed transactions in Token Toilet.',
      },
    },
    web3: {
      transaction: {
        status: 'confirmed',
        hash: '0x123...',
      },
    },
  },
}

// Transaction error
export const TransactionError: Story = {
  args: {
    title: 'Transaction Failed',
    description: 'Transaction was reverted. Please check your balance and try again.',
    variant: 'error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error toast for failed transactions.',
      },
    },
    web3: {
      transaction: {
        status: 'failed',
        error: 'Insufficient balance',
      },
    },
  },
}

// Connection warning
export const ConnectionWarning: Story = {
  args: {
    title: 'Network Changed',
    description: 'Switched to Polygon network. Some features may be unavailable.',
    variant: 'warning',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning toast for network changes.',
      },
    },
    web3: {
      chainId: 137,
      previousChainId: 1,
    },
  },
}
