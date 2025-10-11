/**
 * Dynamic Transaction Status Component
 *
 * This wrapper implements Next.js dynamic imports to reduce initial bundle size.
 * The underlying TransactionStatusCard component is loaded on-demand, reducing the
 * initial JavaScript bundle by ~4-6 KB.
 *
 * BUNDLE OPTIMIZATION STRATEGY:
 * - Component: TransactionStatusCard (~4-6 KB)
 * - Loading: On-demand when user views transaction status
 * - Fallback: TransactionStatusSkeleton maintains layout dimensions during loading
 * - SSR: Disabled (Web3 components require client-side wallet connection)
 *
 * USAGE:
 * ```tsx
 * import {DynamicTransactionStatusCard} from '@/components/web3/dynamic'
 *
 * <DynamicTransactionStatusCard transactionHash={txHash} />
 * ```
 *
 * See docs/development/architecture.md for dynamic loading patterns.
 */
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
