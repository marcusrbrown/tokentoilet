import type {Meta, StoryObj} from '@storybook/react'
import {AddressDisplay} from './address-display'

const meta: Meta<typeof AddressDisplay> = {
  title: 'UI/AddressDisplay',
  component: AddressDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A Web3 address display component with copy functionality, multiple variants, and ENS support. Formats addresses and provides interactive features for DeFi applications.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    address: {
      control: {type: 'text'},
      description: 'Ethereum address or ENS name to display',
    },
    variant: {
      control: {type: 'select'},
      options: ['default', 'card', 'glass', 'primary'],
      description: 'Visual style variant of the address display',
    },
    size: {
      control: {type: 'select'},
      options: ['sm', 'default', 'lg'],
      description: 'Size variant of the address display',
    },
    chars: {
      control: {type: 'number'},
      description: 'Number of characters to show at start and end (default: 4)',
    },
    showCopy: {
      control: {type: 'boolean'},
      description: 'Whether to show the copy button',
    },
    showExternalLink: {
      control: {type: 'boolean'},
      description: 'Whether to show external link to block explorer',
    },
    explorerUrl: {
      control: {type: 'text'},
      description: 'Custom explorer URL (defaults to etherscan.io)',
    },
    validateAddress: {
      control: {type: 'boolean'},
      description: 'Whether to validate the address format',
    },
    onClick: {
      action: 'clicked',
      description: 'Function called when address is clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample Web3 addresses for testing
const SAMPLE_ADDRESSES = {
  ethereum: '0x742d35Cc6644C35532B7c3B8b2b1Aab1B0c0c935',
  vitalik: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  uniswap: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  short: '0x123456789',
  invalid: 'not-an-address',
  ens: 'vitalik.eth',
}

// Default address display story
export const Default: Story = {
  args: {
    address: SAMPLE_ADDRESSES.ethereum,
    variant: 'default',
    size: 'default',
    showCopy: true,
  },
}

// All address display variants showcase
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Address Display Variants</div>
      <div className="space-y-3">
        <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="default" showCopy />
        <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="card" showCopy />
        <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="glass" showCopy />
        <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="primary" showCopy />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available address display variants with different visual treatments and glass morphism effects.',
      },
    },
  },
}

// Size variants showcase
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Size Variants</div>
      <div className="space-y-3">
        <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} size="sm" showCopy />
        <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} size="default" showCopy />
        <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} size="lg" showCopy />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available address display sizes from small to large.',
      },
    },
  },
}

// Web3 famous addresses
export const Web3FamousAddresses: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Famous Web3 Addresses</div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16">Vitalik:</span>
          <AddressDisplay address={SAMPLE_ADDRESSES.vitalik} variant="card" showCopy showExternalLink />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16">Uniswap:</span>
          <AddressDisplay address={SAMPLE_ADDRESSES.uniswap} variant="glass" showCopy showExternalLink />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-16">ENS:</span>
          <AddressDisplay address={SAMPLE_ADDRESSES.ens} variant="primary" showCopy showExternalLink />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples with famous Web3 addresses and ENS names, showing external link functionality.',
      },
    },
    web3: {
      isConnected: true,
      chainId: 1,
    },
  },
}

// Character count showcase
export const AddressFormats: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-2xl">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Address Formats</div>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Default (4 chars):</div>
          <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="card" showCopy chars={4} />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Extended (6 chars):</div>
          <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="card" showCopy chars={6} />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Short (2 chars):</div>
          <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="card" showCopy chars={2} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different character count formats for address truncation.',
      },
    },
  },
}

// Interactive features showcase
export const InteractiveFeatures: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Interactive Features</div>
      <div className="space-y-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">With copy button:</div>
          <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="glass" showCopy />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">With external link:</div>
          <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="glass" showExternalLink />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">With both copy and external link:</div>
          <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="glass" showCopy showExternalLink />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Clickable address:</div>
          <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="primary" showCopy />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive features including copy functionality, external links, and click handlers.',
      },
    },
  },
}

// Error states and edge cases
export const ErrorStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Error States & Edge Cases</div>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Invalid address:</div>
          <AddressDisplay address={SAMPLE_ADDRESSES.invalid} variant="card" showCopy />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Short address:</div>
          <AddressDisplay address={SAMPLE_ADDRESSES.short} variant="card" showCopy />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Empty address:</div>
          <AddressDisplay address="" variant="card" showCopy />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error states and edge cases including invalid addresses and empty values.',
      },
    },
  },
}

// Token Toilet wallet integration example
export const TokenToiletWallet: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950 dark:to-blue-950 rounded-xl">
      <div className="text-sm font-medium text-violet-800 dark:text-violet-200">Connected Wallet</div>
      <AddressDisplay address={SAMPLE_ADDRESSES.ethereum} variant="glass" size="lg" showCopy showExternalLink />
      <div className="text-xs text-violet-600 dark:text-violet-400">
        Ready to dispose of unwanted tokens for charity
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Token Toilet application example showing connected wallet address with violet branding.',
      },
    },
    web3: {
      isConnected: true,
      address: SAMPLE_ADDRESSES.ethereum,
      chainId: 1,
    },
  },
}
