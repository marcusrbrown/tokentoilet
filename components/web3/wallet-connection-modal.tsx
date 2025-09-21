'use client'

import {useWallet} from '@/hooks/use-wallet'
import {useWalletPersistence} from '@/hooks/use-wallet-persistence'
import {cn} from '@/lib/utils'
import {CheckCircle, Copy, ExternalLink, Wifi, X} from 'lucide-react'
import {useEffect, useRef, useState} from 'react'

import {Badge} from '../ui/badge'
import {Button} from '../ui/button'
import {Card} from '../ui/card'
import {Modal} from '../ui/modal'

export interface WalletConnectionModalProps {
  open: boolean
  onClose: () => void
  onConnectionSuccess?: (address: string, chainId: number) => void
  onConnectionError?: (error: Error) => void
  showNetworkSelection?: boolean
  showPersistenceOptions?: boolean
  className?: string
}

type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase' | 'browser'
type ConnectionStep = 'select' | 'connecting' | 'success' | 'error'

const walletProviders: {
  id: WalletProvider
  name: string
  description: string
  icon: string
  isPopular: boolean
}[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Connect with MetaMask browser extension',
    icon: '🦊',
    isPopular: true,
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Connect with mobile wallet via QR code',
    icon: '📱',
    isPopular: true,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Connect with Coinbase Wallet',
    icon: '🔵',
    isPopular: true,
  },
  {
    id: 'browser',
    name: 'Browser Wallet',
    description: 'Connect with any browser wallet',
    icon: '🌐',
    isPopular: false,
  },
]

