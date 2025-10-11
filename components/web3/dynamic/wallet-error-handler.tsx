/**
 * Dynamic Wallet Error Handler Component
 *
 * This wrapper implements Next.js dynamic imports to reduce initial bundle size.
 * The underlying WalletErrorHandler component is loaded on-demand, reducing the
 * initial JavaScript bundle by ~3-5 KB.
 *
 * BUNDLE OPTIMIZATION STRATEGY:
 * - Component: WalletErrorHandler (~3-5 KB)
 * - Loading: On-demand when wallet error occurs and detailed error UI is needed
 * - Fallback: GenericSkeleton maintains layout dimensions during loading
 * - SSR: Disabled (Web3 components require client-side wallet connection)
 *
 * USAGE:
 * ```tsx
 * import {DynamicWalletErrorHandler} from '@/components/web3/dynamic'
 *
 * <DynamicWalletErrorHandler error={walletError} onRetry={handleRetry} />
 * ```
 *
 * See docs/development/architecture.md for dynamic loading patterns.
 */
'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const WalletErrorHandlerComponent = dynamic(
  async () => import('../wallet-error-handler').then(mod => mod.WalletErrorHandler),
  {
    loading: () => <GenericSkeleton height="h-64" />,
    ssr: false,
  },
)

export function DynamicWalletErrorHandler(props: ComponentProps<typeof WalletErrorHandlerComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-64" />}>
      <WalletErrorHandlerComponent {...props} />
    </Suspense>
  )
}
