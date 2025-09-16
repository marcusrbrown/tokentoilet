import type {Meta, StoryObj} from '@storybook/react'
import {Button} from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component with multiple variants, sizes, and Web3-specific states for wallet interactions and DeFi operations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
        'web3Connected',
        'web3Connecting',
        'web3Error',
        'web3Network',
        'web3Pending',
      ],
      description: 'Visual style variant of the button',
    },
    size: {
      control: {type: 'select'},
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Size variant of the button',
    },
    disabled: {
      control: {type: 'boolean'},
      description: 'Whether the button is disabled',
    },
    onClick: {
      action: 'clicked',
      description: 'Function called when button is clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default button story
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
}

// All button variants showcase
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants for general use cases.',
      },
    },
  },
}

// Web3-specific button variants
export const Web3Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="web3Connected">Connected</Button>
      <Button variant="web3Connecting">Connecting</Button>
      <Button variant="web3Network">Switch Network</Button>
      <Button variant="web3Pending">Pending</Button>
      <Button variant="web3Error">Error</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Web3-specific button variants with violet theming for wallet connections and transaction states.',
      },
    },
    web3: {
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      chainId: 1,
    },
  },
}

// Button sizes showcase
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🔗</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available button sizes from small to large, including icon-only buttons.',
      },
    },
  },
}

// Button states showcase
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>
        Disabled Outline
      </Button>
      <Button variant="web3Connected" disabled>
        Disabled Web3
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button states including normal and disabled states across different variants.',
      },
    },
  },
}

// Loading/Connecting state for Web3
export const Web3Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="web3Connecting" disabled>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        Connecting...
      </Button>
      <Button variant="web3Pending" disabled>
        <div className="mr-2 h-4 w-4 animate-pulse rounded-full bg-orange-300"></div>
        Transaction Pending
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Web3 buttons in loading states with spinners and animation effects.',
      },
    },
    web3: {
      isConnecting: true,
    },
  },
}

// Interactive button story
export const Interactive: Story = {
  args: {
    children: 'Click me!',
    variant: 'web3Connected',
    size: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive button that responds to clicks. Check the Actions panel below.',
      },
    },
  },
}
