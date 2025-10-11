/**
 * Dynamic Token Selection Component
 *
 * This wrapper implements Next.js dynamic imports to reduce initial bundle size.
 * The underlying TokenSelection component is loaded on-demand, reducing the initial
 * JavaScript bundle by ~8-12 KB.
 *
 * BUNDLE OPTIMIZATION STRATEGY:
 * - Component: TokenSelection (~8-12 KB)
 * - Loading: On-demand when user opens token selection interface
 * - Fallback: TokenSelectionSkeleton maintains layout dimensions during loading
 * - SSR: Disabled (Web3 components require client-side wallet connection)
 *
 * USAGE:
 * ```tsx
 * import {DynamicTokenSelection} from '@/components/web3/dynamic'
 *
 * <DynamicTokenSelection onSelectToken={handleTokenSelect} />
 * ```
 *
 * See docs/development/architecture.md for dynamic loading patterns.
 */
'use client'

import type {ComponentProps} from 'react'

import {TokenSelectionSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const TokenSelectionComponent = dynamic(async () => import('../token-selection').then(mod => mod.TokenSelection), {
  loading: () => <TokenSelectionSkeleton />,
  ssr: false,
})

export function DynamicTokenSelection(props: ComponentProps<typeof TokenSelectionComponent>) {
  return (
    <Suspense fallback={<TokenSelectionSkeleton />}>
      <TokenSelectionComponent {...props} />
    </Suspense>
  )
}
