import type {Meta, StoryObj} from '@storybook/react'
import React from 'react'

// Mock the wagmi hooks
const mockWalletSwitcher = {
  connectedWallets: [
    {
      id: 'metamask-1-0x1234567890123456789012345678901234567890',
      connector: {uid: 'metamask-1', name: 'MetaMask'},
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isActive: true,
      chainId: 1,
      walletName: 'MetaMask',
      isSupported: true,
    },
    {
      id: 'walletconnect-1-0x9876543210987654321098765432109876543210',
      connector: {uid: 'walletconnect-1', name: 'WalletConnect'},
      address: '0x9876543210987654321098765432109876543210' as `0x${string}`,
      isActive: false,
      chainId: 137,
      walletName: 'WalletConnect',
      isSupported: true,
    },
    {
      id: 'coinbase-1-0x5555555555555555555555555555555555555555',
      connector: {uid: 'coinbase-1', name: 'Coinbase Wallet'},
      address: '0x5555555555555555555555555555555555555555' as `0x${string}`,
      isActive: false,
      chainId: 42161,
      walletName: 'Coinbase Wallet',
      isSupported: true,
    },
  ],
  activeWallet: {
    id: 'metamask-1-0x1234567890123456789012345678901234567890',
    connector: {uid: 'metamask-1', name: 'MetaMask'},
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    isActive: true,
    chainId: 1,
    walletName: 'MetaMask',
    isSupported: true,
  },
  isSwitching: false,
  isConnecting: false,
  availableConnectors: [
    {uid: 'rabby-1', name: 'Rabby'},
    {uid: 'rainbow-1', name: 'Rainbow'},
  ],
  switchToWallet: async (_walletId: string) => {
    // Action for Storybook - will be logged in actions panel
  },
  connectNewWallet: async (_connector: {uid: string; name: string}) => {
    // Action for Storybook - will be logged in actions panel
  },
  disconnectWallet: async (_walletId: string) => {
    // Action for Storybook - will be logged in actions panel
  },
  disconnectAll: async () => {
    // Action for Storybook - will be logged in actions panel
  },
  openWalletModal: () => {
    // Action for Storybook - will be logged in actions panel
  },
}

// Mock function (not a hook since it doesn't call hooks)
const getWalletSwitcherMock = (overrides?: Partial<typeof mockWalletSwitcher>) => ({
  ...mockWalletSwitcher,
  ...overrides,
})

// Mock component with configurable mock data
interface MockWalletSwitcherProps {
  className?: string
  mockData?: Partial<typeof mockWalletSwitcher>
}

