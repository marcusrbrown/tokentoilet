import {Card} from '@/components/ui/card'

export function TransactionStatusSkeleton() {
  return (
    <Card variant="default" className="w-full" padding="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          {Array.from({length: 4}, (_, i) => i).map(index => (
            <div key={`detail-${index}`} className="flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-2 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </Card>
  )
}
