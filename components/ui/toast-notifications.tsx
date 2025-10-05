import toast, {type Toast} from 'react-hot-toast'

import {CustomToast, type CustomToastProps} from './toast'

/**
 * Enhanced toast notification functions with Web3-specific presets
 *
 * Provides a comprehensive API for displaying toast notifications with
 * consistent styling and behavior across the application. Includes
 * specialized functions for Web3 transactions and wallet interactions.
 */
export const toastNotifications = {
  /**
   * Show a success toast notification
   */
  success: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      (t: Toast) => (
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
      (t: Toast) => (
        <CustomToast toast={t} variant="error" title={options?.title} message={message} action={options?.action} />
      ),
      {duration: 6000},
    )
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      (t: Toast) => (
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
      (t: Toast) => (
        <CustomToast toast={t} variant="info" title={options?.title} message={message} action={options?.action} />
      ),
      {duration: 4000},
    )
  },

  /**
   * Show a Web3-branded toast notification
   */
  web3: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      (t: Toast) => (
        <CustomToast toast={t} variant="web3" title={options?.title} message={message} action={options?.action} />
      ),
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
        (t: Toast) => (
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
        (t: Toast) => (
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
        (t: Toast) => (
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
