import {Card} from '@/components/ui/card'

export function TokenCardSkeleton() {
  return (
    <Card variant="default" className="w-full" padding="md">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-full bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-28 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
        </div>

        <div className="flex-shrink-0 space-y-2 text-right">
          <div className="ml-auto h-5 w-24 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200 motion-reduce:animate-none dark:bg-gray-700" />
        </div>
      </div>
    </Card>
  )
}

TokenCardSkeleton.displayName = 'TokenCardSkeleton'
