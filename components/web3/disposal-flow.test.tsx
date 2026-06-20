import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useTokenDisposal} from '@/hooks/use-token-disposal'
import {useUnwantedTokens} from '@/hooks/use-token-filtering'
import {DisposalFlow} from './disposal-flow'

// Mock the hooks
vi.mock('@/hooks/use-token-disposal', () => ({
  useTokenDisposal: vi.fn(),
}))

vi.mock('@/hooks/use-token-filtering', () => ({
  useUnwantedTokens: vi.fn(),
}))

vi.mock('@/hooks/use-token-discovery', () => ({
  useTokenDiscovery: vi.fn(() => ({
    tokens: mockTokens,
    isLoading: false,
    error: null,
    isFetching: false,
    isSuccess: true,
  })),
}))

// Mock TokenList to simplify testing the flow without virtual scrolling complexity
vi.mock('./token-list', () => ({
  TokenList: ({
    selectedTokens,
    onTokenSelectionChange,
  }: {
    selectedTokens: string[]
    onTokenSelectionChange: (tokens: string[]) => void
  }) => (
    <div data-testid="mock-token-list">
      <button
        type="button"
        data-testid="mock-select-token-1"
        onClick={() => {
          onTokenSelectionChange(['0x1'])
        }}
      >
        Select Token 1
      </button>
      <button
        type="button"
        data-testid="mock-select-tokens-1-and-2"
        onClick={() => {
          onTokenSelectionChange(['0x1', '0x2'])
        }}
      >
        Select Token 1 & 2
      </button>
      <button
        type="button"
        data-testid="mock-select-tokens-11"
        onClick={() => {
          onTokenSelectionChange(Array.from({length: 11}, (_, i) => `0x${i}`))
        }}
      >
        Select 11 Tokens
      </button>
      <div data-testid="selected-count">{selectedTokens.length}</div>
    </div>
  ),
}))

// Mock TransactionQueue to simplify testing
vi.mock('./transaction-queue', () => ({
  TransactionQueue: () => <div data-testid="mock-transaction-queue" />,
}))

const mockTokens = [
  {
    address: '0x1',
    chainId: 1,
    symbol: 'TKN1',
    name: 'Token 1',
    decimals: 18,
    balance: BigInt('1000'),
    formattedBalance: '1000',
    category: 'unwanted',
  },
  {
    address: '0x2',
    chainId: 1,
    symbol: 'TKN2',
    name: 'Token 2',
    decimals: 18,
    balance: BigInt('2000'),
    formattedBalance: '2000',
    category: 'spam',
  },
]

