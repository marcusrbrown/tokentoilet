'use client'

import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {AlertCircle, CheckCircle, Info, X, XCircle} from 'lucide-react'
import React from 'react'
import toast, {Toaster, type Toast} from 'react-hot-toast'

/**
 * Toast component variants using class-variance-authority
 * Provides consistent styling for transaction notifications and error handling
 */
const toastVariants = cva(
  // Base classes applied to all toasts
  [
    'flex',
    'items-start',
    'gap-3',
    'p-4',
    'rounded-lg',
    'shadow-lg',
    'backdrop-blur-md',
    'border',
    'transition-all',
    'duration-300',
    'max-w-md',
    'pointer-events-auto',
    'relative',
    'group',
  ],
  {
    variants: {
      variant: {
        // Success toast for confirmed transactions
        success: [
          'bg-green-50/90',
          'border-green-200/50',
          'text-green-800',
          'shadow-[0_4px_6px_-1px_rgb(34_197_94_/_0.1)]',
          'dark:bg-green-900/20',
          'dark:border-green-800/30',
          'dark:text-green-100',
          'dark:shadow-[0_4px_6px_-1px_rgb(34_197_94_/_0.2)]',
        ],
        // Error toast for failed transactions
        error: [
          'bg-red-50/90',
          'border-red-200/50',
          'text-red-800',
          'shadow-[0_4px_6px_-1px_rgb(239_68_68_/_0.1)]',
          'dark:bg-red-900/20',
          'dark:border-red-800/30',
          'dark:text-red-100',
          'dark:shadow-[0_4px_6px_-1px_rgb(239_68_68_/_0.2)]',
        ],
        // Warning toast for pending transactions
        warning: [
          'bg-yellow-50/90',
          'border-yellow-200/50',
          'text-yellow-800',
          'shadow-[0_4px_6px_-1px_rgb(245_158_11_/_0.1)]',
          'dark:bg-yellow-900/20',
          'dark:border-yellow-800/30',
          'dark:text-yellow-100',
          'dark:shadow-[0_4px_6px_-1px_rgb(245_158_11_/_0.2)]',
        ],
        // Info toast for general notifications
        info: [
          'bg-blue-50/90',
          'border-blue-200/50',
          'text-blue-800',
          'shadow-[0_4px_6px_-1px_rgb(59_130_246_/_0.1)]',
          'dark:bg-blue-900/20',
          'dark:border-blue-800/30',
          'dark:text-blue-100',
          'dark:shadow-[0_4px_6px_-1px_rgb(59_130_246_/_0.2)]',
        ],
        // Web3 specific variant with violet branding
        web3: [
          'bg-violet-50/90',
          'border-violet-200/50',
          'text-violet-800',
          'shadow-[0_4px_6px_-1px_rgb(139_92_246_/_0.1)]',
          'dark:bg-violet-900/20',
          'dark:border-violet-800/30',
          'dark:text-violet-100',
          'dark:shadow-[0_4px_6px_-1px_rgb(139_92_246_/_0.2)]',
        ],
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

/**
 * Icon mapping for different toast variants
 */
const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  web3: CheckCircle,
} as const

/**
 * Custom toast component that integrates with react-hot-toast
 */
interface CustomToastProps extends VariantProps<typeof toastVariants> {
  /** The toast object from react-hot-toast */
  toast: Toast
  /** Optional title for the toast */
  title?: string
  /** Toast message content */
  message: string
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Whether to show the close button */
  dismissible?: boolean
}

export function CustomToast({
  toast: toastObj,
  variant = 'info',
  title,
  message,
  action,
  dismissible = true,
}: CustomToastProps) {
  const IconComponent = toastIcons[variant || 'info']

  return (
    <div className={cn(toastVariants({variant}))}>
      {/* Icon */}
      <div className="flex-shrink-0">
        <IconComponent className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title != null && title !== '' ? <div className="text-sm font-semibold mb-1">{title}</div> : null}
        <div className="text-sm">{message}</div>
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              'mt-2 text-xs font-medium underline underline-offset-2',
              'hover:no-underline transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm',
              variant === 'success' && 'focus:ring-green-500',
              variant === 'error' && 'focus:ring-red-500',
              variant === 'warning' && 'focus:ring-yellow-500',
              variant === 'info' && 'focus:ring-blue-500',
              variant === 'web3' && 'focus:ring-violet-500',
            )}
          >
            {action.label}
          </button>
        ) : null}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          type="button"
          onClick={() => toast.dismiss(toastObj.id)}
          className={cn(
            'flex-shrink-0 p-1 rounded-full transition-all duration-150',
            'hover:bg-black/5 dark:hover:bg-white/5',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
            'opacity-70 hover:opacity-100',
          )}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/**
 * Toaster component with custom styling for the application
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        top: 20,
        right: 20,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
        },
        success: {
          duration: 4000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          duration: 6000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
        loading: {
          duration: Infinity,
          iconTheme: {
            primary: '#8b5cf6',
            secondary: '#ffffff',
          },
        },
      }}
    />
  )
}

/**
 * Enhanced toast notification functions with Web3-specific presets
 */
