'use client'

import {cn, formatAddress, isValidAddress} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {Check, Copy, ExternalLink} from 'lucide-react'
import React, {useState} from 'react'

/**
 * AddressDisplay component variants using class-variance-authority
 * Provides consistent styling for Web3 address display with copy functionality
 */
const addressDisplayVariants = cva(
  // Base classes applied to all address displays
  ['inline-flex', 'items-center', 'gap-2', 'font-mono', 'text-sm', 'transition-all', 'duration-150', 'group'],
  {
    variants: {
      variant: {
        // Default variant with subtle styling
        default: ['text-gray-700', 'dark:text-gray-300', 'hover:text-gray-900', 'dark:hover:text-gray-100'],
        // Card variant with background and border
        card: [
          'bg-gray-50',
          'text-gray-700',
          'border',
          'border-gray-200',
          'rounded-lg',
          'px-3',
          'py-2',
          'hover:bg-gray-100',
          'hover:border-gray-300',
          'dark:bg-gray-800',
          'dark:text-gray-300',
          'dark:border-gray-700',
          'dark:hover:bg-gray-700',
          'dark:hover:border-gray-600',
        ],
        // Glass variant with glass morphism effect
        glass: [
          'bg-white/60',
          'text-gray-800',
          'backdrop-blur-md',
          'border',
          'border-white/20',
          'rounded-lg',
          'px-3',
          'py-2',
          'shadow-sm',
          'hover:bg-white/70',
          'hover:shadow-md',
          'dark:bg-gray-800/60',
          'dark:text-gray-200',
          'dark:border-gray-700/40',
          'dark:hover:bg-gray-800/70',
        ],
        // Primary variant with violet brand colors
        primary: [
          'bg-violet-50',
          'text-violet-700',
          'border',
          'border-violet-200',
          'rounded-lg',
          'px-3',
          'py-2',
          'hover:bg-violet-100',
          'hover:border-violet-300',
          'dark:bg-violet-900/30',
          'dark:text-violet-300',
          'dark:border-violet-700/50',
          'dark:hover:bg-violet-900/40',
        ],
      },
      size: {
        sm: ['text-xs', 'gap-1.5'],
        default: ['text-sm', 'gap-2'],
        lg: ['text-base', 'gap-2.5'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/**
 * Button variants for copy and external link actions
 */
const actionButtonVariants = cva(
  [
    'flex',
    'items-center',
    'justify-center',
    'rounded-md',
    'transition-all',
    'duration-150',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-violet-500',
    'focus:ring-offset-2',
    'focus:ring-offset-white',
    'dark:focus:ring-offset-gray-900',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        sm: ['w-4', 'h-4', 'p-0.5'],
        default: ['w-5', 'h-5', 'p-1'],
        lg: ['w-6', 'h-6', 'p-1.5'],
      },
      variant: {
        default: [
          'text-gray-500',
          'hover:text-gray-700',
          'hover:bg-gray-100',
          'dark:text-gray-400',
          'dark:hover:text-gray-200',
          'dark:hover:bg-gray-700',
        ],
        success: [
          'text-green-600',
          'hover:text-green-700',
          'hover:bg-green-50',
          'dark:text-green-400',
          'dark:hover:text-green-300',
          'dark:hover:bg-green-900/20',
        ],
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  },
)

export interface AddressDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof addressDisplayVariants> {
  /**
   * The Ethereum address to display
   */
  address: string
  /**
   * Number of characters to show at start and end (default: 4)
   */
  chars?: number
  /**
   * Whether to show the copy button
   */
  showCopy?: boolean
  /**
   * Whether to show the external link button (links to etherscan)
   */
  showExternalLink?: boolean
  /**
   * Custom explorer URL (defaults to etherscan.io)
   */
  explorerUrl?: string
  /**
   * Callback when address is copied
   */
  onCopy?: () => void
  /**
   * Callback when external link is clicked
   */
  onExternalLinkClick?: () => void
  /**
   * Whether to validate the address format
   */
  validateAddress?: boolean
  /**
   * Custom label for screen readers
   */
  'aria-label'?: string
}

/**
 * AddressDisplay component for displaying and interacting with Ethereum addresses
 * Provides formatting, copy functionality, and external link integration
 */
export const AddressDisplay = ({
  ref,
  address,
  chars = 4,
  showCopy = true,
  showExternalLink = false,
  explorerUrl = 'https://etherscan.io/address',
  onCopy,
  onExternalLinkClick,
  validateAddress = true,
  variant,
  size,
  className,
  'aria-label': ariaLabel,
  ...props
}: AddressDisplayProps & {ref?: React.RefObject<HTMLDivElement | null>}) => {
  const [copied, setCopied] = useState(false)

  // Validate address format if validation is enabled
  const isValid = !validateAddress || isValidAddress(address)
  const displayAddress = isValid ? formatAddress(address, chars) : address

  const handleCopy = () => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopied(true)
        onCopy?.()

        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(error => {
        console.error('Failed to copy address:', error)
      })
  }

  const handleExternalLink = () => {
    if (isValid) {
      window.open(`${explorerUrl}/${address}`, '_blank', 'noopener,noreferrer')
      onExternalLinkClick?.()
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 12
      case 'lg':
        return 18
      case 'default':
      case undefined:
      case null:
      default:
        return 16
    }
  }

  const iconSize = getIconSize()

  return (
    <div
      ref={ref}
      className={cn(addressDisplayVariants({variant, size}), className)}
      role="group"
      aria-label={ariaLabel ?? `Ethereum address: ${address}`}
      {...props}
    >
      {/* Address text */}
      <span className={cn('select-all', !isValid && 'text-red-600 dark:text-red-400')} title={address}>
        {displayAddress}
      </span>

      {/* Copy button */}
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            actionButtonVariants({
              size,
              variant: copied ? 'success' : 'default',
            }),
            'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          )}
          aria-label={copied ? 'Address copied!' : 'Copy address'}
          disabled={!isValid}
        >
          {copied ? <Check size={iconSize} className="animate-in fade-in duration-150" /> : <Copy size={iconSize} />}
        </button>
      )}

      {/* External link button */}
      {showExternalLink && (
        <button
          type="button"
          onClick={handleExternalLink}
          className={cn(
            actionButtonVariants({size}),
            'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          )}
          aria-label="View on block explorer"
          disabled={!isValid}
        >
          <ExternalLink size={iconSize} />
        </button>
      )}
    </div>
  )
}

AddressDisplay.displayName = 'AddressDisplay'

// Re-export variants for external consumption if needed
// export {addressDisplayVariants}
