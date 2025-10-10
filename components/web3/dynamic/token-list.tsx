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
