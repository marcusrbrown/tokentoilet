import {Card} from '@/components/ui/card'

export function TransactionQueueSkeleton() {
  return (
    <Card variant="default" className="w-full" padding="md">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Transaction queue items */}
        {Array.from({length: 3}, (_, i) => i).map(index => (
          <div
            key={`queue-${index}`}
            className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            {/* Status indicator */}
            <div className="h-2 w-2 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />

            {/* Transaction details */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-56 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
