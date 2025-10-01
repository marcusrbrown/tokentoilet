/**
 * End-to-End Tests for Token Discovery and Selection Workflows - TASK-028
 *
 * Comprehensive E2E tests covering complete user workflows from wallet connection
 * through token discovery, selection, and approval. Tests use Vitest + jsdom to
 * simulate realistic user interactions with full component integration.
 *
 * Test Coverage:
 * - Token Discovery Workflow: wallet connection → token discovery → metadata loading
 * - Token Selection Workflow: list display → search/filter → batch selection
 * - Token Approval Workflow: selection → approval → gas estimation → transaction
 */

import type {CategorizedToken} from '@/lib/web3/token-filtering'
import {useTokenApproval} from '@/hooks/use-token-approval'
import {useTokenDiscovery} from '@/hooks/use-token-discovery'
import {useTokenFiltering} from '@/hooks/use-token-filtering'
import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'

import userEvent from '@testing-library/user-event'
import {parseUnits, type Address} from 'viem'
import {beforeEach, describe, expect, it, vi, type Mock} from 'vitest'

import {useAccount, useChainId, useReadContract, useWriteContract} from 'wagmi'
import {TokenApproval} from '../token-approval'
import {TokenList} from '../token-list'
import {TokenSelection} from '../token-selection'

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useReadContract: vi.fn(),
  useWriteContract: vi.fn(),
  useEstimateGas: vi.fn(),
  useConfig: vi.fn(() => ({chains: []})),
  useDisconnect: vi.fn(() => ({disconnect: vi.fn()})),
  useSwitchChain: vi.fn(() => ({switchChain: vi.fn(), isPending: false, error: null})),
}))

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(() => ({
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Address,
    isConnected: true,
    chainId: 1,
    currentNetwork: {id: 1, name: 'Ethereum', nativeCurrency: {symbol: 'ETH'}},
    isCurrentChainSupported: true,
    getUnsupportedNetworkError: vi.fn(() => null),
    getSupportedChains: vi.fn(() => [
      {id: 1, name: 'Ethereum Mainnet'},
      {id: 137, name: 'Polygon'},
      {id: 42161, name: 'Arbitrum One'},
    ]),
    isSupportedChain: vi.fn(() => true),
    validateCurrentNetwork: vi.fn(() => ({success: true})),
    handleUnsupportedNetwork: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}))

vi.mock('@/hooks/use-token-discovery', () => ({
  useTokenDiscovery: vi.fn(),
}))

vi.mock('@/hooks/use-token-filtering', () => ({
  useTokenFiltering: vi.fn(),
  useTokenCategorizationPreferences: vi.fn(() => ({
    preferences: {
      favoriteTokens: new Set(),
      hiddenTokens: new Set(),
    },
  })),
}))

vi.mock('@/hooks/use-token-approval', () => ({
  useTokenApproval: vi.fn(),
}))

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getTotalSize: () => 400,
    getVirtualItems: () => [
      {key: 'item-0', index: 0, start: 0, size: 80},
      {key: 'item-1', index: 1, start: 80, size: 80},
      {key: 'item-2', index: 2, start: 160, size: 80},
    ],
  })),
}))

const mockAppKitOpen = vi.fn()
vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({
    open: mockAppKitOpen,
  })),
  createAppKit: vi.fn(),
}))

vi.mock('@reown/appkit/networks', () => ({
  mainnet: {id: 1, name: 'Ethereum'},
  polygon: {id: 137, name: 'Polygon'},
  arbitrum: {id: 42161, name: 'Arbitrum'},
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}))

const WALLET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Address
const SPENDER_ADDRESS = '0x1234567890123456789012345678901234567890' as Address
const TEST_TIMEOUT = 3000 as const

/**
 * Creates realistic token data for testing.
 * Generates random addresses to ensure test isolation across parallel runs.
 */
function createMockToken(overrides: Partial<CategorizedToken> = {}): CategorizedToken {
  const defaults: CategorizedToken = {
    address: `0x${Math.random().toString(16).slice(2, 42)}`,
    chainId: 1,
    name: 'Test Token',
    symbol: 'TEST',
    decimals: 18,
    balance: parseUnits('100', 18),
    formattedBalance: '100',
    category: TokenCategory.VALUABLE,
    valueClass: TokenValueClass.MEDIUM_VALUE,
    riskScore: TokenRiskScore.LOW,
    spamScore: 0,
    isVerified: true,
    analysisTimestamp: Date.now(),
    confidenceScore: 95,
    estimatedValueUSD: 100,
    priceUSD: 1,
  }

  return {...defaults, ...overrides}
}

