import {arbitrum, mainnet, polygon, sepolia, type AppKitNetwork} from '@reown/appkit/networks'

export const FUTURE_NETWORKS = [mainnet, polygon, arbitrum] as const

export const SUPPORTED_NETWORKS_V1: [AppKitNetwork] = [sepolia]

export const SUPPORTED_CHAIN_IDS_V1 = [sepolia.id] as const

export const SUPPORTED_NETWORK_INFO_V1 = {
  [sepolia.id]: {name: 'Sepolia', symbol: 'ETH'},
} as const

export const DEFAULT_SUPPORTED_NETWORK_V1 = sepolia
