import {Card} from '@/components/ui/card'

export function GenericSkeleton({height = 'h-64'}: {height?: string}) {
  return (
    <Card variant="default" className={`w-full ${height}`} padding="md">
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="mx-auto h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mx-auto h-3 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </Card>
  )
}
