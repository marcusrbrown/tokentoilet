'use client'

import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {Check, ChevronDown, ExternalLink, Heart, Info, Sliders} from 'lucide-react'
import Image from 'next/image'
import React, {useCallback, useId, useState} from 'react'

/**
 * Charity data interface from the product requirements document
 * Defines the structure for charity information and metadata
 */
export interface CharityData {
  id: string
  name: string
  description: string
  logoURI: string
  address: string
  category: string[]
  totalDonations: string
  website: string
}

/**
 * Charity allocation interface for distributing donations
 * Allows users to specify percentage allocation to different charities
 */
export interface CharityAllocation {
  charityId: string
  percentage: number
}

/**
 * Charity selector component variants using class-variance-authority
 * Provides specialized interface for selecting and allocating charitable donations
 */
const charitySelectorVariants = cva(
  // Base classes applied to all charity selectors
  [
    'relative',
    'w-full',
    'rounded-lg',
    'border',
    'bg-white/50',
    'backdrop-blur-sm',
    'transition-all',
    'duration-150',
    'focus-within:ring-2',
    'focus-within:ring-offset-2',
    'focus-within:ring-offset-white',
    'dark:focus-within:ring-offset-gray-900',
    'dark:bg-gray-900/50',
  ],
  {
    variants: {
      variant: {
        // Default glass morphism style
        default: [
          'border-gray-200',
          'focus-within:border-violet-500',
          'focus-within:ring-violet-500',
          'dark:border-gray-600',
          'dark:focus-within:border-violet-400',
          'dark:focus-within:ring-violet-400',
        ],
        // Web3 variant with violet accent
        web3: [
          'border-violet-200',
          'bg-violet-50/50',
          'focus-within:border-violet-500',
          'focus-within:ring-violet-500',
          'dark:border-violet-500/30',
          'dark:bg-violet-900/20',
          'dark:focus-within:border-violet-400',
          'dark:focus-within:ring-violet-400',
        ],
        // Card variant for elevated appearance
        card: [
          'border-white/20',
          'bg-white/80',
          'backdrop-blur-md',
          'shadow-sm',
          'focus-within:border-violet-300',
          'focus-within:ring-violet-500',
          'dark:border-gray-600/20',
          'dark:bg-gray-900/80',
          'dark:focus-within:border-violet-400',
          'dark:focus-within:ring-violet-400',
        ],
        // Compact variant for smaller spaces
        compact: [
          'border-gray-200',
          'bg-white/60',
          'focus-within:border-violet-500',
          'focus-within:ring-violet-500',
          'dark:border-gray-600',
          'dark:bg-gray-900/60',
          'dark:focus-within:border-violet-400',
          'dark:focus-within:ring-violet-400',
        ],
      },
      size: {
        sm: ['p-3'],
        default: ['p-4'],
        lg: ['p-5'],
        xl: ['p-6'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

// Default empty charities array to prevent infinite render loops
const DEFAULT_CHARITIES: CharityData[] = []

export interface CharitySelectorProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'>,
    VariantProps<typeof charitySelectorVariants> {
  /**
   * Component label for accessibility
   */
  label?: string
  /**
   * Helper text to display below the selector
   */
  helperText?: string
  /**
   * Error message to display when selection is invalid
   */
  error?: string
  /**
   * Success message to display when selection is valid
   */
  success?: string
  /**
   * Available charities for selection
   */
  charities?: CharityData[]
  /**
   * Currently selected charity allocations
   */
  selectedAllocations?: CharityAllocation[]
  /**
   * Whether to allow multiple charity selection
   */
  allowMultiple?: boolean
  /**
   * Whether to show allocation sliders for multiple selection
   */
  showAllocationSliders?: boolean
  /**
   * Whether to show charity descriptions
   */
  showDescriptions?: boolean
  /**
   * Whether to show total donations information
   */
  showTotalDonations?: boolean
  /**
   * Whether to show charity categories
   */
  showCategories?: boolean
  /**
   * Whether to show external website links
   */
  showWebsiteLinks?: boolean
  /**
   * Whether the selector is disabled
   */
  disabled?: boolean
  /**
   * Whether the selector is read-only
   */
  readOnly?: boolean
  /**
   * Maximum number of charities that can be selected
   */
  maxSelections?: number
  /**
   * Minimum allocation percentage required
   */
  minAllocation?: number
  /**
   * Custom validation function
   */
  validate?: (allocations: CharityAllocation[]) => string | null
  /**
   * Callback when charity selection changes
   */
  onSelectionChange?: (allocations: CharityAllocation[]) => void
  /**
   * Callback when allocation percentages change
   */
  onAllocationChange?: (allocations: CharityAllocation[]) => void
  /**
   * Callback when a charity website is visited
   */
  onWebsiteVisit?: (charity: CharityData) => void
  /**
   * Container className for additional styling
   */
  containerClassName?: string
  /**
   * Label className for additional styling
   */
  labelClassName?: string
  /**
   * Helper text className for additional styling
   */
  helperClassName?: string
}

/**
 * Format donation amount for display with proper scaling
 */
const formatDonationAmount = (amount: string): string => {
  const num = Number.parseFloat(amount)
  if (num >= 1000000) {
    const millions = num / 1000000
    return millions % 1 === 0 ? `$${millions.toFixed(0)}M` : `$${millions.toFixed(1)}M`
  }
  if (num >= 1000) {
    const thousands = num / 1000
    return thousands % 1 === 0 ? `$${thousands.toFixed(0)}K` : `$${thousands.toFixed(1)}K`
  }
  return `$${num.toFixed(0)}`
}

/**
 * Charity card component for displaying individual charity information
 */
const CharityCard: React.FC<{
  charity: CharityData
  isSelected: boolean
  allocation?: number
  showDescription?: boolean
  showTotalDonations?: boolean
  showCategories?: boolean
  showWebsiteLink?: boolean
  onToggle: () => void
  onAllocationChange?: (percentage: number) => void
  onWebsiteVisit?: () => void
  disabled?: boolean
  compact?: boolean
}> = ({
  charity,
  isSelected,
  allocation = 0,
  showDescription = true,
  showTotalDonations = true,
  showCategories = true,
  showWebsiteLink = true,
  onToggle,
  onAllocationChange,
  onWebsiteVisit,
  disabled = false,
  compact = false,
}) => {
  const handleAllocationChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(event.target.value, 10)
      onAllocationChange?.(value)
    },
    [onAllocationChange],
  )

  return (
    <Card
      variant={isSelected ? 'web3' : 'default'}
      elevation={isSelected ? 'glow' : 'low'}
      padding={compact ? 'sm' : 'md'}
      interactive={disabled ? 'none' : 'subtle'}
      onClick={disabled ? undefined : onToggle}
      className={cn(
        'transition-all duration-200',
        isSelected && 'ring-1 ring-violet-500/20',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Charity Logo */}
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          {charity.logoURI ? (
            <Image src={charity.logoURI} alt={`${charity.name} logo`} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Heart className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>

        {/* Charity Information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{charity.name}</h3>
              {showDescription && !compact && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{charity.description}</p>
              )}
            </div>

            {/* Selection Indicator */}
            <div
              className={cn(
                'ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
                isSelected
                  ? 'border-violet-500 bg-violet-500 text-white'
                  : 'border-gray-300 bg-transparent dark:border-gray-600',
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </div>
          </div>

          {/* Categories */}
          {showCategories && charity.category.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {charity.category.slice(0, compact ? 2 : 3).map(category => (
                <span
                  key={category}
                  className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                >
                  {category}
                </span>
              ))}
              {charity.category.length > (compact ? 2 : 3) && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  +{charity.category.length - (compact ? 2 : 3)}
                </span>
              )}
            </div>
          )}

          {/* Donation Information and Actions */}
          <div className="mt-3 flex items-center justify-between">
            {/* Total Donations */}
            {showTotalDonations && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Info className="h-3 w-3" />
                <span>Raised: {formatDonationAmount(charity.totalDonations)}</span>
              </div>
            )}

            {/* Website Link */}
            {showWebsiteLink && charity.website && (
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  e.stopPropagation()
                  onWebsiteVisit?.()
                }}
                className="h-auto p-1 text-xs"
                disabled={disabled}
                aria-label={`Visit ${charity.name} website`}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Allocation Slider */}
          {isSelected && onAllocationChange && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Allocation</label>
                <span className="text-xs text-gray-600 dark:text-gray-400">{allocation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={allocation}
                onChange={handleAllocationChange}
                className={cn(
                  'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700',
                  'slider:bg-violet-500 slider:rounded-lg slider:cursor-pointer',
                  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
                  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500',
                  '[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0',
                  '[&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-all',
                  '[&::-webkit-slider-thumb]:hover:scale-110',
                  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full',
                  '[&::-moz-range-thumb]:bg-violet-500 [&::-moz-range-thumb]:cursor-pointer',
                  '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm',
                )}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Default empty allocations array to prevent infinite render loops
const DEFAULT_ALLOCATIONS: CharityAllocation[] = []

/**
 * CharitySelector component for token disposal targeting
 * Allows users to select charities and allocate donation percentages
 */
export const CharitySelector: React.FC<CharitySelectorProps & {ref?: React.Ref<HTMLDivElement>}> = ({
  label,
  helperText,
  error,
  success,
  charities = DEFAULT_CHARITIES,
  selectedAllocations = DEFAULT_ALLOCATIONS,
  allowMultiple = false,
  showAllocationSliders = false,
  showDescriptions = true,
  showTotalDonations = true,
  showCategories = true,
  showWebsiteLinks = true,
  disabled = false,
  readOnly = false,
  maxSelections = 5,
  minAllocation = 1,
  validate,
  onSelectionChange,
  onAllocationChange,
  onWebsiteVisit,
  containerClassName,
  labelClassName,
  helperClassName,
  variant,
  size,
  className,
  ref,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [internalAllocations, setInternalAllocations] = useState<CharityAllocation[]>(selectedAllocations)

  // Calculate validation error
  const validationError = validate?.(internalAllocations) ?? null
  const displayError = (error?.length ?? 0) > 0 ? error : validationError

  // Handle charity selection toggle
  const handleCharityToggle = useCallback(
    (charity: CharityData) => {
      if (disabled || readOnly) return

      const isCurrentlySelected = internalAllocations.some(a => a.charityId === charity.id)

      let newAllocations: CharityAllocation[]

      if (isCurrentlySelected) {
        // Remove charity from selection
        newAllocations = internalAllocations.filter(a => a.charityId !== charity.id)
      } else if (allowMultiple) {
        // Multiple selection mode - add new charity
        if (internalAllocations.length >= maxSelections) {
          return // Max selections reached
        }

        const remainingPercentage = 100 - internalAllocations.reduce((sum, a) => sum + a.percentage, 0)
        const defaultPercentage = Math.max(minAllocation, Math.floor(remainingPercentage / 2))

        newAllocations = [...internalAllocations, {charityId: charity.id, percentage: defaultPercentage}]
      } else {
        // Single selection mode - replace existing selection
        newAllocations = [{charityId: charity.id, percentage: 100}]
      }

      setInternalAllocations(newAllocations)
      onSelectionChange?.(newAllocations)
      onAllocationChange?.(newAllocations)
    },
    [
      disabled,
      readOnly,
      internalAllocations,
      allowMultiple,
      maxSelections,
      minAllocation,
      onSelectionChange,
      onAllocationChange,
    ],
  )

  // Handle allocation percentage change
  const handleAllocationChange = useCallback(
    (charityId: string, percentage: number) => {
      if (disabled || readOnly) return

      const newAllocations = internalAllocations.map(allocation =>
        allocation.charityId === charityId ? {...allocation, percentage} : allocation,
      )

      setInternalAllocations(newAllocations)
      onAllocationChange?.(newAllocations)
    },
    [disabled, readOnly, internalAllocations, onAllocationChange],
  )

  // Handle website visit
  const handleWebsiteVisit = useCallback(
    (charity: CharityData) => {
      onWebsiteVisit?.(charity)
      if (charity.website) {
        window.open(charity.website, '_blank', 'noopener,noreferrer')
      }
    },
    [onWebsiteVisit],
  )

  // Get selected charity data for display
  const selectedCharityData = charities.filter(charity => internalAllocations.some(a => a.charityId === charity.id))

  const totalAllocation = internalAllocations.reduce((sum, a) => sum + a.percentage, 0)

  // Generate unique id for accessibility
  const selectId = useId()

  return (
    <div ref={ref} className={cn('space-y-2', containerClassName)} {...props}>
      {/* Label */}
      {(label?.length ?? 0) > 0 && (
        <label
          htmlFor={selectId}
          className={cn('block text-sm font-medium text-gray-700 dark:text-gray-300', labelClassName)}
        >
          {label}
        </label>
      )}

      {/* Main Selector */}
      <div className={cn(charitySelectorVariants({variant, size}), className)}>
        {/* Header - Selected Charities Summary */}
        <button
          id={selectId}
          type="button"
          className="flex w-full cursor-pointer items-center justify-between text-left"
          onClick={() => !disabled && !readOnly && setIsExpanded(!isExpanded)}
          disabled={disabled}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} charity selection`}
        >
          <div className="min-w-0 flex-1">
            {selectedCharityData.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Heart className="h-4 w-4" />
                <span className="text-sm">Select {allowMultiple ? 'charities' : 'charity'} for donation</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedCharityData.length === 1
                      ? selectedCharityData[0].name
                      : `${selectedCharityData.length} charities selected`}
                  </span>
                </div>
                {allowMultiple && showAllocationSliders && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Sliders className="h-3 w-3" />
                    <span>Total allocation: {totalAllocation}%</span>
                    {totalAllocation !== 100 && (
                      <span className="text-amber-600 dark:text-amber-400">(Remaining: {100 - totalAllocation}%)</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expand Toggle */}
          <div className="ml-2 flex-shrink-0">
            <ChevronDown
              className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', isExpanded && 'rotate-180')}
            />
          </div>
        </button>

        {/* Expanded Charity List */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-600">
            {charities.length === 0 ? (
              <div className="py-8 text-center">
                <Heart className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No charities available</p>
              </div>
            ) : (
              charities.map(charity => {
                const allocation = internalAllocations.find(a => a.charityId === charity.id)
                const isSelected = Boolean(allocation)

                return (
                  <CharityCard
                    key={charity.id}
                    charity={charity}
                    isSelected={isSelected}
                    allocation={allocation?.percentage}
                    showDescription={showDescriptions}
                    showTotalDonations={showTotalDonations}
                    showCategories={showCategories}
                    showWebsiteLink={showWebsiteLinks}
                    onToggle={() => handleCharityToggle(charity)}
                    onAllocationChange={
                      allowMultiple && showAllocationSliders
                        ? percentage => handleAllocationChange(charity.id, percentage)
                        : undefined
                    }
                    onWebsiteVisit={() => handleWebsiteVisit(charity)}
                    disabled={disabled}
                    compact={size === 'sm'}
                  />
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Helper Text and Error Messages */}
      {((helperText?.length ?? 0) > 0 || (displayError?.length ?? 0) > 0 || (success?.length ?? 0) > 0) && (
        <div className="text-xs">
          {(displayError?.length ?? 0) > 0 && <p className="text-red-600 dark:text-red-400">{displayError}</p>}
          {(success?.length ?? 0) > 0 && !(displayError?.length ?? 0) && (
            <p className="text-green-600 dark:text-green-400">{success}</p>
          )}
          {(helperText?.length ?? 0) > 0 && !(displayError?.length ?? 0) && !(success?.length ?? 0) && (
            <p className={cn('text-gray-500 dark:text-gray-400', helperClassName)}>{helperText}</p>
          )}
        </div>
      )}
    </div>
  )
}

CharitySelector.displayName = 'CharitySelector'

export default CharitySelector
