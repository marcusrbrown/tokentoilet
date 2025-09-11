'use client'

import type {ReactNode} from 'react'
import {ThemeSync} from '@/components/theme-sync'
import {wagmiAdapter} from '@/lib/web3/config'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {WagmiProvider} from 'wagmi'

// Create QueryClient
const queryClient = new QueryClient()

export function Web3Provider({children}: {children: ReactNode}) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
