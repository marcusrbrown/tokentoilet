import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {AppToaster, CustomToast} from './toast'
import {toastNotifications} from './toast-notifications'

// Mock react-hot-toast
const mockToastCustom = vi.hoisted(() => vi.fn())
const mockToastDismiss = vi.hoisted(() => vi.fn())

vi.mock('react-hot-toast', () => ({
  default: {
    custom: mockToastCustom,
    dismiss: mockToastDismiss,
  },
  Toaster: ({children}: {children?: React.ReactNode}) => <div data-testid="toaster">{children}</div>,
}))

const mockToast = {
  id: 'test-toast-id',
  visible: true,
  type: 'custom' as const,
  message: '',
  duration: 4000,
  pauseDuration: 0,
  position: 'top-center' as const,
  style: {},
  ariaProps: {
    role: 'status' as const,
    'aria-live': 'polite' as const,
  },
  createdAt: Date.now(),
  height: 0,
  dismissed: false,
}

describe('CustomToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders basic toast with message', () => {
    render(<CustomToast toast={mockToast} message="Test message" />)
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders toast with title and message', () => {
    render(<CustomToast toast={mockToast} title="Test Title" message="Test message" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('applies variant classes correctly', () => {
    const {rerender} = render(<CustomToast toast={mockToast} variant="success" message="Success message" />)
    let toastElement = screen.getByText('Success message').closest(String.raw`.bg-green-50\/90`)
    expect(toastElement).toBeInTheDocument()

    rerender(<CustomToast toast={mockToast} variant="error" message="Error message" />)
    toastElement = screen.getByText('Error message').closest(String.raw`.bg-red-50\/90`)
    expect(toastElement).toBeInTheDocument()

    rerender(<CustomToast toast={mockToast} variant="warning" message="Warning message" />)
    toastElement = screen.getByText('Warning message').closest(String.raw`.bg-yellow-50\/90`)
    expect(toastElement).toBeInTheDocument()

    rerender(<CustomToast toast={mockToast} variant="info" message="Info message" />)
    toastElement = screen.getByText('Info message').closest(String.raw`.bg-blue-50\/90`)
    expect(toastElement).toBeInTheDocument()

    rerender(<CustomToast toast={mockToast} variant="web3" message="Web3 message" />)
    toastElement = screen.getByText('Web3 message').closest(String.raw`.bg-violet-50\/90`)
    expect(toastElement).toBeInTheDocument()
  })

  it('renders correct icons for variants', () => {
    const {rerender} = render(<CustomToast toast={mockToast} variant="success" message="Success" />)
    // Icons should be present (specific test-id may vary based on lucide-react version)
    expect(document.querySelector('svg')).toBeInTheDocument()

    rerender(<CustomToast toast={mockToast} variant="error" message="Error" />)
    expect(document.querySelector('svg')).toBeInTheDocument()

    rerender(<CustomToast toast={mockToast} variant="warning" message="Warning" />)
    expect(document.querySelector('svg')).toBeInTheDocument()

    rerender(<CustomToast toast={mockToast} variant="info" message="Info" />)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('handles action button clicks', async () => {
    const user = userEvent.setup()
    const mockAction = vi.fn()

    render(
      <CustomToast toast={mockToast} message="Test message" action={{label: 'Test Action', onClick: mockAction}} />,
    )

    const actionButton = screen.getByText('Test Action')
    expect(actionButton).toBeInTheDocument()

    await user.click(actionButton)
    expect(mockAction).toHaveBeenCalledOnce()
  })

  it('handles dismiss button clicks', async () => {
    const user = userEvent.setup()

    render(<CustomToast toast={mockToast} message="Test message" dismissible={true} />)

    const dismissButton = screen.getByLabelText('Dismiss notification')
    expect(dismissButton).toBeInTheDocument()

    await user.click(dismissButton)
    expect(mockToastDismiss).toHaveBeenCalledWith(mockToast.id)
  })

  it('hides dismiss button when dismissible is false', () => {
    render(<CustomToast toast={mockToast} message="Test message" dismissible={false} />)

    expect(screen.queryByLabelText('Dismiss notification')).not.toBeInTheDocument()
  })

  it('does not render title when title is null or empty', () => {
    const {rerender} = render(<CustomToast toast={mockToast} message="Test message" />)
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()

    rerender(<CustomToast toast={mockToast} title="" message="Test message" />)
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()

    rerender(<CustomToast toast={mockToast} title="Actual Title" message="Test message" />)
    expect(screen.getByText('Actual Title')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<CustomToast toast={mockToast} message="Test message" />)

    const dismissButton = screen.getByLabelText('Dismiss notification')
    expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss notification')
  })
})

describe('AppToaster', () => {
  it('renders the Toaster component', () => {
    render(<AppToaster />)
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })
})

describe('toastNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls mockToastCustom with correct parameters for success notification', () => {
    toastNotifications.success('Success message', {title: 'Success'})

    expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({duration: 4000}))
  })

  it('calls mockToastCustom with correct parameters for error notification', () => {
    toastNotifications.error('Error message', {title: 'Error'})

    expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({duration: 6000}))
  })

  it('calls mockToastCustom with correct parameters for warning notification', () => {
    toastNotifications.warning('Warning message')

    expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({duration: 5000}))
  })

  it('calls mockToastCustom with correct parameters for info notification', () => {
    toastNotifications.info('Info message')

    expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({duration: 4000}))
  })

  it('calls mockToastCustom with correct parameters for web3 notification', () => {
    toastNotifications.web3('Web3 message')

    expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({duration: 4000}))
  })

  describe('transaction notifications', () => {
    it('creates pending transaction notification with infinite duration', () => {
      toastNotifications.transaction.pending('0x123')

      expect(mockToastCustom).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({duration: Infinity, id: 'tx-0x123'}),
      )
    })

    it('creates confirmed transaction notification', () => {
      toastNotifications.transaction.confirmed('0x123')

      expect(mockToastCustom).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({duration: 6000, id: 'tx-0x123'}),
      )
    })

    it('creates failed transaction notification', () => {
      toastNotifications.transaction.failed('Transaction reverted', '0x123')

      expect(mockToastCustom).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({duration: 8000, id: 'tx-0x123'}),
      )
    })

    it('handles failed transaction without error message', () => {
      toastNotifications.transaction.failed(undefined, '0x123')

      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), expect.any(Object))
    })

    it('handles transaction notifications without txHash', () => {
      toastNotifications.transaction.pending()
      toastNotifications.transaction.confirmed()
      toastNotifications.transaction.failed()

      expect(mockToastCustom).toHaveBeenCalledTimes(3)
    })
  })

  describe('wallet notifications', () => {
    it('creates wallet connected notification', () => {
      toastNotifications.wallet.connected('MetaMask')

      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({duration: 4000}))
    })

    it('creates wallet disconnected notification', () => {
      toastNotifications.wallet.disconnected()

      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({duration: 4000}))
    })

    it('creates wallet connection error notification', () => {
      toastNotifications.wallet.connectionError('User rejected connection')

      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({duration: 6000}))
    })

    it('creates network switch notification', () => {
      toastNotifications.wallet.networkSwitch('Ethereum Mainnet')

      expect(mockToastCustom).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({duration: 5000}))
    })
  })

  describe('dismiss methods', () => {
    it('calls mockToastDismiss for dismissAll', () => {
      toastNotifications.dismissAll()
      expect(mockToastDismiss).toHaveBeenCalledWith()
    })

    it('calls mockToastDismiss with ID for specific dismiss', () => {
      toastNotifications.dismiss('test-id')
      expect(mockToastDismiss).toHaveBeenCalledWith('test-id')
    })
  })
})

