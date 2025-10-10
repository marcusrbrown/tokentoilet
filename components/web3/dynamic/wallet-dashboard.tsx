'use client'

import type {ComponentProps} from 'react'

import {WalletDashboardSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const WalletDashboardComponent = dynamic(async () => import('../wallet-dashboard').then(mod => mod.WalletDashboard), {
  loading: () => <WalletDashboardSkeleton />,
  ssr: false,
})

export function DynamicWalletDashboard(props: ComponentProps<typeof WalletDashboardComponent>) {
  return (
    <Suspense fallback={<WalletDashboardSkeleton />}>
      <WalletDashboardComponent {...props} />
    </Suspense>
  )
}
