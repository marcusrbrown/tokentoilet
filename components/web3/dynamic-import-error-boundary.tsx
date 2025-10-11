'use client'

import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {AlertTriangle, RefreshCw} from 'lucide-react'
import {Component, type ReactNode} from 'react'

interface DynamicImportErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
  maxRetries?: number
  onMaxRetriesReached?: (error: Error) => void
}

interface DynamicImportErrorBoundaryState {
  hasError: boolean
  error?: Error
  retryCount: number
  isRetrying: boolean
}

/**
 * Error boundary for dynamic imports with exponential backoff retry mechanism.
 *
 * Catches errors from dynamically loaded components and provides:
 * - User-friendly error UI with retry functionality
 * - Exponential backoff (1s → 2s → 4s → 8s max)
 * - Configurable max retries (default: 3)
 * - Telemetry tracking for dynamic import failures
 *
 * @example
 * ```tsx
 * <DynamicImportErrorBoundary maxRetries={3} onRetry={() => console.log('Retrying...')}>
 *   <DynamicComponent />
 * </DynamicImportErrorBoundary>
 * ```
 */
export class DynamicImportErrorBoundary extends Component<
  DynamicImportErrorBoundaryProps,
  DynamicImportErrorBoundaryState
> {
  private retryTimeoutId?: NodeJS.Timeout

  constructor(props: DynamicImportErrorBoundaryProps) {
    super(props)
    this.state = {hasError: false, retryCount: 0, isRetrying: false}
  }

  static getDerivedStateFromError(error: Error): Partial<DynamicImportErrorBoundaryState> {
    return {hasError: true, error}
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dynamic import error:', error, errorInfo)

    // Log to telemetry service if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      ;(window as {gtag?: (...args: unknown[]) => void}).gtag?.('event', 'exception', {
        description: `Dynamic import error: ${error.message}`,
        fatal: false,
      })
    }
  }

  componentWillUnmount() {
    this.clearRetryTimeout()
  }

  /**
   * Clears any pending retry timeout to prevent memory leaks.
   * Called during unmount and before starting a new retry.
   */
  private clearRetryTimeout() {
    if (this.retryTimeoutId !== undefined) {
      clearTimeout(this.retryTimeoutId)
      this.retryTimeoutId = undefined
    }
  }

  /**
   * Handles retry attempts with exponential backoff.
   * Backoff pattern: 1s → 2s → 4s → 8s (max).
   * Prevents multiple simultaneous retry attempts by clearing existing timeouts.
   */
  handleRetry = () => {
    const {maxRetries = 3, onMaxRetriesReached} = this.props
    const {retryCount, error} = this.state

    if (retryCount >= maxRetries) {
      console.error(`Max retries (${maxRetries}) reached for dynamic import`)
      if (error) {
        onMaxRetriesReached?.(error)
      }
      return
    }

    // Prevent multiple simultaneous retry attempts
    this.clearRetryTimeout()

    this.setState({isRetrying: true})

    // Exponential backoff: 1s, 2s, 4s, 8s (max)
    const backoffMs = Math.min(1000 * 2 ** retryCount, 8000)

    this.retryTimeoutId = setTimeout(() => {
      this.setState(
        {
          hasError: false,
          error: undefined,
          retryCount: retryCount + 1,
          isRetrying: false,
        },
        () => {
          this.props.onRetry?.()
        },
      )
    }, backoffMs)
  }

  render(): ReactNode {
    const {maxRetries = 3} = this.props
    const {hasError, error, retryCount, isRetrying} = this.state

    if (hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback
      }

      const canRetry = retryCount < maxRetries
      const nextBackoffSec = Math.min(2 ** retryCount, 8)

      return (
        <Card variant="default" className="w-full" padding="lg">
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to Load Component</h3>
              <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
                There was a problem loading this part of the application. This might be due to a network issue.
              </p>
              {error && <p className="text-xs text-gray-500 dark:text-gray-500">{error.message}</p>}
              {retryCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Retry attempt {retryCount} of {maxRetries}
                </p>
              )}
            </div>
            {canRetry ? (
              <Button variant="outline" size="sm" onClick={this.handleRetry} disabled={isRetrying}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? `Retrying in ${nextBackoffSec}s...` : 'Try Again'}
              </Button>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Maximum retry attempts reached. Please refresh the page.
              </div>
            )}
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}
