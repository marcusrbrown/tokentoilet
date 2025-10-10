'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const WalletErrorHandlerComponent = dynamic(
  async () => import('../wallet-error-handler').then(mod => mod.WalletErrorHandler),
  {
    loading: () => <GenericSkeleton height="h-64" />,
    ssr: false,
  },
)

export function DynamicWalletErrorHandler(props: ComponentProps<typeof WalletErrorHandlerComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-64" />}>
      <WalletErrorHandlerComponent {...props} />
    </Suspense>
  )
}
