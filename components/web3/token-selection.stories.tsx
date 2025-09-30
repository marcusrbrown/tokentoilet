import type {CategorizedToken} from '@/lib/web3/token-filtering'
import type {Meta, StoryObj} from '@storybook/react'
import type {Address} from 'viem'

import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'

import {TokenSelection} from './token-selection'

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
  estimatedValueUSD: 100,
  ...overrides,
})

const generateMockTokens = (count: number): CategorizedToken[] => {
  const tokens: CategorizedToken[] = []
  const categories = Object.values(TokenCategory)
  const valueClasses = Object.values(TokenValueClass)

  for (let i = 0; i < count; i++) {
    tokens.push(
      mockToken({
        symbol: `TKN${i}`,
        name: `Token ${i}`,
        category: categories[i % categories.length] as TokenCategory,
        valueClass: valueClasses[i % valueClasses.length] as TokenValueClass,
        estimatedValueUSD: Math.random() * 1000,
        spamScore: Math.floor(Math.random() * 100),
      }),
    )
  }

  return tokens
}

const meta: Meta<typeof TokenSelection> = {
  title: 'Web3/TokenSelection',
  component: TokenSelection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Advanced token selection component with batch operations, quick selection presets, filtering, and selection statistics. Designed for efficient multi-token disposal workflows.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: ['default', 'compact', 'modal'],
      description: 'Visual variant',
    },
    size: {
      control: {type: 'select'},
      options: ['sm', 'default', 'lg'],
      description: 'Component size',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    onSelectionChange: {
      action: 'selection-changed',
      description: 'Callback when selection changes',
    },
  },
  decorators: [story => <div className="max-w-4xl mx-auto p-6">{story()}</div>],
}

export default meta
type Story = StoryObj<typeof meta>

const EMPTY_SELECTION: Address[] = []

export const Default: Story = {
  args: {
    tokens: generateMockTokens(50),
    selectedTokens: EMPTY_SELECTION,
    variant: 'default',
    size: 'default',
    config: {
      enableQuickSelection: true,
      enableAdvancedFiltering: true,
      enableBatchOperations: true,
      showSelectionStats: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Default token selection interface with all features enabled.',
      },
    },
  },
}

export const CompactVariant: Story = {
  args: {
    tokens: generateMockTokens(25),
    selectedTokens: EMPTY_SELECTION,
    variant: 'compact',
    size: 'sm',
    config: {
      enableQuickSelection: true,
      enableAdvancedFiltering: false,
      enableBatchOperations: true,
      showSelectionStats: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact variant with minimal features for space-constrained layouts.',
      },
    },
  },
}

export const WithPreselection: Story = {
  args: {
    tokens: generateMockTokens(30),
    selectedTokens: generateMockTokens(5).map(t => t.address),
    variant: 'default',
    size: 'default',
    config: {
      enableQuickSelection: true,
      showSelectionStats: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Token selection with pre-selected tokens showing selection statistics.',
      },
    },
  },
}

export const QuickSelectionPresets: Story = {
  args: {
    tokens: [
      ...generateMockTokens(10).map(t => ({...t, category: TokenCategory.SPAM, spamScore: 85})),
      ...generateMockTokens(10).map(t => ({...t, category: TokenCategory.DUST, estimatedValueUSD: 0.005})),
      ...generateMockTokens(10).map(t => ({...t, category: TokenCategory.UNWANTED})),
      ...generateMockTokens(10).map(t => ({...t, category: TokenCategory.VALUABLE, estimatedValueUSD: 5000})),
    ],
    selectedTokens: EMPTY_SELECTION,
    variant: 'default',
    size: 'default',
    config: {
      enableQuickSelection: true,
      enableAdvancedFiltering: true,
      showSelectionStats: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates quick selection presets for common disposal scenarios: spam, dust, and unwanted tokens.',
      },
    },
  },
}

export const FilteredTokens: Story = {
  args: {
    tokens: generateMockTokens(40).map(t => ({
      ...t,
      category: Math.random() > 0.5 ? TokenCategory.SPAM : TokenCategory.UNWANTED,
    })),
    selectedTokens: EMPTY_SELECTION,
    variant: 'default',
    size: 'default',
    initialFilter: {
      categories: [TokenCategory.SPAM, TokenCategory.UNWANTED],
    },
    config: {
      enableAdvancedFiltering: true,
      showSelectionStats: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Pre-filtered token list showing only disposal candidates (spam and unwanted).',
      },
    },
  },
}

export const LoadingState: Story = {
  args: {
    tokens: generateMockTokens(20),
    selectedTokens: EMPTY_SELECTION,
    variant: 'default',
    size: 'default',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state while token discovery or filtering is in progress.',
      },
    },
  },
}

export const LargeSelection: Story = {
  args: {
    tokens: generateMockTokens(100),
    selectedTokens: EMPTY_SELECTION,
    variant: 'default',
    size: 'default',
    config: {
      enableQuickSelection: true,
      enableAdvancedFiltering: true,
      enableBatchOperations: true,
      showSelectionStats: true,
      maxSelection: 100,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Large token collection demonstrating performance with 100 tokens.',
      },
    },
  },
}

export const MaxSelectionLimit: Story = {
  args: {
    tokens: generateMockTokens(50),
    selectedTokens: EMPTY_SELECTION,
    variant: 'default',
    size: 'default',
    config: {
      enableQuickSelection: true,
      showSelectionStats: true,
      maxSelection: 10,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates maximum selection limit enforcement (10 tokens max in this example).',
      },
    },
  },
}

export const ModalVariant: Story = {
  args: {
    tokens: generateMockTokens(30),
    selectedTokens: EMPTY_SELECTION,
    variant: 'modal',
    size: 'lg',
    config: {
      enableQuickSelection: true,
      enableAdvancedFiltering: true,
      showSelectionStats: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal variant for use in dialog/overlay contexts with larger size.',
      },
    },
  },
}
