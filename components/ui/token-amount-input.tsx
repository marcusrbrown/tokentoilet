'use client'

import {Button} from '@/components/ui/button'
import {TokenInput, type TokenInputProps} from '@/components/ui/token-input'
import {useSingleTokenBalance, type UseSingleTokenBalanceOptions} from '@/hooks/use-token-balance'
import {useWallet, type SupportedChainId} from '@/hooks/use-wallet'
import {rawToDecimal, validateTokenAmount, type TokenData} from '@/lib/token-utils'
import {cn} from '@/lib/utils'
import {AlertTriangle, CheckCircle2, Info, Loader2, TrendingUp, Wallet} from 'lucide-react'
import React, {useCallback, useEffect, useMemo, useRef} from 'react'

// Default configuration objects to prevent render loops
const DEFAULT_VALIDATION_CONFIG = {}
const DEFAULT_BALANCE_OPTIONS = {}

/**
 * Real-time validation result with enhanced context
 */
interface ValidationResult {
  isValid: boolean
  type: 'success' | 'warning' | 'error' | null
  message: string | null
  suggestion?: string
  severity?: 'low' | 'medium' | 'high'
}

/**
 * Enhanced validation configuration
 */
interface ValidationConfig {
  /** Enable real-time balance verification */
  enableRealTimeBalance?: boolean
  /** Minimum amount validation */
  minAmount?: string
  /** Maximum amount validation (overrides balance check) */
  maxAmount?: string
  /** Dust threshold for warning */
  dustThreshold?: string
  /** Custom validation function */
  customValidator?: (amount: string, token?: TokenData, balance?: string) => ValidationResult | null
}

/**
 * Balance verification status
 */
interface BalanceVerification {
  isLoading: boolean
  isStale: boolean
  lastUpdated: Date | null
  error: Error | null
}

export interface TokenAmountInputProps extends Omit<TokenInputProps, 'error' | 'warning' | 'success' | 'validate'> {
  /**
   * Validation configuration options
   */
  validationConfig?: ValidationConfig
  /**
   * Balance checking options
   */
  balanceOptions?: UseSingleTokenBalanceOptions
  /**
   * Show detailed validation feedback
   */
  showDetailedFeedback?: boolean
  /**
   * Show balance verification status
   */
  showBalanceVerification?: boolean
  /**
   * Show amount as percentage of balance
   */
  showPercentageOfBalance?: boolean
  /**
   * Enable quick percentage buttons (25%, 50%, 75%, 100%)
   */
  enableQuickPercentages?: boolean
  /**
   * Custom error message override
   */
  errorOverride?: string
  /**
   * Custom warning message override
   */
  warningOverride?: string
  /**
   * Custom success message override
   */
  successOverride?: string
  /**
   * Callback when validation result changes
   */
  onValidationChange?: (result: ValidationResult) => void
  /**
   * Callback when balance verification status changes
   */
  onBalanceVerificationChange?: (status: BalanceVerification) => void
}

/**
 * TokenAmountInput - Enhanced token amount input with comprehensive validation and balance verification
 */
