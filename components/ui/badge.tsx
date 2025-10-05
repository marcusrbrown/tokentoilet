import type {VariantProps} from 'class-variance-authority'
import {cn} from '@/lib/utils'

import React from 'react'

import {badgeVariants} from './badge-variants'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  children: React.ReactNode
  icon?: React.ReactNode
  showDot?: boolean
  'aria-label'?: string
}

/**
 * Badge component for displaying connection states and network indicators
 *
 * @example
 * ```tsx
 * // Connection state badge
 * <Badge variant="connected">Connected</Badge>
 *
 * // Network indicator with icon
 * <Badge variant="mainnet" icon={<EthereumIcon />}>
 *   Ethereum
 * </Badge>
 *
 * // Transaction status with dot
 * <Badge variant="pending" showDot size="sm">
 *   Pending
 * </Badge>
 * ```
 */
const Badge = ({
  ref,
  className,
  variant,
  size,
  withIcon,
  withDot,
  children,
  icon,
  showDot,
  'aria-label': ariaLabel,
  ...props
}: BadgeProps & {ref?: React.RefObject<HTMLDivElement | null>}) => {
  return (
    <div
      ref={ref}
      className={cn(
        badgeVariants({
          variant,
          size,
          withIcon: withIcon || Boolean(icon),
          withDot: withDot || showDot,
        }),
        className,
      )}
      aria-label={ariaLabel}
      role="status"
      {...props}
    >
      {(showDot || withDot) && (
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            // Dot colors based on variant
            {
              'bg-green-600 dark:bg-green-400': variant === 'connected' || variant === 'confirmed',
              'bg-yellow-600 dark:bg-yellow-400': variant === 'connecting' || variant === 'pending',
              'bg-red-600 dark:bg-red-400': variant === 'disconnected' || variant === 'error' || variant === 'failed',
              'bg-blue-600 dark:bg-blue-400': variant === 'mainnet',
              'bg-amber-600 dark:bg-amber-400': variant === 'testnet',
              'bg-purple-600 dark:bg-purple-400': variant === 'polygon',
              'bg-sky-600 dark:bg-sky-400': variant === 'arbitrum',
              'bg-rose-600 dark:bg-rose-400': variant === 'optimism',
              'bg-violet-600 dark:bg-violet-400': variant === 'violet',
              'bg-gray-600 dark:bg-gray-400': variant === 'default',
            },
          )}
          aria-hidden="true"
        />
      )}
      {Boolean(icon) && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </div>
  )
}

Badge.displayName = 'Badge'

export {Badge}
