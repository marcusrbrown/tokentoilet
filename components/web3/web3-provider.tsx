'use client'

import type {ReactNode} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {WagmiProvider} from 'wagmi'
import {ThemeSync} from '@/components/theme-sync'
import {WalletAutoConnect} from '@/components/web3/wallet-auto-connect'
import {wagmiAdapter} from '@/lib/web3/config'

// Create QueryClient
const queryClient = new QueryClient()

export function Web3Provider({children}: {children: ReactNode}) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletAutoConnect enableAutoReconnect={true} debug={false}>
          <ThemeSync />
          {children}
        </WalletAutoConnect>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
