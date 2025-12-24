import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {ErrorBoundary} from './error-boundary'

function ThrowingComponent({shouldThrow}: {shouldThrow: boolean}) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Content rendered successfully</div>
}

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error

  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  describe('rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>,
      )

      expect(screen.getByText('Content rendered successfully')).toBeInTheDocument()
    })

    it('should render default fallback UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /Try Again/})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /Refresh Page/})).toBeInTheDocument()
    })

    it('should render custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      )

      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('should show technical details when showDetails is true', () => {
      render(
        <ErrorBoundary showDetails>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      )

      expect(screen.getByText('Technical Details')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should not show technical details by default', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      )

      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should call onError callback when error occurs', () => {
      const onError = vi.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      )

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error) as Error,
        expect.objectContaining({componentStack: expect.any(String) as string}),
      )
    })

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      )

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('recovery actions', () => {
    it('should reset error state when Try Again is clicked', async () => {
      const user = userEvent.setup()
      let shouldThrow = true

      function TestComponent() {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div>Recovered content</div>
      }

      const {rerender} = render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>,
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      shouldThrow = false

      await user.click(screen.getByRole('button', {name: /Try Again/}))

      rerender(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>,
      )

      expect(screen.getByText('Recovered content')).toBeInTheDocument()
    })

    it('should reload page when Refresh Page is clicked', async () => {
      const user = userEvent.setup()
      const reloadMock = vi.fn()
      Object.defineProperty(window, 'location', {
        value: {reload: reloadMock},
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      )

      await user.click(screen.getByRole('button', {name: /Refresh Page/}))

      expect(reloadMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('should have accessible error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      )

      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    it('should have interactive buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]).toHaveAccessibleName(/Try Again/)
      expect(buttons[1]).toHaveAccessibleName(/Refresh Page/)
    })
  })

  describe('displayName', () => {
    it('should have displayName set', () => {
      expect(ErrorBoundary.displayName).toBe('ErrorBoundary')
    })
  })
})
