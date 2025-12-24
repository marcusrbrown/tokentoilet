'use client'

import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'

import {Component, type ErrorInfo, type ReactNode} from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static displayName = 'ErrorBoundary'

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {hasError: false}
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, error}
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({errorInfo})
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({hasError: false, error: undefined, errorInfo: undefined})
  }

  handleReload = () => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError === true) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card variant="default" padding="lg" className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Something went wrong</h2>

            <p className="mb-6 text-gray-600 dark:text-gray-400">
              We encountered an unexpected error. Please try again or refresh the page.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="default" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button variant="secondary" onClick={this.handleReload}>
                Refresh Page
              </Button>
            </div>

            {this.props.showDetails === true && this.state.error !== undefined && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  Technical Details
                </summary>
                <div className="mt-2 overflow-auto rounded bg-gray-100 p-3 dark:bg-gray-800">
                  <pre className="whitespace-pre-wrap text-xs text-red-600 dark:text-red-400">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo?.componentStack !== undefined && this.state.errorInfo.componentStack !== '' && (
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-500 dark:text-gray-400">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export {ErrorBoundary}
