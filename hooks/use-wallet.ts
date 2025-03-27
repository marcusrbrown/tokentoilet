'use client'

import {useAccount, useConnect, useDisconnect} from 'wagmi'
import {useWeb3Modal} from '@web3modal/wagmi/react'

export function useWallet() {
  const {open} = useWeb3Modal()
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
