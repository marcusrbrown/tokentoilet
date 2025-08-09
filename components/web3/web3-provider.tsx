'use client'

import {wagmiConfig, web3ModalConfig} from '@/lib/web3/config'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {createWeb3Modal} from '@web3modal/wagmi/react'
import {type ReactNode} from 'react'
import {WagmiProvider} from 'wagmi'

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
