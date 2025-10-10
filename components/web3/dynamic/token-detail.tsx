'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const TokenDetailComponent = dynamic(async () => import('../token-detail').then(mod => mod.TokenDetail), {
  loading: () => <GenericSkeleton height="h-96" />,
  ssr: false,
})

export function DynamicTokenDetail(props: ComponentProps<typeof TokenDetailComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-96" />}>
      <TokenDetailComponent {...props} />
    </Suspense>
  )
}
