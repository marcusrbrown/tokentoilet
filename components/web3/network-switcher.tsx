'use client'

import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {NetworkBadge} from '@/components/ui/network-badge'
import {useWallet, type SupportedChainId} from '@/hooks/use-wallet'
import {cn} from '@/lib/utils'
import {SUPPORTED_CHAIN_IDS_V1} from '@/lib/web3/chains'

const CHAIN_INFO: Record<SupportedChainId, {name: string; icon: string}> = {
  11155111: {name: 'Sepolia', icon: '🧪'},
}

const SUPPORTED_CHAIN_IDS: readonly SupportedChainId[] = [...SUPPORTED_CHAIN_IDS_V1]

export {CHAIN_INFO, SUPPORTED_CHAIN_IDS}

export interface NetworkSwitcherProps {
  className?: string
  showCurrentOnly?: boolean
}

export function NetworkSwitcher({className, showCurrentOnly = false}: NetworkSwitcherProps) {
  const {chainId, isCurrentChainSupported, switchToChain, isConnected} = useWallet()
  const [isSwitching, setIsSwitching] = useState<number | null>(null)

  const handleSwitch = async (targetChainId: SupportedChainId) => {
    if (targetChainId === chainId) return

    setIsSwitching(targetChainId)
    try {
      await switchToChain(targetChainId)
    } catch {
    } finally {
      setIsSwitching(null)
    }
  }

  if (!isConnected) return null

  if (showCurrentOnly) {
    return (
      <NetworkBadge className={cn(!isCurrentChainSupported && 'border-red-500', className)} showIcon showFullName />
    )
  }

  return (
    <div className={cn('flex gap-2', className)} role="group" aria-label="Network switcher">
      {SUPPORTED_CHAIN_IDS.map(id => (
        <Button
          key={id}
          variant={chainId === id ? 'default' : 'secondary'}
          size="sm"
          onClick={() => {
            handleSwitch(id).catch(console.error)
          }}
          disabled={isSwitching !== null}
          loading={isSwitching === id}
          aria-pressed={chainId === id}
          leftIcon={<span aria-hidden="true">{CHAIN_INFO[id].icon}</span>}
        >
          {CHAIN_INFO[id].name}
        </Button>
      ))}
    </div>
  )
}

NetworkSwitcher.displayName = 'NetworkSwitcher'
