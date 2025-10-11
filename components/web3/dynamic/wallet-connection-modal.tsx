/**
 * Dynamic Wallet Connection Modal Component
 *
 * This wrapper implements Next.js dynamic imports to reduce initial bundle size.
 * The underlying WalletConnectionModal component is loaded on-demand, reducing the
 * initial JavaScript bundle by ~7-10 KB.
 *
 * BUNDLE OPTIMIZATION STRATEGY:
 * - Component: WalletConnectionModal (~7-10 KB)
 * - Loading: On-demand when user opens wallet connection interface
 * - Fallback: GenericSkeleton maintains layout dimensions during loading
 * - SSR: Disabled (Web3 components require client-side wallet connection)
 *
 * USAGE:
 * ```tsx
 * import {DynamicWalletConnectionModal} from '@/components/web3/dynamic'
 *
 * <DynamicWalletConnectionModal isOpen={showModal} onClose={handleClose} />
 * ```
 *
 * See docs/development/architecture.md for dynamic loading patterns.
 */
'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const WalletConnectionModalComponent = dynamic(
  async () => import('../wallet-connection-modal').then(mod => mod.WalletConnectionModal),
  {
    loading: () => <GenericSkeleton height="h-96" />,
    ssr: false,
  },
)

export function DynamicWalletConnectionModal(props: ComponentProps<typeof WalletConnectionModalComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-96" />}>
      <WalletConnectionModalComponent {...props} />
    </Suspense>
  )
}
