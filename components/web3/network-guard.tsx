'use client'

import {AlertTriangle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {useWallet} from '@/hooks/use-wallet'
import {DEFAULT_SUPPORTED_NETWORK_V1, SUPPORTED_NETWORK_INFO_V1} from '@/lib/web3/chains'

interface NetworkGuardProps {
  children: React.ReactNode
}

export function NetworkGuard({children}: NetworkGuardProps) {
  const {isConnected, chainId, isSupportedChain, switchToChain, isSwitchingChain} = useWallet()

  if (isConnected && chainId && !isSupportedChain(chainId)) {
    const targetChainId = DEFAULT_SUPPORTED_NETWORK_V1.id
    const targetNetworkName = SUPPORTED_NETWORK_INFO_V1[targetChainId].name

    const handleSwitch = () => {
      switchToChain(targetChainId).catch((error: unknown) => {
        console.error('Failed to switch network:', error)
      })
    }

    return (
      <Card
        variant="default"
        padding="sm"
        className="border-yellow-200 bg-yellow-50/80 dark:border-yellow-800 dark:bg-yellow-900/20 max-w-md mx-auto"
      >
        <div className="flex flex-col items-center text-center gap-3 text-sm text-yellow-800 dark:text-yellow-200 p-4">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-5 w-5" />
            <p>Network Not Supported</p>
          </div>
          <p>Switch to {targetNetworkName} to continue using the app.</p>
          <Button variant="web3Network" size="sm" loading={isSwitchingChain} onClick={handleSwitch}>
            {isSwitchingChain ? 'Switching...' : `Switch to ${targetNetworkName}`}
          </Button>
        </div>
      </Card>
    )
  }

  return <>{children}</>
}
