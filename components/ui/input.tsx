import {cn, formatAddress, isValidAddress} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {AlertCircle, Check, Copy, Eye, EyeOff, X} from 'lucide-react'
import React, {useMemo, useState} from 'react'

/**
 * Input component variants using class-variance-authority
 * Provides comprehensive input styling with Web3 address validation and formatting
 */
const inputVariants = cva(
  // Base classes applied to all inputs
  [
    'flex',
    'w-full',
    'rounded-lg',
    'border',
    'bg-white/50',
    'backdrop-blur-sm',
    'px-3',
    'py-2',
    'text-sm',
    'font-medium',
    'placeholder:text-gray-400',
    'dark:placeholder:text-gray-500',
    'transition-all',
    'duration-150',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-offset-white',
    'dark:focus:ring-offset-gray-900',
    'disabled:cursor-not-allowed',
    'disabled:opacity-50',
    'dark:bg-gray-900/50',
  ],
  {
    variants: {
      variant: {
        // Default glass morphism input
        default: [
          'border-gray-200',
          'text-gray-900',
          'focus:border-violet-500',
          'focus:ring-violet-500',
          'dark:border-gray-600',
          'dark:text-gray-100',
          'dark:focus:border-violet-400',
          'dark:focus:ring-violet-400',
        ],
        // Solid input without glass effect
        solid: [
          'bg-white',
          'border-gray-300',
          'text-gray-900',
          'focus:border-violet-500',
          'focus:ring-violet-500',
          'dark:bg-gray-800',
          'dark:border-gray-600',
          'dark:text-gray-100',
          'dark:focus:border-violet-400',
          'dark:focus:ring-violet-400',
        ],
        // Web3 variant with violet accent
        web3: [
          'border-violet-200',
          'text-gray-900',
          'focus:border-violet-500',
          'focus:ring-violet-500',
          'bg-violet-50/50',
          'dark:border-violet-500/30',
          'dark:text-gray-100',
          'dark:bg-violet-900/20',
          'dark:focus:border-violet-400',
          'dark:focus:ring-violet-400',
        ],
        // Ghost variant with minimal styling
        ghost: [
          'border-transparent',
          'bg-transparent',
          'text-gray-900',
          'focus:border-gray-300',
          'focus:ring-gray-300',
          'hover:bg-gray-50/50',
          'dark:text-gray-100',
          'dark:focus:border-gray-600',
          'dark:focus:ring-gray-600',
          'dark:hover:bg-gray-800/50',
        ],
      },
      size: {
        sm: ['h-9', 'px-2', 'py-1', 'text-xs'],
        default: ['h-10', 'px-3', 'py-2', 'text-sm'],
        lg: ['h-11', 'px-4', 'py-3', 'text-base'],
        xl: ['h-12', 'px-5', 'py-3', 'text-lg'],
      },
      state: {
        default: '',
        error: [
          'border-red-500',
          'text-red-900',
          'focus:border-red-500',
          'focus:ring-red-500',
          'bg-red-50/50',
          'dark:border-red-400',
          'dark:text-red-100',
          'dark:bg-red-900/20',
          'dark:focus:border-red-400',
          'dark:focus:ring-red-400',
        ],
        success: [
          'border-green-500',
          'text-green-900',
          'focus:border-green-500',
          'focus:ring-green-500',
          'bg-green-50/50',
          'dark:border-green-400',
          'dark:text-green-100',
          'dark:bg-green-900/20',
          'dark:focus:border-green-400',
          'dark:focus:ring-green-400',
        ],
        warning: [
          'border-yellow-500',
          'text-yellow-900',
          'focus:border-yellow-500',
          'focus:ring-yellow-500',
          'bg-yellow-50/50',
          'dark:border-yellow-400',
          'dark:text-yellow-100',
          'dark:bg-yellow-900/20',
          'dark:focus:border-yellow-400',
          'dark:focus:ring-yellow-400',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
    },
  },
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
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
   * Input label for accessibility
   */
  label?: string
  /**
   * Whether the input should validate Web3 addresses
   */
  validateAddress?: boolean
  /**
   * Whether to format addresses as user types (truncation)
   */
  formatAddress?: boolean
  /**
   * Whether to show copy button for addresses
   */
  showCopyButton?: boolean
  /**
   * Whether to show password visibility toggle
   */
  showPasswordToggle?: boolean
  /**
   * Whether to show clear button when input has value
   */
  showClearButton?: boolean
  /**
   * Custom validation function
   */
  validate?: (value: string) => string | null
  /**
   * Callback when copy button is clicked
   */
  onCopyAddress?: (value: string) => void
  /**
   * Left icon element
   */
  leftIcon?: React.ReactNode
  /**
   * Right icon element (appears before action buttons)
   */
  rightIcon?: React.ReactNode
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
 * Input component with Web3 address validation, formatting, and comprehensive interaction states
 */
const Input = ({
  ref,
  className,
  containerClassName,
  labelClassName,
  helperClassName,
  variant,
  size,
  state,
  label,
  helperText,
  error,
  success,
  warning,
  validateAddress = false,
  formatAddress: formatAddressProp = false,
  showCopyButton = false,
  showPasswordToggle = false,
  showClearButton = false,
  validate,
  onCopyAddress,
  leftIcon,
  rightIcon,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  id,
  ...props
}: InputProps & {ref?: React.RefObject<HTMLInputElement | null>}) => {
  const [internalValue, setInternalValue] = useState<string>(typeof value === 'string' ? value : '')
  const [showPassword, setShowPassword] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  // Use controlled value if provided, otherwise use internal state
  const currentValue = typeof value === 'string' ? value : internalValue
  const isControlled = value !== undefined

  // Determine current input type (handle password toggle)
  const currentType = type === 'password' && showPassword ? 'text' : type

  // Validation logic
  const validationResult = useMemo(() => {
    if (!currentValue || currentValue.length === 0) {
      return {isValid: true, message: null}
    }

    // Custom validation takes precedence
    if (validate) {
      const customError = validate(currentValue)
      return {
        isValid: customError === null,
        message: customError,
      }
    }

    // Web3 address validation
    if (validateAddress) {
      const isValid = isValidAddress(currentValue)
      return {
        isValid,
        message: isValid ? 'Valid Ethereum address' : 'Invalid Ethereum address format',
      }
    }

    return {isValid: true, message: null}
  }, [currentValue, validate, validateAddress])

  // Determine the current state based on validation and props
  const currentState = useMemo(() => {
    if (error != null && error.length > 0) return 'error'
    if (warning != null && warning.length > 0) return 'warning'
    if (success != null && success.length > 0) return 'success'
    if (validationResult.message != null && !validationResult.isValid) return 'error'
    if (validationResult.message != null && validationResult.isValid) return 'success'
    return state || 'default'
  }, [error, warning, success, validationResult, state])

  // Display value (formatted if needed)
  const displayValue = useMemo(() => {
    if (formatAddressProp && validateAddress && currentValue && isValidAddress(currentValue) && !isFocused) {
      return formatAddress(currentValue)
    }
    return currentValue
  }, [currentValue, formatAddressProp, validateAddress, isFocused])

  // Message to display below input
  const displayMessage = error ?? warning ?? success ?? validationResult.message ?? helperText

  // Generate unique ID for accessibility
  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 9)}`
  const helperId = `${inputId}-helper`

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    if (!isControlled) {
      setInternalValue(newValue)
    }

    if (onChange) {
      onChange(e)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    if (props.onFocus) {
      props.onFocus(e)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    if (onBlur) {
      onBlur(e)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentValue)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
      if (onCopyAddress != null) {
        onCopyAddress(currentValue)
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleClear = () => {
    const newValue = ''
    if (!isControlled) {
      setInternalValue(newValue)
    }
    if (onChange) {
      const syntheticEvent = {
        target: {value: newValue},
      } as React.ChangeEvent<HTMLInputElement>
      onChange(syntheticEvent)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Determine if action buttons should be shown
  const hasActionButtons =
    (showCopyButton && currentValue.length > 0) ||
    (showClearButton && currentValue.length > 0) ||
    (showPasswordToggle && type === 'password')

  return (
    <div className={cn('w-full', containerClassName)}>
      {label != null && label.length > 0 && (
        <label
          htmlFor={inputId}
          className={cn('mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300', labelClassName)}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Left icon */}
        {leftIcon != null && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{leftIcon}</div>
        )}

        {/* Input field */}
        <input
          ref={ref}
          id={inputId}
          type={currentType}
          value={isFocused ? currentValue : displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            inputVariants({variant, size, state: currentState}),
            {
              'pl-10': leftIcon != null,
              'pr-20': hasActionButtons && rightIcon != null,
              'pr-14': hasActionButtons && rightIcon == null,
              'pr-10': !hasActionButtons && rightIcon != null,
            },
            className,
          )}
          aria-describedby={displayMessage != null && displayMessage.length > 0 ? helperId : undefined}
          aria-invalid={currentState === 'error'}
          {...props}
        />

        {/* Right side content: rightIcon + action buttons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Right icon */}
          {rightIcon != null && <div className="text-gray-400 dark:text-gray-500">{rightIcon}</div>}

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Copy button */}
            {showCopyButton && currentValue.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  handleCopy().catch(error => {
                    console.error('Copy failed:', error)
                  })
                }}
                className={cn(
                  'inline-flex h-5 w-5 items-center justify-center rounded transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1',
                  copySuccess ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500',
                )}
                title={copySuccess ? 'Copied!' : 'Copy to clipboard'}
              >
                {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            )}

            {/* Clear button */}
            {showClearButton && currentValue.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className={cn(
                  'inline-flex h-5 w-5 items-center justify-center rounded transition-colors',
                  'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1',
                )}
                title="Clear input"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Password toggle */}
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={cn(
                  'inline-flex h-5 w-5 items-center justify-center rounded transition-colors',
                  'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1',
                )}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>

        {/* State indicator icon */}
        {currentState === 'error' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}
        {currentState === 'success' && validationResult.isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Helper text / validation message */}
      {displayMessage != null && displayMessage.length > 0 && (
        <p
          id={helperId}
          className={cn(
            'mt-2 text-xs',
            {
              'text-red-600 dark:text-red-400': currentState === 'error',
              'text-green-600 dark:text-green-400': currentState === 'success',
              'text-yellow-600 dark:text-yellow-400': currentState === 'warning',
              'text-gray-500 dark:text-gray-400': currentState === 'default',
            },
            helperClassName,
          )}
        >
          {displayMessage}
        </p>
      )}
    </div>
  )
}

Input.displayName = 'Input'

export {Input, inputVariants}
