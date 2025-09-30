import type {CategorizedToken} from '@/lib/web3/token-filtering'
import type {Meta, StoryObj} from '@storybook/react'

import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'

import {TokenDetail} from './token-detail'

const mockToken = (overrides: Partial<CategorizedToken> = {}): CategorizedToken => ({
  address: `0x${'a'.repeat(40)}`,
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
  priceUSD: 1250.5,
  marketCapUSD: 1000000,
  ...overrides,
})

const meta: Meta<typeof TokenDetail> = {
  title: 'Web3/TokenDetail',
  component: TokenDetail,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Detailed token information component with extended metadata, security assessments, and action buttons. Supports modal and inline display modes with risk-based visual indicators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isModal: {
      control: 'boolean',
      description: 'Display as modal or inline',
    },
    open: {
      control: 'boolean',
      description: 'Modal open state (when isModal=true)',
    },
    variant: {
      control: {type: 'select'},
      options: ['modal', 'inline'],
      description: 'Display variant',
    },
    onClose: {
      action: 'close',
      description: 'Callback when modal closes',
    },
    onAddToFavorites: {
      action: 'add-to-favorites',
      description: 'Callback when user adds token to favorites',
    },
    onCategorizeToken: {
      action: 'categorize-token',
      description: 'Callback when user categorizes token',
    },
    onReportSpam: {
      action: 'report-spam',
      description: 'Callback when user reports spam',
    },
  },
  decorators: [story => <div className="max-w-2xl mx-auto p-6">{story()}</div>],
}

export default meta
type Story = StoryObj<typeof meta>

export const ModalLowRisk: Story = {
  args: {
    token: mockToken({
      symbol: 'USDC',
      name: 'USD Coin',
      riskScore: TokenRiskScore.VERIFIED,
      category: TokenCategory.VALUABLE,
      spamScore: 0,
      estimatedValueUSD: 1000,
    }),
    isModal: true,
    open: true,
    variant: 'modal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Token detail modal for low-risk verified token with safe status indicators.',
      },
    },
  },
}

export const ModalMediumRisk: Story = {
  args: {
    token: mockToken({
      symbol: 'NEWTOKEN',
      name: 'New Token Project',
      riskScore: TokenRiskScore.MEDIUM,
      category: TokenCategory.UNKNOWN,
      spamScore: 35,
      isVerified: false,
    }),
    isModal: true,
    open: true,
    variant: 'modal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium risk token with warning indicators and moderate spam score.',
      },
    },
  },
}

export const ModalHighRisk: Story = {
  args: {
    token: mockToken({
      symbol: 'SCAM',
      name: 'Suspicious Token',
      riskScore: TokenRiskScore.HIGH,
      category: TokenCategory.UNWANTED,
      spamScore: 65,
      isVerified: false,
      estimatedValueUSD: 0.01,
    }),
    isModal: true,
    open: true,
    variant: 'modal',
  },
  parameters: {
    docs: {
      description: {
        story: 'High risk token with prominent warning indicators and elevated spam score.',
      },
    },
  },
}

export const ModalSpamToken: Story = {
  args: {
    token: mockToken({
      symbol: 'SPAM',
      name: 'Obvious Spam Token',
      riskScore: TokenRiskScore.HIGH,
      category: TokenCategory.SPAM,
      spamScore: 95,
      isVerified: false,
      estimatedValueUSD: 0,
    }),
    isModal: true,
    open: true,
    variant: 'modal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Spam token with critical warning indicators and red visual theme.',
      },
    },
  },
}

export const InlineView: Story = {
  args: {
    token: mockToken({
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      riskScore: TokenRiskScore.VERIFIED,
      category: TokenCategory.VALUABLE,
      spamScore: 0,
      estimatedValueUSD: 500,
    }),
    isModal: false,
    variant: 'inline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline variant for embedding token details within other components.',
      },
    },
  },
}

export const DustToken: Story = {
  args: {
    token: mockToken({
      symbol: 'DUST',
      name: 'Dust Token',
      riskScore: TokenRiskScore.LOW,
      category: TokenCategory.DUST,
      spamScore: 20,
      balance: BigInt('100000000000000'),
      formattedBalance: '0.0001',
      estimatedValueUSD: 0.001,
      valueClass: TokenValueClass.DUST,
    }),
    isModal: true,
    open: true,
    variant: 'modal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Dust token with negligible value - common disposal candidate.',
      },
    },
  },
}

export const UnknownToken: Story = {
  args: {
    token: mockToken({
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      riskScore: TokenRiskScore.UNKNOWN,
      category: TokenCategory.UNKNOWN,
      spamScore: 50,
      isVerified: false,
      estimatedValueUSD: undefined,
      priceUSD: undefined,
      marketCapUSD: undefined,
    }),
    isModal: true,
    open: true,
    variant: 'modal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Token with unknown metadata and risk assessment - requires user caution.',
      },
    },
  },
}

export const HighValueToken: Story = {
  args: {
    token: mockToken({
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      riskScore: TokenRiskScore.VERIFIED,
      category: TokenCategory.VALUABLE,
      spamScore: 0,
      estimatedValueUSD: 45000,
      priceUSD: 45000,
      marketCapUSD: 8000000000,
      valueClass: TokenValueClass.HIGH_VALUE,
    }),
    isModal: true,
    open: true,
    variant: 'modal',
  },
  parameters: {
    docs: {
      description: {
        story: 'High-value token with significant USD value - clear "keep" indicator.',
      },
    },
  },
}

export const ClosedModal: Story = {
  args: {
    token: mockToken({
      symbol: 'ETH',
      name: 'Ethereum',
      riskScore: TokenRiskScore.VERIFIED,
    }),
    isModal: true,
    open: false,
    variant: 'modal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Closed modal state - useful for testing visibility toggles.',
      },
    },
  },
}
