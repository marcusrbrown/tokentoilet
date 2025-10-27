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
 * Comprehensive validation result that provides contextual feedback beyond simple pass/fail.
 * Enables sophisticated user guidance and progressive disclosure of validation issues.
 */
interface ValidationResult {
  isValid: boolean
  type: 'success' | 'warning' | 'error' | null
  message: string | null
  suggestion?: string
  severity?: 'low' | 'medium' | 'high'
}

/**
 * Configuration for advanced validation logic beyond basic amount validation.
 * Allows customization of business rules specific to DeFi token interactions.
 */
interface ValidationConfig {
  /** Fetches fresh balance data for accurate validation, trading performance for accuracy */
  enableRealTimeBalance?: boolean
  /** Enforces minimum transaction amounts to prevent dust accumulation */
  minAmount?: string
  /** Enforces maximum transaction amounts, useful for regulatory compliance or risk management */
  maxAmount?: string
  /** Warns users about dust amounts that may not be economically viable due to gas costs */
  dustThreshold?: string
  /** Allows parent components to inject domain-specific validation logic */
  customValidator?: (amount: string, token?: TokenData, balance?: string) => ValidationResult | null
}

/**
 * Status information for real-time balance verification to ensure data reliability.
 * Critical for DeFi applications where stale data can cause transaction failures.
 */
interface BalanceVerification {
  isLoading: boolean
  isStale: boolean
  lastUpdated: Date | null
  error: Error | null
}

export interface TokenAmountInputProps extends Omit<TokenInputProps, 'error' | 'warning' | 'success' | 'validate'> {
  /**
   * Configuration for advanced validation logic including dust thresholds and balance verification.
   * Allows customization of validation behavior beyond basic amount validation.
   */
  validationConfig?: ValidationConfig
  /**
   * Options for controlling real-time balance fetching behavior to optimize RPC usage.
   * Allows fine-tuning of refetch intervals and caching strategies.
   */
  balanceOptions?: UseSingleTokenBalanceOptions
  /**
   * Controls visibility of enhanced validation messaging to reduce UI clutter when not needed.
   * Useful for simpler interfaces that only need basic error states.
   */
  showDetailedFeedback?: boolean
  /**
   * Shows balance verification indicators to help users understand data freshness and reliability.
   * Critical for DeFi applications where stale balance data can cause transaction failures.
   */
  showBalanceVerification?: boolean
  /**
   * Displays amount as percentage of total balance to help users gauge transaction impact.
   * Particularly useful for preventing users from accidentally spending entire balances.
   */
  showPercentageOfBalance?: boolean
  /**
   * Provides quick access buttons for common percentage amounts to improve UX.
   * Reduces user error and speeds up common operations like "max" transactions.
   */
  enableQuickPercentages?: boolean
  /**
   * Allows parent components to override error messaging for specific business logic contexts.
   * Enables consistent error handling across different validation scenarios.
   */
  errorOverride?: string
  /**
   * Allows parent components to provide contextual warnings beyond standard validation.
   * Useful for external constraints like slippage or gas fee warnings.
   */
  warningOverride?: string
  /**
   * Allows parent components to override success messaging for enhanced user confidence.
   * Useful for confirming complex validation states or external service integration.
   */
  successOverride?: string
  /**
   * Notifies parent components of validation state changes for coordinated UI updates.
   * Enables advanced form validation and conditional rendering based on input validity.
   */
  onValidationChange?: (result: ValidationResult) => void
  /**
   * Notifies parent components of balance verification status for loading states and error handling.
   * Critical for showing appropriate loading indicators and handling RPC failures gracefully.
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
  const validationCallbackRef = useRef<((result: ValidationResult) => void) | undefined>(onValidationChange)
  useEffect(() => {
    validationCallbackRef.current = onValidationChange
  }, [onValidationChange])

  const balanceCallbackRef = useRef<((status: BalanceVerification) => void) | undefined>(onBalanceVerificationChange)
  useEffect(() => {
    balanceCallbackRef.current = onBalanceVerificationChange
  }, [onBalanceVerificationChange])

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
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={refreshBalance}
                    className="p-0 h-auto text-red-500 hover:text-red-600"
                  >
                    Retry
                  </Button>
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
