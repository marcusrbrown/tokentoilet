/**
 * Dynamic Wallet Dashboard Component
 *
 * This wrapper implements Next.js dynamic imports to reduce initial bundle size.
 * The underlying WalletDashboard component is loaded on-demand, reducing the initial
 * JavaScript bundle by ~12-18 KB.
 *
 * BUNDLE OPTIMIZATION STRATEGY:
 * - Component: WalletDashboard (~12-18 KB)
 * - Loading: On-demand when user accesses wallet management features
 * - Fallback: WalletDashboardSkeleton maintains layout dimensions during loading
 * - SSR: Disabled (Web3 components require client-side wallet connection)
 *
 * USAGE:
 * ```tsx
 * import {DynamicWalletDashboard} from '@/components/web3/dynamic'
 *
 * <DynamicWalletDashboard />
 * ```
 *
 * SUSPENSE BOUNDARY:
 * The component is wrapped in a Suspense boundary to handle loading states.
 * The WalletDashboardSkeleton provides visual feedback during component loading,
 * preventing layout shift and maintaining glass morphism design consistency.
 *
 * See docs/development/architecture.md for dynamic loading patterns.
 */
'use client'

import type {ComponentProps} from 'react'

import {WalletDashboardSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const WalletDashboardComponent = dynamic(async () => import('../wallet-dashboard').then(mod => mod.WalletDashboard), {
  loading: () => <WalletDashboardSkeleton />,
  ssr: false,
})

export function DynamicWalletDashboard(props: ComponentProps<typeof WalletDashboardComponent>) {
  return (
    <Suspense fallback={<WalletDashboardSkeleton />}>
      <WalletDashboardComponent {...props} />
    </Suspense>
  )
}
