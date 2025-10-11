/**
 * Dynamic Token Detail Component
 *
 * This wrapper implements Next.js dynamic imports to reduce initial bundle size.
 * The underlying TokenDetail component is loaded on-demand, reducing the initial
 * JavaScript bundle by ~8-12 KB.
 *
 * BUNDLE OPTIMIZATION STRATEGY:
 * - Component: TokenDetail (~8-12 KB)
 * - Loading: On-demand when user views token details
 * - Fallback: TokenDetailSkeleton maintains layout dimensions during loading
 * - SSR: Disabled (Web3 components require client-side wallet connection)
 *
 * USAGE:
 * ```tsx
 * import {DynamicTokenDetail} from '@/components/web3/dynamic'
 *
 * <DynamicTokenDetail token={selectedToken} />
 * ```
 *
 * SUSPENSE BOUNDARY:
 * The component is wrapped in a Suspense boundary to handle loading states.
 * The TokenDetailSkeleton provides visual feedback during component loading,
 * preventing layout shift and maintaining glass morphism design consistency.
 *
 * See docs/development/architecture.md for dynamic loading patterns.
 */
'use client'

import type {ComponentProps} from 'react'

import {TokenDetailSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const TokenDetailComponent = dynamic(async () => import('../token-detail').then(mod => mod.TokenDetail), {
  loading: () => <TokenDetailSkeleton />,
  ssr: false,
})

export function DynamicTokenDetail(props: ComponentProps<typeof TokenDetailComponent>) {
  return (
    <Suspense fallback={<TokenDetailSkeleton />}>
      <TokenDetailComponent {...props} />
    </Suspense>
  )
}