export const toastNotifications = {
  /**
   * Show a success toast notification
   */
  success: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      t => (
        <CustomToast toast={t} variant="success" title={options?.title} message={message} action={options?.action} />
      ),
      {duration: 4000},
    )
  },

  /**
   * Show an error toast notification
   */
  error: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      t => <CustomToast toast={t} variant="error" title={options?.title} message={message} action={options?.action} />,
      {duration: 6000},
    )
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      t => (
        <CustomToast toast={t} variant="warning" title={options?.title} message={message} action={options?.action} />
      ),
      {duration: 5000},
    )
  },

  /**
   * Show an info toast notification
   */
  info: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      t => <CustomToast toast={t} variant="info" title={options?.title} message={message} action={options?.action} />,
      {duration: 4000},
    )
  },

  /**
   * Show a Web3-branded toast notification
   */
  web3: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      t => <CustomToast toast={t} variant="web3" title={options?.title} message={message} action={options?.action} />,
      {duration: 4000},
    )
  },

  /**
   * Web3-specific transaction notifications
   */
  transaction: {
    /**
     * Show transaction pending notification
     */
    pending: (txHash?: string) => {
      return toast.custom(
        t => (
          <CustomToast
            toast={t}
            variant="warning"
            title="Transaction Pending"
            message="Your transaction is being processed..."
            action={
              txHash != null && txHash !== ''
                ? {
                    label: 'View on Explorer',
                    onClick: () => {
                      // This would typically open the transaction in a block explorer
                      // Implementation would depend on the chain and explorer being used
                      window.open(`#/tx/${txHash}`, '_blank')
                    },
                  }
                : undefined
            }
            dismissible={false}
          />
        ),
        {duration: Infinity, id: `tx-${txHash}`},
      )
    },

    /**
     * Show transaction confirmed notification
     */
    confirmed: (txHash?: string) => {
      return toast.custom(
        t => (
          <CustomToast
            toast={t}
            variant="success"
            title="Transaction Confirmed"
            message="Your transaction has been successfully confirmed!"
            action={
              txHash != null && txHash !== ''
                ? {
                    label: 'View on Explorer',
                    onClick: () => {
                      // This would typically open the transaction in a block explorer
                      // Implementation would depend on the chain and explorer being used
                      window.open(`#/tx/${txHash}`, '_blank')
                    },
                  }
                : undefined
            }
          />
        ),
        {duration: 6000, id: `tx-${txHash}`},
      )
    },

    /**
     * Show transaction failed notification
     */
    failed: (error?: string, txHash?: string) => {
      return toast.custom(
        t => (
          <CustomToast
            toast={t}
            variant="error"
            title="Transaction Failed"
            message={error != null && error !== '' ? error : 'Your transaction could not be processed.'}
            action={
              txHash != null && txHash !== ''
                ? {
                    label: 'View on Explorer',
                    onClick: () => {
                      // This would typically open the transaction in a block explorer
                      // Implementation would depend on the chain and explorer being used
                      window.open(`#/tx/${txHash}`, '_blank')
                    },
                  }
                : undefined
            }
          />
        ),
        {duration: 8000, id: `tx-${txHash}`},
      )
    },
  },

  /**
   * Web3 wallet connection notifications
   */
  wallet: {
    /**
     * Show wallet connection success
     */
    connected: (walletName: string) => {
      return toastNotifications.success(`Connected to ${walletName}`, {
        title: 'Wallet Connected',
      })
    },

    /**
     * Show wallet disconnection
     */
    disconnected: () => {
      return toastNotifications.info('Wallet disconnected', {
        title: 'Wallet Disconnected',
      })
    },

    /**
     * Show wallet connection error
     */
    connectionError: (error: string) => {
      return toastNotifications.error(error, {
        title: 'Connection Failed',
      })
    },

    /**
     * Show network switch request
     */
    networkSwitch: (networkName: string) => {
      return toastNotifications.warning(`Please switch to ${networkName}`, {
        title: 'Network Switch Required',
      })
    },
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss()
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId: string) => {
    toast.dismiss(toastId)
  },
} as const

// Re-export core toast functions for convenience
export {toast}
export default toastNotifications
