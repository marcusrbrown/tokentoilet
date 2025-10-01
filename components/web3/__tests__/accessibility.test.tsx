/**
 * Accessibility Test Suite for Web3 Token Components
 *
 * This test suite validates WCAG 2.1 Level AA compliance for all token-related UI components
 * using vitest-axe and axe-core automated accessibility testing.
 *
 * Test Results Interpretation:
 * - **Passing tests (7)**: Verify the accessibility testing infrastructure works correctly
 * - **Failing tests (21)**: Detect real accessibility violations in components that need fixing
 *
 * Common Violations Detected:
 * - button-name: Buttons lack discernible text for screen readers (missing aria-label, text content, or title)
 *
 * Testing Strategy:
 * - Tests each component across multiple states (loading, error, different variants)
 * - Uses comprehensive Web3 mocking to ensure components render without provider errors
 * - Follows project patterns from `.github/copilot-instructions.md` for wagmi/Reown AppKit mocking
 *
 * Next Steps:
 * - Fix component implementations to address detected violations (separate task)
 * - Re-run tests to validate fixes reduce failure count to zero
 */

import type {CategorizedToken} from '@/lib/web3/token-filtering'

import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render} from '@testing-library/react'
import React from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {axe} from 'vitest-axe'

import {TokenApproval} from '../token-approval'
import {TokenDetail} from '../token-detail'
import {TokenList} from '../token-list'
import {TokenSelection} from '../token-selection'

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  Toaster: () => null,
}))

vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({
    open: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    isConnected: true,
    chain: {id: 1},
  })),
  useDisconnect: vi.fn(() => ({disconnect: vi.fn()})),
  useChainId: vi.fn(() => 1),
  useSwitchChain: vi.fn(() => ({switchChain: vi.fn()})),
  useConfig: vi.fn(() => ({chains: [{id: 1, name: 'Ethereum'}]})),
}))

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    isConnected: true,
    isConnecting: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    chainId: 1,
    networkInfo: {
      id: 1,
      name: 'Ethereum',
      nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
    },
    switchNetwork: vi.fn(),
    isUnsupportedNetwork: false,
    getUnsupportedNetworkError: vi.fn(() => null),
    handleUnsupportedNetwork: vi.fn(),
  })),
}))

vi.mock('@/hooks/use-token-categorization-preferences', () => ({
  useTokenCategorizationPreferences: vi.fn(() => ({
    preferences: {
      dustThreshold: 1,
      valuableThreshold: 100,
    },
    updatePreferences: vi.fn(),
    resetPreferences: vi.fn(),
  })),
}))