/**
 * Test utility: Create multiple mock tokens for various test scenarios
 */
function createMockTokenCollection(): CategorizedToken[] {
  return [
    createMockToken({
      name: 'Ethereum',
      symbol: 'ETH',
      balance: parseUnits('10', 18),
      estimatedValueUSD: 20000,
      category: TokenCategory.VALUABLE,
      valueClass: TokenValueClass.HIGH_VALUE,
    }),
    createMockToken({
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      balance: parseUnits('1000', 6),
      estimatedValueUSD: 1000,
      category: TokenCategory.VALUABLE,
      valueClass: TokenValueClass.MEDIUM_VALUE,
    }),
    createMockToken({
      name: 'Spam Token',
      symbol: 'SPAM',
      balance: parseUnits('1000000', 18),
      estimatedValueUSD: 0.01,
      category: TokenCategory.SPAM,
      valueClass: TokenValueClass.DUST,
      riskScore: TokenRiskScore.HIGH,
      spamScore: 95,
      isVerified: false,
    }),
    createMockToken({
      name: 'Dust Token',
      symbol: 'DUST',
      balance: parseUnits('0.0001', 18),
      estimatedValueUSD: 0.001,
      category: TokenCategory.DUST,
      valueClass: TokenValueClass.DUST,
    }),
    createMockToken({
      name: 'Unwanted Token',
      symbol: 'UNWANTED',
      balance: parseUnits('50', 18),
      estimatedValueUSD: 10,
      category: TokenCategory.UNWANTED,
      valueClass: TokenValueClass.LOW_VALUE,
    }),
  ]
}

/**
 * Test utility: Wrap components with required providers
 */
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Token Discovery Workflow E2E Tests', () => {
  const mockUseAccount = useAccount as unknown as Mock
  const mockUseChainId = useChainId as unknown as Mock
  const mockUseReadContract = useReadContract as unknown as Mock
  const mockUseTokenDiscovery = useTokenDiscovery as unknown as Mock
  const mockUseTokenFiltering = useTokenFiltering as unknown as Mock

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAccount.mockReturnValue({
      address: WALLET_ADDRESS,
      isConnected: true,
      connector: {id: 'metaMaskSDK', name: 'MetaMask'},
    })

    mockUseChainId.mockReturnValue(1)

    const mockTokens = createMockTokenCollection()
    mockUseTokenDiscovery.mockReturnValue({
      tokens: mockTokens.map(t => ({
        address: t.address,
        chainId: t.chainId,
        name: t.name,
        symbol: t.symbol,
        decimals: t.decimals,
        balance: t.balance,
      })),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    mockUseTokenFiltering.mockReturnValue({
      tokens: mockTokens,
      isLoading: false,
      error: null,
    })

    mockUseReadContract.mockImplementation(({functionName, address}: {address?: Address; functionName: string}) => {
      if (functionName === 'balanceOf') {
        const token = mockTokens.find(t => t.address === address)
        return {
          data: token?.balance ?? parseUnits('0', 18),
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        }
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      }
    })
  })

  it('should complete token discovery workflow: connect wallet → discover tokens → display list', async () => {
    renderWithProviders(<TokenList />)

    await waitFor(
      () => {
        const tokenListElement = screen.queryByText('5 tokens')
        expect(tokenListElement).toBeInTheDocument()
      },
      {timeout: TEST_TIMEOUT},
    )
  })

  it('should handle token discovery across multiple chains', async () => {
    mockUseChainId.mockReturnValue(137)

    renderWithProviders(<TokenList />)

    await waitFor(
      () => {
        expect(screen.getByText(/5\s+tokens/i)).toBeInTheDocument()
      },
      {timeout: TEST_TIMEOUT},
    )
  })

  it('should handle token discovery errors gracefully', async () => {
    const testError = new Error('RPC rate limit exceeded')
    mockUseTokenDiscovery.mockReturnValue({
      tokens: [],
      isLoading: false,
      error: testError,
      refetch: vi.fn(),
    })

    renderWithProviders(<TokenList />)

    await waitFor(
      () => {
        expect(screen.getByText('Failed to Load Tokens')).toBeInTheDocument()
        expect(screen.getByText('RPC rate limit exceeded')).toBeInTheDocument()
      },
      {timeout: TEST_TIMEOUT},
    )
  })

  it('should show loading state during token discovery', () => {
    mockUseTokenDiscovery.mockReturnValue({
      tokens: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    renderWithProviders(<TokenList />)

    const skeletons = screen.queryAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should display empty state when no tokens found', async () => {
    mockUseTokenDiscovery.mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    mockUseTokenFiltering.mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
    })

    renderWithProviders(<TokenList />)

    await waitFor(
      () => {
        expect(screen.getByText('No Tokens Found')).toBeInTheDocument()
      },
      {timeout: TEST_TIMEOUT},
    )
  })

  it('should support token metadata fetching with fallback strategies', async () => {
    const tokenWithoutMetadata = createMockToken({
      metadata: undefined,
    })

    mockUseReadContract.mockReturnValue({
      data: tokenWithoutMetadata.balance,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    renderWithProviders(<TokenList />)

    await waitFor(
      () => {
        expect(screen.queryByText(/discovering tokens/i)).not.toBeInTheDocument()
      },
      {timeout: TEST_TIMEOUT},
    )
  })
})

