import {WagmiAdapter} from '@reown/appkit-adapter-wagmi'
import {arbitrum, mainnet, polygon, type AppKitNetwork} from '@reown/appkit/networks'
import {createAppKit} from '@reown/appkit/react'
import {http} from 'viem'

import {env} from '../../env'

// Use validated environment variables
export const projectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Define the networks for multi-chain support
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, polygon, arbitrum]

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

// Create Wagmi Adapter with multi-chain support and configurable RPC endpoints
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  transports: {
    [mainnet.id]: http(
      getRpcUrl(mainnet.id, env.NEXT_PUBLIC_ETHEREUM_RPC_URL, 'https://eth-mainnet.g.alchemy.com/v2/demo'),
    ),
    [polygon.id]: http(
      getRpcUrl(polygon.id, env.NEXT_PUBLIC_POLYGON_RPC_URL, 'https://polygon-mainnet.g.alchemy.com/v2/demo'),
    ),
    [arbitrum.id]: http(
      getRpcUrl(arbitrum.id, env.NEXT_PUBLIC_ARBITRUM_RPC_URL, 'https://arb-mainnet.g.alchemy.com/v2/demo'),
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