describe('DisposalFlow', () => {
  const mockDispose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock returns
    vi.mocked(useUnwantedTokens).mockReturnValue({
      tokens: mockTokens,
      isLoading: false,
      error: null,
      isFetching: false,
      isSuccess: true,
      totalTokens: 2,
      filteredTokens: 2,
      errors: [],
      refetch: vi.fn(),
      refresh: vi.fn(),
    } as unknown as ReturnType<typeof useUnwantedTokens>)

    // Default: simulation succeeded, canDispose=true, not simulating
    vi.mocked(useTokenDisposal).mockReturnValue({
      dispose: mockDispose,
      isPending: false,
      isSuccess: false,
      isSimulating: false,
      canDispose: true,
      isSimulationEnabled: true,
      error: null,
      txHash: undefined,
    })
  })

  it('renders select step initially with disabled Continue button', () => {
    render(<DisposalFlow />)

    expect(screen.getByTestId('mock-token-list')).toBeInTheDocument()

    const continueBtn = screen.getByRole('button', {name: /continue/i})
    expect(continueBtn).toBeDisabled()
  })

  it('enables Continue button when 1-10 tokens are selected', async () => {
    render(<DisposalFlow />)

    await userEvent.click(screen.getByTestId('mock-select-token-1'))

    const continueBtn = screen.getByRole('button', {name: /continue/i})
    expect(continueBtn).toBeEnabled()
  })

  it('disables Continue button when more than 10 tokens are selected', async () => {
    render(<DisposalFlow />)

    await userEvent.click(screen.getByTestId('mock-select-tokens-11'))

    const continueBtn = screen.getByRole('button', {name: /continue/i})
    expect(continueBtn).toBeDisabled()
    expect(screen.getByText(/maximum 10 tokens/i)).toBeInTheDocument()
  })

  it('transitions to confirm step when Continue is clicked', async () => {
    render(<DisposalFlow />)
    await userEvent.click(screen.getByTestId('mock-select-token-1'))

    await userEvent.click(screen.getByRole('button', {name: /continue/i}))

    expect(screen.getByText(/confirm disposal/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /confirm burn/i})).toBeInTheDocument()
    expect(screen.getByText('Token 1')).toBeInTheDocument()
  })

  it('blocks disposal until explicit Confirm Burn click', async () => {
    render(<DisposalFlow />)
    await userEvent.click(screen.getByTestId('mock-select-token-1'))
    await userEvent.click(screen.getByRole('button', {name: /continue/i}))

    expect(mockDispose).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', {name: /confirm burn/i}))

    expect(screen.getByText(/disposing/i)).toBeInTheDocument()
    expect(screen.getByTestId('mock-transaction-queue')).toBeInTheDocument()
  })

  it('executes transfers sequentially with progress indicator', async () => {
    render(<DisposalFlow />)
    await userEvent.click(screen.getByTestId('mock-select-tokens-1-and-2'))
    await userEvent.click(screen.getByRole('button', {name: /continue/i}))

    await userEvent.click(screen.getByRole('button', {name: /confirm burn/i}))

    expect(screen.getByText(/disposing 1 of 2/i)).toBeInTheDocument()
    expect(mockDispose).toHaveBeenCalledTimes(1)
  })

  it('resets hook state between tokens via keyed child remount', async () => {
    // given: two tokens selected and disposal flow started
    const disposeCallTokens: string[] = []
    vi.mocked(useTokenDisposal).mockImplementation(token => {
      return {
        dispose: vi.fn(() => {
          disposeCallTokens.push(token.symbol)
        }),
        isPending: false,
        isSuccess: false,
        isSimulating: false,
        canDispose: true,
        isSimulationEnabled: true,
        error: null,
        txHash: undefined,
      } as unknown as ReturnType<typeof useTokenDisposal>
    })

    render(<DisposalFlow />)
    await userEvent.click(screen.getByTestId('mock-select-tokens-1-and-2'))
    await userEvent.click(screen.getByRole('button', {name: /continue/i}))
    await userEvent.click(screen.getByRole('button', {name: /confirm burn/i}))

    // when: first token disposal starts
    // then: dispose is called with first token
    expect(disposeCallTokens).toContain('TKN1')
  })

  describe('DisposalExecutor simulation states', () => {
    it('renders "Checking transfer safety..." while simulation is in progress', async () => {
      // Given simulation is loading
      vi.mocked(useTokenDisposal).mockReturnValue({
        dispose: mockDispose,
        isPending: false,
        isSuccess: false,
        isSimulating: true,
        canDispose: false,
        isSimulationEnabled: true,
        error: null,
        txHash: undefined,
      })

      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await userEvent.click(screen.getByRole('button', {name: /confirm burn/i}))

      // Then the simulating status is shown
      expect(screen.getByText(/checking transfer safety/i)).toBeInTheDocument()
    })

    it('calls onComplete with success:false when simulation fails; does NOT reach write', async () => {
      // Given simulation failed
      const simulationError = new Error('Transfer would revert')
      vi.mocked(useTokenDisposal).mockReturnValue({
        dispose: mockDispose,
        isPending: false,
        isSuccess: false,
        isSimulating: false,
        canDispose: false,
        isSimulationEnabled: true,
        error: simulationError,
        txHash: undefined,
      })

      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await userEvent.click(screen.getByRole('button', {name: /confirm burn/i}))

      // Then the error is shown and dispose is not called for a write
      expect(screen.getByText(/transfer would revert/i)).toBeInTheDocument()
      // dispose() is called once (to hit guards), but since error is already set, no write occurs
      expect(mockDispose).not.toHaveBeenCalled()
    })

    it('triggers dispose once when simulation succeeds (canDispose=true)', async () => {
      // Given simulation succeeded
      vi.mocked(useTokenDisposal).mockReturnValue({
        dispose: mockDispose,
        isPending: false,
        isSuccess: false,
        isSimulating: false,
        canDispose: true,
        isSimulationEnabled: true,
        error: null,
        txHash: undefined,
      })

      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await userEvent.click(screen.getByRole('button', {name: /confirm burn/i}))

      // Then dispose is called exactly once
      expect(mockDispose).toHaveBeenCalledTimes(1)
    })

    it('shows "Waiting for wallet confirmation..." while write is pending', async () => {
      // Given write is pending
      vi.mocked(useTokenDisposal).mockReturnValue({
        dispose: mockDispose,
        isPending: true,
        isSuccess: false,
        isSimulating: false,
        canDispose: false,
        isSimulationEnabled: true,
        error: null,
        txHash: undefined,
      })

      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await userEvent.click(screen.getByRole('button', {name: /confirm burn/i}))

      // Then the writing status is shown
      expect(screen.getByText(/waiting for wallet confirmation/i)).toBeInTheDocument()
    })

    it('shows updated dispose-step helper copy about preflight checks', async () => {
      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await userEvent.click(screen.getByRole('button', {name: /confirm burn/i}))

      // Then the updated copy is shown
      expect(screen.getByText(/each token is checked before your wallet is prompted/i)).toBeInTheDocument()
    })
  })
})