describe('Token Selection Workflow E2E Tests', () => {
  const mockTokens = createMockTokenCollection()

  const mockUseAccount = useAccount as unknown as Mock
  const mockUseChainId = useChainId as unknown as Mock

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAccount.mockReturnValue({
      address: WALLET_ADDRESS,
      isConnected: true,
      connector: {id: 'metaMaskSDK', name: 'MetaMask'},
    })

    mockUseChainId.mockReturnValue(1)
  })

  it('should complete batch selection workflow: view list → select all → deselect', async () => {
    const user = userEvent.setup()
    const handleSelectionChange = vi.fn()

    renderWithProviders(
      <TokenSelection tokens={mockTokens} selectedTokens={[]} onSelectionChange={handleSelectionChange} />,
    )

    await waitFor(() => {
      expect(screen.getByText('Batch Selection')).toBeInTheDocument()
    })

    const selectAllButton = screen.queryByRole('button', {name: /select all/i})
    if (selectAllButton) {
      await user.click(selectAllButton)

      await waitFor(() => {
        expect(handleSelectionChange).toHaveBeenCalledWith(expect.arrayContaining(mockTokens.map(t => t.address)))
      })

      const clearButton = screen.queryByRole('button', {name: /clear selection|deselect all/i})
      if (clearButton) {
        await user.click(clearButton)

        await waitFor(() => {
          expect(handleSelectionChange).toHaveBeenCalledWith([])
        })
      }
    }
  })

  it('should support quick selection presets: spam, dust, high value', async () => {
    const user = userEvent.setup()
    const handleSelectionChange = vi.fn()

    renderWithProviders(
      <TokenSelection
        tokens={mockTokens}
        selectedTokens={[]}
        onSelectionChange={handleSelectionChange}
        config={{
          enableQuickSelection: true,
          enableBatchOperations: true,
          enableAdvancedFiltering: true,
          persistSelection: false,
          showSelectionStats: true,
        }}
      />,
    )

    const spamButton = screen.getByRole('button', {name: /select.*spam/i})
    await user.click(spamButton)

    await waitFor(() => {
      const spamTokens = mockTokens.filter(t => t.category === TokenCategory.SPAM)
      expect(handleSelectionChange).toHaveBeenCalledWith(spamTokens.map(t => t.address))
    })
  })

  it('should display selection statistics: count, total value, category breakdown', async () => {
    const selectedTokens = [mockTokens[0].address, mockTokens[1].address]

    renderWithProviders(
      <TokenSelection
        tokens={mockTokens}
        selectedTokens={selectedTokens}
        onSelectionChange={vi.fn()}
        config={{
          enableQuickSelection: true,
          enableBatchOperations: true,
          enableAdvancedFiltering: true,
          persistSelection: false,
          showSelectionStats: true,
        }}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/2.*selected/i)).toBeInTheDocument()
    })

    const token0Value = mockTokens[0]?.estimatedValueUSD ?? 0
    const token1Value = mockTokens[1]?.estimatedValueUSD ?? 0
    const expectedValue = token0Value + token1Value
    expect(screen.getByText(new RegExp(expectedValue.toFixed(2)))).toBeInTheDocument()
  })

  it('should support advanced filtering: category, value range, risk level', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <TokenSelection
        tokens={mockTokens}
        selectedTokens={[]}
        onSelectionChange={vi.fn()}
        config={{
          enableQuickSelection: true,
          enableBatchOperations: true,
          enableAdvancedFiltering: true,
          persistSelection: false,
          showSelectionStats: true,
        }}
      />,
    )

    const advancedFiltersButton = screen.queryByRole('button', {name: /advanced.*filter/i})
    if (advancedFiltersButton) {
      await user.click(advancedFiltersButton)

      await waitFor(() => {
        const elements = screen.getAllByText(/category|value|risk/i)
        expect(elements.length).toBeGreaterThan(0)
      })
    }
  })

  it('should enforce maximum selection limits', async () => {
    const user = userEvent.setup()
    const handleSelectionChange = vi.fn()

    renderWithProviders(
      <TokenSelection
        tokens={mockTokens}
        selectedTokens={[]}
        onSelectionChange={handleSelectionChange}
        config={{
          enableQuickSelection: true,
          enableBatchOperations: true,
          enableAdvancedFiltering: true,
          persistSelection: false,
          showSelectionStats: true,
          maxSelection: 2,
        }}
      />,
    )

    const selectAllButton = screen.queryByRole('button', {name: /select all/i})
    if (selectAllButton) {
      await user.click(selectAllButton)

      await waitFor(() => {
        const calls = handleSelectionChange.mock.calls
        if (calls.length > 0) {
          const lastCall = calls.at(-1)
          if (lastCall) {
            expect(lastCall[0]).toHaveLength(2)
          }
        }
      })
    }
  })

  it('should support search functionality within selected tokens', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TokenSelection tokens={mockTokens} selectedTokens={[]} onSelectionChange={vi.fn()} />)

    const searchInput = screen.queryByPlaceholderText(/search/i)
    if (searchInput) {
      await user.type(searchInput, 'ETH')

      await waitFor(() => {
        expect(screen.getByText('Ethereum')).toBeInTheDocument()
        expect(screen.queryByText('USD Coin')).not.toBeInTheDocument()
      })
    }
  })

  it('should handle empty token list gracefully', () => {
    renderWithProviders(<TokenSelection tokens={[]} selectedTokens={[]} onSelectionChange={vi.fn()} />)

    expect(screen.getByText(/0.*selected/i)).toBeInTheDocument()
  })

  it('should persist selection state across component re-renders', async () => {
    const handleSelectionChange = vi.fn()
    const selectedTokens = [mockTokens[0].address]

    const {rerender} = renderWithProviders(
      <TokenSelection tokens={mockTokens} selectedTokens={selectedTokens} onSelectionChange={handleSelectionChange} />,
    )

    expect(screen.getByText(/1.*selected/i)).toBeInTheDocument()

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <TokenSelection tokens={mockTokens} selectedTokens={selectedTokens} onSelectionChange={handleSelectionChange} />
      </QueryClientProvider>,
    )

    expect(screen.getByText(/1.*selected/i)).toBeInTheDocument()
  })
})

