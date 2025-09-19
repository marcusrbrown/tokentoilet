import type {Meta, StoryObj} from '@storybook/react'
import React from 'react'

// Simple mock components and data for Storybook
const mockFormatAddress = (address: string, chars = 4) => `${address.slice(0, chars)}...${address.slice(-chars)}`

// Define mock state interface
interface MockWalletState {
  isConnected?: boolean
  address?: string
  chainId?: number
  currentNetwork?: {
    name: string
    symbol: string
  } | null
  isCurrentChainSupported?: boolean
}

interface MockWalletDashboardProps {
  className?: string
  showConnectionDetails?: boolean
  showNetworkControls?: boolean
  onAddressCopy?: (address: string) => void
  onConnectionStateChange?: (isConnected: boolean) => void
  mockState?: MockWalletState
}

// Mock implementations that work without external dependencies
const MockWalletDashboard = (props: MockWalletDashboardProps) => {
  const {
    className,
    showConnectionDetails = true,
    onAddressCopy,
    onConnectionStateChange,
    mockState: propMockState,
  } = props

  // Get mock state from story parameters with defaults
  const mockState: MockWalletState = propMockState || {}

  const [isConnecting, setIsConnecting] = React.useState(false)
  const [copiedAddress, setCopiedAddress] = React.useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    setTimeout(() => {
      setIsConnecting(false)
      if (onConnectionStateChange) {
        onConnectionStateChange(true)
      }
    }, 1000)
  }

  const handleDisconnect = () => {
    if (onConnectionStateChange) {
      onConnectionStateChange(false)
    }
  }

  const handleCopyAddress = () => {
    const address = mockState.address
    if (typeof address === 'string' && address.length > 0) {
      setCopiedAddress(true)
      if (onAddressCopy) {
        onAddressCopy(address)
      }
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const displayAddress =
    typeof mockState.address === 'string' && mockState.address.length > 0 ? mockFormatAddress(mockState.address, 6) : ''
  const isConnected = Boolean(mockState.isConnected)
  const isCurrentChainSupported = Boolean(mockState.isCurrentChainSupported)

  return (
    <div className={className}>
      <div className="glass-card p-6 max-w-md mx-auto bg-white/80 backdrop-blur-sm border border-violet-200 rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <svg className="h-5 w-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Wallet Dashboard</h2>
              <p className="text-sm text-gray-600">Connection status and account details</p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isConnected
                ? isCurrentChainSupported
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isConnected ? (
                isCurrentChainSupported ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                )
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364"
                />
              )}
            </svg>
            {isConnected
              ? isCurrentChainSupported
                ? 'Wallet connected'
                : 'Unsupported network'
              : 'No wallet connected'}
          </div>
        </div>

        {/* Content */}
        {isConnected ? (
          <div className="space-y-6">
            {/* Account Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Account Information
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{displayAddress}</p>
                      <p className="text-xs text-gray-600">Connected Account</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    {copiedAddress ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Network Info */}
            {showConnectionDetails && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Network Information</h3>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-600">Network</p>
                      <p className="font-medium text-gray-900">{mockState.currentNetwork?.name ?? 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Chain ID</p>
                      <p className="font-medium text-gray-900">{mockState.chainId ?? 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Disconnect */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364"
                  />
                </svg>
                Disconnect Wallet
              </button>
            </div>
          </div>
        ) : (
          /* Disconnected State */
          <div className="text-center py-8">
            <div className="p-4 rounded-full bg-gray-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your Web3 wallet to view account details, manage networks, and interact with the Token Toilet
              application.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const meta: Meta<typeof MockWalletDashboard> = {
  title: 'Web3/WalletDashboard',
  component: MockWalletDashboard,
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
type Story = StoryObj<typeof MockWalletDashboard>

/**
 * Default disconnected state - shows wallet connection prompt
 */
export const Disconnected: Story = {
  args: {
    mockState: {
      isConnected: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Wallet not connected - shows connection prompt with call-to-action.',
      },
    },
  },
}

/**
 * Connected wallet on Ethereum mainnet
 */
export const Connected: Story = {
  args: {
    mockState: {
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Wallet connected to Ethereum mainnet with full dashboard functionality.',
      },
    },
  },
}

/**
 * Connected wallet on Polygon network
 */
export const ConnectedPolygon: Story = {
  args: {
    mockState: {
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      isConnected: true,
      chainId: 137,
      currentNetwork: {name: 'Polygon', symbol: 'MATIC'},
      isCurrentChainSupported: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Wallet connected to Polygon network showing multi-chain support.',
      },
    },
  },
}

/**
 * Connected wallet on unsupported network
 */
export const UnsupportedNetwork: Story = {
  args: {
    mockState: {
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 56, // BSC - unsupported
      currentNetwork: null,
      isCurrentChainSupported: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Wallet connected to unsupported network showing error state and recovery options.',
      },
    },
  },
}

/**
 * Minimal configuration without connection details
 */
export const MinimalView: Story = {
  args: {
    showConnectionDetails: false,
    showNetworkControls: false,
    mockState: {
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 1,
      currentNetwork: {name: 'Ethereum Mainnet', symbol: 'ETH'},
      isCurrentChainSupported: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Simplified view with connection details and network controls hidden.',
      },
    },
  },
}

/**
 * Custom styling example
 */
export const CustomStyling: Story = {
  args: {
    className: 'max-w-md mx-auto border-2 border-violet-300',
    mockState: {
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      chainId: 137,
      currentNetwork: {name: 'Polygon', symbol: 'MATIC'},
      isCurrentChainSupported: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with custom styling applied via className prop.',
      },
    },
  },
}
