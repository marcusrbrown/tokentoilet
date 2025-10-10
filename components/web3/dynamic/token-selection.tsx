'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const TokenSelectionComponent = dynamic(async () => import('../token-selection').then(mod => mod.TokenSelection), {
  loading: () => <GenericSkeleton height="h-96" />,
  ssr: false,
})

export function DynamicTokenSelection(props: ComponentProps<typeof TokenSelectionComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-96" />}>
      <TokenSelectionComponent {...props} />
    </Suspense>
  )
}
