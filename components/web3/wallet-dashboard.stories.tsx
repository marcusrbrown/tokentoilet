import type {Meta, StoryObj} from '@storybook/react'
import {vi} from 'vitest'
import {WalletDashboard} from './wallet-dashboard'

// Mock the useWallet hook for Storybook
const mockUseWallet = vi.fn()
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: mockUseWallet,
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  formatAddress: (address: string, chars = 4) => `${address.slice(0, chars)}...${address.slice(-chars)}`,
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

const meta: Meta<typeof WalletDashboard> = {
  title: 'Web3/WalletDashboard',
  component: WalletDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Comprehensive wallet status dashboard component with detailed connection information.

## Features
- Real-time wallet connection status with visual indicators
- Account information display with copy functionality
- Network information and switching controls
- Error state handling with recovery actions
- Connection metadata and explorer links
- Responsive design with glass morphism aesthetics

## Usage
The component automatically integrates with the useWallet hook to display current wallet state.
Perfect for wallet management interfaces and user dashboards.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
    showConnectionDetails: {
      control: 'boolean',
      description: 'Whether to show detailed connection information',
    },
    showNetworkControls: {
      control: 'boolean',
      description: 'Whether to show network switching controls',
    },
    onAddressCopy: {
      action: 'address copied',
      description: 'Callback when address is copied to clipboard',
    },
    onConnectionStateChange: {
      action: 'connection state changed',
      description: 'Callback when wallet connection state changes',
    },
  },
}

export default meta
type Story = StoryObj<typeof WalletDashboard>

// Base wallet state for stories
const baseWalletState = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  switchToChain: vi.fn(),
  handleUnsupportedNetwork: vi.fn(),
  getSupportedChains: () => [
    {id: 1, name: 'Ethereum Mainnet', symbol: 'ETH'},
    {id: 137, name: 'Polygon', symbol: 'MATIC'},
    {id: 42161, name: 'Arbitrum One', symbol: 'ETH'},
  ],
  isSwitchingChain: false,
  switchChainError: null,
  getUnsupportedNetworkError: () => null,
}

/**
 * Default disconnected state - shows wallet connection prompt
 */
export const Disconnected: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Wallet not connected - shows connection prompt with call-to-action.',
      },
    },
  },
  beforeEach: () => {
    mockUseWallet.mockReturnValue({
      ...baseWalletState,
      address: undefined,
      isConnected: false,
      chainId: undefined,
      currentNetwork: null,
      isCurrentChainSupported: false,
    })
  },
}

/**
 * Connected wallet on Ethereum mainnet
 */
export const Connected: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Wallet connected to Ethereum mainnet with full dashboard functionality.',
      },
    },
  },
  beforeEach: () => {
    mockUseWallet.mockReturnValue({
      ...baseWalletState,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
    })
  },
}

/**
 * Connected wallet on Polygon network
 */
export const ConnectedPolygon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Wallet connected to Polygon network showing multi-chain support.',
      },
    },
  },
  beforeEach: () => {
    mockUseWallet.mockReturnValue({
      ...baseWalletState,
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      isConnected: true,
      chainId: 137,
      currentNetwork: {name: 'Polygon', symbol: 'MATIC'},
      isCurrentChainSupported: true,
    })
  },
}

/**
 * Connected wallet on unsupported network
 */
export const UnsupportedNetwork: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Wallet connected to unsupported network showing error state and recovery options.',
      },
    },
  },
  beforeEach: () => {
    mockUseWallet.mockReturnValue({
      ...baseWalletState,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 56, // BSC - unsupported
      currentNetwork: null,
      isCurrentChainSupported: false,
      getUnsupportedNetworkError: () => ({
        isUnsupported: true,
        currentChainId: 56,
        suggestedChain: {id: 1, name: 'Ethereum Mainnet'},
        error: {
          code: 'UNSUPPORTED_NETWORK',
          message: 'Unsupported network',
          chainId: 56,
          suggestedChainId: 1,
          userFriendlyMessage: 'Switch to Ethereum Mainnet to continue',
          name: 'NetworkValidationError',
        },
      }),
    })
  },
}

/**
 * Wallet connected with network switching in progress
 */
export const SwitchingNetwork: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Wallet connected with network switching operation in progress.',
      },
    },
  },
  beforeEach: () => {
    mockUseWallet.mockReturnValue({
      ...baseWalletState,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
      isSwitchingChain: true,
    })
  },
}

/**
 * Network switch failed state
 */
export const NetworkSwitchError: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Wallet connected but network switch operation failed.',
      },
    },
  },
  beforeEach: () => {
    mockUseWallet.mockReturnValue({
      ...baseWalletState,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
      switchChainError: new Error('User rejected the request'),
    })
  },
}

/**
 * Minimal configuration without connection details
 */
export const MinimalView: Story = {
  args: {
    showConnectionDetails: false,
    showNetworkControls: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Simplified view with connection details and network controls hidden.',
      },
    },
  },
  beforeEach: () => {
    mockUseWallet.mockReturnValue({
      ...baseWalletState,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
    })
  },
}

/**
 * Wallet with long address to test formatting
 */
export const LongAddress: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Wallet with long address to demonstrate formatting and copy functionality.',
      },
    },
  },
  beforeEach: () => {
    mockUseWallet.mockReturnValue({
      ...baseWalletState,
      address: '0x1234567890123456789012345678901234567890abcdefabcdefabcdefabcdefabcd',
      isConnected: true,
      chainId: 42161,
      currentNetwork: {name: 'Arbitrum One', symbol: 'ETH'},
      isCurrentChainSupported: true,
    })
  },
}

/**
 * Loading network information state
 */
export const LoadingNetwork: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Wallet connected but network information is still loading.',
      },
    },
  },
  beforeEach: () => {
    mockUseWallet.mockReturnValue({
      ...baseWalletState,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: undefined,
      currentNetwork: null,
      isCurrentChainSupported: false,
    })
  },
}

/**
 * Custom styling example
 */
export const CustomStyling: Story = {
  args: {
    className: 'max-w-md mx-auto border-2 border-violet-300',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with custom styling applied via className prop.',
      },
    },
  },
  beforeEach: () => {
    mockUseWallet.mockReturnValue({
      ...baseWalletState,
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 137,
      currentNetwork: {name: 'Polygon', symbol: 'MATIC'},
      isCurrentChainSupported: true,
    })
  },
}
