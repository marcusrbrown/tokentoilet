import type {VariantProps} from 'class-variance-authority'
import {cn} from '@/lib/utils'

import React from 'react'

import {buttonVariants} from './button-variants'

// Handle loading state spinner
const LoadingSpinner = () => (
  <svg
    className="h-4 w-4 animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

/**
 * Polymorphic button component for Token Toilet design system
 *
 * Features:
 * - Variant system with Web3-specific states
 * - Glass morphism support for secondary variant
 * - Full accessibility with focus management
 * - Loading states with spinner
 * - Icon support (left/right positioning)
 * - Full width option
 * - Multiple sizes
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Connect Wallet</Button>
 *
 * // Web3 connected state
 * <Button variant="web3Connected" leftIcon={<Wallet />}>
 *   {address}
 * </Button>
 *
 * // Loading state
 * <Button loading disabled>
 *   Processing...
 * </Button>
 *
 * // Glass morphism secondary
 * <Button variant="secondary" size="lg">
 *   Dispose Tokens
 * </Button>
 * ```
 */
const Button = ({
  ref,
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps & {ref?: React.RefObject<HTMLButtonElement | null>}) => {
  // If asChild is true, we'd need to implement Slot pattern
  // For now, we'll just render as button with a note
  if (asChild) {
    console.warn('asChild prop is not yet implemented - rendering as button')
  }

  return (
    <button
      type="button"
      className={cn(buttonVariants({variant, size, fullWidth, className}))}
      ref={ref}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {/* Left icon or loading spinner */}
      {loading ? (
        <LoadingSpinner />
      ) : leftIcon !== undefined && leftIcon !== null ? (
        <span className="mr-2" aria-hidden="true">
          {leftIcon}
        </span>
      ) : null}

      {/* Button content */}
      {children}

      {/* Right icon (not shown when loading) */}
      {!loading && rightIcon !== undefined && rightIcon !== null && (
        <span className="ml-2" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  )
}

Button.displayName = 'Button'

export {Button}
export type {VariantProps as ButtonVariantProps}
