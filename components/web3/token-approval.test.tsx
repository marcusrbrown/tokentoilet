import type {UseTokenApprovalReturn} from '@/hooks/use-token-approval'
import type {CategorizedToken} from '@/lib/web3/token-filtering'
// Import the mocked function
import {useTokenApproval} from '@/hooks/use-token-approval'
import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'
import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {TokenApproval} from './token-approval'

// Mock the useTokenApproval hook
vi.mock('@/hooks/use-token-approval', () => ({
  useTokenApproval: vi.fn(),
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
}))

const mockUseTokenApproval = vi.mocked(useTokenApproval)

describe('TokenApproval', () => {
  const mockToken: CategorizedToken = {
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    chainId: 1,
    symbol: 'TEST',
    name: 'Test Token',
    decimals: 18,
    balance: BigInt('1000000000000000000'), // 1 ETH
    formattedBalance: '1.00',
    category: TokenCategory.UNWANTED,
    valueClass: TokenValueClass.MEDIUM_VALUE,
    riskScore: TokenRiskScore.LOW,
    spamScore: 10,
    isVerified: true,
    estimatedValueUSD: 50,
    analysisTimestamp: Date.now(),
    confidenceScore: 95,
  }

  const defaultProps = {
    token: mockToken,
    spender: '0x9876543210987654321098765432109876543210' as `0x${string}`,
    amount: BigInt('1000000000000000000'), // 1 ETH in wei
  }

  const baseMockReturn: UseTokenApprovalReturn = {
    approvalState: {
      isApproved: false,
      currentAllowance: BigInt('0'),
      approvalAmount: BigInt('1000000000000000000'),
      isLoading: false,
      isPending: false,
      error: null,
    },
    gasEstimate: {
      gasLimit: BigInt('21000'),
      gasPrice: null,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      totalCost: null,
      totalCostFormatted: '',
      error: null,
      isLoading: false,
    },
    approve: vi.fn(),
    checkAllowance: vi.fn(),
    resetApprovalState: vi.fn(),
    setApprovalAmount: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTokenApproval.mockReturnValue(baseMockReturn)
  })

  describe('Initial State', () => {
    it('renders token approval component', () => {
      render(<TokenApproval {...defaultProps} />)

      // Check for the header text in h3 element
      expect(screen.getByRole('heading', {level: 3})).toHaveTextContent('Approve TEST')
      expect(screen.getByText('Allow contract to spend your tokens')).toBeInTheDocument()
    })

    it('shows approve button when not approved', () => {
      render(<TokenApproval {...defaultProps} />)

      expect(screen.getByRole('button', {name: /approve test/i})).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading state when approval is pending', () => {
      mockUseTokenApproval.mockReturnValue({
        ...baseMockReturn,
        approvalState: {
          ...baseMockReturn.approvalState,
          isPending: true,
        },
      })

      render(<TokenApproval {...defaultProps} />)

      // Check for disabled button specifically (more specific than text search)
      const button = screen.getByRole('button', {name: /approving/i})
      expect(button).toBeDisabled()

      // Check that there's a loading indicator somewhere
      expect(screen.getAllByText('Approving...')).toHaveLength(2) // Badge + button
    })
  })

  describe('User Interactions', () => {
    it('calls approve when button is clicked', async () => {
      const mockApprove = vi.fn()
      mockUseTokenApproval.mockReturnValue({
        ...baseMockReturn,
        approve: mockApprove,
      })

      render(<TokenApproval {...defaultProps} />)

      const approveButton = screen.getByRole('button', {name: /approve/i})
      fireEvent.click(approveButton)

      expect(mockApprove).toHaveBeenCalled()
    })
  })
})
