import {Card} from '@/components/ui/card'

export function TokenDetailSkeleton() {
  return (
    <Card variant="default" className="w-full" padding="lg">
      <div className="space-y-6">
        <div className="flex items-start gap-4 border-b border-gray-200 pb-6 dark:border-gray-700">
          <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({length: 4}, (_, i) => i).map(index => (
            <div key={`stat-${index}`} className="space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="h-10 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </Card>
  )
}
