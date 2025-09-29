'use client'

import type {CategorizedToken} from '@/lib/web3/token-filtering'
import type {Address} from 'viem'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Modal} from '@/components/ui/modal'
import {Skeleton} from '@/components/ui/skeleton'
import {useTokenApproval} from '@/hooks/use-token-approval'
import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {AlertTriangle, CheckCircle, Clock, DollarSign, Info, Loader2, RefreshCw, Settings, Zap} from 'lucide-react'
import React, {useState} from 'react'
import {formatUnits, parseUnits} from 'viem'

/**
 * Token approval component variants using class-variance-authority
 * Provides consistent styling for approval workflow states
 */
const tokenApprovalVariants = cva(
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
        modal: ['max-w-lg', 'mx-auto'],
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

/**
 * Approval status badge variants
 */
const approvalStatusVariants = cva(
  ['inline-flex', 'items-center', 'gap-1', 'px-2', 'py-1', 'rounded-md', 'text-xs', 'font-medium'],
  {
    variants: {
      status: {
        approved: ['bg-green-100', 'text-green-800', 'dark:bg-green-900/30', 'dark:text-green-400'],
        pending: ['bg-yellow-100', 'text-yellow-800', 'dark:bg-yellow-900/30', 'dark:text-yellow-400'],
        required: ['bg-red-100', 'text-red-800', 'dark:bg-red-900/30', 'dark:text-red-400'],
        loading: ['bg-blue-100', 'text-blue-800', 'dark:bg-blue-900/30', 'dark:text-blue-400'],
      },
    },
    defaultVariants: {
      status: 'required',
    },
  },
)

/**
 * Token approval workflow configuration
 */
export interface TokenApprovalProps extends VariantProps<typeof tokenApprovalVariants> {
  /** Token to approve */
  token: CategorizedToken
  /** Spender contract address (disposal contract) */
  spender: Address
  /** Custom approval amount (optional) */
  amount?: bigint
  /** Use infinite approval by default */
  useInfiniteApproval?: boolean
  /** Show advanced controls */
  showAdvanced?: boolean
  /** Auto-refresh allowance after approval */
  autoRefresh?: boolean
  /** Custom class name */
  className?: string
  /** Callback when approval completes */
  onApprovalComplete?: () => void
  /** Callback when approval starts */
  onApprovalStart?: () => void
}

/**
 * Approval amount input component
 */
interface ApprovalAmountInputProps {
  token: CategorizedToken
  currentAmount: bigint
  onAmountChange: (amount: bigint) => void
  disabled?: boolean
}

function ApprovalAmountInput({token, currentAmount, onAmountChange, disabled}: ApprovalAmountInputProps) {
  const [inputValue, setInputValue] = useState(() => formatUnits(currentAmount, token.decimals))
  const [isInfinite, setIsInfinite] = useState(false)

  const handleInputChange = (value: string) => {
    setInputValue(value)
    try {
      const parsed = parseUnits(value, token.decimals)
      onAmountChange(parsed)
    } catch {
      // Invalid input, ignore
    }
  }

  const handleInfiniteToggle = () => {
    const newIsInfinite = !isInfinite
    setIsInfinite(newIsInfinite)
    if (newIsInfinite) {
      // Set to max uint256
      const maxAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      onAmountChange(maxAmount)
      setInputValue('∞')
    } else {
      // Reset to token balance
      onAmountChange(token.balance)
      setInputValue(formatUnits(token.balance, token.decimals))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Approval Amount</label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInfiniteToggle}
          disabled={disabled}
          className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          {isInfinite ? 'Use Specific Amount' : 'Use Infinite Approval'}
        </Button>
      </div>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          disabled={disabled || isInfinite}
          placeholder="0.0"
          className="pr-16"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{token.symbol}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Balance: {formatUnits(token.balance, token.decimals)} {token.symbol}
        </span>
        {isInfinite && <span className="text-violet-600 dark:text-violet-400">Infinite approval selected</span>}
      </div>
    </div>
  )
}

/**
 * Gas estimation display component
 */
interface GasEstimateDisplayProps {
  gasEstimate: ReturnType<typeof useTokenApproval>['gasEstimate']
  className?: string
}

function GasEstimateDisplay({gasEstimate, className}: GasEstimateDisplayProps) {
  if (gasEstimate.isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    )
  }

  if (gasEstimate.error != null) {
    return (
      <div className={cn('flex items-center gap-2 text-red-600 dark:text-red-400', className)}>
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm">Gas estimation failed</span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2 text-sm">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="font-medium text-gray-700 dark:text-gray-300">Est. Gas Cost</span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{gasEstimate.totalCostFormatted}</div>
      {gasEstimate.gasLimit != null && (
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Gas Limit: {gasEstimate.gasLimit.toLocaleString()}
        </div>
      )}
    </div>
  )
}

/**
 * Token approval workflow component with gas estimation
 * Provides comprehensive approval management for ERC-20 tokens in disposal workflow
 */
export function TokenApproval({
  token,
  spender,
  amount,
  useInfiniteApproval = false,
  showAdvanced = false,
  autoRefresh = true,
  variant,
  size,
  className,
  onApprovalComplete,
  onApprovalStart,
  ...props
}: TokenApprovalProps) {
  // Local state for advanced controls
  const [showAdvancedControls, setShowAdvancedControls] = useState(showAdvanced)

  // Token approval hook
  const {approvalState, gasEstimate, approve, checkAllowance, setApprovalAmount} = useTokenApproval({
    token,
    spender,
    amount,
    useInfiniteApproval,
    autoRefresh,
  })

  // Handle approval action
  const handleApprove = async () => {
    onApprovalStart?.()
    try {
      await approve()
      onApprovalComplete?.()
    } catch (error) {
      console.error('Approval failed:', error)
    }
  }

  // Render approval status badge
  const renderStatusBadge = () => {
    if (approvalState.isPending) {
      return (
        <div className={cn(approvalStatusVariants({status: 'pending'}))}>
          <Loader2 className="h-3 w-3 animate-spin" />
          Approving...
        </div>
      )
    }

    if (approvalState.isLoading) {
      return (
        <div className={cn(approvalStatusVariants({status: 'loading'}))}>
          <Clock className="h-3 w-3" />
          Checking...
        </div>
      )
    }

    if (approvalState.isApproved) {
      return (
        <div className={cn(approvalStatusVariants({status: 'approved'}))}>
          <CheckCircle className="h-3 w-3" />
          Approved
        </div>
      )
    }

    return (
      <div className={cn(approvalStatusVariants({status: 'required'}))}>
        <AlertTriangle className="h-3 w-3" />
        Approval Required
      </div>
    )
  }

  return (
    <div className={cn(tokenApprovalVariants({variant, size}), className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Approve {token.symbol}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Allow contract to spend your tokens</p>
          </div>
        </div>
        {renderStatusBadge()}
      </div>

      {/* Token Information */}
      <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Token</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">{token.name}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Balance</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatUnits(token.balance, token.decimals)} {token.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Allowance</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatUnits(approvalState.currentAllowance, token.decimals)} {token.symbol}
          </span>
        </div>
      </div>

      {/* Advanced Controls */}
      {showAdvancedControls && (
        <div className="mb-4">
          <ApprovalAmountInput
            token={token}
            currentAmount={approvalState.approvalAmount}
            onAmountChange={setApprovalAmount}
            disabled={approvalState.isPending}
          />
        </div>
      )}

      {/* Gas Estimation */}
      <div className="mb-4">
        <GasEstimateDisplay gasEstimate={gasEstimate} />
      </div>

      {/* Error Display */}
      {approvalState.error != null && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-800 dark:text-red-200">{approvalState.error.message}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Primary approval button */}
        <Button
          onClick={() => {
            handleApprove().catch(console.error)
          }}
          disabled={approvalState.isPending || approvalState.isApproved || approvalState.isLoading}
          className="flex-1"
          variant={approvalState.isApproved ? 'secondary' : 'default'}
        >
          {approvalState.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Approving...
            </>
          ) : approvalState.isApproved ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved
            </>
          ) : (
            `Approve ${token.symbol}`
          )}
        </Button>

        {/* Refresh button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            checkAllowance().catch(console.error)
          }}
          disabled={approvalState.isLoading}
          className="shrink-0"
        >
          <RefreshCw className={cn('h-4 w-4', approvalState.isLoading && 'animate-spin')} />
        </Button>

        {/* Advanced settings toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className="shrink-0"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">About Token Approvals</p>
            <p>
              Approving tokens allows the disposal contract to transfer your tokens on your behalf. You can approve the
              exact amount or use infinite approval for convenience.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Modal variant of the token approval component
 */
export interface TokenApprovalModalProps extends Omit<TokenApprovalProps, 'variant'> {
  /** Modal open state */
  open: boolean
  /** Modal close callback */
  onClose: () => void
  /** Modal title override */
  title?: string
}

export function TokenApprovalModal({open, onClose, title, onApprovalComplete, ...props}: TokenApprovalModalProps) {
  const handleApprovalComplete = () => {
    onApprovalComplete?.()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} variant="web3">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title ?? `Approve ${props.token.symbol}`}
        </h2>
        <TokenApproval {...props} variant="modal" onApprovalComplete={handleApprovalComplete} />
      </div>
    </Modal>
  )
}
