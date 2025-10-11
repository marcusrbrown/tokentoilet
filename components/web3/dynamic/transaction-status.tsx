'use client'

import type {ComponentProps} from 'react'

import {TransactionStatusSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const TransactionStatusCardComponent = dynamic(
  async () => import('../transaction-status').then(mod => mod.TransactionStatusCard),
  {
    loading: () => <TransactionStatusSkeleton />,
    ssr: false,
  },
)

export function DynamicTransactionStatusCard(props: ComponentProps<typeof TransactionStatusCardComponent>) {
  return (
    <Suspense fallback={<TransactionStatusSkeleton />}>
      <TransactionStatusCardComponent {...props} />
    </Suspense>
  )
}
