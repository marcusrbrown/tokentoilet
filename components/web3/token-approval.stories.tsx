import type {CategorizedToken} from '@/lib/web3/token-filtering'
import type {Meta, StoryObj} from '@storybook/react'
import type {Address} from 'viem'

import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'

import {TokenApproval} from './token-approval'

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
  estimatedValueUSD: 1250.5,
  ...overrides,
})

const DISPOSAL_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890' as Address

const meta: Meta<typeof TokenApproval> = {
  title: 'Web3/TokenApproval',
  component: TokenApproval,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Token approval workflow component for ERC-20 token approvals. Supports infinite and custom approval amounts with gas estimation and status tracking.',
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
    useInfiniteApproval: {
      control: 'boolean',
      description: 'Use infinite approval by default',
    },
    showAdvanced: {
      control: 'boolean',
      description: 'Show advanced controls',
    },
    autoRefresh: {
      control: 'boolean',
      description: 'Auto-refresh allowance after approval',
    },
    onApprovalComplete: {
      action: 'approval-complete',
      description: 'Callback when approval completes',
    },
    onApprovalStart: {
      action: 'approval-start',
      description: 'Callback when approval starts',
    },
  },
  decorators: [story => <div className="max-w-lg mx-auto p-6">{story()}</div>],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    token: mockToken({
      symbol: 'USDC',
      name: 'USD Coin',
      balance: BigInt('1000000000'),
      decimals: 6,
      formattedBalance: '1,000.00',
      estimatedValueUSD: 1000,
    }),
    spender: DISPOSAL_CONTRACT_ADDRESS,
    variant: 'default',
    size: 'default',
    useInfiniteApproval: true,
    showAdvanced: true,
    autoRefresh: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default token approval workflow with infinite approval enabled.',
      },
    },
  },
}

export const CustomAmount: Story = {
  args: {
    token: mockToken({
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      balance: BigInt('5000000000000000000000'),
      formattedBalance: '5,000.00',
      estimatedValueUSD: 5000,
    }),
    spender: DISPOSAL_CONTRACT_ADDRESS,
    amount: BigInt('1000000000000000000000'),
    variant: 'default',
    size: 'default',
    useInfiniteApproval: false,
    showAdvanced: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Token approval with custom amount (1,000 tokens instead of infinite).',
      },
    },
  },
}

export const CompactVariant: Story = {
  args: {
    token: mockToken({
      symbol: 'LINK',
      name: 'Chainlink',
      balance: BigInt('100000000000000000000'),
      formattedBalance: '100.00',
      estimatedValueUSD: 1500,
    }),
    spender: DISPOSAL_CONTRACT_ADDRESS,
    variant: 'compact',
    size: 'sm',
    useInfiniteApproval: true,
    showAdvanced: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact variant with minimal controls for space-constrained layouts.',
      },
    },
  },
}

export const ModalVariant: Story = {
  args: {
    token: mockToken({
      symbol: 'UNI',
      name: 'Uniswap',
      balance: BigInt('500000000000000000000'),
      formattedBalance: '500.00',
      estimatedValueUSD: 3500,
    }),
    spender: DISPOSAL_CONTRACT_ADDRESS,
    variant: 'modal',
    size: 'lg',
    useInfiniteApproval: true,
    showAdvanced: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal variant for use in dialog/overlay contexts.',
      },
    },
  },
}

export const LowBalanceToken: Story = {
  args: {
    token: mockToken({
      symbol: 'DUST',
      name: 'Dust Token',
      balance: BigInt('100000000000000'),
      decimals: 18,
      formattedBalance: '0.0001',
      estimatedValueUSD: 0.001,
      category: TokenCategory.DUST,
      valueClass: TokenValueClass.DUST,
    }),
    spender: DISPOSAL_CONTRACT_ADDRESS,
    variant: 'default',
    size: 'default',
    useInfiniteApproval: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Approval for low-balance dust token with negligible value.',
      },
    },
  },
}

export const HighValueToken: Story = {
  args: {
    token: mockToken({
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      balance: BigInt('100000000'),
      decimals: 8,
      formattedBalance: '1.00',
      estimatedValueUSD: 45000,
      category: TokenCategory.VALUABLE,
      valueClass: TokenValueClass.HIGH_VALUE,
    }),
    spender: DISPOSAL_CONTRACT_ADDRESS,
    variant: 'default',
    size: 'default',
    useInfiniteApproval: false,
    showAdvanced: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'High-value token approval with prominent value display and custom amount recommended over infinite.',
      },
    },
  },
}

export const WithAdvancedControls: Story = {
  args: {
    token: mockToken({
      symbol: 'AAVE',
      name: 'Aave',
      balance: BigInt('250000000000000000000'),
      formattedBalance: '250.00',
      estimatedValueUSD: 22500,
    }),
    spender: DISPOSAL_CONTRACT_ADDRESS,
    variant: 'default',
    size: 'default',
    useInfiniteApproval: true,
    showAdvanced: true,
    autoRefresh: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Full approval interface with all advanced controls visible.',
      },
    },
  },
}

export const MinimalControls: Story = {
  args: {
    token: mockToken({
      symbol: 'SNX',
      name: 'Synthetix',
      balance: BigInt('500000000000000000000'),
      formattedBalance: '500.00',
      estimatedValueUSD: 1250,
    }),
    spender: DISPOSAL_CONTRACT_ADDRESS,
    variant: 'default',
    size: 'default',
    useInfiniteApproval: true,
    showAdvanced: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal approval interface with advanced controls hidden.',
      },
    },
  },
}

export const SmallSize: Story = {
  args: {
    token: mockToken({
      symbol: 'COMP',
      name: 'Compound',
      balance: BigInt('50000000000000000000'),
      formattedBalance: '50.00',
      estimatedValueUSD: 3000,
    }),
    spender: DISPOSAL_CONTRACT_ADDRESS,
    variant: 'compact',
    size: 'sm',
    useInfiniteApproval: true,
    showAdvanced: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Small size variant for inline or constrained layouts.',
      },
    },
  },
}

export const LargeSize: Story = {
  args: {
    token: mockToken({
      symbol: 'MKR',
      name: 'Maker',
      balance: BigInt('10000000000000000000'),
      formattedBalance: '10.00',
      estimatedValueUSD: 15000,
    }),
    spender: DISPOSAL_CONTRACT_ADDRESS,
    variant: 'default',
    size: 'lg',
    useInfiniteApproval: true,
    showAdvanced: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Large size variant for prominent approval workflows.',
      },
    },
  },
}
