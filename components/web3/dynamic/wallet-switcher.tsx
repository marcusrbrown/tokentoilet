/**
 * Dynamic Wallet Switcher Component
 *
 * This wrapper implements Next.js dynamic imports to reduce initial bundle size.
 * The underlying WalletSwitcher component is loaded on-demand, reducing the
 * initial JavaScript bundle by ~4-6 KB.
 *
 * BUNDLE OPTIMIZATION STRATEGY:
 * - Component: WalletSwitcher (~4-6 KB)
 * - Loading: On-demand when user accesses wallet switching interface
 * - Fallback: GenericSkeleton maintains layout dimensions during loading
 * - SSR: Disabled (Web3 components require client-side wallet connection)
 *
 * USAGE:
 * ```tsx
 * import {DynamicWalletSwitcher} from '@/components/web3/dynamic'
 *
 * <DynamicWalletSwitcher onWalletChange={handleWalletChange} />
 * ```
 *
 * See docs/development/architecture.md for dynamic loading patterns.
 */
'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const WalletSwitcherComponent = dynamic(async () => import('../wallet-switcher').then(mod => mod.WalletSwitcher), {
  loading: () => <GenericSkeleton height="h-48" />,
  ssr: false,
})

export function DynamicWalletSwitcher(props: ComponentProps<typeof WalletSwitcherComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-48" />}>
      <WalletSwitcherComponent {...props} />
    </Suspense>
  )
}
