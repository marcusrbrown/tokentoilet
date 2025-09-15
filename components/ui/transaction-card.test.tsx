import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {TransactionCard, TransactionList, type TransactionData} from './transaction-card'

// Mock clipboard API
const mockWriteText = vi.fn().mockImplementation(async () => Promise.resolve())
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

// Mock window.open
const mockWindowOpen = vi.fn()
globalThis.window = Object.create(window) as Window & typeof globalThis
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
})

// Mock transactions for testing
const mockPendingTransaction: TransactionData = {
  txHash: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01',
  chainId: 1,
  user: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  actionType: 'disposal',
  tokens: [
    {
      address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1a',
      amount: '100.0',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
  ],
  timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
  status: 'pending',
}

const mockConfirmedTransaction: TransactionData = {
  txHash: '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  chainId: 137,
  user: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  actionType: 'contribution',
  tokens: [
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      amount: '250.0',
      symbol: 'USDC',
      name: 'USD Coin',
    },
    {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      amount: '0.5',
      symbol: 'WETH',
      name: 'Wrapped Ether',
    },
  ],
  timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
  status: 'confirmed',
  blockNumber: 12345678,
  gasUsed: '89123',
  confirmations: 15,
}

const mockFailedTransaction: TransactionData = {
  txHash: '0x999888777666555444333222111000aabbccddeeff123456789abcdef012345',
  chainId: 42161,
  user: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  actionType: 'claim',
  tokens: [
    {
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      amount: '500.0',
      symbol: 'USDC',
    },
  ],
  timestamp: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
  status: 'failed',
  errorMessage: 'Transaction reverted: insufficient balance',
}

