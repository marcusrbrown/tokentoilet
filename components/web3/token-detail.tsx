'use client'

import type {CategorizedToken} from '@/lib/web3/token-filtering'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Modal} from '@/components/ui/modal'
import {NetworkBadge} from '@/components/ui/network-badge'
import {Skeleton} from '@/components/ui/skeleton'
import {useTokenMetadata} from '@/hooks/use-token-metadata'
import {formatDate, formatNumber} from '@/lib/token-utils'
import {cn, formatAddress} from '@/lib/utils'
import {TokenCategory, TokenValueClass} from '@/lib/web3/token-filtering'
import {TokenRiskScore} from '@/lib/web3/token-metadata'
import {cva, type VariantProps} from 'class-variance-authority'
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Copy,
  DollarSign,
  Globe,
  Hash,
  Heart,
  Info,
  MessageCircle,
  PieChart,
  Shield,
  Star,
  TrendingDown,
  TrendingUp,
  Twitter,
  Users,
  X,
  Zap,
} from 'lucide-react'
import React, {useCallback, useState} from 'react'

// Strict type definitions for component variants
type RiskLevel = 'low' | 'medium' | 'high' | 'spam'

// Metadata error types for better error classification
interface MetadataError extends Error {
  type?: 'network' | 'timeout' | 'rate-limit' | 'unknown'
}

const tokenDetailVariants = cva(['w-full', 'space-y-6'], {
  variants: {
    variant: {
      modal: ['p-0'],
      inline: ['p-4', 'rounded-lg', 'border', 'bg-white/80', 'backdrop-blur-md', 'dark:bg-gray-900/80'],
    },
  },
  defaultVariants: {
    variant: 'modal',
  },
})

const tokenHeaderVariants = cva(
  [
    'relative',
    'p-6',
    'rounded-t-2xl',
    'bg-gradient-to-br',
    'from-violet-50/80',
    'to-blue-50/80',
    'dark:from-violet-900/40',
    'dark:to-blue-900/40',
    'backdrop-blur-sm',
    'border-b',
    'border-violet-200/50',
    'dark:border-violet-700/50',
  ],
  {
    variants: {
      riskLevel: {
        low: ['from-green-50/80', 'to-emerald-50/80', 'dark:from-green-900/40', 'dark:to-emerald-900/40'],
        medium: ['from-yellow-50/80', 'to-amber-50/80', 'dark:from-yellow-900/40', 'dark:to-amber-900/40'],
        high: ['from-red-50/80', 'to-orange-50/80', 'dark:from-red-900/40', 'dark:to-orange-900/40'],
        spam: ['from-red-100/80', 'to-pink-100/80', 'dark:from-red-800/40', 'dark:to-pink-800/40'],
      },
    },
    defaultVariants: {
      riskLevel: 'medium',
    },
  },
)

export interface TokenDetailProps extends VariantProps<typeof tokenDetailVariants> {
  /** Token to display details for */
  token: CategorizedToken
  /** Whether to show as modal */
  isModal?: boolean
  /** Whether the modal is open */
  open?: boolean
  /** Callback when modal should close */
  onClose?: () => void
  /** Callback when user wants to add token to favorites */
  onAddToFavorites?: (token: CategorizedToken) => void
  /** Callback when user wants to categorize token */
  onCategorizeToken?: (token: CategorizedToken, category: TokenCategory) => void
  /** Callback when user wants to report spam */
  onReportSpam?: (token: CategorizedToken) => void
  /** Additional CSS classes */
  className?: string
}

interface TokenDetailSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}

function TokenDetailSection({title, icon, children, className}: TokenDetailSectionProps): React.ReactElement {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

interface MetadataRowProps {
  label: string
  value: React.ReactNode
  copyable?: boolean
  className?: string
}

function MetadataRow({label, value, copyable = false, className}: MetadataRowProps): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (typeof value === 'string') {
      navigator.clipboard
        .writeText(value)
        .then(() => {
          setCopied(true)
          // 2-second timeout provides clear user feedback without being intrusive
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(error => {
          // Log error but don't throw - clipboard failures shouldn't break the component
          console.error('Failed to copy to clipboard:', error)
        })
    }
  }, [value])

  return (
    <div
      className={cn('flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800', className)}
    >
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
        {copyable && typeof value === 'string' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCopy}
            aria-label={copied ? `${label} copied` : `Copy ${label}`}
          >
            {copied ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-gray-400" />}
          </Button>
        )}
      </div>
    </div>
  )
}

