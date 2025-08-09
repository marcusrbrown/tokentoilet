'use client'

import {useWallet} from '@/hooks/use-wallet'
import {Wallet} from 'lucide-react'

export function WalletButton() {
  const {address, isConnected, connect, disconnect} = useWallet()

  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  return (
    <button
      onClick={isConnected ? disconnect : connect}
      className="flex items-center gap-2 rounded-lg bg-violet-500 px-6 py-2 font-medium text-white transition-colors hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700"
    >
      <Wallet className="h-5 w-5" />
      {isConnected ? displayAddress : 'Connect Wallet'}
    </button>
  )
}
