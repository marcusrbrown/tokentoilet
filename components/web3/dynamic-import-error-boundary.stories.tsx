import type {Meta, StoryObj} from '@storybook/react'

import {Button} from '@/components/ui/button'
import {useState} from 'react'

import {DynamicImportErrorBoundary} from './dynamic-import-error-boundary'

const meta: Meta<typeof DynamicImportErrorBoundary> = {
  title: 'Components/Web3/DynamicImportErrorBoundary',
  component: DynamicImportErrorBoundary,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof DynamicImportErrorBoundary>

function ThrowError(): never {
  throw new Error('Simulated dynamic import failure')
}

function TriggerableError() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    throw new Error('Simulated dynamic import failure')
  }

  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <h3 className="mb-2 text-lg font-semibold">Component Loaded Successfully</h3>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        This component loaded without errors. Click the button to simulate an error.
      </p>
      <Button
        variant="outline"
        onClick={() => {
          setShouldThrow(true)
        }}
      >
        Trigger Error
      </Button>
    </div>
  )
}

export const DefaultError: Story = {
  render: () => (
    <DynamicImportErrorBoundary>
      <ThrowError />
    </DynamicImportErrorBoundary>
  ),
}

function WithRetryComponent() {
  const [retryCount, setRetryCount] = useState(0)

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <p className="text-sm text-blue-800 dark:text-blue-200">Retry attempts: {retryCount}</p>
      </div>
      <DynamicImportErrorBoundary
        maxRetries={3}
        onRetry={() => {
          setRetryCount(prev => prev + 1)
        }}
      >
        <ThrowError />
      </DynamicImportErrorBoundary>
    </div>
  )
}

export const WithRetry: Story = {
  render: () => <WithRetryComponent />,
}

export const WithCustomFallback: Story = {
  render: () => (
    <DynamicImportErrorBoundary
      fallback={
        <div className="rounded-lg border-2 border-dashed border-purple-300 p-8 text-center dark:border-purple-700">
          <h3 className="mb-2 text-lg font-semibold text-purple-900 dark:text-purple-100">Custom Fallback UI</h3>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            This is a custom fallback that appears instead of the default error UI.
          </p>
        </div>
      }
    >
      <ThrowError />
    </DynamicImportErrorBoundary>
  ),
}

function WithMaxRetriesReachedComponent() {
  const [message, setMessage] = useState('')

  return (
    <div className="space-y-4">
      {message !== '' && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
        </div>
      )}
      <DynamicImportErrorBoundary
        maxRetries={0}
        onMaxRetriesReached={error => {
          setMessage(`Max retries reached: ${error.message}`)
        }}
      >
        <ThrowError />
      </DynamicImportErrorBoundary>
    </div>
  )
}

export const WithMaxRetriesReached: Story = {
  render: () => <WithMaxRetriesReachedComponent />,
}

function InteractiveComponent() {
  const [key, setKey] = useState(0)

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <p className="mb-2 text-sm font-semibold">Interactive Demo</p>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          The component starts in a working state. Click &quot;Trigger Error&quot; to see the error boundary in action.
          Use the &quot;Retry&quot; button to attempt recovery.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setKey(prev => prev + 1)
          }}
        >
          Reset Demo
        </Button>
      </div>
      <DynamicImportErrorBoundary key={key}>
        <TriggerableError />
      </DynamicImportErrorBoundary>
    </div>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveComponent />,
}
