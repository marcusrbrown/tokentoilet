'use client'

import type {CategorizedToken, TokenCategory, TokenFilter, TokenValueClass} from '@/lib/web3/token-filtering'
import type {Address} from 'viem'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Modal} from '@/components/ui/modal'
import {cn} from '@/lib/utils'
import {TokenCategory as TokenCategoryEnum, TokenValueClass as TokenValueClassEnum} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'
import {cva, type VariantProps} from 'class-variance-authority'
import {
  AlertTriangle,
  ChevronDown,
  Coins,
  DollarSign,
  Filter,
  Heart,
  RotateCcw,
  Search,
  Tag,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import React, {useCallback, useEffect, useMemo, useState} from 'react'

const tokenSelectionVariants = cva(
  [
    'w-full',
    'bg-white/90',
    'backdrop-blur-md',
    'border',
    'border-gray-200/60',
    'rounded-xl',
    'shadow-lg',
    'dark:bg-gray-900/90',
    'dark:border-gray-700/40',
  ],
  {
    variants: {
      variant: {
        default: [],
        compact: ['shadow-sm'],
        modal: ['max-w-2xl', 'mx-auto'],
      },
      size: {
        sm: ['p-4'],
        default: ['p-6'],
        lg: ['p-8'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface BatchSelectionCriteria {
  /** Select by category */
  categories?: TokenCategory[]
  /** Select by value class */
  valueClasses?: TokenValueClass[]
  /** Select by value range */
  valueRange?: {
    min?: number
    max?: number
  }
  /** Select by risk criteria */
  riskCriteria?: {
    maxRiskScore?: TokenRiskScore
    maxSpamScore?: number
    onlyUnverified?: boolean
  }
  /** Select by balance criteria */
  balanceCriteria?: {
    minBalance?: number
    maxBalance?: number
  }
  /** Select user-marked tokens */
  userCriteria?: {
    onlyFavorites?: boolean
    onlyNonFavorites?: boolean
    withNotes?: boolean
  }
}

export interface BatchOperation {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  action: (tokens: CategorizedToken[]) => Promise<void> | void
  requiresConfirmation?: boolean
  confirmationText?: string
  variant?: 'default' | 'warning' | 'error'
  disabled?: boolean
  disabledReason?: string
}

export interface SelectionStats {
  totalSelected: number
  totalValue: number
  byCategory: Record<TokenCategory, number>
  byValueClass: Record<TokenValueClass, number>
  averageRiskScore: number
  averageSpamScore: number
}

export interface TokenSelectionConfig {
  /** Enable quick selection presets */
  enableQuickSelection: boolean
  /** Enable advanced filtering */
  enableAdvancedFiltering: boolean
  /** Enable batch operations */
  enableBatchOperations: boolean
  /** Enable selection persistence */
  persistSelection: boolean
  /** Maximum tokens that can be selected */
  maxSelection?: number
  /** Show selection statistics */
  showSelectionStats: boolean
}

export interface TokenSelectionProps extends VariantProps<typeof tokenSelectionVariants> {
  /** Available tokens to select from */
  tokens: CategorizedToken[]
  /** Currently selected token addresses */
  selectedTokens: Address[]
  /** Callback when selection changes */
  onSelectionChange: (tokens: Address[]) => void
  /** Available batch operations */
  batchOperations?: BatchOperation[]
  /** Configuration options */
  config?: Partial<TokenSelectionConfig>
  /** Whether the component is in loading state */
  loading?: boolean
  /** Optional filter to pre-filter available tokens */
  initialFilter?: TokenFilter
  /** Additional CSS classes */
  className?: string
}

const DEFAULT_CONFIG: TokenSelectionConfig = {
  enableQuickSelection: true,
  enableAdvancedFiltering: true,
  enableBatchOperations: true,
  persistSelection: true,
  showSelectionStats: true,
}

const DEFAULT_BATCH_OPERATIONS: BatchOperation[] = []
const DEFAULT_USER_CONFIG = {}

// Quick selection presets for common disposal scenarios
const QUICK_SELECTION_PRESETS: {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  criteria: BatchSelectionCriteria
  variant?: 'default' | 'warning' | 'error'
}[] = [
  {
    id: 'spam-tokens',
    label: 'Spam Tokens',
    description: 'Select tokens likely to be spam (>70% spam score)',
    icon: <AlertTriangle className="h-4 w-4" />,
    criteria: {
      categories: [TokenCategoryEnum.SPAM],
      riskCriteria: {maxSpamScore: 100},
    },
    variant: 'error',
  },
  {
    id: 'dust-tokens',
    label: 'Dust Tokens',
    description: 'Select tokens with negligible value (<$0.01)',
    icon: <Coins className="h-4 w-4" />,
    criteria: {
      categories: [TokenCategoryEnum.DUST],
      valueClasses: [TokenValueClassEnum.DUST, TokenValueClassEnum.MICRO_VALUE],
      valueRange: {max: 0.01},
    },
  },
  {
    id: 'unwanted-tokens',
    label: 'Unwanted Tokens',
    description: 'Select tokens marked as unwanted for disposal',
    icon: <Trash2 className="h-4 w-4" />,
    criteria: {
      categories: [TokenCategoryEnum.UNWANTED],
    },
    variant: 'warning',
  },
  {
    id: 'low-value',
    label: 'Low Value (<$1)',
    description: 'Select tokens worth less than $1',
    icon: <DollarSign className="h-4 w-4" />,
    criteria: {
      valueRange: {max: 1},
      valueClasses: [TokenValueClassEnum.LOW_VALUE, TokenValueClassEnum.MICRO_VALUE, TokenValueClassEnum.DUST],
    },
  },
  {
    id: 'high-risk',
    label: 'High Risk Tokens',
    description: 'Select tokens with high risk scores',
    icon: <Target className="h-4 w-4" />,
    criteria: {
      riskCriteria: {
        maxRiskScore: TokenRiskScore.HIGH,
        onlyUnverified: true,
      },
    },
    variant: 'warning',
  },
  {
    id: 'non-favorites',
    label: 'Non-Favorites',
    description: 'Select tokens not marked as favorites',
    icon: <Heart className="h-4 w-4" />,
    criteria: {
      userCriteria: {onlyNonFavorites: true},
    },
  },
]

function calculateSelectionStats(tokens: CategorizedToken[], selectedAddresses: Address[]): SelectionStats {
  const selectedTokens = tokens.filter(token => selectedAddresses.includes(token.address))

  const stats: SelectionStats = {
    totalSelected: selectedTokens.length,
    totalValue: selectedTokens.reduce((sum, token) => sum + (token.estimatedValueUSD ?? 0), 0),
    byCategory: {} as Record<TokenCategory, number>,
    byValueClass: {} as Record<TokenValueClass, number>,
    averageRiskScore: 0,
    averageSpamScore: 0,
  }

  // Initialize category counts
  Object.values(TokenCategoryEnum).forEach(category => {
    stats.byCategory[category] = 0
  })

  // Initialize value class counts
  Object.values(TokenValueClassEnum).forEach(valueClass => {
    stats.byValueClass[valueClass] = 0
  })

  if (selectedTokens.length === 0) {
    return stats
  }

  let totalRiskScore = 0
  let totalSpamScore = 0

  selectedTokens.forEach(token => {
    stats.byCategory[token.category]++
    stats.byValueClass[token.valueClass]++

    // Convert risk score enum to numeric for averaging
    const riskScoreValue =
      token.riskScore === TokenRiskScore.HIGH ? 3 : token.riskScore === TokenRiskScore.MEDIUM ? 2 : 1
    totalRiskScore += riskScoreValue
    totalSpamScore += token.spamScore
  })

  stats.averageRiskScore = totalRiskScore / selectedTokens.length
  stats.averageSpamScore = totalSpamScore / selectedTokens.length

  return stats
}

function matchesCriteria(token: CategorizedToken, criteria: BatchSelectionCriteria): boolean {
  // Category filter
  if (criteria.categories && !criteria.categories.includes(token.category)) {
    return false
  }

  // Value class filter
  if (criteria.valueClasses && !criteria.valueClasses.includes(token.valueClass)) {
    return false
  }

  // Value range filter
  if (criteria.valueRange && token.estimatedValueUSD != null) {
    const {min, max} = criteria.valueRange
    if (min != null && token.estimatedValueUSD < min) {
      return false
    }
    if (max != null && token.estimatedValueUSD > max) {
      return false
    }
  }

  // Risk criteria filter
  if (criteria.riskCriteria) {
    const {maxRiskScore, maxSpamScore, onlyUnverified} = criteria.riskCriteria

    if (maxRiskScore != null) {
      const tokenRiskValue =
        token.riskScore === TokenRiskScore.HIGH ? 3 : token.riskScore === TokenRiskScore.MEDIUM ? 2 : 1
      const maxRiskValue = maxRiskScore === TokenRiskScore.HIGH ? 3 : maxRiskScore === TokenRiskScore.MEDIUM ? 2 : 1
      if (tokenRiskValue > maxRiskValue) {
        return false
      }
    }

    if (maxSpamScore != null && token.spamScore > maxSpamScore) {
      return false
    }

    if (onlyUnverified === true && token.isVerified === true) {
      return false
    }
  }

  // Balance criteria filter
  if (criteria.balanceCriteria) {
    const {minBalance, maxBalance} = criteria.balanceCriteria
    const tokenBalance = Number(token.balance) / 10 ** token.decimals

    if (minBalance != null && tokenBalance < minBalance) {
      return false
    }
    if (maxBalance != null && tokenBalance > maxBalance) {
      return false
    }
  }

  // User criteria filter
  if (criteria.userCriteria) {
    const {onlyFavorites, onlyNonFavorites, withNotes} = criteria.userCriteria

    if (onlyFavorites === true && !token.isUserFavorite) {
      return false
    }
    if (onlyNonFavorites === true && token.isUserFavorite === true) {
      return false
    }
    if (withNotes === true && (token.userNotes == null || token.userNotes.trim().length === 0)) {
      return false
    }
  }

  return true
}

/**
 * Advanced token selection interface with batch operations support.
 *
 * Provides sophisticated batch selection capabilities beyond basic select all/none,
 * including category-based selection, value-based filtering, risk-aware operations,
 * and comprehensive batch action toolbar for efficient token management.
 */
export function TokenSelection({
  tokens,
  selectedTokens,
  onSelectionChange,
  batchOperations = DEFAULT_BATCH_OPERATIONS,
  config: userConfig = DEFAULT_USER_CONFIG,
  loading = false,
  initialFilter,
  className,
  variant = 'default',
  size = 'default',
  ...props
}: TokenSelectionProps): React.ReactElement {
  const config = useMemo(() => ({...DEFAULT_CONFIG, ...userConfig}), [userConfig])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [customCriteria, setCustomCriteria] = useState<BatchSelectionCriteria>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmOperation, setConfirmOperation] = useState<BatchOperation | null>(null)

  // Apply initial filter if provided
  const filteredTokens = useMemo(() => {
    if (!initialFilter) return tokens

    return tokens.filter(token => {
      if (initialFilter.categories && !initialFilter.categories.includes(token.category)) return false
      if (initialFilter.valueClasses && !initialFilter.valueClasses.includes(token.valueClass)) return false
      if (initialFilter.minValueUSD != null && (token.estimatedValueUSD ?? 0) < initialFilter.minValueUSD) return false
      if (initialFilter.maxValueUSD != null && (token.estimatedValueUSD ?? 0) > initialFilter.maxValueUSD) return false
      if (
        initialFilter.searchQuery != null &&
        initialFilter.searchQuery.trim().length > 0 &&
        !token.name.toLowerCase().includes(initialFilter.searchQuery.toLowerCase()) &&
        !token.symbol.toLowerCase().includes(initialFilter.searchQuery.toLowerCase())
      )
        return false

      return true
    })
  }, [tokens, initialFilter])

  // Calculate selection statistics
  const selectionStats = useMemo(
    () => calculateSelectionStats(filteredTokens, selectedTokens),
    [filteredTokens, selectedTokens],
  )

  // Quick selection handlers
  const handleQuickSelection = useCallback(
    (criteria: BatchSelectionCriteria) => {
      const matchingTokens = filteredTokens.filter(token => matchesCriteria(token, criteria))
      const newSelection = [...new Set([...selectedTokens, ...matchingTokens.map(t => t.address)])]

      if (config.maxSelection != null && config.maxSelection > 0 && newSelection.length > config.maxSelection) {
        // Truncate to max selection limit
        onSelectionChange(newSelection.slice(0, config.maxSelection))
        return
      }

      onSelectionChange(newSelection)
    },
    [filteredTokens, selectedTokens, onSelectionChange, config.maxSelection],
  )

  const handleCustomSelection = useCallback(() => {
    const matchingTokens = filteredTokens.filter(token => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!token.name.toLowerCase().includes(query) && !token.symbol.toLowerCase().includes(query)) {
          return false
        }
      }
      return matchesCriteria(token, customCriteria)
    })

    const newSelection = [...new Set([...selectedTokens, ...matchingTokens.map(t => t.address)])]
    onSelectionChange(newSelection)
    setShowAdvancedFilters(false)
  }, [filteredTokens, selectedTokens, onSelectionChange, customCriteria, searchQuery])

  const handleClearSelection = useCallback(() => {
    onSelectionChange([])
  }, [onSelectionChange])

  const handleInvertSelection = useCallback(() => {
    const allAddresses = filteredTokens.map(t => t.address)
    const newSelection = allAddresses.filter(addr => !selectedTokens.includes(addr))
    onSelectionChange(newSelection)
  }, [filteredTokens, selectedTokens, onSelectionChange])

  const handleBatchOperation = useCallback(
    async (operation: BatchOperation) => {
      if (operation.requiresConfirmation) {
        setConfirmOperation(operation)
        return
      }

      const selectedTokensData = filteredTokens.filter(token => selectedTokens.includes(token.address))
      await operation.action(selectedTokensData)
    },
    [filteredTokens, selectedTokens],
  )

  const handleConfirmOperation = useCallback(async () => {
    if (!confirmOperation) return

    const selectedTokensData = filteredTokens.filter(token => selectedTokens.includes(token.address))
    await confirmOperation.action(selectedTokensData)
    setConfirmOperation(null)
  }, [confirmOperation, filteredTokens, selectedTokens])

  // Persist selection if enabled
  useEffect(() => {
    if (config.persistSelection) {
      const key = 'tokentoilet-selection'
      try {
        localStorage.setItem(key, JSON.stringify(selectedTokens))
      } catch (error) {
        console.warn('Failed to persist token selection:', error)
      }
    }
  }, [selectedTokens, config.persistSelection])

  if (loading) {
    return (
      <div className={cn(tokenSelectionVariants({variant, size}), className)} {...props}>
        <div className="animate-pulse space-y-4" data-testid="loading-skeleton">
          <div className="h-6 bg-gray-200 rounded dark:bg-gray-700"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({length: 6}, (_, i) => `skeleton-item-${i}`).map(key => (
              <div key={key} className="h-20 bg-gray-200 rounded dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn(tokenSelectionVariants({variant, size}), className)} {...props}>
        <div className="space-y-6">
          {/* Selection Summary */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batch Selection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectionStats.totalSelected} of {filteredTokens.length} tokens selected
                {config.maxSelection != null && config.maxSelection > 0 ? ` (max: ${config.maxSelection})` : ''}
              </p>
            </div>
            {selectionStats.totalSelected > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleInvertSelection}>
                  <RotateCcw className="h-4 w-4" />
                  Invert
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Selection Statistics */}
          {config.showSelectionStats && selectionStats.totalSelected > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-violet-50/50 dark:bg-violet-900/20 rounded-lg">
                <div className="text-sm font-medium text-violet-900 dark:text-violet-100">Total Value</div>
                <div className="text-lg font-semibold text-violet-700 dark:text-violet-300">
                  ${selectionStats.totalValue.toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Avg Risk</div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {selectionStats.averageSpamScore.toFixed(0)}%
                </div>
              </div>
              <div className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm font-medium text-green-900 dark:text-green-100">Valuable</div>
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                  {selectionStats.byCategory[TokenCategoryEnum.VALUABLE] || 0}
                </div>
              </div>
              <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
                <div className="text-sm font-medium text-red-900 dark:text-red-100">Unwanted</div>
                <div className="text-lg font-semibold text-red-700 dark:text-red-300">
                  {(selectionStats.byCategory[TokenCategoryEnum.UNWANTED] || 0) +
                    (selectionStats.byCategory[TokenCategoryEnum.SPAM] || 0)}
                </div>
              </div>
            </div>
          )}

          {/* Quick Selection Presets */}
          {config.enableQuickSelection && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Quick Selection</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {QUICK_SELECTION_PRESETS.map(preset => (
                  <Button
                    key={preset.id}
                    variant={
                      preset.variant === 'error' ? 'destructive' : preset.variant === 'warning' ? 'outline' : 'outline'
                    }
                    className="h-auto p-4 flex-col items-start text-left"
                    onClick={() => handleQuickSelection(preset.criteria)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {preset.icon}
                      <span className="font-medium">{preset.label}</span>
                    </div>
                    <span className="text-xs opacity-75">{preset.description}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Filtering */}
          {config.enableAdvancedFiltering && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Advanced Selection</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                  <Filter className="h-4 w-4" />
                  <ChevronDown
                    className={cn('h-4 w-4 ml-1 transition-transform', showAdvancedFilters && 'rotate-180')}
                  />
                </Button>
              </div>

              {showAdvancedFilters && (
                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg space-y-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Tokens</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or symbol..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(TokenCategoryEnum).map(category => (
                        <Button
                          key={category}
                          variant={customCriteria.categories?.includes(category) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const categories = customCriteria.categories ?? []
                            const newCategories = categories.includes(category)
                              ? categories.filter(c => c !== category)
                              : [...categories, category]
                            setCustomCriteria(prev => ({...prev, categories: newCategories}))
                          }}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Value Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Min Value (USD)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={customCriteria.valueRange?.min ?? ''}
                        onChange={e => {
                          const value = e.target.value ? Number.parseFloat(e.target.value) : undefined
                          setCustomCriteria(prev => ({
                            ...prev,
                            valueRange: {...prev.valueRange, min: value},
                          }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Value (USD)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1000.00"
                        value={customCriteria.valueRange?.max ?? ''}
                        onChange={e => {
                          const value = e.target.value ? Number.parseFloat(e.target.value) : undefined
                          setCustomCriteria(prev => ({
                            ...prev,
                            valueRange: {...prev.valueRange, max: value},
                          }))
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleCustomSelection} className="flex-1">
                      <Target className="h-4 w-4 mr-2" />
                      Apply Selection
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCustomCriteria({})
                        setSearchQuery('')
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Batch Operations */}
          {config.enableBatchOperations && selectionStats.totalSelected > 0 && batchOperations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Batch Operations ({selectionStats.totalSelected} selected)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {batchOperations.map(operation => (
                  <Button
                    key={operation.id}
                    variant={
                      operation.variant === 'error'
                        ? 'destructive'
                        : operation.variant === 'warning'
                          ? 'outline'
                          : 'default'
                    }
                    disabled={operation.disabled}
                    onClick={() => {
                      handleBatchOperation(operation).catch(console.error)
                    }}
                    className="h-auto p-4 flex-col items-start text-left"
                    title={operation.disabled ? operation.disabledReason : undefined}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {operation.icon}
                      <span className="font-medium">{operation.label}</span>
                    </div>
                    <span className="text-xs opacity-75">{operation.description}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOperation && (
        <Modal
          open={true}
          onClose={() => setConfirmOperation(null)}
          title={`Confirm ${confirmOperation.label}`}
          variant={confirmOperation.variant === 'error' ? 'elevated' : 'default'}
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {confirmOperation.confirmationText ??
                `Are you sure you want to perform "${confirmOperation.label}" on ${selectionStats.totalSelected} selected tokens?`}
            </p>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Selection Summary:</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectionStats.totalSelected} tokens • ${selectionStats.totalValue.toFixed(2)} total value
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmOperation(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmOperation.variant === 'error' ? 'destructive' : 'default'}
                onClick={() => {
                  handleConfirmOperation().catch(console.error)
                }}
              >
                {confirmOperation.icon}
                Confirm {confirmOperation.label}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
