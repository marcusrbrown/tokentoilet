import {Card} from '@/components/ui/card'

export function WalletDashboardSkeleton() {
  return (
    <Card variant="default" className="w-full" padding="lg">
      <div className="space-y-6">
        {/* Header with wallet address */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({length: 3}, (_, i) => i).map(index => (
            <div key={`stat-${index}`} className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>

        {/* Recent transactions */}
        <div className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          {Array.from({length: 3}, (_, i) => i).map(index => (
            <div
              key={`tx-${index}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
