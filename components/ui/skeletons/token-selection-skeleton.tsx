import {Card} from '@/components/ui/card'

export function TokenSelectionSkeleton() {
  return (
    <Card variant="default" className="w-full" padding="md">
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />

        <div className="flex gap-2">
          {Array.from({length: 3}, (_, i) => i).map(index => (
            <div key={`tab-${index}`} className="h-8 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({length: 6}, (_, i) => i).map(index => (
            <div
              key={`token-${index}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