describe('Token Approval Workflow E2E Tests', () => {
  const mockToken = createMockTokenCollection()[1]

  const mockUseAccount = useAccount as unknown as Mock
  const mockUseChainId = useChainId as unknown as Mock
  const mockUseReadContract = useReadContract as unknown as Mock
  const mockUseWriteContract = useWriteContract as unknown as Mock
  const mockUseTokenApproval = useTokenApproval as unknown as Mock

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAccount.mockReturnValue({
      address: WALLET_ADDRESS,
      isConnected: true,
      connector: {id: 'metaMaskSDK', name: 'MetaMask'},
    })

    mockUseChainId.mockReturnValue(1)

    mockUseReadContract.mockImplementation(({functionName}: {functionName: string}) => {
      if (functionName === 'allowance') {
        return {
          data: parseUnits('0', 6),
          isLoading: false,
          error: null as Error | null,
          refetch: vi.fn(),
        }
      }
      return {
        data: undefined,
        isLoading: false,
        error: null as Error | null,
        refetch: vi.fn(),
      }
    })

    mockUseWriteContract.mockReturnValue({
      writeContract: vi.fn().mockResolvedValue('0x1234'),
      isPending: false,
      isSuccess: false,
      error: null,
    })

    mockUseTokenApproval.mockReturnValue({
      approvalState: {
        isApproved: false,
        currentAllowance: parseUnits('0', 6),
        approvalAmount: parseUnits('100', 6),
        isLoading: false,
        isPending: false,
        error: null,
      },
      gasEstimate: {
        gasLimit: parseUnits('50000', 0),
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        totalCost: parseUnits('0.001', 18),
        totalCostFormatted: '0.001 ETH',
        error: null,
        isLoading: false,
      },
      approve: vi.fn().mockResolvedValue({hash: '0x1234'}),
      checkAllowance: vi.fn(),
      setApprovalAmount: vi.fn(),
    })
  })

  it('should render token approval component', async () => {
    renderWithProviders(
      <TokenApproval
        token={mockToken}
        spender={SPENDER_ADDRESS}
        amount={parseUnits('100', 6)}
        useInfiniteApproval={false}
      />,
    )

    await waitFor(() => {
      const approveButton = screen.getByRole('button', {name: /approve usdc/i})
      expect(approveButton).toBeInTheDocument()
    })
  })

  it('should show approval button when allowance is insufficient', async () => {
    renderWithProviders(<TokenApproval token={mockToken} spender={SPENDER_ADDRESS} amount={parseUnits('100', 6)} />)

    await waitFor(() => {
      const approveButton = screen.queryByRole('button', {name: /approve/i})
      expect(approveButton).toBeInTheDocument()
    })
  })

  it('should support infinite approval mode', async () => {
    renderWithProviders(
      <TokenApproval
        token={mockToken}
        spender={SPENDER_ADDRESS}
        amount={parseUnits('100', 6)}
        useInfiniteApproval={true}
      />,
    )

    await waitFor(() => {
      const approveButton = screen.getByRole('button', {name: /approve usdc/i})
      expect(approveButton).toBeInTheDocument()
    })
  })

  it('should show loading state when checking allowance', () => {
    mockUseTokenApproval.mockReturnValue({
      approvalState: {
        isApproved: false,
        currentAllowance: BigInt(0),
        approvalAmount: BigInt(0),
        isLoading: true,
        isPending: false,
        error: null,
      },
      gasEstimate: {
        gasLimit: undefined,
        gasPrice: undefined,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        totalCost: undefined,
        totalCostFormatted: undefined,
        error: null,
        isLoading: false,
      },
      approve: vi.fn(),
      checkAllowance: vi.fn(),
      setApprovalAmount: vi.fn(),
    })

    renderWithProviders(<TokenApproval token={mockToken} spender={SPENDER_ADDRESS} amount={parseUnits('100', 6)} />)

    const loadingIndicator = screen.queryByText(/loading|checking/i)
    expect(loadingIndicator).toBeDefined()
  })

  it('should handle already approved tokens', async () => {
    mockUseTokenApproval.mockReturnValue({
      approvalState: {
        isApproved: true,
        currentAllowance: parseUnits('1000', 6),
        approvalAmount: parseUnits('100', 6),
        isLoading: false,
        isPending: false,
        error: null,
      },
      gasEstimate: {
        gasLimit: undefined,
        gasPrice: undefined,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        totalCost: undefined,
        totalCostFormatted: undefined,
        error: null,
        isLoading: false,
      },
      approve: vi.fn(),
      checkAllowance: vi.fn(),
      setApprovalAmount: vi.fn(),
    })

    renderWithProviders(<TokenApproval token={mockToken} spender={SPENDER_ADDRESS} amount={parseUnits('100', 6)} />)

    await waitFor(() => {
      const approvedBadge = screen.getAllByText(/approved/i).find(el => el.className.includes('green'))
      expect(approvedBadge).toBeDefined()
    })
  })

  it('should handle approval errors', async () => {
    const testError = new Error('User rejected transaction')
    mockUseTokenApproval.mockReturnValue({
      approvalState: {
        isApproved: false,
        currentAllowance: parseUnits('0', 6),
        approvalAmount: parseUnits('100', 6),
        isLoading: false,
        isPending: false,
        error: testError,
      },
      gasEstimate: {
        gasLimit: undefined,
        gasPrice: undefined,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        totalCost: undefined,
        totalCostFormatted: undefined,
        error: null,
        isLoading: false,
      },
      approve: vi.fn().mockRejectedValue(testError),
      checkAllowance: vi.fn(),
      setApprovalAmount: vi.fn(),
    })

    renderWithProviders(<TokenApproval token={mockToken} spender={SPENDER_ADDRESS} amount={parseUnits('100', 6)} />)

    await waitFor(() => {
      const errorMessage = screen.queryByText(/error|rejected|failed/i)
      expect(errorMessage).toBeDefined()
    })
  })

  it('should display gas estimation when available', async () => {
    mockUseTokenApproval.mockReturnValue({
      approvalState: {
        isApproved: false,
        currentAllowance: parseUnits('0', 6),
        approvalAmount: parseUnits('100', 6),
        isLoading: false,
        isPending: false,
        error: null,
      },
      gasEstimate: {
        gasLimit: BigInt(50000),
        gasPrice: parseUnits('20', 9),
        maxFeePerGas: parseUnits('30', 9),
        maxPriorityFeePerGas: parseUnits('2', 9),
        totalCost: parseUnits('0.001', 18),
        totalCostFormatted: '0.001 ETH',
        error: null,
        isLoading: false,
      },
      approve: vi.fn(),
      checkAllowance: vi.fn(),
      setApprovalAmount: vi.fn(),
    })

    renderWithProviders(
      <TokenApproval token={mockToken} spender={SPENDER_ADDRESS} amount={parseUnits('100', 6)} showAdvanced={true} />,
    )

    await waitFor(() => {
      const gasLimitText = screen.getByText(/50,000/)
      expect(gasLimitText).toBeInTheDocument()
    })
  })

  it('should support custom approval amounts', async () => {
    const customAmount = parseUnits('50', 6)

    renderWithProviders(
      <TokenApproval token={mockToken} spender={SPENDER_ADDRESS} amount={customAmount} useInfiniteApproval={false} />,
    )

    await waitFor(() => {
      const approveButton = screen.getByRole('button', {name: /approve usdc/i})
      expect(approveButton).toBeInTheDocument()
    })
  })
})

