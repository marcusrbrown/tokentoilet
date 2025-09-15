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
