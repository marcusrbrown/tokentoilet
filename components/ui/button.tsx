import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import React from 'react'

/**
 * Button component variants using class-variance-authority
 * Provides consistent styling for all button states and Web3 interactions
 */
const buttonVariants = cva(
  // Base classes applied to all buttons
  [
    'inline-flex',
    'items-center',
    'justify-center',
    'whitespace-nowrap',
    'rounded-lg',
    'text-sm',
    'font-medium',
    'transition-all',
    'duration-150',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-offset-white',
    'dark:focus:ring-offset-gray-900',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    'active:scale-95',
  ],
  {
    variants: {
      variant: {
        // Primary variant with violet brand colors
        default: [
          'bg-violet-600',
          'text-white',
          'hover:bg-violet-700',
          'focus:ring-violet-500',
          'shadow-sm',
          'dark:bg-violet-600',
          'dark:hover:bg-violet-700',
        ],
        // Destructive variant for dangerous actions
        destructive: [
          'bg-red-600',
          'text-white',
          'hover:bg-red-700',
          'focus:ring-red-500',
          'shadow-sm',
          'dark:bg-red-600',
          'dark:hover:bg-red-700',
        ],
        // Outline variant for secondary actions
        outline: [
          'border',
          'border-violet-300',
          'bg-transparent',
          'text-violet-700',
          'hover:bg-violet-50',
          'hover:text-violet-800',
          'focus:ring-violet-500',
          'dark:border-violet-700',
          'dark:text-violet-300',
          'dark:hover:bg-violet-950/20',
          'dark:hover:text-violet-200',
        ],
        // Secondary variant with glass morphism
        secondary: [
          'bg-white/80',
          'backdrop-blur-md',
          'border',
          'border-white/20',
          'text-gray-900',
          'hover:bg-white/90',
          'focus:ring-violet-500',
          'shadow-sm',
          'dark:bg-gray-900/80',
          'dark:border-gray-700/20',
          'dark:text-gray-100',
          'dark:hover:bg-gray-900/90',
        ],
        // Ghost variant for minimal styling
        ghost: [
          'bg-transparent',
          'text-violet-700',
          'hover:bg-violet-100',
          'hover:text-violet-800',
          'focus:ring-violet-500',
          'dark:text-violet-300',
          'dark:hover:bg-violet-950/20',
          'dark:hover:text-violet-200',
        ],
        // Link variant styled as link
        link: [
          'bg-transparent',
          'text-violet-600',
          'underline-offset-4',
          'hover:underline',
          'focus:ring-violet-500',
          'dark:text-violet-400',
        ],
        // Web3 specific variants for wallet states
        web3Connected: [
          'bg-green-600',
          'text-white',
          'hover:bg-green-700',
          'focus:ring-green-500',
          'shadow-sm',
          'dark:bg-green-600',
          'dark:hover:bg-green-700',
        ],
        web3Connecting: [
          'bg-yellow-500',
          'text-white',
          'hover:bg-yellow-600',
          'focus:ring-yellow-400',
          'shadow-sm',
          'dark:bg-yellow-500',
          'dark:hover:bg-yellow-600',
        ],
        web3Error: [
          'bg-red-600',
          'text-white',
          'hover:bg-red-700',
          'focus:ring-red-500',
          'shadow-sm',
          'border-2',
          'border-red-400',
          'dark:bg-red-600',
          'dark:hover:bg-red-700',
          'dark:border-red-500',
        ],
        web3Network: [
          'bg-blue-600',
          'text-white',
          'hover:bg-blue-700',
          'focus:ring-blue-500',
          'shadow-sm',
          'dark:bg-blue-600',
          'dark:hover:bg-blue-700',
        ],
        web3Pending: [
          'bg-orange-500',
          'text-white',
          'hover:bg-orange-600',
          'focus:ring-orange-400',
          'shadow-sm',
          'animate-pulse',
          'dark:bg-orange-500',
          'dark:hover:bg-orange-600',
        ],
      },
      size: {
        default: ['h-10', 'px-4', 'py-2'],
        sm: ['h-9', 'rounded-md', 'px-3', 'text-xs'],
        lg: ['h-11', 'rounded-lg', 'px-8'],
        xl: ['h-12', 'rounded-lg', 'px-10', 'text-base'],
        icon: ['h-10', 'w-10', 'rounded-lg'],
        iconSm: ['h-8', 'w-8', 'rounded-md'],
        iconLg: ['h-12', 'w-12', 'rounded-lg'],
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  },
)

/**
 * Button component props interface extending HTML button attributes
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as child component instead of button
   */
  asChild?: boolean
  /**
   * Loading state with spinner
   */
  loading?: boolean
  /**
   * Icon to display before text
   */
  leftIcon?: React.ReactNode
  /**
   * Icon to display after text
   */
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
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
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
    },
    ref,
  ) => {
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

    // If asChild is true, we'd need to implement Slot pattern
    // For now, we'll just render as button with a note
    if (asChild) {
      console.warn('asChild prop is not yet implemented - rendering as button')
    }

    return (
      <button
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
  },
)

Button.displayName = 'Button'

export {Button, buttonVariants}
export type {VariantProps as ButtonVariantProps}
