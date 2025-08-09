import {createConfig, http} from 'wagmi'
import {mainnet, sepolia, type Chain} from 'wagmi/chains'

// You can get a project ID at https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

export const chains: Chain[] = [mainnet, sepolia]

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

export const web3ModalConfig = {
  projectId,
  chains,
  wagmiConfig,
  includedWallets: 'ALL',
  themeMode: 'light' as const,
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': 'rgb(124 58 237)', // violet-600
  },
}
