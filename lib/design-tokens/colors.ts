/**
 * Color design tokens for Token Toilet
 * Establishes violet-based color palette with semantic Web3 state tokens
 */

// Base violet brand palette (violet-50 to violet-900)
export const violetPalette = {
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
  600: '#7c3aed',
  700: '#6d28d9',
  800: '#5b21b7',
  900: '#4c1d95',
  950: '#2e1065',
} as const

// Semantic color tokens for Web3 states
export const web3States = {
  // Connection states
  connected: '#10b981', // green-500
  connecting: '#f59e0b', // amber-500
  disconnected: '#ef4444', // red-500
  error: '#dc2626', // red-600

  // Transaction states
  pending: '#f59e0b', // amber-500
  confirmed: '#10b981', // green-500
  failed: '#ef4444', // red-500

  // Network indicators
  mainnet: '#627eea', // ethereum blue
  testnet: '#fbbf24', // amber-400
  polygon: '#8247e5', // polygon purple
  arbitrum: '#28a0f0', // arbitrum blue
  optimism: '#ff0420', // optimism red
} as const

// Glass morphism color system
export const glassMorphism = {
  // Light mode glass effects
  light: {
    primary: 'rgb(255 255 255 / 0.8)', // bg-white/80
    secondary: 'rgb(255 255 255 / 0.6)', // bg-white/60
    tertiary: 'rgb(255 255 255 / 0.4)', // bg-white/40
    border: 'rgb(255 255 255 / 0.2)', // border-white/20
  },
  // Dark mode glass effects
  dark: {
    primary: 'rgb(17 24 39 / 0.8)', // bg-gray-900/80
    secondary: 'rgb(31 41 55 / 0.8)', // bg-gray-800/80
    tertiary: 'rgb(55 65 81 / 0.6)', // bg-gray-700/60
    border: 'rgb(75 85 99 / 0.2)', // border-gray-600/20
  },
} as const

// Gradient combinations for hero sections and backgrounds
export const gradients = {
  hero: {
    light: 'linear-gradient(to bottom, #f5f3ff, #dbeafe)', // from-violet-50 to-blue-50
    dark: 'linear-gradient(to bottom, #111827, #1f2937)', // from-gray-900 to-gray-800
  },
  text: {
    primary: 'linear-gradient(to right, #7c3aed, #2563eb)', // from-violet-600 to-blue-600
    secondary: 'linear-gradient(to right, #8b5cf6, #06b6d4)', // from-violet-500 to-cyan-500
  },
  button: {
    primary: 'linear-gradient(to bottom, #a78bfa, #7c3aed)', // from-violet-400 to-violet-600
    hover: 'linear-gradient(to bottom, #8b5cf6, #6d28d9)', // from-violet-500 to-violet-700
  },
} as const

// Semantic color system extending violet brand
export const semanticColors = {
  // Primary brand colors
  primary: {
    50: violetPalette[50],
    100: violetPalette[100],
    200: violetPalette[200],
    300: violetPalette[300],
    400: violetPalette[400],
    500: violetPalette[500],
    600: violetPalette[600],
    700: violetPalette[700],
    800: violetPalette[800],
    900: violetPalette[900],
    950: violetPalette[950],
    DEFAULT: violetPalette[600], // Primary brand color
  },

  // Success states (green)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    DEFAULT: '#22c55e',
  },

  // Warning states (amber)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    DEFAULT: '#f59e0b',
  },

  // Error states (red)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    DEFAULT: '#ef4444',
  },

  // Info states (blue)
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    DEFAULT: '#3b82f6',
  },
} as const

// Address formatting specific colors for DeFi interfaces
export const addressColors = {
  text: {
    light: '#374151', // gray-700
    dark: '#d1d5db', // gray-300
  },
  background: {
    light: '#f3f4f6', // gray-100
    dark: '#374151', // gray-700
  },
  border: {
    light: '#e5e7eb', // gray-200
    dark: '#4b5563', // gray-600
  },
  copy: {
    idle: violetPalette[600],
    hover: violetPalette[700],
    active: violetPalette[800],
  },
} as const

// Export all color tokens
export const colors = {
  violet: violetPalette,
  web3: web3States,
  glass: glassMorphism,
  gradients,
  semantic: semanticColors,
  address: addressColors,
} as const

export type ColorToken = typeof colors
export type VioletShade = keyof typeof violetPalette
export type Web3State = keyof typeof web3States
export type SemanticColor = keyof typeof semanticColors
