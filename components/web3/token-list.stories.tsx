import type {CategorizedToken} from '@/lib/web3/token-filtering'
import type {Meta, StoryObj} from '@storybook/react'
import type {Address} from 'viem'

import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'
import React from 'react'

const mockToken = (overrides: Partial<CategorizedToken> = {}): CategorizedToken => ({
  address: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`,
  chainId: 1,
  symbol: 'TOKEN',
  name: 'Test Token',
  decimals: 18,
  balance: BigInt('1000000000000000000'),
  formattedBalance: '1.0',
  category: TokenCategory.UNKNOWN,
  valueClass: TokenValueClass.MEDIUM_VALUE,
  riskScore: TokenRiskScore.LOW,
  spamScore: 10,
  isVerified: true,
  analysisTimestamp: Date.now(),
  confidenceScore: 85,
  ...overrides,
})

const generateMockTokens = (count: number): CategorizedToken[] => {
  const tokens: CategorizedToken[] = []
  const categories = Object.values(TokenCategory)
  const valueClasses = Object.values(TokenValueClass)
  const symbols = ['ETH', 'USDC', 'DAI', 'WBTC', 'LINK', 'UNI', 'AAVE', 'SNX', 'COMP', 'MKR']
  const names = [
    'Ethereum',
    'USD Coin',
    'Dai Stablecoin',
    'Wrapped Bitcoin',
    'Chainlink',
    'Uniswap',
    'Aave',
    'Synthetix',
    'Compound',
    'Maker',
  ]

  for (let i = 0; i < count; i++) {
    const idx = i % symbols.length
    tokens.push(
      mockToken({
        symbol: symbols[idx],
        name: names[idx],
        category: categories[i % categories.length] as TokenCategory,
        valueClass: valueClasses[i % valueClasses.length] as TokenValueClass,
        balance: BigInt(Math.floor(Math.random() * 1000000000000000000)),
        estimatedValueUSD: Math.random() * 10000,
        priceUSD: Math.random() * 100,
      }),
    )
  }

  return tokens
}

const EMPTY_SELECTED: Address[] = []

interface MockTokenListProps {
  tokens: CategorizedToken[]
  variant?: 'default' | 'compact' | 'card'
  layout?: 'list' | 'grid'
  searchQuery?: string
  selectedTokens?: Address[]
  onTokenClick?: (token: CategorizedToken) => void
  className?: string
}

const MockTokenList = ({
  tokens,
  variant = 'default',
  layout = 'list',
  searchQuery = '',
  selectedTokens = EMPTY_SELECTED,
  onTokenClick,
  className = '',
}: MockTokenListProps) => {
  const [search, setSearch] = React.useState(searchQuery)
  const [selected, setSelected] = React.useState<Address[]>(selectedTokens)

  const filteredTokens = tokens.filter(
    token =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()),
  )

  const variantClasses = {
    default: 'border-gray-200/60 shadow-sm',
    compact: 'border-gray-200/60 shadow-none',
    card: 'border-gray-200/60 shadow-lg rounded-xl',
  }

  return (
    <div
      className={`w-full rounded-lg border bg-white/80 backdrop-blur-md dark:bg-gray-900/80 dark:border-gray-700/40 ${variantClasses[variant]} ${className}`}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Token List</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredTokens.length === 1 ? '1 token' : `${filteredTokens.length} tokens`} found
            </p>
          </div>
          <button
            type="button"
            className="px-3 py-1 text-sm bg-violet-100 text-violet-700 rounded-md hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400"
            onClick={() => {
              if (selected.length > 0) {
                setSelected([])
              } else {
                setSelected(filteredTokens.map(t => t.address))
              }
            }}
          >
            {selected.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
          }}
          placeholder="Search tokens..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
        />

        <div className={`space-y-2 ${layout === 'grid' ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No tokens found</p>
            </div>
          ) : (
            filteredTokens.map(token => {
              const isSelected = selected.includes(token.address)
              return (
                <div
                  key={token.address}
                  className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => {
                    if (onTokenClick != null) {
                      onTokenClick(token)
                    }
                    setSelected(prev =>
                      prev.includes(token.address) ? prev.filter(a => a !== token.address) : [...prev, token.address],
                    )
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{token.symbol}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{token.formattedBalance}</div>
                      {token.estimatedValueUSD != null && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ${token.estimatedValueUSD.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof MockTokenList> = {
  title: 'Web3/TokenList',
  component: MockTokenList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'High-performance token list component with virtual scrolling, search, filtering, and batch selection. Optimized for wallets with 1000+ tokens using TanStack Virtual for efficient rendering.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: ['default', 'compact', 'card'],
      description: 'Visual style variant for the token list container',
    },
    layout: {
      control: {type: 'select'},
      options: ['list', 'grid'],
      description: 'Layout style for token items',
    },
    searchQuery: {
      control: {type: 'text'},
      description: 'Initial search query',
    },
    onTokenClick: {
      action: 'token-clicked',
      description: 'Callback when a token is clicked',
    },
  },
  decorators: [story => <div className="max-w-4xl mx-auto p-6">{story()}</div>],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    tokens: generateMockTokens(20),
    variant: 'default',
    layout: 'list',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default token list with 20 tokens, showing search and selection controls.',
      },
    },
  },
}

export const LargeTokenCollection: Story = {
  args: {
    tokens: generateMockTokens(100),
    variant: 'default',
    layout: 'list',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Token list with 100 tokens demonstrating performance. Critical for DeFi power users with large token collections.',
      },
    },
  },
}

export const WithSearch: Story = {
  args: {
    tokens: generateMockTokens(30),
    variant: 'default',
    layout: 'list',
    searchQuery: 'ETH',
  },
  parameters: {
    docs: {
      description: {
        story: 'Token list with active search query filtering results.',
      },
    },
  },
}

export const CompactVariant: Story = {
  args: {
    tokens: generateMockTokens(15),
    variant: 'compact',
    layout: 'list',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact variant with reduced visual prominence for space-constrained layouts.',
      },
    },
  },
}

export const CardLayout: Story = {
  args: {
    tokens: generateMockTokens(12),
    variant: 'card',
    layout: 'grid',
  },
  parameters: {
    docs: {
      description: {
        story: 'Card layout variant with grid display for a more visual token browsing experience.',
      },
    },
  },
}

export const EmptyState: Story = {
  args: {
    tokens: [],
    variant: 'default',
    layout: 'list',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no tokens are available. Shows helpful messaging to guide users.',
      },
    },
  },
}

export const FilteredByCategory: Story = {
  args: {
    tokens: generateMockTokens(30).map(t => ({...t, category: TokenCategory.UNWANTED})),
    variant: 'default',
    layout: 'list',
  },
  parameters: {
    docs: {
      description: {
        story: 'Token list showing only unwanted tokens - ideal for disposal workflow.',
      },
    },
  },
}
