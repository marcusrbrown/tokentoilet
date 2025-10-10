'use client'

import type {ComponentProps} from 'react'

import {GenericSkeleton} from '@/components/ui/skeletons'
import dynamic from 'next/dynamic'
import {Suspense} from 'react'

const WalletSwitcherComponent = dynamic(async () => import('../wallet-switcher').then(mod => mod.WalletSwitcher), {
  loading: () => <GenericSkeleton height="h-48" />,
  ssr: false,
})

export function DynamicWalletSwitcher(props: ComponentProps<typeof WalletSwitcherComponent>) {
  return (
    <Suspense fallback={<GenericSkeleton height="h-48" />}>
      <WalletSwitcherComponent {...props} />
    </Suspense>
  )
}
