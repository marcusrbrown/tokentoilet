/**
 * Dynamic Token Approval Component
 *
 * This wrapper implements Next.js dynamic imports to reduce initial bundle size.
 * The underlying TokenApproval component is loaded on-demand, reducing the initial
 * JavaScript bundle by ~6-10 KB.
 *
 * BUNDLE OPTIMIZATION STRATEGY:
 * - Component: TokenApproval (~6-10 KB)
 * - Loading: On-demand when user initiates token approval workflow
 * - Fallback: GenericSkeleton maintains layout dimensions during loading
 * - SSR: Disabled (Web3 components require client-side wallet connection)
 *
 * USAGE:
 * ```tsx
 * import {DynamicTokenApproval} from '@/components/web3/dynamic'
 *
 * <DynamicTokenApproval token={selectedToken} spender={contractAddress} />
 * ```
 *
 * See docs/development/architecture.md for dynamic loading patterns.
 */
'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const TokenApprovalComponent = dynamic(async () => import('../token-approval').then(mod => mod.TokenApproval), {
  loading: () => <GenericSkeleton height="h-80" />,
  ssr: false,
})

export function DynamicTokenApproval(props: ComponentProps<typeof TokenApprovalComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-80" />}>
      <TokenApprovalComponent {...props} />
    </Suspense>
  )
}
