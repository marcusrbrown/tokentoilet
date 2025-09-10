import {WagmiAdapter} from '@reown/appkit-adapter-wagmi'
import {arbitrum, mainnet, polygon, type AppKitNetwork} from '@reown/appkit/networks'
import {createAppKit} from '@reown/appkit/react'

// You can get a project ID at https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''

// Define the networks for multi-chain support
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, polygon, arbitrum]

// Create metadata object for TokenToilet project
export const metadata = {
  name: 'TokenToilet',
  description: 'A Web3 application for token interactions',
  url: typeof window === 'undefined' ? 'https://tokentoilet.com' : window.location.origin,
  icons: ['/toilet.svg'],
}

// Create Wagmi Adapter with multi-chain support
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
})

// Create AppKit with custom theming for violet design system
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
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
