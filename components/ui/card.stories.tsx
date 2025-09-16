import type {Meta, StoryObj} from '@storybook/react'
import {CreditCard, Wallet, Zap} from 'lucide-react'
import {Badge} from './badge'
import {Button} from './button'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from './card'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible card component with glass morphism effects, elevation levels, and interactive states. Perfect for Web3 DeFi interfaces with violet branding and backdrop blur support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: ['default', 'solid', 'ghost', 'elevated', 'web3'],
      description: 'Visual style variant of the card',
    },
    elevation: {
      control: {type: 'select'},
      options: ['flat', 'low', 'medium', 'high', 'float', 'glow'],
      description: 'Shadow elevation level',
    },
    padding: {
      control: {type: 'select'},
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Internal padding amount',
    },
    interactive: {
      control: {type: 'select'},
      options: ['none', 'subtle', 'enhanced'],
      description: 'Interaction behavior when clickable',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default card story
export const Default: Story = {
  args: {
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-gray-600 dark:text-gray-400">This is the card content with default styling.</p>
      </div>
    ),
    variant: 'default',
    elevation: 'low',
    padding: 'none',
  },
}

// Card variants showcase
export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-4xl">
      <Card variant="default" className="p-4">
        <h4 className="font-medium mb-2">Default</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Glass morphism with backdrop blur</p>
      </Card>
      <Card variant="solid" className="p-4">
        <h4 className="font-medium mb-2">Solid</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Solid background without blur</p>
      </Card>
      <Card variant="ghost" className="p-4">
        <h4 className="font-medium mb-2">Ghost</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Minimal transparent styling</p>
      </Card>
      <Card variant="elevated" className="p-4">
        <h4 className="font-medium mb-2">Elevated</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Enhanced glass effect</p>
      </Card>
      <Card variant="web3" className="p-4" elevation="glow">
        <h4 className="font-medium mb-2">Web3</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Violet accent for Web3 components</p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available card variants showcasing different visual treatments and glass morphism effects.',
      },
    },
  },
}

// Elevation levels showcase
export const Elevations: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-6xl">
      <Card elevation="flat" className="p-4">
        <h4 className="font-medium mb-2">Flat</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">No shadow</p>
      </Card>
      <Card elevation="low" className="p-4">
        <h4 className="font-medium mb-2">Low</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Subtle shadow</p>
      </Card>
      <Card elevation="medium" className="p-4">
        <h4 className="font-medium mb-2">Medium</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Moderate shadow</p>
      </Card>
      <Card elevation="high" className="p-4">
        <h4 className="font-medium mb-2">High</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Pronounced shadow</p>
      </Card>
      <Card elevation="float" className="p-4">
        <h4 className="font-medium mb-2">Float</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Dramatic shadow</p>
      </Card>
      <Card elevation="glow" variant="web3" className="p-4">
        <h4 className="font-medium mb-2">Glow</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Violet-tinted shadow</p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different elevation levels from flat to floating with violet glow effect.',
      },
    },
  },
}

// Interactive cards
export const Interactive: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <Card interactive="subtle" className="p-4">
        <h4 className="font-medium mb-2">Subtle Interaction</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Hover for subtle scale effect</p>
      </Card>
      <Card interactive="enhanced" variant="web3" elevation="glow" className="p-4">
        <h4 className="font-medium mb-2">Enhanced Interaction</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Enhanced hover and focus states</p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive cards with different hover and focus behaviors for clickable content.',
      },
    },
  },
}

// Wallet connection card example
export const WalletCard: Story = {
  render: () => (
    <Card variant="web3" elevation="glow" interactive="enhanced" className="max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-violet-600" />
          <CardTitle>Connect Wallet</CardTitle>
        </div>
        <CardDescription>Connect your wallet to start disposing tokens for charity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Network</span>
            <Badge variant="mainnet">Ethereum</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Status</span>
            <Badge variant="disconnected">Disconnected</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="web3Connected" className="w-full">
          Connect Wallet
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Token Toilet wallet connection card with Web3 styling, badges, and interactive elements.',
      },
    },
    web3: {
      isConnected: false,
      chainId: 1,
    },
  },
}

// Transaction card example
export const TransactionCard: Story = {
  render: () => (
    <Card variant="elevated" elevation="medium" className="max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-green-600" />
          <CardTitle>Token Disposal</CardTitle>
        </div>
        <CardDescription>Successful charitable token donation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Amount</span>
            <span className="font-mono">100.00 USDC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Charity</span>
            <span className="text-sm">Against Malaria Foundation</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Status</span>
            <Badge variant="confirmed">Confirmed</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Gas Fee</span>
            <span className="font-mono text-sm">0.0023 ETH</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          View on Etherscan
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Transaction card showing completed token disposal with charity information and status.',
      },
    },
    web3: {
      isConnected: true,
      transaction: {
        status: 'confirmed',
        hash: '0x123...',
      },
    },
  },
}

// Portfolio card example
export const PortfolioCard: Story = {
  render: () => (
    <Card variant="default" elevation="medium" className="max-w-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-violet-600" />
          <CardTitle>Portfolio Value</CardTitle>
        </div>
        <CardDescription>Total value of disposable tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-violet-600">$2,847.32</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Available for disposal</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>USDC</span>
              <span className="font-mono">1,247.83</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>DAI</span>
              <span className="font-mono">892.45</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>USDT</span>
              <span className="font-mono">707.04</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="web3Connected" className="w-full">
          Dispose All Tokens
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Portfolio card showing token values available for charitable disposal in Token Toilet.',
      },
    },
    web3: {
      isConnected: true,
      portfolio: {
        totalValue: 2847.32,
        tokens: ['USDC', 'DAI', 'USDT'],
      },
    },
  },
}

// Complex layout with subcomponents
export const ComplexCard: Story = {
  render: () => (
    <Card variant="web3" elevation="glow" className="max-w-lg">
      <CardHeader>
        <CardTitle>Token Toilet Dashboard</CardTitle>
        <CardDescription>Manage your charitable token disposals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <div className="text-2xl font-bold text-violet-600">47</div>
            <div className="text-xs text-violet-600 dark:text-violet-400">Tokens Disposed</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">$12,483</div>
            <div className="text-xs text-green-600 dark:text-green-400">Donated to Charity</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Network</span>
            <Badge variant="mainnet">Ethereum</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Connection</span>
            <Badge variant="connected">Connected</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="web3Connected" className="flex-1">
          Dispose Tokens
        </Button>
        <Button variant="outline" className="flex-1">
          View History
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complex card layout with statistics, badges, and multiple actions for Token Toilet dashboard.',
      },
    },
    web3: {
      isConnected: true,
      chainId: 1,
      stats: {
        tokensDisposed: 47,
        totalDonated: 12483,
      },
    },
  },
}
