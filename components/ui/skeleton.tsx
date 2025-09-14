import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import React from 'react'

/**
 * Skeleton component variants using class-variance-authority
 * Provides loading states for wallet operations and Web3 DeFi interactions
 */
const skeletonVariants = cva(
  // Base classes applied to all skeletons
  ['inline-block', 'rounded', 'bg-gradient-to-r', 'animate-pulse', 'select-none', 'pointer-events-none'],
  {
    variants: {
      variant: {
        // Default skeleton with subtle gray gradient
        default: ['from-gray-200', 'to-gray-300', 'dark:from-gray-700', 'dark:to-gray-600'],
        // Web3 skeleton with violet accent for wallet-related content
        web3: ['from-violet-100', 'to-violet-200', 'dark:from-violet-900/30', 'dark:to-violet-800/30'],
        // Shimmer effect for address and transaction loading
        shimmer: [
          'from-gray-200',
          'via-gray-100',
          'to-gray-200',
          'dark:from-gray-700',
          'dark:via-gray-600',
          'dark:to-gray-700',
          'animate-[shimmer_2s_ease-in-out_infinite]',
        ],
        // Success state loading for confirmed transactions
        success: ['from-green-100', 'to-green-200', 'dark:from-green-900/30', 'dark:to-green-800/30'],
        // Warning state loading for pending transactions
        warning: ['from-amber-100', 'to-amber-200', 'dark:from-amber-900/30', 'dark:to-amber-800/30'],
        // Error state loading for failed operations
        error: ['from-red-100', 'to-red-200', 'dark:from-red-900/30', 'dark:to-red-800/30'],
      },
      size: {
        // Text sizes
        text: ['h-4'],
        caption: ['h-3'],
        small: ['h-5'],
        base: ['h-6'],
        large: ['h-8'],
        title: ['h-10'],

        // Web3 specific sizes
        address: ['h-5', 'w-32'], // Wallet address skeleton
        hash: ['h-4', 'w-20'], // Transaction hash skeleton
        amount: ['h-6', 'w-24'], // Token amount skeleton
        balance: ['h-8', 'w-28'], // Balance display skeleton

        // Component sizes
        button: ['h-10', 'w-24'],
        badge: ['h-6', 'w-16'],
        avatar: ['h-10', 'w-10', 'rounded-full'],
        card: ['h-32', 'w-full'],
        input: ['h-12', 'w-full'],
      },
      animation: {
        // Standard pulse animation
        pulse: ['animate-pulse'],
        // Slower pulse for background elements
        slow: ['animate-[pulse_2s_ease-in-out_infinite]'],
        // Shimmer effect for interactive elements
        shimmer: ['animate-[shimmer_2s_ease-in-out_infinite]'],
        // No animation for static placeholders
        none: ['animate-none'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'text',
      animation: 'pulse',
    },
  },
)

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {
  /**
   * Custom width override
   * Use Tailwind width classes like 'w-32', 'w-1/2', etc.
   */
  width?: string
  /**
   * Custom height override
   * Use Tailwind height classes like 'h-4', 'h-8', etc.
   */
  height?: string
  /**
   * Number of skeleton lines to render
   * Creates multiple skeleton elements with slight width variations
   */
  lines?: number
  /**
   * Enable responsive sizing
   * Automatically adjusts for mobile and desktop viewports
   */
  responsive?: boolean
}

const Skeleton = ({
  ref,
  className,
  variant,
  size,
  animation,
  width,
  height,
  lines = 1,
  responsive = false,
  ...props
}: SkeletonProps & {ref?: React.RefObject<HTMLDivElement | null>}) => {
  const baseClasses = skeletonVariants({variant, size, animation})

  // Custom dimension overrides
  const customClasses = cn(
    width ?? '',
    height ?? '',
    responsive && [
      'sm:h-auto', // Responsive height adjustments
      'md:w-auto', // Responsive width adjustments
    ],
  )

  // Single skeleton
  if (lines === 1) {
    return (
      <div
        ref={ref}
        className={cn(baseClasses, customClasses, className)}
        aria-hidden="true"
        data-testid="skeleton"
        {...props}
      />
    )
  }

  // Multiple skeleton lines with width variations
  return (
    <div ref={ref} className={cn('space-y-2', className)} aria-hidden="true" data-testid="skeleton-group" {...props}>
      {Array.from({length: lines}, (_, index) => (
        <div
          key={index}
          className={cn(
            baseClasses,
            customClasses,
            // Vary width for last line to create realistic text appearance
            index === lines - 1 && lines > 1 && width === undefined && 'w-3/4',
          )}
        />
      ))}
    </div>
  )
}

Skeleton.displayName = 'Skeleton'

// Specialized Web3 skeleton components
export const AddressSkeleton = ({
  ref,
  className,
  ...props
}: Omit<SkeletonProps, 'size' | 'variant'> & {ref?: React.RefObject<HTMLDivElement | null>}) => (
  <Skeleton
    ref={ref}
    variant="web3"
    size="address"
    animation="shimmer"
    className={cn('font-mono', className)}
    data-testid="address-skeleton"
    {...props}
  />
)
AddressSkeleton.displayName = 'AddressSkeleton'

export const TransactionHashSkeleton = ({
  ref,
  className,
  ...props
}: Omit<SkeletonProps, 'size' | 'variant'> & {ref?: React.RefObject<HTMLDivElement | null>}) => (
  <Skeleton
    ref={ref}
    variant="web3"
    size="hash"
    animation="shimmer"
    className={cn('font-mono', className)}
    data-testid="transaction-hash-skeleton"
    {...props}
  />
)
TransactionHashSkeleton.displayName = 'TransactionHashSkeleton'

export const TokenAmountSkeleton = ({
  ref,
  className,
  ...props
}: Omit<SkeletonProps, 'size' | 'variant'> & {ref?: React.RefObject<HTMLDivElement | null>}) => (
  <Skeleton
    ref={ref}
    variant="web3"
    size="amount"
    animation="pulse"
    className={cn('font-medium', className)}
    data-testid="token-amount-skeleton"
    {...props}
  />
)
TokenAmountSkeleton.displayName = 'TokenAmountSkeleton'

export const BalanceSkeleton = ({
  ref,
  className,
  ...props
}: Omit<SkeletonProps, 'size' | 'variant'> & {ref?: React.RefObject<HTMLDivElement | null>}) => (
  <Skeleton
    ref={ref}
    variant="web3"
    size="balance"
    animation="pulse"
    className={cn('font-bold', className)}
    data-testid="balance-skeleton"
    {...props}
  />
)
BalanceSkeleton.displayName = 'BalanceSkeleton'

export const NetworkBadgeSkeleton = ({
  ref,
  className,
  ...props
}: Omit<SkeletonProps, 'size' | 'variant'> & {ref?: React.RefObject<HTMLDivElement | null>}) => (
  <Skeleton
    ref={ref}
    variant="web3"
    size="badge"
    animation="pulse"
    className={cn('rounded-full', className)}
    data-testid="network-badge-skeleton"
    {...props}
  />
)
NetworkBadgeSkeleton.displayName = 'NetworkBadgeSkeleton'

export const WalletButtonSkeleton = ({
  ref,
  className,
  ...props
}: Omit<SkeletonProps, 'size' | 'variant'> & {ref?: React.RefObject<HTMLDivElement | null>}) => (
  <Skeleton
    ref={ref}
    variant="web3"
    size="button"
    animation="pulse"
    className={cn('rounded-lg', className)}
    data-testid="wallet-button-skeleton"
    {...props}
  />
)
WalletButtonSkeleton.displayName = 'WalletButtonSkeleton'

export const TransactionCardSkeleton = ({
  ref,
  className,
  ...props
}: Omit<SkeletonProps, 'variant' | 'lines'> & {ref?: React.RefObject<HTMLDivElement | null>}) => (
  <div
    ref={ref}
    className={cn(
      'p-4',
      'rounded-xl',
      'border',
      'bg-white/80',
      'backdrop-blur-md',
      'border-white/20',
      'dark:bg-gray-900/80',
      'dark:border-gray-600/20',
      'space-y-3',
      className,
    )}
    data-testid="transaction-card-skeleton"
    {...props}
  >
    {/* Transaction header with hash and timestamp */}
    <div className="flex items-center justify-between">
      <TransactionHashSkeleton />
      <Skeleton variant="default" size="caption" width="w-16" />
    </div>

    {/* Transaction details */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton variant="default" size="small" width="w-20" />
        <TokenAmountSkeleton />
      </div>
      <NetworkBadgeSkeleton />
    </div>

    {/* Status indicator */}
    <div className="flex items-center space-x-2">
      <Skeleton variant="warning" size="badge" />
      <Skeleton variant="default" size="caption" width="w-24" />
    </div>
  </div>
)
TransactionCardSkeleton.displayName = 'TransactionCardSkeleton'

export {Skeleton, skeletonVariants}