function getRiskLevelFromToken(token: CategorizedToken): RiskLevel {
  // Prioritize spam classification over risk score because user safety is paramount
  // High spam scores indicate suspicious behavior patterns that override other risk factors
  if (token.category === 'spam' || token.spamScore > 70) {
    return 'spam'
  }
  switch (token.riskScore) {
    case TokenRiskScore.VERIFIED:
    case TokenRiskScore.LOW:
      return 'low'
    case TokenRiskScore.MEDIUM:
      return 'medium'
    case TokenRiskScore.HIGH:
      return 'high'
    case TokenRiskScore.UNKNOWN:
    default:
      // Default to medium risk for unknown tokens to encourage user caution
      return 'medium'
  }
}

function getCategoryIcon(category: TokenCategory): React.ReactNode {
  switch (category) {
    case TokenCategory.VALUABLE:
      return <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
    case TokenCategory.UNWANTED:
      return <X className="h-5 w-5 text-red-600 dark:text-red-400" />
    case TokenCategory.DUST:
      return <Coins className="h-5 w-5 text-gray-400" />
    case TokenCategory.SPAM:
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    case TokenCategory.UNKNOWN:
    default:
      return <Info className="h-5 w-5 text-gray-500" />
  }
}

function getCategoryBadge(category: TokenCategory): React.ReactNode {
  switch (category) {
    case TokenCategory.VALUABLE:
      return <Badge variant="confirmed">Valuable</Badge>
    case TokenCategory.UNWANTED:
      return <Badge variant="error">Unwanted</Badge>
    case TokenCategory.DUST:
      return <Badge variant="default">Dust</Badge>
    case TokenCategory.SPAM:
      return <Badge variant="error">Spam</Badge>
    case TokenCategory.UNKNOWN:
    default:
      return <Badge variant="default">Unknown</Badge>
  }
}

function getValueClassBadge(valueClass: TokenValueClass): React.ReactNode {
  switch (valueClass) {
    case TokenValueClass.HIGH_VALUE:
      return (
        <Badge variant="confirmed">
          <TrendingUp className="h-3 w-3 mr-1" />
          High Value
        </Badge>
      )
    case TokenValueClass.MEDIUM_VALUE:
      return (
        <Badge variant="default">
          <DollarSign className="h-3 w-3 mr-1" />
          Medium Value
        </Badge>
      )
    case TokenValueClass.LOW_VALUE:
    case TokenValueClass.MICRO_VALUE:
      return (
        <Badge variant="default">
          <TrendingDown className="h-3 w-3 mr-1" />
          Low Value
        </Badge>
      )
    case TokenValueClass.DUST:
      return (
        <Badge variant="default">
          <Coins className="h-3 w-3 mr-1" />
          Dust
        </Badge>
      )
    case TokenValueClass.UNKNOWN:
    default:
      return <Badge variant="default">Unknown Value</Badge>
  }
}

function getRiskBadge(riskScore: TokenRiskScore): React.ReactNode {
  switch (riskScore) {
    case TokenRiskScore.VERIFIED:
      return (
        <Badge variant="confirmed">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )
    case TokenRiskScore.LOW:
      return (
        <Badge variant="confirmed">
          <Shield className="h-3 w-3 mr-1" />
          Low Risk
        </Badge>
      )
    case TokenRiskScore.MEDIUM:
      return (
        <Badge variant="pending">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Medium Risk
        </Badge>
      )
    case TokenRiskScore.HIGH:
      return (
        <Badge variant="error">
          <AlertTriangle className="h-3 w-3 mr-1" />
          High Risk
        </Badge>
      )
    case TokenRiskScore.UNKNOWN:
      return <Badge variant="default">Unknown Risk</Badge>
    default:
      return <Badge variant="default">Unknown Risk</Badge>
  }
}

interface SocialLinkButtonProps {
  href: string
  icon: React.ReactNode
  label: string
}

function SocialLinkButton({href, icon, label}: SocialLinkButtonProps): React.ReactElement {
  const handleClick = useCallback(() => {
    // Critical security: 'noopener' prevents new window from accessing parent window object
    // 'noreferrer' prevents leaking the current page URL to external site
    // These flags protect against malicious external sites accessing Web3 state
    window.open(href, '_blank', 'noopener,noreferrer')
  }, [href])

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  )
}

/**
 * Comprehensive token detail view component displaying extended metadata and security information.
 *
 * Features:
 * - Complete token metadata display with multiple data sources
 * - Security validation and risk assessment indicators
 * - Market data integration with price and volume information
 * - Social links and community information
 * - Contract security analysis with verification status
 * - User interaction controls (favorites, categorization, reporting)
 * - Responsive design with modal and inline variants
 * - Glass morphism styling consistent with design system
 */
