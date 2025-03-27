'use client'

import {createWeb3Modal} from '@web3modal/wagmi/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {WagmiProvider} from 'wagmi'
import {type ReactNode} from 'react'
import {web3ModalConfig, wagmiConfig} from '@/lib/web3/config'

// Create Web3Modal
createWeb3Modal(web3ModalConfig)

// Create QueryClient
const queryClient = new QueryClient()

export function Web3Provider({children}: {children: ReactNode}) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
