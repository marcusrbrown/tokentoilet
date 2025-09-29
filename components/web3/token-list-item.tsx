'use client'

import type {CategorizedToken} from '@/lib/web3/token-filtering'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {NetworkBadge} from '@/components/ui/network-badge'
import {Skeleton} from '@/components/ui/skeleton'
import {useTokenPrice} from '@/hooks/use-token-price'
import {formatUsdValue, getPriceChangeDisplay, rawToDecimal} from '@/lib/token-utils'
import {cn} from '@/lib/utils'
import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'
import {cva, type VariantProps} from 'class-variance-authority'
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  DollarSign,
  ExternalLink,
  Heart,
  Shield,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import React, {useCallback, useMemo} from 'react'

// Token list item variants for consistent glass morphism styling across states
const tokenListItemVariants = cva(
  [
    'group',
    'relative',
    'w-full',
    'p-4',
    'rounded-lg',
    'border',
    'bg-white/80',
    'backdrop-blur-md',
    'transition-all',
    'duration-150',
    'hover:shadow-lg',
    'hover:scale-[1.02]',
    'dark:bg-gray-900/80',
    'dark:border-gray-700/40',
  ],
  {
    variants: {
      variant: {
        // Default token display
        default: [
          'border-gray-200/60',
          'hover:border-violet-300',
          'hover:bg-white/90',
          'dark:hover:border-violet-500/50',
          'dark:hover:bg-gray-900/90',
        ],
        // Selected state for batch operations
        selected: [
          'border-violet-500',
          'bg-violet-50/80',
          'shadow-md',
          'dark:border-violet-400',
          'dark:bg-violet-900/30',
        ],
        // Warning state for risky tokens
        warning: [
          'border-amber-300/60',
          'bg-amber-50/80',
          'hover:border-amber-400',
          'dark:border-amber-500/40',
          'dark:bg-amber-900/20',
        ],
        // Error state for spam/dangerous tokens
        error: [
          'border-red-300/60',
          'bg-red-50/80',
          'hover:border-red-400',
          'dark:border-red-500/40',
          'dark:bg-red-900/20',
        ],
        // Success state for valuable tokens
        success: [
          'border-green-300/60',
          'bg-green-50/80',
          'hover:border-green-400',
          'dark:border-green-500/40',
          'dark:bg-green-900/20',
        ],
      },
      category: {
        valuable: [],
        unwanted: [],
        unknown: [],
        dust: ['opacity-75'],
        spam: ['opacity-60'],
      },
    },
    defaultVariants: {
      variant: 'default',
      category: 'unknown',
    },
  },
)

export interface TokenListItemProps extends VariantProps<typeof tokenListItemVariants> {
  /** Token data to display */
  token: CategorizedToken
  /** Whether the token is selected for batch operations */
  selected?: boolean
  /** Loading state for async operations */
  loading?: boolean
  /** Click handler for token selection */
  onClick?: (token: CategorizedToken) => void
  /** Handler for toggling selection */
  onToggleSelection?: (token: CategorizedToken, selected: boolean) => void
  /** Handler for viewing token details */
  onViewDetails?: (token: CategorizedToken) => void
  /** Additional CSS classes */
  className?: string
}

function getCategoryIcon(category: TokenCategory): React.ReactNode {
  switch (category) {
    case TokenCategory.VALUABLE:
      return <Star className="h-4 w-4 text-green-600 dark:text-green-400" />
    case TokenCategory.UNWANTED:
      return <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
    case TokenCategory.DUST:
      return <Coins className="h-4 w-4 text-gray-400" />
    case TokenCategory.SPAM:
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case TokenCategory.UNKNOWN:
    default:
      return <Coins className="h-4 w-4 text-gray-500" />
  }
}

function getTokenVariant(token: CategorizedToken): 'default' | 'warning' | 'error' | 'success' {
  if (token.category === 'spam' || token.spamScore > 70) {
    return 'error'
  }
  if (token.category === 'dust' || token.riskScore === TokenRiskScore.HIGH) {
    return 'warning'
  }
  if (token.category === 'valuable' || token.valueClass === 'high_value') {
    return 'success'
  }
  return 'default'
}

/**
 * Enhanced token value display component with live price integration
 */
