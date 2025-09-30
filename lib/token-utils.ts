/**
 * Utility functions for token amount handling in Web3 DeFi applications
 */

export interface TokenData {
  /**
   * Token contract address
   */
  address: string
  /**
   * Token symbol (e.g., "ETH", "USDC")
   */
  symbol: string
  /**
   * Token name (e.g., "Ethereum", "USD Coin")
   */
  name: string
  /**
   * Number of decimal places (e.g., 18 for ETH, 6 for USDC)
   */
  decimals: number
  /**
   * Token logo URL
   */
  logoUrl?: string
  /**
   * User's token balance in raw units (wei-like)
   */
  balance?: string
  /**
   * USD price per token
   */
  price?: number
}

/**
 * Format token amount for display with proper decimal precision
 */
export function formatTokenAmount(amount: string, decimals = 18, displayDecimals = 6): string {
  try {
    const num = Number.parseFloat(amount)
    if (Number.isNaN(num) || num === 0) return '0'

    // For very small amounts, show more decimals
    if (num < 0.001) {
      return num.toFixed(Math.min(decimals, displayDecimals + 3))
    }
    // For normal amounts, limit display decimals
    return num.toFixed(Math.min(decimals, displayDecimals))
  } catch {
    return '0'
  }
}

/**
 * Convert raw token balance to decimal string
 */
export function rawToDecimal(raw: string, decimals: number): string {
  try {
    const rawBigInt = BigInt(raw)
    const divisor = BigInt(10 ** decimals)
    const whole = rawBigInt / divisor
    const remainder = rawBigInt % divisor

    if (remainder === BigInt(0)) {
      return whole.toString()
    }

    const fractional = remainder.toString().padStart(decimals, '0').replace(/0+$/, '')
    return fractional ? `${whole}.${fractional}` : whole.toString()
  } catch {
    return '0'
  }
}

/**
 * Convert decimal string to raw token amount
 */
export function decimalToRaw(decimal: string, decimals: number): string {
  try {
    const [whole, fractional = ''] = decimal.split('.')
    const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals)
    const rawAmount = BigInt(whole + paddedFractional)
    return rawAmount.toString()
  } catch {
    return '0'
  }
}

/**
 * Calculate USD value for token amount
 */
export function calculateUsdValue(amount: string, price?: number): string {
  if (price === null || price === undefined || price === 0 || !amount) return '0.00'
  try {
    const num = Number.parseFloat(amount) * price
    return num.toFixed(2)
  } catch {
    return '0.00'
  }
}

/**
 * Format USD values with intelligent magnitude-based display
 *
 * Provides user-friendly formatting for token values in disposal workflows.
 * Uses abbreviated notation (K/M) for large values to improve readability
 * and help users quickly assess token values for disposal decisions.
 */
export function formatUsdValue(amount: string, price: number): string {
  if (price === null || price === undefined || price === 0 || !amount) return '$0.00'

  try {
    const numericAmount = Number.parseFloat(amount)
    if (Number.isNaN(numericAmount)) return '$0.00'

    const usdValue = numericAmount * price

    // Use abbreviated notation for better UX in token disposal context
    if (usdValue < 0.01) {
      return usdValue < 0.001 ? '<$0.001' : `$${usdValue.toFixed(3)}`
    }
    if (usdValue >= 1_000_000) {
      return `$${(usdValue / 1_000_000).toFixed(2)}M`
    }
    if (usdValue >= 1_000) {
      return `$${(usdValue / 1_000).toFixed(2)}K`
    }

    return `$${usdValue.toFixed(2)}`
  } catch (error) {
    // Log formatting errors for debugging while providing safe fallback
    console.error('Error formatting USD value:', error, {amount, price})
    return '$0.00'
  }
}

/**
 * Calculate total portfolio USD value from token array
 *
 * Essential for portfolio valuation in token disposal workflows.
 * Helps users understand the total value they're disposing of across multiple tokens
 * with formatted output for easy comprehension in the UI.
 */