describe('TransactionCard', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteText.mockClear()
  })

  describe('Basic Rendering', () => {
    it('renders pending transaction correctly', () => {
      render(<TransactionCard transaction={mockPendingTransaction} />)

      expect(screen.getByText('disposal')).toBeInTheDocument()
      expect(screen.getByText('pending')).toBeInTheDocument()
      expect(screen.getByText('100.0 USDC')).toBeInTheDocument()
      expect(screen.getByText('(USD Coin)')).toBeInTheDocument()
      expect(screen.getByText('5m ago')).toBeInTheDocument()
      expect(screen.getByText('Ethereum')).toBeInTheDocument()
    })

    it('renders confirmed transaction correctly', () => {
      render(<TransactionCard transaction={mockConfirmedTransaction} />)

      expect(screen.getByText('contribution')).toBeInTheDocument()
      expect(screen.getByText('confirmed')).toBeInTheDocument()
      expect(screen.getByText('250.0 USDC')).toBeInTheDocument()
      expect(screen.getByText('0.5 WETH')).toBeInTheDocument()
      expect(screen.getByText('2h ago')).toBeInTheDocument()
      expect(screen.getByText('Polygon')).toBeInTheDocument()
    })

    it('renders failed transaction correctly', () => {
      render(<TransactionCard transaction={mockFailedTransaction} />)

      expect(screen.getByText('claim')).toBeInTheDocument()
      expect(screen.getByText('failed')).toBeInTheDocument()
      expect(screen.getByText('500.0 USDC')).toBeInTheDocument()
      expect(screen.getByText('1d ago')).toBeInTheDocument()
      expect(screen.getByText('Arbitrum')).toBeInTheDocument()
    })
  })

  describe('Address Formatting', () => {
    it('formats transaction hash correctly for default variant', () => {
      render(<TransactionCard transaction={mockPendingTransaction} />)

      expect(screen.getByText('0x1234...ef01')).toBeInTheDocument()
    })

    it('formats transaction hash correctly for compact variant', () => {
      render(<TransactionCard transaction={mockPendingTransaction} variant="compact" />)

      expect(screen.getByText('0x123...f01')).toBeInTheDocument()
    })

    it('formats user address correctly', () => {
      render(<TransactionCard transaction={mockPendingTransaction} />)

      expect(screen.getByText('0xf39F...2266')).toBeInTheDocument()
    })
  })

  describe('Status Variants', () => {
    it('applies correct classes for pending status', () => {
      const {container} = render(<TransactionCard transaction={mockPendingTransaction} />)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('border-l-orange-400')
    })

    it('applies correct classes for confirmed status', () => {
      const {container} = render(<TransactionCard transaction={mockConfirmedTransaction} />)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('border-l-green-400')
    })

    it('applies correct classes for failed status', () => {
      const {container} = render(<TransactionCard transaction={mockFailedTransaction} />)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('border-l-red-400')
    })
  })

  describe('Variants', () => {
    it('applies compact variant classes', () => {
      render(<TransactionCard transaction={mockPendingTransaction} variant="compact" />)

      expect(screen.getByText('disposal')).toHaveClass('text-sm')
    })

    it('applies interactive variant classes', () => {
      const {container} = render(<TransactionCard transaction={mockPendingTransaction} variant="interactive" />)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('cursor-pointer', 'hover:shadow-lg', 'hover:scale-[1.01]')
    })
  })

  describe('Detailed Information', () => {
    it('shows detailed information when showDetails is true', () => {
      render(<TransactionCard transaction={mockConfirmedTransaction} showDetails />)

      expect(screen.getByText('Block:')).toBeInTheDocument()
      expect(screen.getByText('#12345678')).toBeInTheDocument()
      expect(screen.getByText('Gas Used:')).toBeInTheDocument()
      expect(screen.getByText('89123')).toBeInTheDocument()
      expect(screen.getByText('Confirmations:')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('shows error message for failed transactions in detailed view', () => {
      render(<TransactionCard transaction={mockFailedTransaction} showDetails />)

      expect(screen.getByText('Transaction reverted: insufficient balance')).toBeInTheDocument()
    })

    it('does not show detailed information by default', () => {
      render(<TransactionCard transaction={mockConfirmedTransaction} />)

      expect(screen.queryByText('Block:')).not.toBeInTheDocument()
      expect(screen.queryByText('Gas Used:')).not.toBeInTheDocument()
    })
  })

  describe('Copy Functionality', () => {
    it('copies transaction hash when copy button is clicked', async () => {
      // Ensure clipboard exists and writeText is defined
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        configurable: true,
      })

      render(<TransactionCard transaction={mockPendingTransaction} />)

      const copyButton = screen.getByTitle('Copy transaction hash')
      await user.click(copyButton)

      // Wait for the async operation
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(mockPendingTransaction.txHash)
      })

      expect(screen.getByText('Copied!')).toBeInTheDocument()

      await waitFor(
        () => {
          expect(screen.queryByText('Copied!')).not.toBeInTheDocument()
        },
        {timeout: 3000},
      )
    })

    it('falls back to execCommand when clipboard API is not available', async () => {
      const originalClipboard = navigator.clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      })

      const execCommandSpy = vi.fn().mockReturnValue(true)
      Object.defineProperty(document, 'execCommand', {
        value: execCommandSpy,
        configurable: true,
      })
      const createElementSpy = vi.spyOn(document, 'createElement')
      const appendSpy = vi.spyOn(document.body, 'append')

      render(<TransactionCard transaction={mockPendingTransaction} />)

      const copyButton = screen.getByTitle('Copy transaction hash')
      await user.click(copyButton)

      expect(createElementSpy).toHaveBeenCalledWith('textarea')
      expect(appendSpy).toHaveBeenCalled()
      expect(execCommandSpy).toHaveBeenCalledWith('copy')
      expect(screen.getByText('Copied!')).toBeInTheDocument()

      execCommandSpy.mockRestore?.()
      createElementSpy.mockRestore()
      appendSpy.mockRestore()
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      })
    })

    it('does not show copy button when showCopyButton is false', () => {
      render(<TransactionCard transaction={mockPendingTransaction} showCopyButton={false} />)

      expect(screen.queryByTitle('Copy transaction hash')).not.toBeInTheDocument()
    })
  })

  describe('Explorer Link', () => {
    it('opens explorer link when explorer button is clicked', async () => {
      render(<TransactionCard transaction={mockPendingTransaction} />)

      const explorerButton = screen.getByTitle('View on explorer')
      await user.click(explorerButton)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://etherscan.io/tx/${mockPendingTransaction.txHash}`,
        '_blank',
        'noopener,noreferrer',
      )
    })

    it('uses custom explorer URL builder when provided', async () => {
      const customGetExplorerUrl = vi.fn().mockReturnValue('https://custom-explorer.com/tx/0x123')

      render(<TransactionCard transaction={mockPendingTransaction} getExplorerUrl={customGetExplorerUrl} />)

      const explorerButton = screen.getByTitle('View on explorer')
      await user.click(explorerButton)

      expect(customGetExplorerUrl).toHaveBeenCalledWith(mockPendingTransaction.chainId, mockPendingTransaction.txHash)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://custom-explorer.com/tx/0x123',
        '_blank',
        'noopener,noreferrer',
      )
    })

    it('does not show explorer button when showExplorerLink is false', () => {
      render(<TransactionCard transaction={mockPendingTransaction} showExplorerLink={false} />)

      expect(screen.queryByTitle('View on explorer')).not.toBeInTheDocument()
    })
  })

  describe('Click Handling', () => {
    it('calls onClick when interactive variant is clicked', async () => {
      const onClickMock = vi.fn()
      render(<TransactionCard transaction={mockPendingTransaction} variant="interactive" onClick={onClickMock} />)

      const card = screen.getByText('disposal').closest('div')
      if (card) {
        await user.click(card)
      }

      expect(onClickMock).toHaveBeenCalledWith(mockPendingTransaction)
    })

    it('does not call onClick for non-interactive variants', async () => {
      const onClickMock = vi.fn()
      render(<TransactionCard transaction={mockPendingTransaction} onClick={onClickMock} />)

      const card = screen.getByText('disposal').closest('div')
      if (card) {
        await user.click(card)
      }

      expect(onClickMock).not.toHaveBeenCalled()
    })

    it('prevents event propagation when clicking copy/explorer buttons', async () => {
      const onClickMock = vi.fn()
      render(<TransactionCard transaction={mockPendingTransaction} variant="interactive" onClick={onClickMock} />)

      const copyButton = screen.getByTitle('Copy transaction hash')
      await user.click(copyButton)

      expect(onClickMock).not.toHaveBeenCalled()
    })
  })

  describe('Badge Variants', () => {
    it('displays correct badge variant for pending status', () => {
      render(<TransactionCard transaction={mockPendingTransaction} />)

      const badge = screen.getByText('pending').parentElement
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800')
    })

    it('displays correct badge variant for confirmed status', () => {
      render(<TransactionCard transaction={mockConfirmedTransaction} />)

      const badge = screen.getByText('confirmed').parentElement
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('displays correct badge variant for failed status', () => {
      render(<TransactionCard transaction={mockFailedTransaction} />)

      const badge = screen.getByText('failed').parentElement
      expect(badge).toHaveClass('bg-red-100', 'text-red-800')
    })
  })

  describe('Multiple Tokens', () => {
    it('displays multiple tokens correctly', () => {
      render(<TransactionCard transaction={mockConfirmedTransaction} />)

      expect(screen.getByText('250.0 USDC')).toBeInTheDocument()
      expect(screen.getByText('0.5 WETH')).toBeInTheDocument()
      expect(screen.getByText('(USD Coin)')).toBeInTheDocument()
      expect(screen.getByText('(Wrapped Ether)')).toBeInTheDocument()
    })

    it('handles tokens without names', () => {
      const transactionWithoutNames: TransactionData = {
        ...mockPendingTransaction,
        tokens: [
          {
            address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1a',
            amount: '100.0',
            symbol: 'USDC',
          },
        ],
      }

      render(<TransactionCard transaction={transactionWithoutNames} />)

      expect(screen.getByText('100.0 USDC')).toBeInTheDocument()
      expect(screen.queryByText('(USD Coin)')).not.toBeInTheDocument()
    })
  })

  describe('Timestamp Formatting', () => {
    it('displays "Just now" for very recent transactions', () => {
      const recentTransaction = {
        ...mockPendingTransaction,
        timestamp: Date.now() - 30 * 1000, // 30 seconds ago
      }

      render(<TransactionCard transaction={recentTransaction} />)

      expect(screen.getByText('Just now')).toBeInTheDocument()
    })

    it('displays days for older transactions', () => {
      const oldTransaction = {
        ...mockPendingTransaction,
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      }

      render(<TransactionCard transaction={oldTransaction} />)

      expect(screen.getByText('3d ago')).toBeInTheDocument()
    })
  })
})

