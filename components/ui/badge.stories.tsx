import type {Meta, StoryObj} from '@storybook/react'
import {AlertCircle, Check, Clock, Globe, Wifi, WifiOff, X} from 'lucide-react'
import {Badge} from './badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile badge component for displaying connection states, transaction status, and network indicators in Web3 DeFi applications. Features violet branding and multiple variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: [
        'default',
        'connected',
        'connecting',
        'disconnected',
        'error',
        'pending',
        'confirmed',
        'failed',
        'mainnet',
        'testnet',
        'polygon',
        'arbitrum',
        'optimism',
        'violet',
      ],
      description: 'Visual style variant of the badge',
    },
    size: {
      control: {type: 'select'},
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the badge',
    },
    children: {
      control: {type: 'text'},
      description: 'Badge content - text to display',
    },
    showDot: {
      control: {type: 'boolean'},
      description: 'Show colored dot indicator',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default badge story
export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
    size: 'md',
  },
}

// Connection state badges
export const ConnectionStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="connected" icon={<Check className="w-3 h-3" />}>
        Connected
      </Badge>
      <Badge variant="connecting" icon={<Clock className="w-3 h-3" />}>
        Connecting
      </Badge>
      <Badge variant="disconnected" icon={<WifiOff className="w-3 h-3" />}>
        Disconnected
      </Badge>
      <Badge variant="error" icon={<X className="w-3 h-3" />}>
        Error
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Connection state badges for wallet connectivity status with appropriate icons.',
      },
    },
    web3: {
      isConnected: true,
    },
  },
}

// Transaction state badges
export const TransactionStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="pending" icon={<Clock className="w-3 h-3" />}>
        Pending
      </Badge>
      <Badge variant="confirmed" icon={<Check className="w-3 h-3" />}>
        Confirmed
      </Badge>
      <Badge variant="failed" icon={<AlertCircle className="w-3 h-3" />}>
        Failed
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Transaction state badges for Web3 transaction status tracking.',
      },
    },
  },
}

// Network indicator badges
export const NetworkIndicators: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="mainnet" icon={<Globe className="w-3 h-3" />}>
        Ethereum
      </Badge>
      <Badge variant="testnet" icon={<Globe className="w-3 h-3" />}>
        Goerli
      </Badge>
      <Badge variant="polygon" icon={<Globe className="w-3 h-3" />}>
        Polygon
      </Badge>
      <Badge variant="arbitrum" icon={<Globe className="w-3 h-3" />}>
        Arbitrum
      </Badge>
      <Badge variant="optimism" icon={<Globe className="w-3 h-3" />}>
        Optimism
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Network indicator badges for different blockchain networks supported by Token Toilet.',
      },
    },
    web3: {
      chainId: 1,
    },
  },
}

// Size variants showcase
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="sm" variant="violet">
        Small
      </Badge>
      <Badge size="md" variant="violet">
        Medium
      </Badge>
      <Badge size="lg" variant="violet">
        Large
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available badge sizes from small to large with violet branding.',
      },
    },
  },
}

// Badge with dots
export const WithDots: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="connected" showDot>
        Online
      </Badge>
      <Badge variant="pending" showDot>
        Processing
      </Badge>
      <Badge variant="error" showDot>
        Offline
      </Badge>
      <Badge variant="violet" showDot>
        Active
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges with colored dot indicators for quick status recognition.',
      },
    },
  },
}

// Token Toilet charity status example
export const CharityStatus: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950 dark:to-blue-950 rounded-xl">
      <div className="text-sm font-medium text-violet-800 dark:text-violet-200">Token Disposal Status</div>
      <div className="flex flex-wrap gap-3">
        <Badge variant="violet" icon={<Wifi className="w-3 h-3" />}>
          Wallet Connected
        </Badge>
        <Badge variant="mainnet" icon={<Globe className="w-3 h-3" />}>
          Ethereum Mainnet
        </Badge>
        <Badge variant="pending" icon={<Clock className="w-3 h-3" />}>
          Transaction Pending
        </Badge>
      </div>
      <div className="text-xs text-violet-600 dark:text-violet-400">Disposing 100 USDC tokens to charity...</div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Token Toilet application example showing charity disposal status with multiple badges.',
      },
    },
    web3: {
      isConnected: true,
      chainId: 1,
      transaction: {
        status: 'pending',
        hash: '0x123...',
      },
    },
  },
}

// Interactive badge story
export const Interactive: Story = {
  args: {
    children: 'Click me!',
    variant: 'violet',
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive badge that can respond to clicks and other events.',
      },
    },
  },
}

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">All Badge Variants</div>
      <div className="grid grid-cols-3 gap-3">
        <Badge variant="default">Default</Badge>
        <Badge variant="connected">Connected</Badge>
        <Badge variant="connecting">Connecting</Badge>
        <Badge variant="disconnected">Disconnected</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="pending">Pending</Badge>
        <Badge variant="confirmed">Confirmed</Badge>
        <Badge variant="failed">Failed</Badge>
        <Badge variant="mainnet">Mainnet</Badge>
        <Badge variant="testnet">Testnet</Badge>
        <Badge variant="polygon">Polygon</Badge>
        <Badge variant="arbitrum">Arbitrum</Badge>
        <Badge variant="optimism">Optimism</Badge>
        <Badge variant="violet">Violet</Badge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete showcase of all available badge variants for different use cases.',
      },
    },
  },
}
