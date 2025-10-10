'use client'

import type {ComponentProps} from 'react'

import {TransactionQueueSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const TransactionQueueComponent = dynamic(
  async () => import('../transaction-queue').then(mod => mod.TransactionQueue),
  {
    loading: () => <TransactionQueueSkeleton />,
    ssr: false,
  },
)

export function DynamicTransactionQueue(props: ComponentProps<typeof TransactionQueueComponent>) {
  return (
    <Suspense fallback={<TransactionQueueSkeleton />}>
      <TransactionQueueComponent {...props} />
    </Suspense>
  )
}
