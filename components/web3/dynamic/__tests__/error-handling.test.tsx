import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {DynamicImportErrorBoundary} from '../../dynamic-import-error-boundary'
import {
  FallbackUI,
  TokenDetailFallback,
  TokenListFallback,
  TransactionQueueFallback,
  WalletDashboardFallback,
} from '../../fallback-ui'

// Test component that throws errors
function ThrowError({message}: {message: string}): never {
  throw new Error(message)
}

// Component that always fails
function AlwaysFailsComponent(): never {
  throw new Error('Permanent failure')
}

describe('DynamicImportErrorBoundary', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {retry: false},
      },
    })
    vi.clearAllMocks()
    // Suppress console.error for expected errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Error Detection and Display', () => {
    it('catches errors from child components', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <DynamicImportErrorBoundary>
            <ThrowError message="Test error" />
          </DynamicImportErrorBoundary>
        </QueryClientProvider>,
      )

      expect(screen.getByText(/Failed to Load Component/i)).toBeInTheDocument()
      expect(screen.getByText(/Test error/i)).toBeInTheDocument()
    })

    it('displays custom fallback UI when provided', () => {
      const CustomFallback = <div>Custom Error Message</div>

      render(
        <QueryClientProvider client={queryClient}>
          <DynamicImportErrorBoundary fallback={CustomFallback}>
            <ThrowError message="Test error" />
          </DynamicImportErrorBoundary>
        </QueryClientProvider>,
      )

      expect(screen.getByText('Custom Error Message')).toBeInTheDocument()
      expect(screen.queryByText(/Failed to Load Component/i)).not.toBeInTheDocument()
    })

    it('renders children successfully when no error occurs', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <DynamicImportErrorBoundary>
            <div>Working Component</div>
          </DynamicImportErrorBoundary>
        </QueryClientProvider>,
      )

      expect(screen.getByText('Working Component')).toBeInTheDocument()
      expect(screen.queryByText(/Failed to Load Component/i)).not.toBeInTheDocument()
    })
  })

  describe('Retry Mechanism', () => {
    it('displays retry button when error occurs', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <DynamicImportErrorBoundary>
            <ThrowError message="Retry test error" />
          </DynamicImportErrorBoundary>
        </QueryClientProvider>,
      )

      const retryButton = screen.getByRole('button', {name: /Try Again/i})
      expect(retryButton).toBeInTheDocument()
      expect(retryButton).not.toBeDisabled()
    })

    it('calls onRetry callback when retry button is clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(
        <QueryClientProvider client={queryClient}>
          <DynamicImportErrorBoundary onRetry={onRetry}>
            <ThrowError message="Retry callback test" />
          </DynamicImportErrorBoundary>
        </QueryClientProvider>,
      )

      const retryButton = screen.getByRole('button', {name: /Try Again/i})
      await user.click(retryButton)

      // Wait for exponential backoff (1 second for first retry)
      await waitFor(
        () => {
          expect(onRetry).toHaveBeenCalledTimes(1)
        },
        {timeout: 2000},
      )
    })

    it('shows retry count and disables button after max retries', async () => {
      const user = userEvent.setup()

      render(
        <QueryClientProvider client={queryClient}>
          <DynamicImportErrorBoundary maxRetries={2}>
            <AlwaysFailsComponent />
          </DynamicImportErrorBoundary>
        </QueryClientProvider>,
      )

      // Initial state: no retry count shown
      expect(screen.queryByText(/Retry attempt/i)).not.toBeInTheDocument()

      // First retry
      const retryButton1 = screen.getByRole('button', {name: /Try Again/i})
      await user.click(retryButton1)

      // After clicking, button shows retrying state
      await waitFor(() => {
        expect(screen.getByText(/Retrying in 1s/i)).toBeInTheDocument()
      })

      // Wait for retry to complete and error state to reappear with count
      await waitFor(
        () => {
          const retryText = screen.getByText((content, element) => {
            return element?.textContent === 'Retry attempt 1 of 2'
          })
          expect(retryText).toBeInTheDocument()
        },
        {timeout: 2000},
      )

      // Second retry
      const retryButton2 = screen.getByRole('button', {name: /Try Again/i})
      await user.click(retryButton2)

      // Wait for retry to complete
      await waitFor(
        () => {
          const retryText = screen.getByText((content, element) => {
            return element?.textContent === 'Retry attempt 2 of 2'
          })
          expect(retryText).toBeInTheDocument()
        },
        {timeout: 3000},
      )

      // Max retries reached - button should no longer exist
      await waitFor(
        () => {
          expect(screen.queryByRole('button', {name: /Try Again/i})).not.toBeInTheDocument()
          expect(screen.getByText(/Maximum retry attempts reached/i)).toBeInTheDocument()
        },
        {timeout: 3000},
      )
    })

    it('shows max retries message when retries exceeded', async () => {
      const user = userEvent.setup()

      render(
        <QueryClientProvider client={queryClient}>
          <DynamicImportErrorBoundary maxRetries={1}>
            <AlwaysFailsComponent />
          </DynamicImportErrorBoundary>
        </QueryClientProvider>,
      )

      // First (and only) retry
      const retryButton = screen.getByRole('button', {name: /Try Again/i})
      await user.click(retryButton)

      // Wait for retry to complete and count to show
      await waitFor(
        () => {
          const retryText = screen.getByText((content, element) => {
            return element?.textContent === 'Retry attempt 1 of 1'
          })
          expect(retryText).toBeInTheDocument()
        },
        {timeout: 2000},
      )

      // Max retries reached message should appear
      await waitFor(
        () => {
          expect(screen.getByText(/Maximum retry attempts reached/i)).toBeInTheDocument()
          expect(screen.queryByRole('button', {name: /Try Again/i})).not.toBeInTheDocument()
        },
        {timeout: 2000},
      )
    })
  })

  describe('Exponential Backoff', () => {
    it('displays increasing retry delays during retry', async () => {
      const user = userEvent.setup()

      render(
        <QueryClientProvider client={queryClient}>
          <DynamicImportErrorBoundary maxRetries={4}>
            <ThrowError message="Backoff test" />
          </DynamicImportErrorBoundary>
        </QueryClientProvider>,
      )

      // Initial state: button shows "Try Again"
      expect(screen.getByRole('button', {name: /Try Again/i})).toBeInTheDocument()

      // Click first retry
      const retryButton1 = screen.getByRole('button', {name: /Try Again/i})
      await user.click(retryButton1)

      // Should show retrying state with 1s delay
      await waitFor(() => {
        expect(screen.getByText(/Retrying in 1s/i)).toBeInTheDocument()
      })

      // Wait for retry to complete and count to update
      await waitFor(
        () => {
          expect(screen.getByText('Retry attempt 1 of 4')).toBeInTheDocument()
        },
        {timeout: 2000},
      )

      // Click second retry
      const retryButton2 = screen.getByRole('button', {name: /Try Again/i})
      await user.click(retryButton2)

      // Should show retrying state with 2s delay
      await waitFor(() => {
        expect(screen.getByText(/Retrying in 2s/i)).toBeInTheDocument()
      })

      // Wait for retry to complete
      await waitFor(
        () => {
          expect(screen.getByText('Retry attempt 2 of 4')).toBeInTheDocument()
        },
        {timeout: 3000},
      )
    })
  })

  describe('Error Logging', () => {
    it('logs errors to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')

      render(
        <QueryClientProvider client={queryClient}>
          <DynamicImportErrorBoundary>
            <ThrowError message="Logging test error" />
          </DynamicImportErrorBoundary>
        </QueryClientProvider>,
      )

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Dynamic import error:', expect.any(Error), expect.any(Object))
    })

    it('sends telemetry when gtag is available', () => {
      const gtagMock = vi.fn()
      ;(window as {gtag?: (...args: unknown[]) => void}).gtag = gtagMock

      render(
        <QueryClientProvider client={queryClient}>
          <DynamicImportErrorBoundary>
            <ThrowError message="Telemetry test error" />
          </DynamicImportErrorBoundary>
        </QueryClientProvider>,
      )

      expect(gtagMock).toHaveBeenCalledWith('event', 'exception', {
        description: 'Dynamic import error: Telemetry test error',
        fatal: false,
      })

      delete (window as {gtag?: (...args: unknown[]) => void}).gtag
    })
  })
})

