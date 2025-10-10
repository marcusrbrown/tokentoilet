'use client'

import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {AlertTriangle, RefreshCw} from 'lucide-react'
import {Component, type ReactNode} from 'react'

interface DynamicImportErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
}

interface DynamicImportErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class DynamicImportErrorBoundary extends Component<
  DynamicImportErrorBoundaryProps,
  DynamicImportErrorBoundaryState
> {
  constructor(props: DynamicImportErrorBoundaryProps) {
    super(props)
    this.state = {hasError: false}
  }

  static getDerivedStateFromError(error: Error): DynamicImportErrorBoundaryState {
    return {hasError: true, error}
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dynamic import error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({hasError: false, error: undefined})
    this.props.onRetry?.()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback
      }

      return (
        <Card variant="default" className="w-full" padding="lg">
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to Load Component</h3>
              <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
                There was a problem loading this part of the application. This might be due to a network issue.
              </p>
              {this.state.error && (
                <p className="text-xs text-gray-500 dark:text-gray-500">{this.state.error.message}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}