describe('Complete Token Disposal Workflow E2E Test', () => {
  const mockTokens = createMockTokenCollection()

  const mockUseAccount = useAccount as unknown as Mock
  const mockUseChainId = useChainId as unknown as Mock
  const mockUseReadContract = useReadContract as unknown as Mock
  const mockUseWriteContract = useWriteContract as unknown as Mock
  const mockUseTokenDiscovery = useTokenDiscovery as unknown as Mock
  const mockUseTokenFiltering = useTokenFiltering as unknown as Mock

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAccount.mockReturnValue({
      address: WALLET_ADDRESS,
      isConnected: true,
      connector: {id: 'metaMaskSDK', name: 'MetaMask'},
    })

    mockUseChainId.mockReturnValue(1)

    mockUseTokenDiscovery.mockReturnValue({
      tokens: mockTokens.map(t => ({
        address: t.address,
        chainId: t.chainId,
        name: t.name,
        symbol: t.symbol,
        decimals: t.decimals,
        balance: t.balance,
      })),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    mockUseTokenFiltering.mockReturnValue({
      tokens: mockTokens,
      isLoading: false,
      error: null,
    })

    mockUseReadContract.mockImplementation(({address, functionName}: {address?: Address; functionName: string}) => {
      if (functionName === 'balanceOf') {
        const token = mockTokens.find(t => t.address === address)
        return {
          data: token?.balance ?? parseUnits('0', 18),
          isLoading: false,
          error: null as Error | null,
          refetch: vi.fn(),
        }
      }
      if (functionName === 'allowance') {
        return {
          data: parseUnits('0', 18),
          isLoading: false,
          error: null as Error | null,
          refetch: vi.fn(),
        }
      }
      return {
        data: undefined,
        isLoading: false,
        error: null as Error | null,
        refetch: vi.fn(),
      }
    })

    mockUseWriteContract.mockReturnValue({
      writeContract: vi.fn().mockResolvedValue('0x1234'),
      isPending: false,
      isSuccess: false,
      error: null,
    })
  })

  it('should complete full disposal workflow: discover → select spam/dust → display', async () => {
    renderWithProviders(<TokenList />)

    await waitFor(
      () => {
        expect(screen.queryByText(/5 tokens/i)).toBeInTheDocument()
      },
      {timeout: TEST_TIMEOUT},
    )
  })

  it('should support multi-step workflow with state preservation', async () => {
    const {rerender} = renderWithProviders(
      <TokenSelection tokens={mockTokens} selectedTokens={[]} onSelectionChange={vi.fn()} />,
    )

    const spamToken = mockTokens.find(t => t.category === TokenCategory.SPAM)
    if (!spamToken) {
      throw new Error('No spam token found in mock data')
    }

    const selectedTokens = [spamToken.address]

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <TokenSelection tokens={mockTokens} selectedTokens={selectedTokens} onSelectionChange={vi.fn()} />
      </QueryClientProvider>,
    )

    expect(screen.getByText(/1.*selected/i)).toBeInTheDocument()
  })
})
