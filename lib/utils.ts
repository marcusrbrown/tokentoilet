import {clsx, type ClassValue} from 'clsx'
import {twMerge} from 'tailwind-merge'

/**
 * Utility function that combines clsx and tailwind-merge for optimal className handling
 * @param inputs - Array of class values to merge
 * @returns Merged and deduplicated className string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format Web3 addresses for display
 * @param address - The full address string
 * @param chars - Number of characters to show at start and end (default: 4)
 * @returns Formatted address string
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length <= chars * 2) {
    return address
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Check if an address is valid Ethereum address format
 * @param address - Address string to validate
 * @returns Boolean indicating if address is valid format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Convert hex color to RGB values
 * @param hex - Hex color string (with or without #)
 * @returns RGB object with r, g, b values
 */
export function hexToRgb(hex: string): {r: number; g: number; b: number} | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

/**
 * Create CSS custom property name from design token path
 * @param path - Dot-separated path (e.g., 'colors.violet.500')
 * @returns CSS custom property name (e.g., '--color-violet-500')
 */
export function createCSSVar(path: string): string {
  return `--${path.replaceAll('.', '-')}`
}

/**
 * Get CSS custom property value with fallback
 * @param property - CSS custom property name
 * @param fallback - Fallback value if property not found
 * @returns CSS var() expression
 */
export function getCSSVar(property: string, fallback?: string): string {
  const varName = property.startsWith('--') ? property : `--${property}`
  return fallback !== undefined && fallback !== '' ? `var(${varName}, ${fallback})` : `var(${varName})`
}

/**
 * Generate focus ring classes for accessibility
 * @param color - Focus ring color (default: 'violet-500')
 * @returns Focus ring className string
 */
export function focusRing(color = 'violet-500'): string {
  return `focus:outline-none focus:ring-2 focus:ring-${color} focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900`
}

/**
 * Generate glass morphism background classes
 * @param level - Glass effect level ('primary', 'secondary', 'tertiary')
 * @param mode - Theme mode ('light', 'dark', 'auto')
 * @returns Glass morphism className string
 */
export function glassEffect(
  level: 'primary' | 'secondary' | 'tertiary' = 'primary',
  mode: 'light' | 'dark' | 'auto' = 'auto',
): string {
  const backdropBlur = 'backdrop-blur-md'
  const border = 'border border-white/20 dark:border-gray-700/20'

  const backgrounds = {
    light: {
      primary: 'bg-white/80',
      secondary: 'bg-white/60',
      tertiary: 'bg-white/40',
    },
    dark: {
      primary: 'bg-gray-900/80',
      secondary: 'bg-gray-800/80',
      tertiary: 'bg-gray-700/60',
    },
    auto: {
      primary: 'bg-white/80 dark:bg-gray-900/80',
      secondary: 'bg-white/60 dark:bg-gray-800/80',
      tertiary: 'bg-white/40 dark:bg-gray-700/60',
    },
  }

  return cn(backgrounds[mode][level], backdropBlur, border)
}

/**
 * Generate transition classes for consistent animations
 * @param properties - CSS properties to transition (default: 'all')
 * @param duration - Transition duration (default: '150')
 * @param timing - Timing function (default: 'ease-in-out')
 * @returns Transition className string
 */
export function transition(properties: string | string[] = 'all', duration = '150', timing = 'ease-in-out'): string {
  const props = Array.isArray(properties) ? properties.join(', ') : properties
  return `transition-${props === 'all' ? 'all' : 'colors'} duration-${duration} ${timing === 'ease-in-out' ? '' : `ease-${timing}`}`.trim()
}