export function TokenAmountInput({
  className,
  validationConfig = DEFAULT_VALIDATION_CONFIG,
  balanceOptions = DEFAULT_BALANCE_OPTIONS,
  showDetailedFeedback = true,
  showBalanceVerification = true,
  showPercentageOfBalance = false,
  enableQuickPercentages = false,
  errorOverride,
  warningOverride,
  successOverride,
  value = '',
  selectedToken,
  onAmountChange,
  onValidationChange,
  onBalanceVerificationChange,
  disabled = false,
  readOnly = false,
  ...props
}: TokenAmountInputProps) {
  // Wallet connection state
  const {address, chainId, isConnected} = useWallet()

  // Use ref for validation callback timing
  const validationCallbackRef = useRef(onValidationChange)
  validationCallbackRef.current = onValidationChange

  const balanceCallbackRef = useRef(onBalanceVerificationChange)
  balanceCallbackRef.current = onBalanceVerificationChange

  // Real-time balance verification
  const {
    balance: realTimeBalance,
    isLoading: isBalanceLoading,
    error: balanceError,
    refresh: refreshBalance,
    isSuccess: hasBalanceData,
  } = useSingleTokenBalance((selectedToken?.address as `0x${string}`) ?? null, (chainId as SupportedChainId) ?? null, {
    enabled:
      (validationConfig.enableRealTimeBalance ?? false) &&
      isConnected &&
      selectedToken?.address != null &&
      address != null &&
      chainId != null,
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000, // 5 seconds
    ...balanceOptions,
  })

  // Enhanced validation logic with real-time balance verification
  const validationResult = useMemo((): ValidationResult => {
    if (value.length === 0) {
      return {isValid: true, type: null, message: null}
    }

    // Custom validation takes priority
    if (validationConfig.customValidator != null) {
      const customResult = validationConfig.customValidator(
        value,
        selectedToken,
        realTimeBalance?.formattedBalance ?? selectedToken?.balance,
      )
      if (customResult != null) return customResult
    }

    // Use built-in validation function
    const basicValidation = validateTokenAmount(
      value,
      selectedToken,
      validationConfig.minAmount,
      validationConfig.maxAmount,
    )

    if (basicValidation != null) {
      return {
        isValid: false,
        type: 'error',
        message: basicValidation,
        severity: 'high',
      }
    }

    // Use real-time balance if available, fall back to token balance
    const currentBalance = realTimeBalance?.formattedBalance ?? selectedToken?.balance
    const num = Number.parseFloat(value)

    // Balance verification with enhanced messaging
    if (currentBalance != null && currentBalance.length > 0) {
      const balanceDecimal = selectedToken ? rawToDecimal(currentBalance, selectedToken.decimals) : currentBalance
      const balanceNum = Number.parseFloat(balanceDecimal)

      // Dust threshold warning
      if (
        validationConfig.dustThreshold != null &&
        validationConfig.dustThreshold.length > 0 &&
        num < Number.parseFloat(validationConfig.dustThreshold) &&
        num > 0
      ) {
        return {
          isValid: true,
          type: 'warning',
          message: `This is a very small amount (dust)`,
          suggestion: 'Consider consolidating small amounts to reduce transaction costs',
          severity: 'low',
        }
      }

      // High percentage of balance warning
      const percentageOfBalance = (num / balanceNum) * 100
      if (percentageOfBalance > 90 && percentageOfBalance < 100) {
        return {
          isValid: true,
          type: 'warning',
          message: `Using ${percentageOfBalance.toFixed(1)}% of your balance`,
          suggestion: 'Consider leaving some tokens for future transaction fees',
          severity: 'low',
        }
      }

      // Success state with helpful context
      return {
        isValid: true,
        type: 'success',
        message: `Valid amount (${percentageOfBalance.toFixed(1)}% of balance)`,
        severity: 'low',
      }
    }

    // Default valid state when no balance available
    return {
      isValid: true,
      type: 'success',
      message: 'Amount appears valid',
    }
  }, [value, selectedToken, realTimeBalance, validationConfig])

  // Balance verification status
  const balanceVerification = useMemo((): BalanceVerification => {
    return {
      isLoading: isBalanceLoading,
      isStale: !hasBalanceData && !isBalanceLoading,
      lastUpdated: new Date(),
      error: balanceError,
    }
  }, [isBalanceLoading, hasBalanceData, balanceError])

  // Validation change callback effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (validationCallbackRef.current != null) {
        validationCallbackRef.current(validationResult)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [validationResult])

  // Balance verification status callback
  useEffect(() => {
    if (balanceCallbackRef.current != null) {
      balanceCallbackRef.current(balanceVerification)
    }
  }, [balanceVerification])

  // Determine current validation variant
  const currentValidation = useMemo(() => {
    if (errorOverride != null && errorOverride.length > 0) return 'error'
    if (warningOverride != null && warningOverride.length > 0) return 'warning'
    if (successOverride != null && successOverride.length > 0) return 'success'
    if (isBalanceLoading) return 'loading'
    return validationResult.type ?? 'default'
  }, [errorOverride, warningOverride, successOverride, isBalanceLoading, validationResult.type])

  // Display message priority: override > validation result > default
  const displayMessage = useMemo(() => {
    if (errorOverride != null && errorOverride.length > 0) return errorOverride
    if (warningOverride != null && warningOverride.length > 0) return warningOverride
    if (successOverride != null && successOverride.length > 0) return successOverride
    if (validationResult.message != null && validationResult.message.length > 0) return validationResult.message
    if (props.helperText != null && props.helperText.length > 0) return props.helperText
    return null
  }, [errorOverride, warningOverride, successOverride, validationResult.message, props.helperText])

  // Quick percentage handlers
  const handlePercentageClick = useCallback(
    (percentage: number) => {
      if (selectedToken?.balance == null || selectedToken.balance.length === 0 || disabled || readOnly) return

      const balanceDecimal = rawToDecimal(selectedToken.balance, selectedToken.decimals)
      const balanceNum = Number.parseFloat(balanceDecimal)
      const targetAmount = (balanceNum * percentage) / 100

      const formattedAmount = targetAmount.toFixed(selectedToken.decimals).replace(/\.?0+$/, '')

      if (onAmountChange != null) {
        onAmountChange(formattedAmount)
      }
    },
    [selectedToken, disabled, readOnly, onAmountChange],
  )

  // Render validation icon
  const ValidationIcon = useMemo(() => {
    if (isBalanceLoading) return <Loader2 className="h-4 w-4 animate-spin text-violet-500" />

    switch (validationResult.type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case null:
      default:
        return balanceError ? <AlertTriangle className="h-4 w-4 text-red-500" /> : null
    }
  }, [validationResult.type, isBalanceLoading, balanceError])

  return (
    <div className="space-y-3">
      {/* Main token input */}
      <div className="relative">
        <TokenInput
          {...props}
          className={cn(className)}
          value={value}
          selectedToken={selectedToken}
          onAmountChange={onAmountChange}
          disabled={disabled}
          readOnly={readOnly}
          error={currentValidation === 'error' ? (displayMessage ?? undefined) : undefined}
          warning={currentValidation === 'warning' ? (displayMessage ?? undefined) : undefined}
          success={currentValidation === 'success' ? (displayMessage ?? undefined) : undefined}
        />

        {/* Validation status indicator */}
        {(showDetailedFeedback || ValidationIcon != null) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">{ValidationIcon}</div>
        )}
      </div>

      {/* Enhanced validation feedback */}
      {showDetailedFeedback && (
        <div className="space-y-2">
          {/* Balance verification status */}
          {showBalanceVerification && selectedToken != null && (validationConfig.enableRealTimeBalance ?? false) && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Wallet className="h-3 w-3" />
                <span>Balance verification</span>
                {isBalanceLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <div className="flex items-center gap-2">
                {balanceError ? (
                  <button type="button" onClick={refreshBalance} className="text-red-500 hover:text-red-600 underline">
                    Retry
                  </button>
                ) : hasBalanceData ? (
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Pending</span>
                )}
              </div>
            </div>
          )}

          {/* Percentage of balance display */}
          {showPercentageOfBalance &&
            selectedToken?.balance != null &&
            selectedToken.balance.length > 0 &&
            Number.parseFloat(rawToDecimal(selectedToken.balance, selectedToken.decimals)) > 0 &&
            value.length > 0 &&
            !Number.isNaN(Number.parseFloat(value)) && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-3 w-3" />
                <span>
                  {(
                    (Number.parseFloat(value) /
                      Number.parseFloat(rawToDecimal(selectedToken.balance, selectedToken.decimals))) *
                    100
                  ).toFixed(1)}
                  % of available balance
                </span>
              </div>
            )}

          {/* Validation suggestion */}
          {validationResult.suggestion != null && validationResult.suggestion.length > 0 && (
            <div className="flex items-start gap-2 text-xs">
              <Info className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-300">{validationResult.suggestion}</span>
            </div>
          )}
        </div>
      )}

      {/* Quick percentage buttons */}
      {enableQuickPercentages &&
        selectedToken?.balance != null &&
        selectedToken.balance.length > 0 &&
        Number.parseFloat(rawToDecimal(selectedToken.balance, selectedToken.decimals)) > 0 &&
        !disabled &&
        !readOnly && (
          <div className="flex gap-2">
            {[25, 50, 75, 100].map(percentage => (
              <Button
                key={percentage}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePercentageClick(percentage)}
                className="text-xs flex-1"
                disabled={isBalanceLoading}
              >
                {percentage}%
              </Button>
            ))}
          </div>
        )}
    </div>
  )
}

export default TokenAmountInput
