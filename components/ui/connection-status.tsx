'use client'

import {useWallet} from '@/hooks/use-wallet'
import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {AlertCircle, CheckCircle2, Loader2, Network, Wallet, WifiOff, Zap} from 'lucide-react'
import React from 'react'

import {Badge} from './badge'
import {Button} from './button'

/**
 * ConnectionStatus component variants using class-variance-authority
 * Provides consistent styling for wallet connection state visualization
 */
const connectionStatusVariants = cva(
  // Base classes applied to all connection status displays
  ['inline-flex', 'items-center', 'gap-3', 'rounded-lg', 'transition-all', 'duration-200'],
  {
    variants: {
      variant: {
        // Default minimal variant
        default: ['text-gray-700', 'dark:text-gray-300'],
        // Card variant with background and padding
        card: [
          'bg-white/80',
          'backdrop-blur-md',
          'border',
          'border-white/20',
          'px-4',
          'py-3',
          'shadow-sm',
          'dark:bg-gray-900/80',
          'dark:border-gray-700/20',
        ],
        // Compact variant for smaller spaces
        compact: ['gap-2', 'text-sm'],
        // Glass variant with enhanced glass morphism
        glass: [
          'bg-white/60',
          'backdrop-blur-lg',
          'border',
          'border-white/30',
          'px-4',
          'py-3',
          'shadow-md',
          'dark:bg-gray-800/60',
          'dark:border-gray-700/30',
        ],
      },
      size: {
        sm: ['text-xs', 'gap-2'],
        md: ['text-sm', 'gap-3'],
        lg: ['text-base', 'gap-4'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export interface ConnectionStatusProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof connectionStatusVariants> {
  /** Show network switching button when on unsupported network */
  showNetworkSwitch?: boolean
  /** Show detailed error messages */
  showErrorDetails?: boolean
  /** Custom action button for connection */
  actionButton?: React.ReactNode
  /** Hide status badge */
  hideBadge?: boolean
  /** Hide wallet address when connected */
  hideAddress?: boolean
}

/**
 * ConnectionStatus component for visualizing wallet connection state
 *
 * Displays current wallet connection status with appropriate icons, badges, and actions.
 * Provides visual feedback for connected, connecting, disconnected, and error states.
 * Includes network validation and switching capabilities for unsupported networks.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ConnectionStatus />
 *
 * // Card variant with network switching
 * <ConnectionStatus variant="card" showNetworkSwitch />
 *
 * // Compact variant with custom action
 * <ConnectionStatus
 *   variant="compact"
 *   size="sm"
 *   actionButton={<Button size="sm">Connect</Button>}
 * />
 * ```
 */
export const ConnectionStatus = ({
  variant,
  size,
  showNetworkSwitch = true,
  showErrorDetails = true,
  actionButton,
  hideBadge = false,
  hideAddress = false,
  className,
  ref,
  ...props
}: ConnectionStatusProps & {ref?: React.Ref<HTMLDivElement>}) => {
  const {
    address,
    isConnected,
    connect,
    disconnect,
    currentNetwork,
    isCurrentChainSupported,
    getUnsupportedNetworkError,
    handleUnsupportedNetwork,
    validateCurrentNetwork,
    isSwitchingChain,
  } = useWallet()

  // Determine connection state
  const getConnectionState = () => {
    if (!isConnected) return 'disconnected'
    if (isSwitchingChain) return 'switching'
    if (!isCurrentChainSupported) return 'unsupported'
    return 'connected'
  }

  const connectionState = getConnectionState()
  const unsupportedNetworkError = getUnsupportedNetworkError()
  const networkValidationError = validateCurrentNetwork()

  // Get status icon based on connection state
  const getStatusIcon = () => {
    const iconProps = {
      className: cn('flex-shrink-0', size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'),
    }

    switch (connectionState) {
      case 'connected':
        return <CheckCircle2 {...iconProps} className={cn(iconProps.className, 'text-green-600')} />
      case 'switching':
        return <Loader2 {...iconProps} className={cn(iconProps.className, 'text-yellow-600 animate-spin')} />
      case 'unsupported':
        return <AlertCircle {...iconProps} className={cn(iconProps.className, 'text-amber-600')} />
      case 'disconnected':
      default:
        return <WifiOff {...iconProps} className={cn(iconProps.className, 'text-gray-500')} />
    }
  }

  // Get status badge variant
  const getBadgeVariant = () => {
    switch (connectionState) {
      case 'connected':
        return 'connected'
      case 'switching':
        return 'connecting'
      case 'unsupported':
        return 'error'
      case 'disconnected':
      default:
        return 'disconnected'
    }
  }

  // Get status text
  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return currentNetwork ? `Connected to ${currentNetwork.name}` : 'Connected'
      case 'switching':
        return 'Switching Network...'
      case 'unsupported':
        return unsupportedNetworkError
          ? `Unsupported Network (${unsupportedNetworkError.currentChainId})`
          : 'Unsupported Network'
      case 'disconnected':
      default:
        return 'Not Connected'
    }
  }

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Handle connect action
  const handleConnect = () => {
    connect().catch(error => {
      console.error('Connection failed:', error)
    })
  }

  // Handle disconnect action
  const handleDisconnect = () => {
    disconnect().catch(error => {
      console.error('Disconnect failed:', error)
    })
  }

  // Handle network switch action
  const handleNetworkSwitch = () => {
    if (unsupportedNetworkError) {
      handleUnsupportedNetwork(true).catch(error => {
        console.error('Network switch failed:', error)
      })
    }
  }

  return (
    <div ref={ref} className={cn(connectionStatusVariants({variant, size}), className)} {...props}>
      {/* Status Icon */}
      {getStatusIcon()}

      {/* Status Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Status Text */}
          <span className="font-medium truncate">{getStatusText()}</span>

          {/* Status Badge */}
          {!hideBadge && (
            <Badge variant={getBadgeVariant()} size={size === 'sm' ? 'sm' : 'lg'}>
              {connectionState}
            </Badge>
          )}
        </div>

        {/* Address Display */}
        {isConnected && address !== undefined && address !== null && address.length > 0 && !hideAddress && (
          <div className="flex items-center gap-2 mt-1">
            <Wallet className={cn('flex-shrink-0 text-gray-400', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
            <span
              className={cn(
                'font-mono text-gray-600 dark:text-gray-400 truncate',
                size === 'sm' ? 'text-xs' : 'text-sm',
              )}
            >
              {formatAddress(address)}
            </span>
          </div>
        )}

        {/* Network Information */}
        {isConnected && currentNetwork && (
          <div className="flex items-center gap-2 mt-1">
            <Network className={cn('flex-shrink-0 text-gray-400', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
            <span className={cn('text-gray-600 dark:text-gray-400 truncate', size === 'sm' ? 'text-xs' : 'text-sm')}>
              {currentNetwork.name} ({currentNetwork.symbol})
            </span>
          </div>
        )}

        {/* Error Details */}
        {showErrorDetails && networkValidationError && (
          <div className="mt-2">
            <p className={cn('text-red-600 dark:text-red-400', size === 'sm' ? 'text-xs' : 'text-sm')}>
              {networkValidationError.userFriendlyMessage ?? networkValidationError.message ?? 'Unknown error'}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Custom Action Button */}
        {actionButton}

        {/* Network Switch Button */}
        {showNetworkSwitch && connectionState === 'unsupported' && unsupportedNetworkError && (
          <Button
            variant="outline"
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
            onClick={handleNetworkSwitch}
            disabled={isSwitchingChain}
            className="flex-shrink-0"
          >
            {isSwitchingChain ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Switching...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Switch Network
              </>
            )}
          </Button>
        )}

        {/* Connect/Disconnect Button */}
        {actionButton === undefined && (
          <>
            {isConnected ? (
              <Button
                variant="outline"
                size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
                onClick={handleDisconnect}
                className="flex-shrink-0"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                variant="default"
                size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
                onClick={handleConnect}
                className="flex-shrink-0"
              >
                Connect Wallet
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
