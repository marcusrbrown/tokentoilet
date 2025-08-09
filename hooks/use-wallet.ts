'use client'

import {useAppKit} from '@reown/appkit/react'
import {useAccount, useDisconnect} from 'wagmi'

export function useWallet() {
  const {open} = useAppKit()
  const {address, isConnected} = useAccount()
  const {disconnect} = useDisconnect()

  const handleConnect = async () => {
    try {
      await open()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      disconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  return {
    address,
    isConnected,
    connect: handleConnect,
    disconnect: handleDisconnect,
  }
}
