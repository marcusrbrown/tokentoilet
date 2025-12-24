import {Card} from '@/components/ui/card'

export function CharitySelectorSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-5 w-40 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />

      <div className="relative w-full rounded-lg border border-gray-200 bg-white/50 p-4 backdrop-blur-sm dark:border-gray-600 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
          </div>
          <div className="h-4 w-4 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
        </div>

        <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-600">
          {Array.from({length: 3}, (_, i) => i).map(index => (
            <CharityCardSkeleton key={`charity-skeleton-${index}`} />
          ))}
        </div>
      </div>

      <div className="h-3 w-64 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
    </div>
  )
}

CharitySelectorSkeleton.displayName = 'CharitySelectorSkeleton'

function CharityCardSkeleton() {
  return (
    <Card variant="default" elevation="low" padding="md">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-lg bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
              <div className="h-3 w-full max-w-xs animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
            </div>
            <div className="ml-2 h-5 w-5 flex-shrink-0 animate-pulse rounded-full bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
          </div>

          <div className="mt-2 flex gap-1">
            <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
            <div className="h-6 w-6 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </Card>
  )
}

CharityCardSkeleton.displayName = 'CharityCardSkeleton'

export {CharityCardSkeleton}