describe('Fallback UI Components', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {retry: false},
      },
    })
    vi.clearAllMocks()
  })

  describe('FallbackUI Base Component', () => {
    it('renders title and message', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <FallbackUI title="Test Title" message="Test message content" />
        </QueryClientProvider>,
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test message content')).toBeInTheDocument()
    })

    it('renders action button with onClick handler', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(
        <QueryClientProvider client={queryClient}>
          <FallbackUI title="Test Title" message="Test message" action={{label: 'Click Me', onClick: handleClick}} />
        </QueryClientProvider>,
      )

      const button = screen.getByRole('button', {name: 'Click Me'})
      expect(button).toBeInTheDocument()

      await user.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders action link with href', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <FallbackUI
            title="Test Title"
            message="Test message"
            action={{label: 'Visit Link', href: 'https://example.com'}}
          />
        </QueryClientProvider>,
      )

      const link = screen.getByRole('link', {name: /Visit Link/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders without action when not provided', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <FallbackUI title="Test Title" message="Test message" />
        </QueryClientProvider>,
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  describe('TokenListFallback', () => {
    it('renders token list fallback with refresh action', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TokenListFallback />
        </QueryClientProvider>,
      )

      expect(screen.getByText('Token List Unavailable')).toBeInTheDocument()
      expect(screen.getByText(/Unable to load the token list. You can still connect your wallet/i)).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Refresh Page'})).toBeInTheDocument()
    })

    it('refreshes page when action clicked', async () => {
      const user = userEvent.setup()
      const reloadSpy = vi.fn()
      Object.defineProperty(window, 'location', {
        value: {reload: reloadSpy},
        writable: true,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <TokenListFallback />
        </QueryClientProvider>,
      )

      const refreshButton = screen.getByRole('button', {name: 'Refresh Page'})
      await user.click(refreshButton)

      expect(reloadSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('WalletDashboardFallback', () => {
    it('renders wallet dashboard fallback with refresh action', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <WalletDashboardFallback />
        </QueryClientProvider>,
      )

      expect(screen.getByText('Dashboard Unavailable')).toBeInTheDocument()
      expect(
        screen.getByText(/Unable to load your wallet dashboard. Your wallet is still connected/i),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Refresh Page'})).toBeInTheDocument()
    })
  })

  describe('TransactionQueueFallback', () => {
    it('renders transaction queue fallback with explorer link', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TransactionQueueFallback />
        </QueryClientProvider>,
      )

      expect(screen.getByText('Transaction Queue Unavailable')).toBeInTheDocument()
      expect(screen.getByText(/Unable to load the transaction queue. Your transactions are still/i)).toBeInTheDocument()

      const explorerLink = screen.getByRole('link', {name: /View on Explorer/i})
      expect(explorerLink).toBeInTheDocument()
      expect(explorerLink).toHaveAttribute('href', 'https://etherscan.io')
    })
  })

  describe('TokenDetailFallback', () => {
    it('renders token detail fallback with go back action', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TokenDetailFallback />
        </QueryClientProvider>,
      )

      expect(screen.getByText('Token Details Unavailable')).toBeInTheDocument()
      expect(screen.getByText(/Unable to load detailed token information. The token is still/i)).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Go Back'})).toBeInTheDocument()
    })

    it('navigates back when action clicked', async () => {
      const user = userEvent.setup()
      const backSpy = vi.fn()
      Object.defineProperty(window, 'history', {
        value: {back: backSpy},
        writable: true,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <TokenDetailFallback />
        </QueryClientProvider>,
      )

      const backButton = screen.getByRole('button', {name: 'Go Back'})
      await user.click(backButton)

      expect(backSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Fallback UI Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TokenListFallback />
        </QueryClientProvider>,
      )

      const heading = screen.getByRole('heading', {name: 'Token List Unavailable'})
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H3')
    })

    it('has accessible icon rendered', () => {
      const {container} = render(
        <QueryClientProvider client={queryClient}>
          <FallbackUI title="Test" message="Test message" />
        </QueryClientProvider>,
      )

      // AlertCircle icon should be rendered (check for SVG element)
      const svgIcon = container.querySelector('svg')
      expect(svgIcon).toBeInTheDocument()
      expect(svgIcon).toHaveClass('lucide-circle-alert')
    })

    it('external links have proper security attributes', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TransactionQueueFallback />
        </QueryClientProvider>,
      )

      const link = screen.getByRole('link', {name: /View on Explorer/i})
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveAttribute('target', '_blank')
    })
  })
})
