'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const WalletErrorRecoveryComponent = dynamic(
  async () => import('../wallet-error-recovery').then(mod => mod.WalletErrorRecovery),
  {
    loading: () => <GenericSkeleton height="h-64" />,
    ssr: false,
  },
)

export function DynamicWalletErrorRecovery(props: ComponentProps<typeof WalletErrorRecoveryComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-64" />}>
      <WalletErrorRecoveryComponent {...props} />
    </Suspense>
  )
}
