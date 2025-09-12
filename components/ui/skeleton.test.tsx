import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {
  AddressSkeleton,
  BalanceSkeleton,
  NetworkBadgeSkeleton,
  Skeleton,
  TokenAmountSkeleton,
  TransactionCardSkeleton,
  TransactionHashSkeleton,
  WalletButtonSkeleton,
} from './skeleton'

describe('Skeleton', () => {
  it('renders basic skeleton with default props', () => {
    render(<Skeleton />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass(
      'inline-block',
      'rounded',
      'bg-gradient-to-r',
      'animate-pulse',
      'select-none',
      'pointer-events-none',
    )
  })

  it('applies default variant classes', () => {
    render(<Skeleton />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('from-gray-200', 'to-gray-300', 'dark:from-gray-700', 'dark:to-gray-600')
  })

  it('applies web3 variant classes', () => {
    render(<Skeleton variant="web3" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('from-violet-100', 'to-violet-200', 'dark:from-violet-900/30', 'dark:to-violet-800/30')
  })

  it('applies shimmer variant classes', () => {
    render(<Skeleton variant="shimmer" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass(
      'from-gray-200',
      'via-gray-100',
      'to-gray-200',
      'dark:from-gray-700',
      'dark:via-gray-600',
      'dark:to-gray-700',
    )
    // Note: shimmer animation should be applied separately via animation prop
  })

  it('applies shimmer variant with shimmer animation', () => {
    render(<Skeleton variant="shimmer" animation="shimmer" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass(
      'from-gray-200',
      'via-gray-100',
      'to-gray-200',
      'animate-[shimmer_2s_ease-in-out_infinite]',
    )
  })

  it('applies success variant classes', () => {
    render(<Skeleton variant="success" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('from-green-100', 'to-green-200', 'dark:from-green-900/30', 'dark:to-green-800/30')
  })

  it('applies warning variant classes', () => {
    render(<Skeleton variant="warning" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('from-amber-100', 'to-amber-200', 'dark:from-amber-900/30', 'dark:to-amber-800/30')
  })

  it('applies error variant classes', () => {
    render(<Skeleton variant="error" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('from-red-100', 'to-red-200', 'dark:from-red-900/30', 'dark:to-red-800/30')
  })

  describe('Size variants', () => {
    it('applies text size classes', () => {
      render(<Skeleton size="text" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-4')
    })

    it('applies caption size classes', () => {
      render(<Skeleton size="caption" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-3')
    })

    it('applies address size classes', () => {
      render(<Skeleton size="address" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-5', 'w-32')
    })

    it('applies hash size classes', () => {
      render(<Skeleton size="hash" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-4', 'w-20')
    })

    it('applies amount size classes', () => {
      render(<Skeleton size="amount" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-6', 'w-24')
    })

    it('applies balance size classes', () => {
      render(<Skeleton size="balance" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-8', 'w-28')
    })

    it('applies button size classes', () => {
      render(<Skeleton size="button" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-10', 'w-24')
    })

    it('applies badge size classes', () => {
      render(<Skeleton size="badge" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-6', 'w-16')
    })

    it('applies avatar size classes', () => {
      render(<Skeleton size="avatar" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-10', 'w-10', 'rounded-full')
    })

    it('applies card size classes', () => {
      render(<Skeleton size="card" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-32', 'w-full')
    })

    it('applies input size classes', () => {
      render(<Skeleton size="input" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-12', 'w-full')
    })
  })

  describe('Animation variants', () => {
    it('applies pulse animation by default', () => {
      render(<Skeleton />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('applies slow animation classes', () => {
      render(<Skeleton animation="slow" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-[pulse_2s_ease-in-out_infinite]')
    })

    it('applies shimmer animation classes', () => {
      render(<Skeleton animation="shimmer" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-[shimmer_2s_ease-in-out_infinite]')
    })

    it('applies no animation classes', () => {
      render(<Skeleton animation="none" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-none')
    })
  })

  describe('Custom dimensions', () => {
    it('applies custom width override', () => {
      render(<Skeleton width="w-48" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('w-48')
    })

    it('applies custom height override', () => {
      render(<Skeleton height="h-12" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-12')
    })

    it('applies both custom width and height', () => {
      render(<Skeleton width="w-48" height="h-12" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('w-48', 'h-12')
    })
  })

  describe('Multiple lines', () => {
    it('renders single skeleton by default', () => {
      render(<Skeleton />)
      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('skeleton-group')).not.toBeInTheDocument()
    })

    it('renders multiple skeleton lines when lines > 1', () => {
      render(<Skeleton lines={3} />)
      const skeletonGroup = screen.getByTestId('skeleton-group')
      expect(skeletonGroup).toBeInTheDocument()
      expect(skeletonGroup.children).toHaveLength(3)
    })

    it('applies varied width to last line for realistic text appearance', () => {
      render(<Skeleton lines={3} />)
      const skeletonGroup = screen.getByTestId('skeleton-group')
      const lastLine = skeletonGroup.children[2]
      expect(lastLine).toHaveClass('w-3/4')
    })

    it('does not apply varied width when custom width is provided', () => {
      render(<Skeleton lines={3} width="w-full" />)
      const skeletonGroup = screen.getByTestId('skeleton-group')
      const lastLine = skeletonGroup.children[2]
      expect(lastLine).toHaveClass('w-full')
      expect(lastLine).not.toHaveClass('w-3/4')
    })

    it('applies space-y-2 to skeleton group container', () => {
      render(<Skeleton lines={3} />)
      const skeletonGroup = screen.getByTestId('skeleton-group')
      expect(skeletonGroup).toHaveClass('space-y-2')
    })
  })

  describe('Responsive behavior', () => {
    it('applies responsive classes when enabled', () => {
      render(<Skeleton responsive />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('sm:h-auto', 'md:w-auto')
    })

    it('does not apply responsive classes by default', () => {
      render(<Skeleton />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).not.toHaveClass('sm:h-auto', 'md:w-auto')
    })
  })

  describe('Accessibility', () => {
    it('has aria-hidden attribute', () => {
      render(<Skeleton />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    })

    it('is not focusable', () => {
      render(<Skeleton />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('pointer-events-none')
    })

    it('is not selectable', () => {
      render(<Skeleton />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('select-none')
    })
  })

  describe('Custom className', () => {
    it('merges custom className with default classes', () => {
      render(<Skeleton className="custom-class" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('custom-class', 'animate-pulse', 'rounded')
    })
  })

  describe('HTML attributes', () => {
    it('forwards additional props to the element', () => {
      render(<Skeleton data-custom="test-value" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('data-custom', 'test-value')
    })
  })
})

describe('Web3 Skeleton Components', () => {
  describe('AddressSkeleton', () => {
    it('renders with web3 variant and address size', () => {
      render(<AddressSkeleton />)
      const skeleton = screen.getByTestId('address-skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass(
        'h-5',
        'w-32',
        'font-mono',
        'from-violet-100',
        'to-violet-200',
        'animate-[shimmer_2s_ease-in-out_infinite]',
      )
    })

    it('forwards custom className', () => {
      render(<AddressSkeleton className="custom-address" />)
      const skeleton = screen.getByTestId('address-skeleton')
      expect(skeleton).toHaveClass('custom-address', 'font-mono')
    })
  })

  describe('TransactionHashSkeleton', () => {
    it('renders with web3 variant and hash size', () => {
      render(<TransactionHashSkeleton />)
      const skeleton = screen.getByTestId('transaction-hash-skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass(
        'h-4',
        'w-20',
        'font-mono',
        'from-violet-100',
        'to-violet-200',
        'animate-[shimmer_2s_ease-in-out_infinite]',
      )
    })

    it('forwards custom className', () => {
      render(<TransactionHashSkeleton className="custom-hash" />)
      const skeleton = screen.getByTestId('transaction-hash-skeleton')
      expect(skeleton).toHaveClass('custom-hash', 'font-mono')
    })
  })

  describe('TokenAmountSkeleton', () => {
    it('renders with web3 variant and amount size', () => {
      render(<TokenAmountSkeleton />)
      const skeleton = screen.getByTestId('token-amount-skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('h-6', 'w-24', 'font-medium', 'from-violet-100', 'to-violet-200', 'animate-pulse')
    })

    it('forwards custom className', () => {
      render(<TokenAmountSkeleton className="custom-amount" />)
      const skeleton = screen.getByTestId('token-amount-skeleton')
      expect(skeleton).toHaveClass('custom-amount', 'font-medium')
    })
  })

  describe('BalanceSkeleton', () => {
    it('renders with web3 variant and balance size', () => {
      render(<BalanceSkeleton />)
      const skeleton = screen.getByTestId('balance-skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('h-8', 'w-28', 'font-bold', 'from-violet-100', 'to-violet-200', 'animate-pulse')
    })

    it('forwards custom className', () => {
      render(<BalanceSkeleton className="custom-balance" />)
      const skeleton = screen.getByTestId('balance-skeleton')
      expect(skeleton).toHaveClass('custom-balance', 'font-bold')
    })
  })

  describe('NetworkBadgeSkeleton', () => {
    it('renders with web3 variant and badge size', () => {
      render(<NetworkBadgeSkeleton />)
      const skeleton = screen.getByTestId('network-badge-skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('h-6', 'w-16', 'rounded-full', 'from-violet-100', 'to-violet-200', 'animate-pulse')
    })

    it('forwards custom className', () => {
      render(<NetworkBadgeSkeleton className="custom-badge" />)
      const skeleton = screen.getByTestId('network-badge-skeleton')
      expect(skeleton).toHaveClass('custom-badge', 'rounded-full')
    })
  })

  describe('WalletButtonSkeleton', () => {
    it('renders with web3 variant and button size', () => {
      render(<WalletButtonSkeleton />)
      const skeleton = screen.getByTestId('wallet-button-skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('h-10', 'w-24', 'rounded-lg', 'from-violet-100', 'to-violet-200', 'animate-pulse')
    })

    it('forwards custom className', () => {
      render(<WalletButtonSkeleton className="custom-button" />)
      const skeleton = screen.getByTestId('wallet-button-skeleton')
      expect(skeleton).toHaveClass('custom-button', 'rounded-lg')
    })
  })

  describe('TransactionCardSkeleton', () => {
    it('renders complete transaction card skeleton structure', () => {
      render(<TransactionCardSkeleton />)
      const cardSkeleton = screen.getByTestId('transaction-card-skeleton')
      expect(cardSkeleton).toBeInTheDocument()

      // Check card container classes
      expect(cardSkeleton).toHaveClass(
        'p-4',
        'rounded-xl',
        'border',
        'bg-white/80',
        'backdrop-blur-md',
        'border-white/20',
        'space-y-3',
      )

      // Check for transaction hash skeleton
      expect(screen.getByTestId('transaction-hash-skeleton')).toBeInTheDocument()

      // Check for token amount skeleton
      expect(screen.getByTestId('token-amount-skeleton')).toBeInTheDocument()

      // Check for network badge skeleton
      expect(screen.getByTestId('network-badge-skeleton')).toBeInTheDocument()
    })

    it('forwards custom className to card container', () => {
      render(<TransactionCardSkeleton className="custom-card" />)
      const cardSkeleton = screen.getByTestId('transaction-card-skeleton')
      expect(cardSkeleton).toHaveClass('custom-card', 'p-4', 'rounded-xl')
    })

    it('applies dark mode classes', () => {
      render(<TransactionCardSkeleton />)
      const cardSkeleton = screen.getByTestId('transaction-card-skeleton')
      expect(cardSkeleton).toHaveClass('dark:bg-gray-900/80', 'dark:border-gray-600/20')
    })
  })
})

describe('Skeleton Edge Cases', () => {
  it('handles zero lines gracefully', () => {
    render(<Skeleton lines={0} />)
    const skeletonGroup = screen.getByTestId('skeleton-group')
    expect(skeletonGroup.children).toHaveLength(0)
  })

  it('handles negative lines gracefully', () => {
    render(<Skeleton lines={-1} />)
    const skeletonGroup = screen.getByTestId('skeleton-group')
    expect(skeletonGroup.children).toHaveLength(0)
  })

  it('handles undefined/null width gracefully', () => {
    render(<Skeleton width={undefined} />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
  })

  it('handles undefined/null height gracefully', () => {
    render(<Skeleton height={undefined} />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
  })
})
