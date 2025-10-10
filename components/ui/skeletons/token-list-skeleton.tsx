import {Card} from '@/components/ui/card'

export function TokenListSkeleton() {
  return (
    <Card variant="default" className="w-full" padding="md">
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Token list items skeleton */}
        {Array.from({length: 5}, (_, i) => i).map(index => (
          <div key={`token-skeleton-${index}`} className="flex items-center gap-4 py-3">
            {/* Token icon */}
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />

            {/* Token info */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Token balance */}
            <div className="space-y-2 text-right">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
