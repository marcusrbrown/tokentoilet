/**
 * Dynamic Transaction Queue Component
 *
 * This wrapper implements Next.js dynamic imports to reduce initial bundle size.
 * The underlying TransactionQueue component is loaded on-demand, reducing the initial
 * JavaScript bundle by ~5-8 KB.
 *
 * BUNDLE OPTIMIZATION STRATEGY:
 * - Component: TransactionQueue (~5-8 KB)
 * - Loading: On-demand when user initiates blockchain transactions
 * - Fallback: TransactionQueueSkeleton maintains layout dimensions during loading
 * - SSR: Disabled (Web3 components require client-side wallet connection)
 *
 * USAGE:
 * ```tsx
 * import {DynamicTransactionQueue} from '@/components/web3/dynamic'
 *
 * <DynamicTransactionQueue />
 * ```
 *
 * SUSPENSE BOUNDARY:
 * The component is wrapped in a Suspense boundary to handle loading states.
 * The TransactionQueueSkeleton provides visual feedback during component loading,
 * preventing layout shift and maintaining glass morphism design consistency.
 *
 * See docs/development/architecture.md for dynamic loading patterns.
 */
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
