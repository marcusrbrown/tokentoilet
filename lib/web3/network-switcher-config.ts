import type {SupportedChainId} from '@/hooks/use-wallet'
import {SUPPORTED_CHAIN_IDS_V1} from '@/lib/web3/chains'

export const CHAIN_INFO: Record<SupportedChainId, {name: string; icon: string}> = {
  11155111: {name: 'Sepolia', icon: '🧪'},
}

export const SUPPORTED_CHAIN_IDS: readonly SupportedChainId[] = [...SUPPORTED_CHAIN_IDS_V1]
