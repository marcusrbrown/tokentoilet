import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {X} from 'lucide-react'
import React, {useEffect, useRef} from 'react'
import {createPortal} from 'react-dom'

/**
 * Modal backdrop variants using class-variance-authority
 * Provides consistent backdrop styli        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElementth Web3Modal theming integration
 */
const modalBackdropVariants = cva(
  [
    'fixed',
    'inset-0',
    'z-50',
    'backdrop-blur-sm',
    'transition-all',
    'duration-300',
    'ease-in-out',
    'flex',
    'items-center',
    'justify-center',
    'p-4',
  ],
  {
    variants: {
      variant: {
        // Default backdrop with subtle blur
        default: ['bg-black/50'],
        // Web3 themed backdrop with violet tint
        web3: ['bg-black/60', 'backdrop-sepia-0'],
        // Elevated backdrop for important modals
        elevated: ['bg-black/70', 'backdrop-blur-md'],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

/**
 * Modal content variants using class-variance-authority
 * Provides glass morphism effects consistent with Web3Modal theming
 */
const modalContentVariants = cva(
  [
    'relative',
    'w-full',
    'max-h-[90vh]',
    'overflow-y-auto',
    'rounded-2xl',
    'border',
    'shadow-2xl',
    'transition-all',
    'duration-300',
    'ease-in-out',
    'transform',
  ],
  {
    variants: {
      variant: {
        // Default glass morphism modal
        default: [
          'bg-white/90',
          'backdrop-blur-lg',
          'border-white/20',
          'dark:bg-gray-900/90',
          'dark:border-gray-600/20',
        ],
        // Solid modal without glass effect
        solid: ['bg-white', 'border-gray-200', 'dark:bg-gray-900', 'dark:border-gray-700'],
        // Web3 themed modal with violet accents
        web3: [
          'bg-white/85',
          'backdrop-blur-lg',
          'border-violet-200/50',
          'shadow-violet-500/10',
          'dark:bg-gray-900/85',
          'dark:border-violet-500/30',
          'dark:shadow-violet-500/20',
        ],
        // Elevated modal with stronger glass effect
        elevated: [
          'bg-white/95',
          'backdrop-blur-xl',
          'border-white/30',
          'dark:bg-gray-800/95',
          'dark:border-gray-500/30',
        ],
      },
      size: {
        sm: ['max-w-sm'],
        md: ['max-w-md'],
        lg: ['max-w-lg'],
        xl: ['max-w-xl'],
        '2xl': ['max-w-2xl'],
        '3xl': ['max-w-3xl'],
        '4xl': ['max-w-4xl'],
        '5xl': ['max-w-5xl'],
        '6xl': ['max-w-6xl'],
        full: ['max-w-none', 'mx-4'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

/**
 * Close button variants for consistent styling
 */
const closeButtonVariants = cva(
  [
    'absolute',
    'right-4',
    'top-4',
    'rounded-lg',
    'p-1.5',
    'transition-all',
    'duration-150',
    'ease-in-out',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-violet-500/50',
    'focus:ring-offset-2',
    'focus:ring-offset-white',
    'dark:focus:ring-offset-gray-900',
  ],
  {
    variants: {
      variant: {
        default: [
          'text-gray-400',
          'hover:text-gray-600',
          'hover:bg-gray-100',
          'dark:text-gray-500',
          'dark:hover:text-gray-300',
          'dark:hover:bg-gray-800',
        ],
        web3: [
          'text-violet-400',
          'hover:text-violet-600',
          'hover:bg-violet-50',
          'dark:text-violet-400',
          'dark:hover:text-violet-300',
          'dark:hover:bg-violet-900/20',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof modalContentVariants> {
  /**
   * Whether the modal is open
   */
  open: boolean
  /**
   * Callback fired when the modal should close
   */
  onClose: () => void
  /**
   * Modal title for accessibility
   */
  title?: string
  /**
   * Modal description for accessibility
   */
  description?: string
  /**
   * Whether clicking the backdrop should close the modal
   */
  closeOnBackdropClick?: boolean
  /**
   * Whether pressing Escape should close the modal
   */
  closeOnEscape?: boolean
  /**
   * Whether to show the close button
   */
  showCloseButton?: boolean
  /**
   * Custom close button label for accessibility
   */
  closeButtonLabel?: string
  /**
   * Backdrop variant
   */
  backdropVariant?: VariantProps<typeof modalBackdropVariants>['variant']
  /**
   * Container element to portal into (defaults to document.body)
   */
  container?: Element | null
}

/**
 * Modal component with backdrop blur and Web3Modal theming integration
 *
 * Provides a fully accessible modal dialog with glass morphism effects,
 * keyboard navigation, focus management, and Web3-optimized styling.
 * Built following WCAG 2.1 AA guidelines with proper ARIA attributes.
 *
 * @example
 * ```tsx
 * // Basic modal
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Wallet Settings">
 *   <ModalHeader>
 *     <ModalTitle>Connect Wallet</ModalTitle>
 *     <ModalDescription>Choose your preferred wallet provider</ModalDescription>
 *   </ModalHeader>
 *   <ModalContent>
 *     Modal content here
 *   </ModalContent>
 * </Modal>
 *
 * // Web3 themed modal
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   variant="web3"
 *   backdropVariant="web3"
 *   size="lg"
 * >
 *   <ModalContent>
 *     Web3 modal content
 *   </ModalContent>
 * </Modal>
 * ```
 */
const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      description,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      closeButtonLabel = 'Close',
      backdropVariant = 'default',
      variant,
      size,
      className,
      children,
      container,
      ...props
    },
    _ref,
  ) => {
    const modalRef = useRef<HTMLDivElement>(null)
    const previousActiveElement = useRef<Element | null>(null)

    // Focus management
    useEffect(() => {
      if (open) {
        // Store the previously focused element
        previousActiveElement.current = document.activeElement

        // Focus the modal
        if (modalRef.current) {
          modalRef.current.focus()
        }
      } else if (previousActiveElement.current && 'focus' in previousActiveElement.current) {
        // Restore focus to the previously focused element
        ;(previousActiveElement.current as HTMLElement).focus()
      }
    }, [open]) // Escape key handler
    useEffect(() => {
      if (!open || !closeOnEscape) return

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [open, closeOnEscape, onClose])

    // Body scroll lock
    useEffect(() => {
      if (open) {
        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = originalStyle
        }
      }
    }, [open])

    // Backdrop click handler
    const handleBackdropClick = (event: React.MouseEvent) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose()
      }
    }

    // Focus trap handler
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Tab') {
        const modal = modalRef.current
        if (!modal) return

        const focusableElements = Array.from(
          modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements.at(-1) as HTMLElement

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    if (!open) return null

    const modalContent = (
      <div
        className={cn(modalBackdropVariants({variant: backdropVariant}))}
        onClick={handleBackdropClick}
        role="presentation"
      >
        <div
          ref={modalRef}
          className={cn(modalContentVariants({variant, size}), className)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title != null && title.trim() !== '' ? 'modal-title' : undefined}
          aria-describedby={description != null && description.trim() !== '' ? 'modal-description' : undefined}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              type="button"
              className={cn(
                closeButtonVariants({
                  variant: variant === 'web3' ? 'web3' : 'default',
                }),
              )}
              onClick={onClose}
              aria-label={closeButtonLabel}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Hidden title and description for screen readers */}
          {title != null && title.trim() !== '' && (
            <h2 id="modal-title" className="sr-only">
              {title}
            </h2>
          )}
          {description != null && description.trim() !== '' && (
            <p id="modal-description" className="sr-only">
              {description}
            </p>
          )}

          {children}
        </div>
      </div>
    )

    // Portal the modal to the specified container or document.body
    return createPortal(modalContent, container || document.body)
  },
)
Modal.displayName = 'Modal'

/**
 * ModalHeader component for modal titles and descriptions
 * Provides consistent spacing and typography for modal headers
 */
const ModalHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({className, ...props}, ref) => {
    return <div ref={ref} className={cn('flex flex-col space-y-2 p-6 pb-0', className)} {...props} />
  },
)
ModalHeader.displayName = 'ModalHeader'

/**
 * ModalTitle component for modal titles
 * Uses semantic heading with appropriate typography
 */
const ModalTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({className, ...props}, ref) => {
    return (
      <h2
        ref={ref}
        className={cn('text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-50', className)}
        {...props}
      />
    )
  },
)
ModalTitle.displayName = 'ModalTitle'

/**
 * ModalDescription component for modal descriptions
 * Provides muted text styling for modal subtitles and descriptions
 */
const ModalDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({className, ...props}, ref) => {
    return <p ref={ref} className={cn('text-sm text-gray-600 dark:text-gray-400', className)} {...props} />
  },
)
ModalDescription.displayName = 'ModalDescription'

/**
 * ModalContent component for main modal content
 * Provides consistent padding for modal body content
 */
const ModalContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({className, ...props}, ref) => {
    return <div ref={ref} className={cn('p-6', className)} {...props} />
  },
)
ModalContent.displayName = 'ModalContent'

/**
 * ModalFooter component for modal actions and footer content
 * Provides consistent spacing for modal footer elements
 */
const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({className, ...props}, ref) => {
    return <div ref={ref} className={cn('flex items-center justify-end space-x-2 p-6 pt-0', className)} {...props} />
  },
)
ModalFooter.displayName = 'ModalFooter'

export {Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle}
