'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const TransactionStatusCardComponent = dynamic(
  async () => import('../transaction-status').then(mod => mod.TransactionStatusCard),
  {
    loading: () => <GenericSkeleton height="h-64" />,
    ssr: false,
  },
)

export function DynamicTransactionStatusCard(props: ComponentProps<typeof TransactionStatusCardComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-64" />}>
      <TransactionStatusCardComponent {...props} />
    </Suspense>
  )
}
