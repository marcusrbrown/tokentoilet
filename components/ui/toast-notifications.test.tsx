import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import toastNotifications from './toast-notifications'

// Use vi.hoisted so mock variables are available before vi.mock() is called
const mockToastCustom = vi.hoisted(() => vi.fn().mockReturnValue('toast-id'))
const mockToastDismiss = vi.hoisted(() => vi.fn())

vi.mock('react-hot-toast', () => ({
  default: {
    custom: mockToastCustom,
    dismiss: mockToastDismiss,
  },
  toast: {
    custom: mockToastCustom,
    dismiss: mockToastDismiss,
  },
}))

describe('toastNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToastCustom.mockReturnValue('toast-id')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('success()', () => {
    it('calls toast.custom with success variant', () => {
      toastNotifications.success('Operation completed')
      expect(mockToastCustom).toHaveBeenCalledTimes(1)
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {duration: 4000})
    })

    it('accepts optional title', () => {
      toastNotifications.success('Operation completed', {title: 'Success'})
      expect(mockToastCustom).toHaveBeenCalledTimes(1)
    })

    it('accepts optional action', () => {
      const action = {label: 'View', onClick: vi.fn()}
      toastNotifications.success('Done', {action})
      expect(mockToastCustom).toHaveBeenCalledTimes(1)
    })

    it('returns a toast id', () => {
      const id = toastNotifications.success('Done')
      expect(id).toBe('toast-id')
    })
  })

  describe('error()', () => {
    it('calls toast.custom with error variant and longer duration', () => {
      toastNotifications.error('Something went wrong')
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {duration: 6000})
    })

    it('accepts optional title', () => {
      toastNotifications.error('Failed', {title: 'Error'})
      expect(mockToastCustom).toHaveBeenCalledTimes(1)
    })
  })

  describe('warning()', () => {
    it('calls toast.custom with warning variant', () => {
      toastNotifications.warning('Please check your network')
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {duration: 5000})
    })
  })

  describe('info()', () => {
    it('calls toast.custom with info variant', () => {
      toastNotifications.info('Transaction submitted')
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {duration: 4000})
    })
  })

  describe('web3()', () => {
    it('calls toast.custom with web3 variant', () => {
      toastNotifications.web3('Wallet connected')
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {duration: 4000})
    })
  })

  describe('transaction.pending()', () => {
    it('calls toast.custom with infinite duration', () => {
      toastNotifications.transaction.pending()
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {
        duration: Infinity,
        id: 'tx-undefined',
      })
    })

    it('uses txHash as toast id when provided', () => {
      toastNotifications.transaction.pending('0xabc123')
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {
        duration: Infinity,
        id: 'tx-0xabc123',
      })
    })
  })

  describe('transaction.confirmed()', () => {
    it('calls toast.custom with 6000ms duration', () => {
      toastNotifications.transaction.confirmed('0xabc123')
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {
        duration: 6000,
        id: 'tx-0xabc123',
      })
    })

    it('works without txHash', () => {
      toastNotifications.transaction.confirmed()
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {
        duration: 6000,
        id: 'tx-undefined',
      })
    })
  })

  describe('transaction.failed()', () => {
    it('calls toast.custom with 8000ms duration', () => {
      toastNotifications.transaction.failed('Insufficient funds', '0xabc123')
      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), {
        duration: 8000,
        id: 'tx-0xabc123',
      })
    })

    it('uses default error message when no error provided', () => {
      toastNotifications.transaction.failed()
      expect(mockToastCustom).toHaveBeenCalledTimes(1)
    })
  })

  describe('wallet.connected()', () => {
    it('calls success toast with wallet name', () => {
      toastNotifications.wallet.connected('MetaMask')
      expect(mockToastCustom).toHaveBeenCalledTimes(1)
    })
  })

  describe('wallet.disconnected()', () => {
    it('calls info toast', () => {
      toastNotifications.wallet.disconnected()
      expect(mockToastCustom).toHaveBeenCalledTimes(1)
    })
  })

  describe('wallet.connectionError()', () => {
    it('calls error toast with error message', () => {
      toastNotifications.wallet.connectionError('User rejected request')
      expect(mockToastCustom).toHaveBeenCalledTimes(1)
    })
  })

  describe('wallet.networkSwitch()', () => {
    it('calls warning toast with network name', () => {
      toastNotifications.wallet.networkSwitch('Ethereum Mainnet')
      expect(mockToastCustom).toHaveBeenCalledTimes(1)
    })
  })

  describe('dismissAll()', () => {
    it('calls toast.dismiss with no arguments', () => {
      toastNotifications.dismissAll()
      expect(mockToastDismiss).toHaveBeenCalledTimes(1)
      expect(mockToastDismiss).toHaveBeenCalledWith()
    })
  })

  describe('dismiss()', () => {
    it('calls toast.dismiss with the given toast id', () => {
      toastNotifications.dismiss('my-toast-id')
      expect(mockToastDismiss).toHaveBeenCalledWith('my-toast-id')
    })
  })
})
