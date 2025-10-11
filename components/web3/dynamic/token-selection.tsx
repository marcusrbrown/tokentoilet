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