export function WalletConnectionModal({
  open,
  onClose,
  onConnectionSuccess,
  onConnectionError,
  showNetworkSelection = true,
  showPersistenceOptions = true,
  className,
}: WalletConnectionModalProps) {
  const {address, isConnected, connect, chainId, getSupportedChains} = useWallet()
  const {autoReconnect, preferredChain, setAutoReconnect, setPreferredChain} = useWalletPersistence()

  // Modal state - initialized with proper defaults
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('select')
  const [selectedProvider, setSelectedProvider] = useState<WalletProvider | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<number>(1)

  // Cleanup ref
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize selected network from persistence
  useEffect(() => {
    if (typeof preferredChain === 'number' && selectedNetwork !== preferredChain) {
      const timer = setTimeout(() => {
        setSelectedNetwork(preferredChain)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [preferredChain, selectedNetwork])

  // Reset modal state when opening - using setTimeout to avoid direct setState in useEffect
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setConnectionStep('select')
        setSelectedProvider(null)
        setConnectionError(null)
        setSelectedNetwork(preferredChain ?? 1)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open, preferredChain])

  // Handle connection success - using setTimeout to avoid direct setState in useEffect
  useEffect(() => {
    if (isConnected && typeof address === 'string' && address.length > 0 && connectionStep === 'connecting') {
      const timer = setTimeout(() => {
        setConnectionStep('success')
        if (onConnectionSuccess) {
          onConnectionSuccess(address, chainId)
        }
        // Auto-close after showing success
        successTimeoutRef.current = setTimeout(onClose, 1500)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isConnected, address, connectionStep, chainId, onConnectionSuccess, onClose]) // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  const supportedChains = getSupportedChains()

  const handleProviderSelect = async (provider: WalletProvider) => {
    setSelectedProvider(provider)
    setConnectionStep('connecting')
    setConnectionError(null)

    try {
      // Switch network if different from selected
      if (selectedNetwork !== chainId) {
        await setPreferredChain(selectedNetwork)
      }

      await connect()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      setConnectionError(errorMessage)
      setConnectionStep('error')

      if (onConnectionError) {
        onConnectionError(error instanceof Error ? error : new Error(errorMessage))
      }
    }
  }

  const handleNetworkSelect = (chainId: number) => {
    setSelectedNetwork(chainId)
    setPreferredChain(chainId).catch(error => {
      console.error('Failed to set preferred chain:', error)
    })
  }

  const handleAutoReconnectToggle = () => {
    setAutoReconnect(!autoReconnect).catch(error => {
      console.error('Failed to toggle auto-reconnect:', error)
    })
  }

  const handleRetry = () => {
    setConnectionStep('select')
    setConnectionError(null)
    setSelectedProvider(null)
  }

  const getProviderInstructions = (provider: WalletProvider) => {
    switch (provider) {
      case 'metamask':
        return 'Follow the prompts in your MetaMask extension to complete the connection.'
      case 'walletconnect':
        return 'Scan the QR code with your mobile wallet or tap the button below'
      case 'coinbase':
        return 'Follow the prompts in Coinbase Wallet to authorize the connection.'
      case 'browser':
        return 'Follow the prompts in your browser wallet to complete the connection.'
    }
  }

  const getDetailedInstructions = (provider: WalletProvider) => {
    switch (provider) {
      case 'walletconnect':
        return 'Open your mobile wallet and scan the QR code from the WalletConnect popup'
      case 'metamask':
      case 'coinbase':
      case 'browser':
        return `Make sure your ${provider} wallet is unlocked and ready to connect`
    }
  }

  const renderSelectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Connect Your Wallet</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Choose your preferred wallet to connect to Token Toilet
        </p>
      </div>

      {showNetworkSelection && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Select Network</h3>
          <div className="grid grid-cols-1 gap-2">
            {supportedChains.map(chain => (
              <button
                key={chain.id}
                type="button"
                onClick={() => {
                  handleNetworkSelect(chain.id)
                }}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                  'hover:bg-gray-50 dark:hover:bg-gray-700',
                  selectedNetwork === chain.id
                    ? 'border-violet-300 bg-violet-50 dark:bg-violet-900/30'
                    : 'border-gray-200 dark:border-gray-600',
                )}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{chain.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{chain.symbol}</div>
                </div>
                {selectedNetwork === chain.id && <CheckCircle className="h-5 w-5 text-violet-600" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Choose Wallet Provider</h3>
        <div className="grid grid-cols-1 gap-2">
          {walletProviders.map(provider => (
            <button
              key={provider.id}
              type="button"
              onClick={() => {
                handleProviderSelect(provider.id).catch(console.error)
              }}
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="text-2xl">{provider.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{provider.name}</span>
                  {provider.isPopular && <Badge variant="default">Popular</Badge>}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{provider.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showPersistenceOptions && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Connection Preferences</h3>
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Auto-reconnect</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Automatically connect on future visits</div>
            </div>
            <Button variant={autoReconnect ? 'default' : 'secondary'} size="sm" onClick={handleAutoReconnectToggle}>
              {autoReconnect ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => window.open('https://ethereum.org/en/wallets/', '_blank')}
          className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors inline-flex items-center gap-1"
        >
          Learn about wallets
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  )

  const renderConnectingStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Connecting Wallet</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {selectedProvider && `Connecting to ${walletProviders.find(p => p.id === selectedProvider)?.name}...`}
        </p>
      </div>

      <div className="flex justify-center">
        <div className="animate-pulse">
          <Wifi className="h-12 w-12 text-violet-600" />
        </div>
      </div>

      {selectedProvider && (
        <div className="space-y-4">
          <Card className="p-4 bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700">
            <p className="text-sm text-violet-800 dark:text-violet-200">{getProviderInstructions(selectedProvider)}</p>
          </Card>

          <p className="text-xs text-gray-500 dark:text-gray-400">{getDetailedInstructions(selectedProvider)}</p>
        </div>
      )}

      <Button variant="secondary" onClick={onClose} className="w-full">
        Cancel
      </Button>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Wallet Connected!</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Successfully connected to Token Toilet</p>
      </div>

      {typeof address === 'string' && address.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Wallet Address</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(address).catch(console.error)
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">This modal will close automatically...</div>
    </div>
  )

  const renderErrorStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <div className="flex justify-center mb-4">
          <X className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Connection Failed</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {connectionError ?? 'Unable to connect to wallet'}
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button onClick={handleRetry} className="flex-1">
          Try Again
        </Button>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (connectionStep) {
      case 'select':
        return renderSelectStep()
      case 'connecting':
        return renderConnectingStep()
      case 'success':
        return renderSuccessStep()
      case 'error':
        return renderErrorStep()
      default:
        return renderSelectStep()
    }
  }

  return (
    <Modal open={open} onClose={onClose} className={className}>
      <div className="w-full max-w-md mx-auto p-6">{renderCurrentStep()}</div>
    </Modal>
  )
}