describe('TransactionList', () => {
  const user = userEvent.setup()
  const mockTransactions = [mockPendingTransaction, mockConfirmedTransaction, mockFailedTransaction]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders list of transactions', () => {
      render(<TransactionList transactions={mockTransactions} />)

      expect(screen.getByText('disposal')).toBeInTheDocument()
      expect(screen.getByText('contribution')).toBeInTheDocument()
      expect(screen.getByText('claim')).toBeInTheDocument()
    })

    it('renders empty state when no transactions', () => {
      render(<TransactionList transactions={[]} />)

      expect(screen.getByText('No transactions yet')).toBeInTheDocument()
      expect(
        screen.getByText('Your transaction history will appear here once you start interacting with the platform.'),
      ).toBeInTheDocument()
    })

    it('renders custom empty state when provided', () => {
      const customEmptyState = <div>Custom empty message</div>
      render(<TransactionList transactions={[]} emptyState={customEmptyState} />)

      expect(screen.getByText('Custom empty message')).toBeInTheDocument()
      expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument()
    })
  })

  describe('Props Propagation', () => {
    it('passes variant to all transaction cards', () => {
      render(<TransactionList transactions={mockTransactions} variant="compact" />)

      // Check that compact variant styles are applied
      expect(screen.getByText('disposal')).toHaveClass('text-sm')
      expect(screen.getByText('contribution')).toHaveClass('text-sm')
      expect(screen.getByText('claim')).toHaveClass('text-sm')
    })

    it('passes showDetails to all transaction cards', () => {
      render(<TransactionList transactions={[mockConfirmedTransaction]} showDetails />)

      expect(screen.getByText('Block:')).toBeInTheDocument()
      expect(screen.getByText('Gas Used:')).toBeInTheDocument()
    })

    it('handles transaction clicks when onTransactionClick is provided', async () => {
      const onTransactionClickMock = vi.fn()
      render(
        <TransactionList
          transactions={mockTransactions}
          variant="interactive"
          onTransactionClick={onTransactionClickMock}
        />,
      )

      const firstCard = screen.getByText('disposal').closest('div')
      if (firstCard) {
        await user.click(firstCard)
      }

      expect(onTransactionClickMock).toHaveBeenCalledWith(mockPendingTransaction)
    })
  })

  describe('Custom Explorer URL', () => {
    it('passes custom getExplorerUrl to all cards', async () => {
      const customGetExplorerUrl = vi.fn().mockReturnValue('https://custom.explorer/tx/0x123')

      render(<TransactionList transactions={[mockPendingTransaction]} getExplorerUrl={customGetExplorerUrl} />)

      const explorerButton = screen.getByTitle('View on explorer')
      await user.click(explorerButton)

      expect(customGetExplorerUrl).toHaveBeenCalledWith(mockPendingTransaction.chainId, mockPendingTransaction.txHash)
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure in empty state', () => {
      render(<TransactionList transactions={[]} />)

      const heading = screen.getByRole('heading', {level: 3})
      expect(heading).toHaveTextContent('No transactions yet')
    })

    it('has accessible buttons for copy and explorer actions', () => {
      render(<TransactionList transactions={[mockPendingTransaction]} />)

      expect(screen.getByTitle('Copy transaction hash')).toBeInTheDocument()
      expect(screen.getByTitle('View on explorer')).toBeInTheDocument()
    })
  })
})