const MockWalletSwitcher = ({className, mockData}: MockWalletSwitcherProps) => {
  const walletSwitcher = getWalletSwitcherMock(mockData)

  // Mock the WalletSwitcher component structure for Storybook
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className={className}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900 transition-colors hover:bg-violet-100 dark:border-violet-600 dark:bg-violet-950 dark:text-violet-100 dark:hover:bg-violet-900"
        >
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>{walletSwitcher.activeWallet?.walletName}</span>
          <span className="text-xs text-violet-600 dark:text-violet-400">
            {walletSwitcher.activeWallet?.address.slice(0, 6)}...
            {walletSwitcher.activeWallet?.address.slice(-4)}
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-violet-200 bg-white p-4 shadow-lg dark:border-violet-700 dark:bg-violet-950">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-violet-900 dark:text-violet-100">Connected Wallets</h3>
                <span className="text-sm text-violet-600 dark:text-violet-400">
                  {walletSwitcher.connectedWallets.length} connected
                </span>
              </div>

              <div className="space-y-2">
                {walletSwitcher.connectedWallets.map(wallet => (
                  <div
                    key={wallet.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      wallet.isActive
                        ? 'border-violet-300 bg-violet-50 dark:border-violet-600 dark:bg-violet-900'
                        : 'border-gray-200 bg-white hover:border-violet-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-violet-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${wallet.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{wallet.walletName}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          Chain {wallet.chainId}
                        </span>
                        {!wallet.isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              walletSwitcher.switchToWallet(wallet.id).catch(console.error)
                            }}
                            className="rounded-md bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-200 dark:bg-violet-800 dark:text-violet-300 dark:hover:bg-violet-700"
                          >
                            Switch
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {walletSwitcher.availableConnectors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-violet-900 dark:text-violet-100">Connect New Wallet</h4>
                  <div className="space-y-1">
                    {walletSwitcher.availableConnectors.map(connector => (
                      <button
                        type="button"
                        key={connector.uid}
                        onClick={() => {
                          walletSwitcher.connectNewWallet(connector).catch(console.error)
                        }}
                        className="w-full rounded-md border border-gray-200 bg-white p-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                      >
                        {connector.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    walletSwitcher.disconnectAll().catch(console.error)
                  }}
                  className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                >
                  Disconnect All
                </button>
                <button
                  type="button"
                  onClick={walletSwitcher.openWalletModal}
                  className="rounded-md bg-violet-100 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-200 dark:bg-violet-800 dark:text-violet-300 dark:hover:bg-violet-700"
                >
                  Add Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const meta: Meta<typeof MockWalletSwitcher> = {
  title: 'Web3/WalletSwitcher',
  component: MockWalletSwitcher,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A wallet switching interface component for managing multiple simultaneously connected wallets. Supports switching between active wallets, connecting new wallets, and disconnecting from existing ones.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default wallet switcher story
export const Default: Story = {
  args: {},
}

// With single wallet
export const SingleWallet: Story = {
  args: {
    mockData: {
      connectedWallets: [
        {
          id: 'metamask-1-0x1234567890123456789012345678901234567890',
          connector: {uid: 'metamask-1', name: 'MetaMask'},
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          isActive: true,
          chainId: 1,
          walletName: 'MetaMask',
          isSupported: true,
        },
      ],
      activeWallet: {
        id: 'metamask-1-0x1234567890123456789012345678901234567890',
        connector: {uid: 'metamask-1', name: 'MetaMask'},
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        isActive: true,
        chainId: 1,
        walletName: 'MetaMask',
        isSupported: true,
      },
    },
  },
}

// With loading state
export const Loading: Story = {
  args: {
    mockData: {
      isSwitching: true,
    },
  },
}

// With connecting state
export const Connecting: Story = {
  args: {
    mockData: {
      isConnecting: true,
    },
  },
}

// With many wallets
export const ManyWallets: Story = {
  args: {
    mockData: {
      connectedWallets: [
        {
          id: 'metamask-1-0x1234567890123456789012345678901234567890',
          connector: {uid: 'metamask-1', name: 'MetaMask'},
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          isActive: true,
          chainId: 1,
          walletName: 'MetaMask',
          isSupported: true,
        },
        {
          id: 'walletconnect-1-0x9876543210987654321098765432109876543210',
          connector: {uid: 'walletconnect-1', name: 'WalletConnect'},
          address: '0x9876543210987654321098765432109876543210' as `0x${string}`,
          isActive: false,
          chainId: 137,
          walletName: 'WalletConnect',
          isSupported: true,
        },
        {
          id: 'coinbase-1-0x5555555555555555555555555555555555555555',
          connector: {uid: 'coinbase-1', name: 'Coinbase Wallet'},
          address: '0x5555555555555555555555555555555555555555' as `0x${string}`,
          isActive: false,
          chainId: 42161,
          walletName: 'Coinbase Wallet',
          isSupported: true,
        },
        {
          id: 'rabby-1-0x7777777777777777777777777777777777777777',
          connector: {uid: 'rabby-1', name: 'Rabby'},
          address: '0x7777777777777777777777777777777777777777' as `0x${string}`,
          isActive: false,
          chainId: 1,
          walletName: 'Rabby Wallet',
          isSupported: true,
        },
        {
          id: 'rainbow-1-0x8888888888888888888888888888888888888888',
          connector: {uid: 'rainbow-1', name: 'Rainbow'},
          address: '0x8888888888888888888888888888888888888888' as `0x${string}`,
          isActive: false,
          chainId: 42161,
          walletName: 'Rainbow',
          isSupported: true,
        },
      ],
      availableConnectors: [
        {uid: 'trust-1', name: 'Trust Wallet'},
        {uid: 'phantom-1', name: 'Phantom'},
      ],
    },
  },
}

// With unsupported network
export const UnsupportedNetwork: Story = {
  args: {
    mockData: {
      connectedWallets: [
        {
          id: 'metamask-1-0x1234567890123456789012345678901234567890',
          connector: {uid: 'metamask-1', name: 'MetaMask'},
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          isActive: true,
          chainId: 999, // Unsupported network
          walletName: 'MetaMask',
          isSupported: false,
        },
      ],
      activeWallet: {
        id: 'metamask-1-0x1234567890123456789012345678901234567890',
        connector: {uid: 'metamask-1', name: 'MetaMask'},
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        isActive: true,
        chainId: 999,
        walletName: 'MetaMask',
        isSupported: false,
      },
    },
  },
}
