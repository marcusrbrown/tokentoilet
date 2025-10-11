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