export function TokenDetail({
  token,
  isModal = false,
  open = false,
  onClose,
  onAddToFavorites,
  onCategorizeToken,
  onReportSpam,
  className,
  variant = 'modal',
  ...props
}: TokenDetailProps): React.ReactElement {
  const {
    metadata,
    isLoading: isLoadingMetadata,
    error: metadataError,
    validation,
  } = useTokenMetadata(token.address, token.chainId)

  const riskLevel = getRiskLevelFromToken(token)

  const renderTokenHeader = (): React.ReactElement => (
    <div className={tokenHeaderVariants({riskLevel})}>
      {isModal && onClose != null && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 h-8 w-8 p-0"
          onClick={onClose}
          aria-label="Close token details"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="flex items-start gap-4">
        {/* Token Logo or Placeholder */}
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-800 dark:to-blue-800 flex items-center justify-center flex-shrink-0">
          {metadata?.logoURI != null && metadata.logoURI.trim().length > 0 ? (
            <div
              style={{
                backgroundImage: `url(${metadata.logoURI})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              className="h-12 w-12 rounded-full"
              role="img"
              aria-label={`${token.name} logo`}
            />
          ) : (
            <Coins className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{token.name}</h2>
            <Badge variant="default" size="sm">
              {token.symbol}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <NetworkBadge size="sm" variant="glass" />
            {getCategoryBadge(token.category)}
            {getValueClassBadge(token.valueClass)}
            {getRiskBadge(token.riskScore)}
          </div>

          {/* Balance and Value */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400 block">Balance</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {token.formattedBalance} {token.symbol}
              </span>
            </div>
            {token.estimatedValueUSD != null && (
              <div>
                <span className="text-gray-600 dark:text-gray-400 block">Value</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ${formatNumber(token.estimatedValueUSD)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        {onAddToFavorites != null && (
          <Button variant="outline" size="sm" onClick={() => onAddToFavorites(token)} className="flex-1">
            <Heart className="h-4 w-4 mr-2" />
            {token.isUserFavorite === true ? 'Remove from Favorites' : 'Add to Favorites'}
          </Button>
        )}
        {onReportSpam != null && token.category !== 'spam' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReportSpam(token)}
            className="text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Spam
          </Button>
        )}
      </div>
    </div>
  )

  const renderBasicInfo = (): React.ReactElement => (
    <TokenDetailSection title="Basic Information" icon={<Info className="h-4 w-4" />}>
      <div className="space-y-1">
        <MetadataRow label="Contract Address" value={formatAddress(token.address, 4)} copyable />
        <MetadataRow label="Chain ID" value={token.chainId.toString()} />
        <MetadataRow label="Decimals" value={token.decimals.toString()} />
        <MetadataRow label="Analysis Time" value={formatDate(token.analysisTimestamp)} />
        {token.confidenceScore != null && <MetadataRow label="Confidence Score" value={`${token.confidenceScore}%`} />}
      </div>
    </TokenDetailSection>
  )

  const renderMarketData = (): React.ReactElement | null => {
    if (
      metadata == null ||
      (metadata.priceUSD == null && metadata.marketCapUSD == null && metadata.volume24hUSD == null)
    ) {
      return null
    }

    return (
      <TokenDetailSection title="Market Data" icon={<PieChart className="h-4 w-4" />}>
        <div className="space-y-1">
          {metadata.priceUSD != null && (
            <MetadataRow label="Price (USD)" value={`$${formatNumber(metadata.priceUSD)}`} />
          )}
          {metadata.marketCapUSD != null && (
            <MetadataRow label="Market Cap" value={`$${formatNumber(metadata.marketCapUSD)}`} />
          )}
          {metadata.volume24hUSD != null && (
            <MetadataRow label="24h Volume" value={`$${formatNumber(metadata.volume24hUSD)}`} />
          )}
          {metadata.priceChange24h != null && (
            <MetadataRow
              label="24h Change"
              value={
                <span className={metadata.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {metadata.priceChange24h >= 0 ? '+' : ''}
                  {metadata.priceChange24h.toFixed(2)}%
                </span>
              }
            />
          )}
        </div>
      </TokenDetailSection>
    )
  }

  const renderSocialLinks = (): React.ReactElement | null => {
    if (
      metadata == null ||
      (metadata.website == null && metadata.twitter == null && metadata.telegram == null && metadata.discord == null)
    ) {
      return null
    }

    return (
      <TokenDetailSection title="Social & Links" icon={<Users className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2">
          {metadata.website != null && metadata.website.trim().length > 0 && (
            <SocialLinkButton href={metadata.website} icon={<Globe className="h-4 w-4" />} label="Website" />
          )}
          {metadata.twitter != null && metadata.twitter.trim().length > 0 && (
            <SocialLinkButton href={metadata.twitter} icon={<Twitter className="h-4 w-4" />} label="Twitter" />
          )}
          {metadata.telegram != null && metadata.telegram.trim().length > 0 && (
            <SocialLinkButton href={metadata.telegram} icon={<MessageCircle className="h-4 w-4" />} label="Telegram" />
          )}
          {metadata.discord != null && metadata.discord.trim().length > 0 && (
            <SocialLinkButton href={metadata.discord} icon={<Hash className="h-4 w-4" />} label="Discord" />
          )}
        </div>
      </TokenDetailSection>
    )
  }

  const renderSecurityInfo = (): React.ReactElement => (
    <TokenDetailSection title="Security & Risk Assessment" icon={<Shield className="h-4 w-4" />}>
      <div className="space-y-3">
        <div className="space-y-1">
          <MetadataRow label="Risk Score" value={getRiskBadge(token.riskScore)} />
          <MetadataRow label="Spam Score" value={`${token.spamScore}%`} />
          {token.isVerified != null && <MetadataRow label="Verified" value={token.isVerified ? 'Yes' : 'No'} />}
        </div>
      </div>
    </TokenDetailSection>
  )

  const renderMetadataInfo = (): React.ReactElement | null => {
    if (metadata == null) return null

    return (
      <TokenDetailSection title="Metadata Sources" icon={<Zap className="h-4 w-4" />}>
        <div className="space-y-1">
          <MetadataRow label="Last Updated" value={formatDate(metadata.lastUpdated)} />
          <MetadataRow label="Data Sources" value={metadata.sources.length.toString()} />
          {validation != null && <MetadataRow label="Completeness" value={`${validation.completeness}%`} />}
        </div>

        {metadata.description != null && metadata.description.trim().length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">{metadata.description}</p>
          </div>
        )}
      </TokenDetailSection>
    )
  }

  const renderCategorizationControls = (): React.ReactElement | null => {
    if (onCategorizeToken == null) return null

    const categories = [
      {value: TokenCategory.VALUABLE, label: 'Valuable', icon: <Star className="h-4 w-4" />},
      {value: TokenCategory.UNWANTED, label: 'Unwanted', icon: <X className="h-4 w-4" />},
      {value: TokenCategory.DUST, label: 'Dust', icon: <Coins className="h-4 w-4" />},
      {value: TokenCategory.SPAM, label: 'Spam', icon: <AlertTriangle className="h-4 w-4" />},
    ]

    return (
      <TokenDetailSection title="Categorization" icon={getCategoryIcon(token.category)}>
        <div className="grid grid-cols-2 gap-2">
          {categories.map(cat => (
            <Button
              key={cat.value}
              variant={token.category === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategorizeToken(token, cat.value)}
              className="justify-start"
            >
              {cat.icon}
              <span className="ml-2">{cat.label}</span>
            </Button>
          ))}
        </div>
      </TokenDetailSection>
    )
  }

  const content = (
    <div className={cn(tokenDetailVariants({variant}), className)} {...props}>
      {renderTokenHeader()}

      <div className="p-6 space-y-6">
        {isLoadingMetadata ? (
          <div className="space-y-4">
            <Skeleton variant="web3" className="h-8 w-full" />
            <Skeleton variant="web3" className="h-24 w-full" />
            <Skeleton variant="web3" className="h-16 w-full" />
          </div>
        ) : metadataError ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {(metadataError as MetadataError).type === 'network' || metadataError.message.includes('network')
                  ? 'Network connection issue'
                  : (metadataError as MetadataError).type === 'timeout' || metadataError.message.includes('timeout')
                    ? 'Request timed out'
                    : (metadataError as MetadataError).type === 'rate-limit' ||
                        metadataError.message.includes('rate limit')
                      ? 'Rate limit exceeded'
                      : 'Failed to load extended metadata'}
              </span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {(metadataError as MetadataError).type === 'network' || metadataError.message.includes('network')
                ? 'Please check your internet connection and try again'
                : (metadataError as MetadataError).type === 'timeout' || metadataError.message.includes('timeout')
                  ? 'The request took too long. Basic token information is still available'
                  : (metadataError as MetadataError).type === 'rate-limit' ||
                      metadataError.message.includes('rate limit')
                    ? 'Too many requests. Extended data will be available shortly'
                    : metadataError.message}
            </p>
            {(metadataError as MetadataError).type === 'network' ||
            metadataError.message.includes('network') ||
            (metadataError as MetadataError).type === 'timeout' ||
            metadataError.message.includes('timeout') ? (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : null}

        {renderBasicInfo()}
        {renderMarketData()}
        {renderSocialLinks()}
        {renderSecurityInfo()}
        {renderMetadataInfo()}
        {renderCategorizationControls()}
      </div>
    </div>
  )

  if (isModal) {
    return (
      <Modal open={open} onClose={onClose || (() => {})} variant="web3" size="2xl">
        {content}
      </Modal>
    )
  }

  return content
}
