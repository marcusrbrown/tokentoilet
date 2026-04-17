import {WagmiAdapter} from '@reown/appkit-adapter-wagmi'
import {createAppKit} from '@reown/appkit/react'
import {http} from 'viem'

import {env} from '../../env'
import {DEFAULT_SUPPORTED_NETWORK_V1, SUPPORTED_NETWORKS_V1} from './chains'

// Use validated environment variables
export const projectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Define the networks for v1.0 support
export const networks = SUPPORTED_NETWORKS_V1

// Create metadata object for TokenToilet project
export const metadata = {
  name: 'TokenToilet',
  description: 'A Web3 application for token interactions',
  url: env.NEXT_PUBLIC_APP_URL,
  icons: ['/toilet.svg'],
}

// Helper function to get RPC URL with fallback to default endpoints
const getRpcUrl = (chainId: number, envUrl?: string, defaultUrl?: string): string => {
  if (envUrl !== undefined && envUrl.length > 0) {
    return envUrl
  }
  if (defaultUrl !== undefined && defaultUrl.length > 0) {
    return defaultUrl
  }
  // Return empty string to use chain's default RPC
  return ''
}

// Create Wagmi Adapter with Sepolia-only support for v1.0
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  transports: {
    [DEFAULT_SUPPORTED_NETWORK_V1.id]: http(
      getRpcUrl(DEFAULT_SUPPORTED_NETWORK_V1.id, env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    ),
  },
})

// Create AppKit with custom theming for violet design system
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': 'rgb(124 58 237)', // violet-600 for violet design system
    '--w3m-border-radius-master': '8px',
  },
})

// Export wagmiConfig for use in WagmiProvider
export const wagmiConfig = wagmiAdapter.wagmiConfig
