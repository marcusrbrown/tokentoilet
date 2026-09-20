import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useTokenDisposal} from '@/hooks/use-token-disposal'
import {useUnwantedTokens} from '@/hooks/use-token-filtering'
import {DisposalFlow} from './disposal-flow'

const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD'

async function proceedThroughConfirmation(tokenCount = 1) {
  await userEvent.click(screen.getByRole('checkbox', {name: /acknowledge/i}))

  const confirmationInput = screen.queryByRole('textbox', {name: /type burn/i})
  if (confirmationInput != null) {
    await userEvent.type(confirmationInput, tokenCount === 1 ? 'BURN' : `BURN ${tokenCount} TOKENS`)
  }

  await userEvent.click(screen.getByRole('button', {name: /confirm burn/i}))
}

// Mock the hooks
vi.mock('@/hooks/use-token-disposal', () => ({
  useTokenDisposal: vi.fn(),
  BURN_ADDRESS: '0x000000000000000000000000000000000000dEaD',
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
      <button
        type="button"
        data-testid="mock-select-tokens-1-2-3"
        onClick={() => {
          onTokenSelectionChange(['0x1', '0x2', '0x3'])
        }}
      >
        Select Token 1, 2 & 3
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
    estimatedValueUSD: 0.5,
    valueClass: 'low_value',
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
    estimatedValueUSD: 0.5,
    valueClass: 'low_value',
    category: 'spam',
  },
  {
    address: '0x3',
    chainId: 1,
    symbol: 'TKN3',
    name: 'Token 3',
    decimals: 18,
    balance: BigInt('3000'),
    formattedBalance: '3000',
    estimatedValueUSD: 0.5,
    valueClass: 'low_value',
    category: 'unwanted',
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
      isGlobalFailure: false,
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
    expect(screen.getByText(/permanently transfer these tokens/i)).toBeInTheDocument()
    expect(screen.getByText(BURN_ADDRESS)).toBeInTheDocument()
    expect(screen.queryByText(/value unknown/i)).not.toBeInTheDocument()
  })

  it('blocks disposal until both the acknowledgement and typed confirmation are provided', async () => {
    render(<DisposalFlow />)
    await userEvent.click(screen.getByTestId('mock-select-token-1'))
    await userEvent.click(screen.getByRole('button', {name: /continue/i}))

    expect(mockDispose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', {name: /confirm burn/i})).toBeDisabled()

    await userEvent.click(screen.getByRole('checkbox', {name: /acknowledge/i}))
    expect(screen.getByRole('button', {name: /confirm burn/i})).toBeDisabled()

    await userEvent.type(screen.getByRole('textbox', {name: /type burn/i}), 'BURN')
    expect(screen.getByRole('button', {name: /confirm burn/i})).toBeEnabled()

    await userEvent.click(screen.getByRole('button', {name: /confirm burn/i}))

    expect(screen.getByText(/disposing/i)).toBeInTheDocument()
    expect(screen.getByTestId('mock-transaction-queue')).toBeInTheDocument()
  })

  it('executes transfers sequentially with progress indicator', async () => {
    render(<DisposalFlow />)
    await userEvent.click(screen.getByTestId('mock-select-tokens-1-and-2'))
    await userEvent.click(screen.getByRole('button', {name: /continue/i}))

    await proceedThroughConfirmation(2)

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
        isGlobalFailure: false,
        error: null,
        txHash: undefined,
      } as unknown as ReturnType<typeof useTokenDisposal>
    })

    render(<DisposalFlow />)
    await userEvent.click(screen.getByTestId('mock-select-tokens-1-and-2'))
    await userEvent.click(screen.getByRole('button', {name: /continue/i}))
    await proceedThroughConfirmation(2)

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
        isGlobalFailure: false,
        error: null,
        txHash: undefined,
      })

      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await proceedThroughConfirmation()

      // Then the simulating status is shown
      expect(screen.getByText(/checking transfer safety/i)).toBeInTheDocument()
    })

    it('advances to results with a failed token when simulation fails; never writes', async () => {
      // Given a single selected token whose preflight simulation has failed
      const simulationError = new Error('Transfer would revert')
      vi.mocked(useTokenDisposal).mockReturnValue({
        dispose: mockDispose,
        isPending: false,
        isSuccess: false,
        isSimulating: false,
        canDispose: false,
        isSimulationEnabled: true,
        isGlobalFailure: false,
        error: simulationError,
        txHash: undefined,
      })

      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await proceedThroughConfirmation()

      // Then the flow does NOT deadlock: it reports completion and advances to
      // the results screen showing the token as failed ("Failed checks will be skipped").
      expect(await screen.findByText(/results/i)).toBeInTheDocument()
      expect(screen.getByText(/1 failed/i)).toBeInTheDocument()
      // And a doomed transfer is never written (no blind signature prompt).
      expect(mockDispose).not.toHaveBeenCalled()
    })

    it('halts the batch on a mid-batch disconnect instead of cascading per-token failures', async () => {
      // Given three selected tokens, and the wallet disconnects after the first succeeds
      const disconnectMessage = 'Wallet connection required to dispose tokens'
      const attemptedTokens: string[] = []

      vi.mocked(useTokenDisposal).mockImplementation(token => {
        attemptedTokens.push(token.symbol)

        if (token.address === '0x1') {
          return {
            dispose: vi.fn(),
            isPending: false,
            isSuccess: true,
            isSimulating: false,
            canDispose: false,
            isSimulationEnabled: true,
            isGlobalFailure: false,
            error: null,
            txHash: '0xabc',
          } as unknown as ReturnType<typeof useTokenDisposal>
        }

        // Second token: the wallet has disconnected by the time this one runs.
        return {
          dispose: vi.fn(),
          isPending: false,
          isSuccess: false,
          isSimulating: false,
          canDispose: false,
          isSimulationEnabled: false,
          isGlobalFailure: true,
          error: new Error(disconnectMessage),
          txHash: undefined,
        }
      })

      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-tokens-1-2-3'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await proceedThroughConfirmation(3)

      // Then the batch halts on the results screen with one clear cause,
      // rather than showing every remaining token as an independent failure.
      expect(await screen.findByText(/results/i)).toBeInTheDocument()
      expect(screen.getByText(new RegExp(disconnectMessage, 'i'))).toBeInTheDocument()

      // And the third token is never attempted.
      expect(attemptedTokens).toEqual(['TKN1', 'TKN2'])
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
        isGlobalFailure: false,
        error: null,
        txHash: undefined,
      })

      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await proceedThroughConfirmation()

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
        isGlobalFailure: false,
        error: null,
        txHash: undefined,
      })

      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await proceedThroughConfirmation()

      // Then the writing status is shown
      expect(screen.getByText(/waiting for wallet confirmation/i)).toBeInTheDocument()
    })

    it('requires typed confirmation before allowing burn, and keeps proceed disabled until it matches exactly', async () => {
      vi.mocked(useUnwantedTokens).mockReturnValue({
        tokens: [{...mockTokens[0], estimatedValueUSD: undefined, valueClass: 'unknown'}],
        isLoading: false,
        error: null,
        isFetching: false,
        isSuccess: true,
        totalTokens: 1,
        filteredTokens: 1,
        errors: [],
        refetch: vi.fn(),
        refresh: vi.fn(),
      } as unknown as ReturnType<typeof useUnwantedTokens>)

      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await userEvent.click(screen.getByRole('checkbox', {name: /acknowledge/i}))

      const confirmButton = screen.getByRole('button', {name: /confirm burn/i})
      const confirmationInput = screen.getByRole('textbox', {name: /type burn/i})
      expect(screen.getByText(/value unknown/i)).toBeInTheDocument()
      expect(confirmButton).toBeDisabled()

      await userEvent.type(confirmationInput, 'BURN')
      expect(confirmButton).toBeEnabled()
    })

    it('shows updated dispose-step helper copy about preflight checks', async () => {
      render(<DisposalFlow />)
      await userEvent.click(screen.getByTestId('mock-select-token-1'))
      await userEvent.click(screen.getByRole('button', {name: /continue/i}))
      await proceedThroughConfirmation()

      // Then the updated copy is shown
      expect(screen.getByText(/each token is checked before your wallet is prompted/i)).toBeInTheDocument()
    })
  })
})
