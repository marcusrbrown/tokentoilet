'use client'

import {useWallet, type SupportedChainId} from '@/hooks/use-wallet'
import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import {ChevronDown, Loader2, Zap} from 'lucide-react'
import React, {useEffect, useRef, useState} from 'react'

import {Badge} from './badge'
import {Button} from './button'

/**
 * NetworkBadge com                <button
                  key={chain.id}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-700',
                    'focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700',
                    isCurrentChain && 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
                  )}
                  onClick={() => {
                    handleNetworkSwitch(chain.id as SupportedChainId).catch(console.error)
                  }}
                  disabled={isCurrentChain}iants using class-variance-authority
 * Provides consistent styling for network identification and switching
 */
const networkBadgeVariants = cva(
  // Base classes applied to all network badges
  ['inline-flex', 'items-center', 'gap-2', 'transition-all', 'duration-150'],
  {
    variants: {
      variant: {
        // Default variant with minimal styling
        default: ['text-gray-700', 'dark:text-gray-300'],
        // Interactive variant for clickable network switcher
        interactive: [
          'cursor-pointer',
          'rounded-lg',
          'px-3',
          'py-2',
          'hover:bg-gray-50',
          'hover:shadow-sm',
          'dark:hover:bg-gray-800',
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-violet-500',
          'focus:ring-offset-2',
          'focus:ring-offset-white',
          'dark:focus:ring-offset-gray-900',
        ],
        // Card variant with background and border
        card: [
          'bg-gray-50',
          'border',
          'border-gray-200',
          'rounded-lg',
          'px-3',
          'py-2',
          'dark:bg-gray-800',
          'dark:border-gray-700',
        ],
        // Glass variant with glass morphism effect
        glass: [
          'bg-white/60',
          'backdrop-blur-md',
          'border',
          'border-white/20',
          'rounded-lg',
          'px-3',
          'py-2',
          'shadow-sm',
          'dark:bg-gray-800/60',
          'dark:border-gray-700/40',
        ],
      },
      size: {
        sm: ['text-xs', 'gap-1.5'],
        md: ['text-sm', 'gap-2'],
        lg: ['text-base', 'gap-2.5'],
      },
      status: {
        connected: [],
        connecting: ['animate-pulse'],
        disconnected: ['opacity-60'],
        error: ['text-red-600', 'dark:text-red-400'],
        unsupported: ['text-amber-600', 'dark:text-amber-400'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      status: 'connected',
    },
  },
)

/**
 * Network configuration mapping chain IDs to display information
 */
const NETWORK_CONFIG = {
  1: {
    name: 'Ethereum',
    shortName: 'ETH',
    color: 'mainnet',
    icon: '⟠',
    explorerUrl: 'https://etherscan.io',
  },
  137: {
    name: 'Polygon',
    shortName: 'MATIC',
    color: 'polygon',
    icon: '⬟',
    explorerUrl: 'https://polygonscan.com',
  },
  42161: {
    name: 'Arbitrum',
    shortName: 'ARB',
    color: 'arbitrum',
    icon: '🔷',
    explorerUrl: 'https://arbiscan.io',
  },
} as const

export interface NetworkBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof networkBadgeVariants> {
  /**
   * Whether to show network switching functionality
   */
  showSwitcher?: boolean
  /**
   * Whether to show the network icon
   */
  showIcon?: boolean
  /**
   * Whether to show the full network name or short name
   */
  showFullName?: boolean
  /**
   * Whether to show the connected status dot
   */
  showStatusDot?: boolean
  /**
   * Custom network display name override
   */
  customName?: string
  /**
   * Callback when network switch is attempted
   */
  onNetworkSwitch?: (chainId: SupportedChainId) => void
  /**
   * Whether to show unsupported network warning
   */
  showUnsupportedWarning?: boolean
}

/**
 * NetworkBadge component for chain identification and switching
 *
 * @example
 * ```tsx
 * // Basic network display
 * <NetworkBadge />
 *
 * // Interactive network switcher
 * <NetworkBadge
 *   variant="interactive"
 *   showSwitcher
 *   showIcon
 *   showStatusDot
 * />
 *
 * // Glass morphism style with full features
 * <NetworkBadge
 *   variant="glass"
 *   size="lg"
 *   showSwitcher
 *   showIcon
 *   showFullName
 *   showStatusDot
 *   showUnsupportedWarning
 * />
 * ```
 */
const NetworkBadge = ({
  className,
  variant,
  size,
  status: statusProp,
  showSwitcher = false,
  showIcon = false,
  showFullName = false,
  showStatusDot = false,
  customName,
  onNetworkSwitch,
  showUnsupportedWarning = false,
  ...props
}: NetworkBadgeProps) => {
  const {
    chainId,
    isCurrentChainSupported,
    getUnsupportedNetworkError,
    switchToChain,
    isSwitchingChain,
    getSupportedChains,
  } = useWallet()

  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showDropdown])

  // Determine the actual status based on wallet state
  const getNetworkStatus = () => {
    if (statusProp) return statusProp

    if (isSwitchingChain) return 'connecting'
    if (!chainId) return 'disconnected'
    if (!isCurrentChainSupported) return 'unsupported'
    return 'connected'
  }

  const networkStatus = getNetworkStatus()
  const unsupportedError = getUnsupportedNetworkError()
  const supportedChains = getSupportedChains()

  // Get network display information
  const getNetworkInfo = () => {
    if (!chainId) {
      return {
        name: 'No Network',
        shortName: 'N/A',
        color: 'default' as const,
        icon: '❌',
      }
    }

    if (chainId in NETWORK_CONFIG) {
      return NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG]
    }

    // Unsupported network
    return {
      name: `Chain ${chainId}`,
      shortName: 'Unknown',
      color: 'default' as const,
      icon: '⚠️',
    }
  }

  const networkInfo = getNetworkInfo()
  const displayName = customName ?? (showFullName ? networkInfo.name : networkInfo.shortName)

  // Handle network switching
  const handleNetworkSwitch = async (targetChainId: SupportedChainId) => {
    try {
      await switchToChain(targetChainId)
      setShowDropdown(false)
      onNetworkSwitch?.(targetChainId)
    } catch (error) {
      console.error('Failed to switch network:', error)
      // Error handling is done in the useWallet hook
    }
  }

  // Handle interactive click
  const handleClick = () => {
    if (showSwitcher && !isSwitchingChain) {
      setShowDropdown(!showDropdown)
    }
  }

  // Render unsupported network warning
  if (showUnsupportedWarning && unsupportedError) {
    return (
      <div className={cn('flex flex-col gap-2', className)} {...props}>
        <div className={cn(networkBadgeVariants({variant, size, status: 'unsupported'}))}>
          <Badge variant="error" size={size} showDot>
            {networkInfo.icon} {displayName}
          </Badge>
          <span className="text-xs text-amber-600 dark:text-amber-400">Unsupported</span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Switch to a supported network to continue</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            handleNetworkSwitch(1).catch(console.error) // Switch to Ethereum mainnet
          }}
          disabled={isSwitchingChain}
        >
          {isSwitchingChain && <Loader2 className="h-3 w-3 animate-spin" />}
          Switch to Ethereum
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef} {...props}>
      <div
        className={cn(networkBadgeVariants({variant, size, status: networkStatus}), showSwitcher && 'cursor-pointer')}
        onClick={handleClick}
        role={showSwitcher ? 'button' : undefined}
        tabIndex={showSwitcher ? 0 : undefined}
        onKeyDown={
          showSwitcher
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClick()
                }
              }
            : undefined
        }
        aria-label={
          showSwitcher
            ? `Current network: ${displayName}. Click to switch networks.`
            : `Current network: ${displayName}`
        }
      >
        {/* Network Badge */}
        <Badge
          variant={networkInfo.color}
          size={size}
          showDot={showStatusDot}
          icon={showIcon ? <span className="text-xs">{networkInfo.icon}</span> : undefined}
        >
          {displayName}
        </Badge>

        {/* Network switching status indicators */}
        {isSwitchingChain && (
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs text-gray-500">Switching...</span>
          </div>
        )}

        {/* Network switcher dropdown indicator */}
        {showSwitcher && !isSwitchingChain && (
          <ChevronDown
            className={cn('h-3 w-3 text-gray-400 transition-transform duration-150', showDropdown && 'rotate-180')}
          />
        )}

        {/* Connection status indicator */}
        {networkStatus === 'unsupported' && (
          <span className="text-xs text-amber-600 dark:text-amber-400">⚠️ Unsupported</span>
        )}

        {networkStatus === 'error' && <span className="text-xs text-red-600 dark:text-red-400">❌ Error</span>}

        {networkStatus === 'disconnected' && <span className="text-xs text-gray-500">⭕ Disconnected</span>}
      </div>

      {/* Network switcher dropdown */}
      {showSwitcher && showDropdown && !isSwitchingChain && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg backdrop-blur-md z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">Switch Network</div>
            {supportedChains.map(chain => {
              const config = NETWORK_CONFIG[chain.id]
              const isCurrentChain = chainId === chain.id

              return (
                <button
                  key={chain.id}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-700',
                    'focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700',
                    isCurrentChain && 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
                  )}
                  onClick={() => {
                    handleNetworkSwitch(chain.id).catch(console.error)
                  }}
                  disabled={isCurrentChain}
                >
                  <span className="text-base">{config.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{config.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{config.shortName}</div>
                  </div>
                  {isCurrentChain && (
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span className="text-xs">Current</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

NetworkBadge.displayName = 'NetworkBadge'

export {NetworkBadge}
