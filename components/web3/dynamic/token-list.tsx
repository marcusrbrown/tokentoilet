'use client'

import type {ComponentProps} from 'react'

import {TokenListSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

/**
 * Dynamically imported TokenList component with Suspense boundary.
 *
 * Bundle optimization strategy:
 * - Lazy loads TokenList only when needed
 * - Shows skeleton loader during import
 * - Reduces initial bundle size
 * - Client-side only (ssr: false)
 *
 * Suspense provides fallback UI during component loading.
 */
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