describe('Toast accessibility', () => {
  it('has proper ARIA attributes for screen readers', () => {
    render(<CustomToast toast={mockToast} message="Test message" />)

    // The toast container should be focusable for screen readers
    const toastContainer = screen.getByText('Test message').closest('.pointer-events-auto')
    expect(toastContainer).toBeInTheDocument()
  })

  it('supports keyboard navigation for action buttons', async () => {
    const user = userEvent.setup()
    const mockAction = vi.fn()

    render(
      <CustomToast toast={mockToast} message="Test message" action={{label: 'Test Action', onClick: mockAction}} />,
    )

    const actionButton = screen.getByText('Test Action')

    // Test keyboard focus
    await user.tab()
    expect(actionButton).toHaveFocus()

    // Test keyboard activation
    await user.keyboard('{Enter}')
    expect(mockAction).toHaveBeenCalledOnce()
  })

  it('supports keyboard navigation for dismiss button', async () => {
    const user = userEvent.setup()

    render(<CustomToast toast={mockToast} message="Test message" dismissible={true} />)

    const dismissButton = screen.getByLabelText('Dismiss notification')

    // Tab to the dismiss button (assuming it's the first/only focusable element)
    await user.tab()
    expect(dismissButton).toHaveFocus()

    // Test keyboard activation
    await user.keyboard('{Enter}')
    expect(mockToastDismiss).toHaveBeenCalledWith(mockToast.id)
  })
})
