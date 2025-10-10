'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const WalletConnectionModalComponent = dynamic(
  async () => import('../wallet-connection-modal').then(mod => mod.WalletConnectionModal),
  {
    loading: () => <GenericSkeleton height="h-96" />,
    ssr: false,
  },
)

export function DynamicWalletConnectionModal(props: ComponentProps<typeof WalletConnectionModalComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-96" />}>
      <WalletConnectionModalComponent {...props} />
    </Suspense>
  )
}
