'use client'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {
  calculateUsdValue,
  formatTokenAmount,
  rawToDecimal,
  validateTokenAmount,
  type TokenData,
} from '@/lib/token-utils'
import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {ChevronDown, DollarSign, Wallet} from 'lucide-react'
import Image from 'next/image'
import React, {useCallback, useMemo, useState} from 'react'

/**
 * Token input component variants using class-variance-authority
 * Provides specialized input for token amounts with selection and validation
 */
const tokenInputVariants = cva(
  // Base classes applied to all token inputs
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
        // Error state for validation failures
        error: [
          'border-red-500',
          'bg-red-50/50',
          'focus-within:border-red-500',
          'focus-within:ring-red-500',
          'dark:border-red-400',
          'dark:bg-red-900/20',
          'dark:focus-within:border-red-400',
          'dark:focus-within:ring-red-400',
        ],
        // Success state for valid amounts
        success: [
          'border-green-500',
          'bg-green-50/50',
          'focus-within:border-green-500',
          'focus-within:ring-green-500',
          'dark:border-green-400',
          'dark:bg-green-900/20',
          'dark:focus-within:border-green-400',
          'dark:focus-within:ring-green-400',
        ],
      },
      size: {
        sm: ['p-2'],
        default: ['p-3'],
        lg: ['p-4'],
        xl: ['p-5'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

// Default empty tokens array to prevent infinite render loops
const DEFAULT_TOKENS: TokenData[] = []

export interface TokenInputProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'>,
    VariantProps<typeof tokenInputVariants> {
  /**
   * Input label for accessibility
   */
  label?: string
  /**
   * Helper text to display below the input
   */
  helperText?: string
  /**
   * Error message to display when input is invalid
   */
  error?: string
  /**
   * Success message to display when input is valid
   */
  success?: string
  /**
   * Warning message to display for cautionary information
   */
  warning?: string
  /**
   * Current token amount value in decimal string format
   */
  value?: string
  /**
   * Currently selected token
   */
  selectedToken?: TokenData
  /**
   * Available tokens for selection
   */
  tokens?: TokenData[]
  /**
   * Placeholder text for amount input
   */
  placeholder?: string
  /**
   * Whether the input is disabled
   */
  disabled?: boolean
  /**
   * Whether the input is read-only
   */
  readOnly?: boolean
  /**
   * Whether to show USD value conversion
   */
  showUsdValue?: boolean
  /**
   * Whether to show balance display and max button
   */
  showBalance?: boolean
  /**
   * Whether to allow token selection
   */
  allowTokenSelection?: boolean
  /**
   * Maximum number of decimal places to allow
   */
  maxDecimals?: number
  /**
   * Minimum allowed amount
   */
  minAmount?: string
  /**
   * Maximum allowed amount (defaults to balance if available)
   */
  maxAmount?: string
  /**
   * Custom validation function
   */
  validate?: (amount: string, token?: TokenData) => string | null
  /**
   * Callback when amount value changes
   */
  onAmountChange?: (amount: string) => void
  /**
   * Callback when token selection changes
   */
  onTokenChange?: (token: TokenData) => void
  /**
   * Callback when max button is clicked
   */
  onMaxClick?: () => void
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
 * TokenInput component for Web3 DeFi amount entry with token selection
 */
const TokenInput = ({
  ref,
  className,
  containerClassName,
  labelClassName,
  helperClassName,
  variant,
  size,
  label,
  helperText,
  error,
  success,
  warning,
  value = '',
  selectedToken,
  tokens = DEFAULT_TOKENS,
  placeholder = '0.0',
  disabled = false,
  readOnly = false,
  showUsdValue = true,
  showBalance = true,
  allowTokenSelection = true,
  maxDecimals,
  minAmount,
  maxAmount,
  validate,
  onAmountChange,
  onTokenChange,
  onMaxClick,
  id,
  ...props
}: TokenInputProps & {ref?: React.RefObject<HTMLDivElement | null>}) => {
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(value)

  // Use controlled value if provided, otherwise use internal state
  const currentValue = value === undefined ? internalValue : value
  const isControlled = value !== undefined

  // Validation logic
  const validationResult = useMemo(() => {
    if (!currentValue || currentValue === '') {
      return {isValid: true, message: null}
    }

    // Custom validation takes precedence
    if (validate) {
      const customError = validate(currentValue, selectedToken)
      return {
        isValid: customError === null,
        message: customError,
      }
    }

    // Built-in validation
    const effectiveMaxAmount =
      maxAmount !== null && maxAmount !== undefined && maxAmount !== ''
        ? maxAmount
        : selectedToken?.balance !== null && selectedToken?.balance !== undefined && selectedToken?.balance !== ''
          ? rawToDecimal(selectedToken.balance, selectedToken.decimals)
          : undefined
    const validationError = validateTokenAmount(currentValue, selectedToken, minAmount, effectiveMaxAmount)

    return {
      isValid: validationError === null,
      message: validationError,
    }
  }, [currentValue, selectedToken, minAmount, maxAmount, validate])

  // Determine the current state based on validation and props
  const currentVariant = useMemo(() => {
    if (error != null && error.length > 0) return 'error'
    if (warning != null && warning.length > 0) return 'default'
    if (success != null && success.length > 0) return 'success'
    if (validationResult.message != null && !validationResult.isValid) return 'error'
    if (validationResult.message != null && validationResult.isValid) return 'success'
    return variant || 'default'
  }, [error, warning, success, validationResult, variant])

  // Display message
  const displayMessage = error ?? warning ?? success ?? validationResult.message ?? helperText

  // Generate unique ID for accessibility
  const inputId = id ?? `token-input-${Math.random().toString(36).slice(2, 9)}`
  const helperId = `${inputId}-helper`

  // USD value calculation
  const usdValue = useMemo(() => {
    if (
      !showUsdValue ||
      selectedToken?.price === null ||
      selectedToken?.price === undefined ||
      selectedToken?.price === 0
    )
      return null
    return calculateUsdValue(currentValue, selectedToken.price)
  }, [currentValue, selectedToken?.price, showUsdValue])

  // Balance display
  const balanceDisplay = useMemo(() => {
    if (
      !showBalance ||
      selectedToken?.balance === null ||
      selectedToken?.balance === undefined ||
      selectedToken?.balance === ''
    )
      return null
    return formatTokenAmount(rawToDecimal(selectedToken.balance, selectedToken.decimals), selectedToken.decimals)
  }, [selectedToken, showBalance])

  // Handle amount change
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value

      // Restrict decimal places if specified
      if (maxDecimals !== undefined && newValue.includes('.')) {
        const [, fractional] = newValue.split('.')
        if (fractional && fractional.length > maxDecimals) {
          return // Don't allow more decimals than specified
        }
      }

      if (!isControlled) {
        setInternalValue(newValue)
      }

      if (onAmountChange) {
        onAmountChange(newValue)
      }
    },
    [isControlled, maxDecimals, onAmountChange],
  )

  // Handle max button click
  const handleMaxClick = useCallback(() => {
    if (selectedToken?.balance !== null && selectedToken?.balance !== undefined && selectedToken?.balance !== '') {
      const maxValue = rawToDecimal(selectedToken.balance, selectedToken.decimals)
      if (!isControlled) {
        setInternalValue(maxValue)
      }
      if (onAmountChange) {
        onAmountChange(maxValue)
      }
    }
    if (onMaxClick) {
      onMaxClick()
    }
  }, [selectedToken, isControlled, onAmountChange, onMaxClick])

  // Handle token selection
  const handleTokenSelect = useCallback(
    (token: TokenData) => {
      setIsTokenSelectorOpen(false)
      if (onTokenChange) {
        onTokenChange(token)
      }
    },
    [onTokenChange],
  )

  return (
    <div className={cn('w-full', containerClassName)} {...props}>
      {label != null && label.length > 0 && (
        <label
          htmlFor={inputId}
          className={cn('mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300', labelClassName)}
        >
          {label}
        </label>
      )}

      <div ref={ref} className={cn(tokenInputVariants({variant: currentVariant, size}), className)}>
        {/* Top row: Token selector and balance */}
        <div className="mb-3 flex items-center justify-between">
          {/* Token selector */}
          {allowTokenSelection && tokens.length > 0 ? (
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsTokenSelectorOpen(!isTokenSelectorOpen)}
                disabled={disabled}
                className="h-auto p-1 text-left"
              >
                <div className="flex items-center gap-2">
                  {selectedToken?.logoUrl !== null &&
                    selectedToken?.logoUrl !== undefined &&
                    selectedToken?.logoUrl !== '' && (
                      <Image
                        src={selectedToken.logoUrl}
                        alt={selectedToken.symbol}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full"
                        onError={e => {
                          // Hide image on error
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                  <span className="font-medium">
                    {selectedToken?.symbol !== null &&
                    selectedToken?.symbol !== undefined &&
                    selectedToken?.symbol !== ''
                      ? selectedToken.symbol
                      : 'Select Token'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Button>

              {/* Token dropdown */}
              {isTokenSelectorOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border bg-white shadow-lg dark:bg-gray-800">
                  <div className="max-h-60 overflow-y-auto p-1">
                    {tokens.map(token => (
                      <button
                        key={token.address}
                        type="button"
                        onClick={() => handleTokenSelect(token)}
                        className="flex w-full items-center gap-2 rounded p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {token.logoUrl !== null && token.logoUrl !== undefined && token.logoUrl !== '' && (
                          <Image
                            src={token.logoUrl}
                            alt={token.symbol}
                            width={20}
                            height={20}
                            className="h-5 w-5 rounded-full"
                            onError={e => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{token.name}</div>
                        </div>
                        {token.balance !== null && token.balance !== undefined && token.balance !== '' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTokenAmount(rawToDecimal(token.balance, token.decimals), token.decimals, 4)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            selectedToken && (
              <div className="flex items-center gap-2">
                {selectedToken !== null &&
                  selectedToken !== undefined &&
                  selectedToken.logoUrl !== null &&
                  selectedToken.logoUrl !== undefined &&
                  selectedToken.logoUrl !== '' && (
                    <Image
                      src={selectedToken.logoUrl}
                      alt={selectedToken.symbol}
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full"
                      onError={e => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                <span className="font-medium text-sm">{selectedToken.symbol}</span>
              </div>
            )
          )}

          {/* Balance display */}
          {showBalance && balanceDisplay !== null && balanceDisplay !== undefined && balanceDisplay !== '' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Wallet className="h-3 w-3" />
                <span>{balanceDisplay}</span>
                {selectedToken && <span>{selectedToken.symbol}</span>}
              </div>
              {!readOnly && !disabled && (
                <Button type="button" variant="ghost" size="sm" onClick={handleMaxClick} className="h-auto p-1 text-xs">
                  MAX
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Main input row */}
        <div className="flex items-center gap-3">
          {/* Amount input */}
          <div className="flex-1">
            <Input
              id={inputId}
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={currentValue}
              onChange={handleAmountChange}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              variant="ghost"
              className="border-0 bg-transparent p-0 text-2xl font-semibold focus:ring-0"
              aria-describedby={displayMessage != null && displayMessage.length > 0 ? helperId : undefined}
              aria-invalid={currentVariant === 'error'}
            />
          </div>

          {/* USD value display */}
          {usdValue !== null && usdValue !== undefined && usdValue !== '' && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <DollarSign className="h-4 w-4" />
              <span>{usdValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Helper text / validation message */}
      {displayMessage != null && displayMessage.length > 0 && (
        <p
          id={helperId}
          className={cn(
            'mt-2 text-xs',
            {
              'text-red-600 dark:text-red-400': currentVariant === 'error',
              'text-green-600 dark:text-green-400': currentVariant === 'success',
              'text-yellow-600 dark:text-yellow-400': warning != null && warning.length > 0,
              'text-gray-500 dark:text-gray-400':
                currentVariant === 'default' &&
                (error === null || error === undefined || error === '') &&
                (success === null || success === undefined || success === '') &&
                (warning === null || warning === undefined || warning === ''),
            },
            helperClassName,
          )}
        >
          {displayMessage}
        </p>
      )}

      {/* Click outside handler for token selector */}
      {isTokenSelectorOpen && <div className="fixed inset-0 z-40" onClick={() => setIsTokenSelectorOpen(false)} />}
    </div>
  )
}

TokenInput.displayName = 'TokenInput'

export {TokenInput}
