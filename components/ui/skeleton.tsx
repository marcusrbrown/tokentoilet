import type {VariantProps} from 'class-variance-authority'
import {cn} from '@/lib/utils'

import React from 'react'

import {skeletonVariants} from './skeleton-variants'

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

export {Skeleton}
