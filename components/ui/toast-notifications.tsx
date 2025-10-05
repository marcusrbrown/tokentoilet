import toast, {type Toast} from 'react-hot-toast'

import {CustomToast, type CustomToastProps} from './toast'

/**
 * Enhanced toast notification functions with Web3-specific presets
 *
 * Provides a comprehensive API for displaying toast notifications with
 * consistent styling and behavior across the application. Includes
 * specialized functions for Web3 transactions and wallet interactions.
 */

// NOTE: Uses hash-based routing as placeholder until block explorer integration is added
const createExplorerAction = (txHash: string | undefined): CustomToastProps['action'] | undefined => {
  if (txHash == null || txHash === '') {
    return undefined
  }

  return {
    label: 'View on Explorer',
    onClick: () => {
      window.open(`#/tx/${txHash}`, '_blank')
    },
  }
}

export const toastNotifications = {
  success: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      (t: Toast) => (
        <CustomToast toast={t} variant="success" title={options?.title} message={message} action={options?.action} />
      ),
      {duration: 4000},
    )
  },

  error: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      (t: Toast) => (
        <CustomToast toast={t} variant="error" title={options?.title} message={message} action={options?.action} />
      ),
      {duration: 6000},
    )
  },

  warning: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      (t: Toast) => (
        <CustomToast toast={t} variant="warning" title={options?.title} message={message} action={options?.action} />
      ),
      {duration: 5000},
    )
  },

  info: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      (t: Toast) => (
        <CustomToast toast={t} variant="info" title={options?.title} message={message} action={options?.action} />
      ),
      {duration: 4000},
    )
  },

  web3: (message: string, options?: {title?: string; action?: CustomToastProps['action']}) => {
    return toast.custom(
      (t: Toast) => (
        <CustomToast toast={t} variant="web3" title={options?.title} message={message} action={options?.action} />
      ),
      {duration: 4000},
    )
  },

  transaction: {
    pending: (txHash?: string) => {
      return toast.custom(
        (t: Toast) => (
          <CustomToast
            toast={t}
            variant="warning"
            title="Transaction Pending"
            message="Your transaction is being processed..."
            action={createExplorerAction(txHash)}
            dismissible={false}
          />
        ),
        {duration: Infinity, id: `tx-${txHash}`},
      )
    },

    confirmed: (txHash?: string) => {
      return toast.custom(
        (t: Toast) => (
          <CustomToast
            toast={t}
            variant="success"
            title="Transaction Confirmed"
            message="Your transaction has been successfully confirmed!"
            action={createExplorerAction(txHash)}
          />
        ),
        {duration: 6000, id: `tx-${txHash}`},
      )
    },

    failed: (error?: string, txHash?: string) => {
      return toast.custom(
        (t: Toast) => (
          <CustomToast
            toast={t}
            variant="error"
            title="Transaction Failed"
            message={error != null && error !== '' ? error : 'Your transaction could not be processed.'}
            action={createExplorerAction(txHash)}
          />
        ),
        {duration: 8000, id: `tx-${txHash}`},
      )
    },
  },

  wallet: {
    connected: (walletName: string) => {
      return toastNotifications.success(`Connected to ${walletName}`, {
        title: 'Wallet Connected',
      })
    },

    disconnected: () => {
      return toastNotifications.info('Wallet disconnected', {
        title: 'Wallet Disconnected',
      })
    },

    connectionError: (error: string) => {
      return toastNotifications.error(error, {
        title: 'Connection Failed',
      })
    },

    networkSwitch: (networkName: string) => {
      return toastNotifications.warning(`Please switch to ${networkName}`, {
        title: 'Network Switch Required',
      })
    },
  },

  dismissAll: () => {
    toast.dismiss()
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId)
  },
} as const

// Re-export core toast functions for convenience
export {toast}
export default toastNotifications
