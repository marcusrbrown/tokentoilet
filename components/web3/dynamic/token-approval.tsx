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