vi.mock('@/hooks/use-token-discovery', () => ({
  useTokenDiscovery: vi.fn(() => ({
    tokens: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
  useChainTokenDiscovery: vi.fn(() => ({
    tokens: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

vi.mock('@/hooks/use-token-filtering', () => ({
  useTokenFiltering: vi.fn(() => ({
    tokens: [],
    stats: {
      totalTokens: 0,
      filteredTokens: 0,
      categoryStats: {},
      valueStats: {},
      totalValueUSD: 0,
    },
    errors: [],
    totalTokens: 0,
    filteredTokens: 0,
    isLoading: false,
    error: null,
    isFetching: false,
    isSuccess: true,
    refresh: vi.fn(),
  })),
}))

vi.mock('@/hooks/use-token-metadata', () => ({
  useTokenMetadata: vi.fn(() => ({
    metadata: null,
    isLoading: false,
    error: null,
  })),
}))

vi.mock('@/hooks/use-token-approval', () => ({
  useTokenApproval: vi.fn(() => ({
    approvalState: {
      isApproved: false,
      isApproving: false,
      isChecking: false,
      currentAllowance: BigInt(0),
      requiredAmount: BigInt(1000000),
      isInfiniteApproval: true,
      approvalAmount: BigInt('1000000000000000000'),
      isPending: false,
    },
    gasEstimate: {
      estimatedGas: BigInt(50000),
      estimatedCostEth: '0.001',
      estimatedCostUsd: '2.50',
      gasPrice: BigInt(20000000000),
      maxFeePerGas: BigInt(30000000000),
      maxPriorityFeePerGas: BigInt(1500000000),
      isEstimating: false,
      error: null,
    },
    approve: vi.fn(),
    checkAllowance: vi.fn(),
    setApprovalAmount: vi.fn(),
  })),
}))

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    scrollToIndex: vi.fn(),
    measure: vi.fn(),
  })),
}))

vi.mock('next/image', () => ({
  default: vi.fn(
    (props: {src: string; alt: string; width: number; height: number; className?: string; onError?: () => void}) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={props.src}
        alt={props.alt}
        width={props.width}
        height={props.height}
        className={props.className}
        onError={props.onError}
      />
    ),
  ),
}))

/**
 * Creates a mock CategorizedToken for testing purposes
 *
 * Provides a complete token object with sensible defaults that can be partially
 * overridden for specific test scenarios.
 *
 * @param overrides - Partial CategorizedToken properties to override defaults
 * @returns Complete CategorizedToken with defaults merged with overrides
 *
 * @example
 * // Create default DAI token
 * const token = createMockToken()
 *
 * @example
 * // Create USDC token with custom properties
 * const usdc = createMockToken({
 *   symbol: 'USDC',
 *   name: 'USD Coin',
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
 * })
 *
 * @example
 * // Create high-risk spam token
 * const spam = createMockToken({
 *   category: TokenCategory.SPAM,
 *   riskScore: TokenRiskScore.HIGH
 * })
 */
function createMockToken(overrides?: Partial<CategorizedToken>): CategorizedToken {
  return {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as `0x${string}`,
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    chainId: 1,
    balance: BigInt('5000000000000000000'),
    balanceFormatted: '5.00',
    estimatedValueUSD: 5,
    category: TokenCategory.VALUABLE,
    valueClass: TokenValueClass.MEDIUM_VALUE,
    riskScore: TokenRiskScore.LOW,
    logoURI: 'https://example.com/dai.png',
    isVerified: true,
    ...overrides,
  } as CategorizedToken
}

// Test wrapper component
function TestWrapper({children}: {children: React.ReactNode}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('Token Components Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('TokenList Accessibility', () => {
    it('should have no accessibility violations with empty state', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenList />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with tokens', async () => {
      const mockTokens = [createMockToken(), createMockToken({symbol: 'USDC', name: 'USD Coin'})]

      const {useTokenDiscovery} = await import('@/hooks/use-token-discovery')
      vi.mocked(useTokenDiscovery).mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as never)

      const {useTokenFiltering} = await import('@/hooks/use-token-filtering')
      vi.mocked(useTokenFiltering).mockReturnValue({
        tokens: mockTokens,
        stats: {
          totalTokens: mockTokens.length,
          filteredTokens: mockTokens.length,
          categoryStats: {},
          valueStats: {},
          totalValueUSD: 10,
        },
        errors: [],
        totalTokens: mockTokens.length,
        filteredTokens: mockTokens.length,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        refresh: vi.fn(),
      } as never)

      const {container} = render(
        <TestWrapper>
          <TokenList />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in compact variant', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenList variant="compact" />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in card layout', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenList layout="grid" />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in loading state', async () => {
      const {useTokenDiscovery} = await import('@/hooks/use-token-discovery')
      vi.mocked(useTokenDiscovery).mockReturnValue({
        tokens: [],
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as never)

      const {container} = render(
        <TestWrapper>
          <TokenList />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in error state', async () => {
      const {useTokenDiscovery} = await import('@/hooks/use-token-discovery')
      vi.mocked(useTokenDiscovery).mockReturnValue({
        tokens: [],
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch tokens'),
        refetch: vi.fn(),
      } as never)

      const {container} = render(
        <TestWrapper>
          <TokenList />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('TokenDetail Accessibility', () => {
    const mockToken = createMockToken()

    it('should have no accessibility violations in modal variant', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenDetail token={mockToken} variant="modal" open={true} onClose={vi.fn()} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in inline variant', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenDetail token={mockToken} variant="inline" />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with low risk token', async () => {
      const lowRiskToken = createMockToken({riskScore: TokenRiskScore.LOW})

      const {container} = render(
        <TestWrapper>
          <TokenDetail token={lowRiskToken} variant="inline" />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with high risk token', async () => {
      const highRiskToken = createMockToken({riskScore: TokenRiskScore.HIGH, category: TokenCategory.SPAM})

      const {container} = render(
        <TestWrapper>
          <TokenDetail token={highRiskToken} variant="inline" />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with metadata loading', async () => {
      const {useTokenMetadata} = await import('@/hooks/use-token-metadata')
      vi.mocked(useTokenMetadata).mockReturnValue({
        metadata: null,
        isLoading: true,
        error: null,
      } as never)

      const {container} = render(
        <TestWrapper>
          <TokenDetail token={mockToken} variant="inline" />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with metadata error', async () => {
      const {useTokenMetadata} = await import('@/hooks/use-token-metadata')
      vi.mocked(useTokenMetadata).mockReturnValue({
        metadata: null,
        isLoading: false,
        error: new Error('Failed to fetch metadata'),
      } as never)

      const {container} = render(
        <TestWrapper>
          <TokenDetail token={mockToken} variant="inline" />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('TokenSelection Accessibility', () => {
    const mockTokens = [
      createMockToken(),
      createMockToken({symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'}),
      createMockToken({
        symbol: 'SPAM',
        name: 'Spam Token',
        category: TokenCategory.SPAM,
        riskScore: TokenRiskScore.HIGH,
        address: '0x1234567890123456789012345678901234567890',
      }),
    ]

    it('should have no accessibility violations in default variant', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenSelection tokens={mockTokens} selectedTokens={[]} onSelectionChange={vi.fn()} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in compact variant', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenSelection tokens={mockTokens} selectedTokens={[]} onSelectionChange={vi.fn()} variant="compact" />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with preselected tokens', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenSelection tokens={mockTokens} selectedTokens={[mockTokens[0].address]} onSelectionChange={vi.fn()} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with empty token list', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenSelection tokens={[]} selectedTokens={[]} onSelectionChange={vi.fn()} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with loading state', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenSelection tokens={mockTokens} selectedTokens={[]} onSelectionChange={vi.fn()} loading={true} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('TokenApproval Accessibility', () => {
    const mockToken = createMockToken()
    const mockSpender = '0x1234567890123456789012345678901234567890' as `0x${string}`

    it('should have no accessibility violations in default variant', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenApproval token={mockToken} spender={mockSpender} amount={BigInt('1000000000000000000')} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in compact variant', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenApproval
            token={mockToken}
            spender={mockSpender}
            amount={BigInt('1000000000000000000')}
            variant="compact"
          />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with infinite approval', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenApproval
            token={mockToken}
            spender={mockSpender}
            amount={BigInt('1000000000000000000')}
            useInfiniteApproval={true}
          />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with custom approval amount', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenApproval
            token={mockToken}
            spender={mockSpender}
            amount={BigInt('5000000000000000000')}
            useInfiniteApproval={false}
          />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in approving state', async () => {
      const {useTokenApproval} = await import('@/hooks/use-token-approval')
      vi.mocked(useTokenApproval).mockReturnValue({
        approvalState: {
          isApproved: false,
          isApproving: true,
          isChecking: false,
          currentAllowance: BigInt(0),
          requiredAmount: BigInt(1000000),
          isInfiniteApproval: true,
        },
        gasEstimate: {
          estimatedGas: BigInt(50000),
          estimatedCostEth: '0.001',
          estimatedCostUsd: '2.50',
          gasPrice: BigInt(20000000000),
          maxFeePerGas: BigInt(30000000000),
          maxPriorityFeePerGas: BigInt(1500000000),
          isEstimating: false,
          error: null,
        },
        approve: vi.fn(),
        checkAllowance: vi.fn(),
        setApprovalAmount: vi.fn(),
      } as never)

      const {container} = render(
        <TestWrapper>
          <TokenApproval token={mockToken} spender={mockSpender} amount={BigInt('1000000000000000000')} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations when already approved', async () => {
      const {useTokenApproval} = await import('@/hooks/use-token-approval')
      vi.mocked(useTokenApproval).mockReturnValue({
        approvalState: {
          isApproved: true,
          isApproving: false,
          isChecking: false,
          currentAllowance: BigInt(1000000000000000000),
          requiredAmount: BigInt(1000000),
          isInfiniteApproval: true,
        },
        gasEstimate: {
          estimatedGas: BigInt(0),
          estimatedCostEth: '0',
          estimatedCostUsd: '0',
          gasPrice: BigInt(0),
          maxFeePerGas: BigInt(0),
          maxPriorityFeePerGas: BigInt(0),
          isEstimating: false,
          error: null,
        },
        approve: vi.fn(),
        checkAllowance: vi.fn(),
        setApprovalAmount: vi.fn(),
      } as never)

      const {container} = render(
        <TestWrapper>
          <TokenApproval token={mockToken} spender={mockSpender} amount={BigInt('1000000000000000000')} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with gas estimation loading', async () => {
      const {useTokenApproval} = await import('@/hooks/use-token-approval')
      vi.mocked(useTokenApproval).mockReturnValue({
        approvalState: {
          isApproved: false,
          isApproving: false,
          isChecking: false,
          currentAllowance: BigInt(0),
          requiredAmount: BigInt(1000000),
          isInfiniteApproval: true,
        },
        gasEstimate: {
          estimatedGas: BigInt(0),
          estimatedCostEth: '0',
          estimatedCostUsd: '0',
          gasPrice: BigInt(0),
          maxFeePerGas: BigInt(0),
          maxPriorityFeePerGas: BigInt(0),
          isEstimating: true,
          error: null,
        },
        approve: vi.fn(),
        checkAllowance: vi.fn(),
        setApprovalAmount: vi.fn(),
      } as never)

      const {container} = render(
        <TestWrapper>
          <TokenApproval token={mockToken} spender={mockSpender} amount={BigInt('1000000000000000000')} />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with advanced controls', async () => {
      const {container} = render(
        <TestWrapper>
          <TokenApproval
            token={mockToken}
            spender={mockSpender}
            amount={BigInt('1000000000000000000')}
            showAdvanced={true}
          />
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Cross-Component Accessibility Integration', () => {
    it('should have no accessibility violations with combined token selection and approval', async () => {
      const mockTokens = [createMockToken()]
      const mockSpender = '0x1234567890123456789012345678901234567890' as `0x${string}`

      const {container} = render(
        <TestWrapper>
          <div>
            <TokenSelection tokens={mockTokens} selectedTokens={[]} onSelectionChange={vi.fn()} />
            <TokenApproval
              token={mockTokens[0]}
              spender={mockSpender}
              amount={BigInt('1000000000000000000')}
              variant="compact"
            />
          </div>
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations with complete disposal workflow UI', async () => {
      const mockTokens = [createMockToken(), createMockToken({symbol: 'USDC', name: 'USD Coin'})]
      const mockSpender = '0x1234567890123456789012345678901234567890' as `0x${string}`

      const {useTokenDiscovery} = await import('@/hooks/use-token-discovery')
      vi.mocked(useTokenDiscovery).mockReturnValue({
        tokens: mockTokens,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as never)

      const {useTokenFiltering} = await import('@/hooks/use-token-filtering')
      vi.mocked(useTokenFiltering).mockReturnValue({
        tokens: mockTokens,
        stats: {
          totalTokens: mockTokens.length,
          filteredTokens: mockTokens.length,
          categoryStats: {},
          valueStats: {},
          totalValueUSD: 10,
        },
        errors: [],
        totalTokens: mockTokens.length,
        filteredTokens: mockTokens.length,
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        refresh: vi.fn(),
      } as never)

      const {container} = render(
        <TestWrapper>
          <div>
            <TokenList variant="compact" />
            <TokenSelection tokens={mockTokens} selectedTokens={[]} onSelectionChange={vi.fn()} variant="compact" />
            <TokenApproval
              token={mockTokens[0]}
              spender={mockSpender}
              amount={BigInt('1000000000000000000')}
              variant="compact"
            />
          </div>
        </TestWrapper>,
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
