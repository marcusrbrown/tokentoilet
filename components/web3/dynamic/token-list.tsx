/**
 * Dynamic Token List Component
 *
 * This wrapper implements Next.js dynamic imports to reduce initial bundle size.
 * The underlying TokenList component is loaded on-demand, reducing the initial
 * JavaScript bundle by ~10-15 KB.
 *
 * BUNDLE OPTIMIZATION STRATEGY:
 * - Component: TokenList (~10-15 KB)
 * - Loading: On-demand when user navigates to token management features
 * - Fallback: TokenListSkeleton maintains layout dimensions during loading
 * - SSR: Disabled (Web3 components require client-side wallet connection)
 *
 * USAGE:
 * ```tsx
 * import {DynamicTokenList} from '@/components/web3/dynamic'
 *
 * <DynamicTokenList onSelectToken={handleTokenSelect} />
 * ```
 *
 * SUSPENSE BOUNDARY:
 * The component is wrapped in a Suspense boundary to handle loading states.
 * The TokenListSkeleton provides visual feedback during component loading,
 * preventing layout shift and maintaining glass morphism design consistency.
 *
 * See docs/development/architecture.md for dynamic loading patterns.
 */
'use client'

import type {ComponentProps} from 'react'

import {TokenListSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const TokenListComponent = dynamic(async () => import('../token-list').then(mod => mod.TokenList), {
  loading: () => <TokenListSkeleton />,
  ssr: false,
})

export function DynamicTokenList(props: ComponentProps<typeof TokenListComponent>) {
  return (
    <Suspense fallback={<TokenListSkeleton />}>
      <TokenListComponent {...props} />
    </Suspense>
  )
}