function TokenValueDisplay({token}: {token: CategorizedToken}) {
  const {price, priceChange24h, isLoading} = useTokenPrice(token, {
    include24hChange: true,
    refreshInterval: 60_000, // 1 minute for list items
  })

  const {formattedValue, totalValue} = useMemo(() => {
    const balanceDecimal = rawToDecimal(token.balance.toString(), token.decimals)

    // Use live price if available, fall back to cached value
    const currentPrice = price ?? token.priceUSD

    if (currentPrice != null && currentPrice > 0) {
      const value = formatUsdValue(balanceDecimal, currentPrice)
      const total = Number.parseFloat(balanceDecimal) * currentPrice
      return {formattedValue: value, totalValue: total}
    }

    // Fallback to estimated value if no price available
    if (token.estimatedValueUSD != null && token.estimatedValueUSD > 0) {
      return {
        formattedValue: formatUsdValue('1', token.estimatedValueUSD),
        totalValue: token.estimatedValueUSD,
      }
    }

    return {formattedValue: 'Unknown', totalValue: 0}
  }, [token, price])

  const priceChangeDisplay = useMemo(() => {
    return getPriceChangeDisplay(priceChange24h ?? undefined)
  }, [priceChange24h])

  if (isLoading && price === null) {
    return (
      <div className="text-right">
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    )
  }

  return (
    <div className="text-right">
      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{formattedValue}</div>
      {priceChange24h != null && (
        <div className={cn('text-xs flex items-center gap-1 justify-end', priceChangeDisplay.colorClass)}>
          {priceChangeDisplay.isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : priceChangeDisplay.isPositive === false ? (
            <TrendingDown className="h-3 w-3" />
          ) : null}
          <span>{priceChangeDisplay.text}</span>
        </div>
      )}
      {priceChange24h === null && totalValue > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">{price === null ? 'Estimated' : 'Live'}</div>
      )}
    </div>
  )
}

function getValueClassBadge(valueClass: TokenValueClass): React.ReactNode {
  switch (valueClass) {
    case TokenValueClass.HIGH_VALUE:
      return (
        <Badge variant="confirmed" size="sm">
          <TrendingUp className="h-3 w-3" />
          High Value
        </Badge>
      )
    case TokenValueClass.MEDIUM_VALUE:
      return (
        <Badge variant="default" size="sm">
          <DollarSign className="h-3 w-3" />
          Medium
        </Badge>
      )
    case TokenValueClass.LOW_VALUE:
    case TokenValueClass.MICRO_VALUE:
      return (
        <Badge variant="default" size="sm">
          <DollarSign className="h-3 w-3" />
          Low Value
        </Badge>
      )
    case TokenValueClass.DUST:
      return (
        <Badge variant="default" size="sm">
          <Coins className="h-3 w-3" />
          Dust
        </Badge>
      )
    case TokenValueClass.UNKNOWN:
    default:
      return (
        <Badge variant="default" size="sm">
          Unknown
        </Badge>
      )
  }
}

/**
 * Individual token display component optimized for virtual scrolling performance.
 *
 * Uses glass morphism design to maintain visual consistency while providing
 * clear visual hierarchy for token risk assessment and value classification.
 * Selection state management enables batch disposal operations.
 */
export function TokenListItem({
  token,
  selected = false,
  loading = false,
  onClick,
  onToggleSelection,
  onViewDetails,
  className,
  variant: _variant,
  category: _category,
  ...props
}: TokenListItemProps): React.ReactElement {
  // Use token risk/value analysis to determine visual variant
  const variant = getTokenVariant(token)
  const handleClick = useCallback(() => {
    onClick?.(token)
  }, [onClick, token])

  const handleToggleSelection = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      onToggleSelection?.(token, !selected)
    },
    [onToggleSelection, token, selected],
  )

  const handleViewDetails = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      onViewDetails?.(token)
    },
    [onViewDetails, token],
  )

  // Skeleton loading prevents layout shift during token discovery
  if (loading) {
    return (
      <div className={cn(tokenListItemVariants({variant: 'default'}), className)} {...props}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton variant="web3" className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Skeleton variant="web3" className="h-4 w-20" />
                <Skeleton variant="web3" className="h-4 w-12" />
              </div>
              <Skeleton variant="web3" className="h-3 w-32" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton variant="web3" className="h-4 w-16 mb-1" />
            <Skeleton variant="web3" className="h-3 w-12" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        tokenListItemVariants({
          variant: selected ? 'selected' : variant,
          category: token.category,
        }),
        'cursor-pointer',
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {/* Selection checkbox for batch disposal operations */}
      {onToggleSelection && (
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 w-6 p-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity',
              selected && 'opacity-100',
            )}
            onClick={handleToggleSelection}
          >
            <CheckCircle2
              className={cn('h-4 w-4', selected ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400')}
            />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Gradient token icon with category indicator overlay */}
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {token.symbol.slice(0, 2).toUpperCase()}
            </div>

            <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
              {getCategoryIcon(token.category)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{token.symbol}</h3>
              <NetworkBadge variant="glass" size="sm" />
              {token.isUserFavorite && <Heart className="h-3 w-3 text-red-500 fill-current" />}
              {token.isVerified && <Shield className="h-3 w-3 text-green-500" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{token.name}</p>
            <div className="flex items-center gap-2 mt-1">
              {getValueClassBadge(token.valueClass)}
              {token.spamScore > 50 && (
                <Badge variant="error" size="sm">
                  Risk: {token.spamScore}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 ml-4">
          <div className="text-right mb-2">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {token.formattedBalance} {token.symbol}
            </div>
          </div>
          <TokenValueDisplay token={token} />

          {/* Progressive disclosure: actions appear on hover to reduce visual clutter */}
          <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onViewDetails && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleViewDetails}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Risk indicator prevents accidental disposal of high-risk tokens */}
      {(token.spamScore > 30 || token.riskScore === TokenRiskScore.HIGH) && (
        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span className="text-gray-600 dark:text-gray-400">
              Risk Score: {token.spamScore}% | {token.riskScore} Risk
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