export function calculateTotalUsdValue(tokens: {balance: string; decimals: number; price?: number}[]): string {
  let total = 0

  for (const token of tokens) {
    if (token.price != null && token.price > 0 && token.balance && token.decimals) {
      try {
        const balanceDecimal = rawToDecimal(token.balance, token.decimals)
        const tokenValue = Number.parseFloat(balanceDecimal) * token.price
        if (!Number.isNaN(tokenValue)) {
          total += tokenValue
        }
      } catch (error) {
        // Log calculation errors but continue processing other tokens
        console.error('Error calculating individual token USD value:', error, {
          balance: token.balance,
          decimals: token.decimals,
          price: token.price,
        })
      }
    }
  }

  return formatUsdValue(total.toString(), 1) // Price is 1 since total is already in USD
}

/**
 * Get percentage change indicator and color class for price changes
 *
 * Returns appropriate styling and display text for price change percentages
 * following the project's violet branding and semantic color patterns.
 */
export function getPriceChangeDisplay(priceChange?: number): {
  text: string
  colorClass: string
  isPositive: boolean | null
} {
  if (priceChange === null || priceChange === undefined || Number.isNaN(priceChange)) {
    return {
      text: '--',
      colorClass: 'text-gray-400 dark:text-gray-500',
      isPositive: null,
    }
  }

  const isPositive = priceChange > 0
  const absChange = Math.abs(priceChange)

  // Format percentage with appropriate precision
  let formattedChange: string
  if (absChange < 0.01) {
    formattedChange = absChange.toFixed(3)
  } else if (absChange < 1) {
    formattedChange = absChange.toFixed(2)
  } else {
    formattedChange = absChange.toFixed(1)
  }

  return {
    text: `${isPositive ? '+' : '-'}${formattedChange}%`,
    colorClass: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    isPositive,
  }
}

/**
 * Parse and validate price data from external APIs
 *
 * Safely extracts numeric price values from API responses,
 * handling various data formats and providing fallbacks.
 */
export function parseApiPrice(priceData: unknown): number | null {
  if (typeof priceData === 'number') {
    return Number.isNaN(priceData) || !Number.isFinite(priceData) ? null : priceData
  }

  if (typeof priceData === 'string') {
    const parsed = Number.parseFloat(priceData)
    return Number.isNaN(parsed) || !Number.isFinite(parsed) ? null : parsed
  }

  // Handle nested price objects (common in API responses)
  if (typeof priceData === 'object' && priceData !== null) {
    const obj = priceData as Record<string, unknown>

    // Try common price field names
    for (const field of ['usd', 'price', 'value', 'rate']) {
      if (field in obj) {
        const nestedPrice = parseApiPrice(obj[field])
        if (nestedPrice !== null) {
          return nestedPrice
        }
      }
    }
  }

  return null
}

/**
 * Validate token amount input
 */
export function validateTokenAmount(
  amount: string,
  token?: TokenData,
  minAmount?: string,
  maxAmount?: string,
): string | null {
  if (!amount || amount === '') return null

  // Check if it's a valid number
  const num = Number.parseFloat(amount)
  if (Number.isNaN(num)) {
    return 'Please enter a valid number'
  }

  // Check for negative amounts
  if (num < 0) {
    return 'Amount cannot be negative'
  }

  // Check decimal precision
  if (token && amount.includes('.')) {
    const decimalPlaces = amount.split('.')[1]?.length || 0
    if (decimalPlaces > token.decimals) {
      return `Maximum ${token.decimals} decimal places allowed for ${token.symbol}`
    }
  }

  // Check minimum amount
  if (minAmount !== null && minAmount !== undefined && minAmount !== '' && num < Number.parseFloat(minAmount)) {
    return `Minimum amount is ${minAmount}`
  }

  // Check maximum amount
  if (maxAmount !== null && maxAmount !== undefined && maxAmount !== '' && num > Number.parseFloat(maxAmount)) {
    return `Maximum amount is ${maxAmount}`
  }

  // Check balance if available
  if (token?.balance !== null && token?.balance !== undefined && token?.balance !== '') {
    const balanceDecimal = rawToDecimal(token.balance, token.decimals)
    if (num > Number.parseFloat(balanceDecimal)) {
      return `Insufficient ${token.symbol} balance`
    }
  }

  return null
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export function formatNumber(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`
  }
  return value.toFixed(2)
}

/**
 * Format timestamp to human-readable date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
