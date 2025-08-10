'use client'

import {wagmiAdapter} from '@/lib/web3/config'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {type ReactNode} from 'react'
import {WagmiProvider} from 'wagmi'

// Create QueryClient
const queryClient = new QueryClient()

export function Web3Provider({children}: {children: ReactNode}) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
