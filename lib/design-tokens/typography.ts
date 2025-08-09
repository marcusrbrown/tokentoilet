/**
 * Typography design tokens for Token Toilet
 * DeFi-optimized font scales and address formatting for Web3 interfaces
 */

// Font families
export const fontFamilies = {
  sans: [
    'Inter',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans"',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"',
  ],
  mono: [
    '"Fira Code"',
    '"JetBrains Mono"',
    '"SF Mono"',
    'Monaco',
    'Inconsolata',
    '"Roboto Mono"',
    '"Source Code Pro"',
    'monospace',
  ],
  serif: ['"Playfair Display"', 'ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
} as const

// Font sizes with DeFi-optimized scale
export const fontSizes = {
  // Micro text (legal, disclaimers)
  xs: {
    fontSize: '0.75rem', // 12px
    lineHeight: '1rem', // 16px
  },

  // Small text (labels, captions)
  sm: {
    fontSize: '0.875rem', // 14px
    lineHeight: '1.25rem', // 20px
  },

  // Base text (body content)
  base: {
    fontSize: '1rem', // 16px
    lineHeight: '1.5rem', // 24px
  },

  // Medium text (emphasized content)
  lg: {
    fontSize: '1.125rem', // 18px
    lineHeight: '1.75rem', // 28px
  },

  // Large text (section headers)
  xl: {
    fontSize: '1.25rem', // 20px
    lineHeight: '1.75rem', // 28px
  },

  // Extra large (card titles)
  '2xl': {
    fontSize: '1.5rem', // 24px
    lineHeight: '2rem', // 32px
  },

  // Display text (page headings)
  '3xl': {
    fontSize: '1.875rem', // 30px
    lineHeight: '2.25rem', // 36px
  },

  // Large display (hero sub-headings)
  '4xl': {
    fontSize: '2.25rem', // 36px
    lineHeight: '2.5rem', // 40px
  },

  // Extra large display (hero headings)
  '5xl': {
    fontSize: '3rem', // 48px
    lineHeight: '1',
  },

  // Massive display (marketing heroes)
  '6xl': {
    fontSize: '3.75rem', // 60px
    lineHeight: '1',
  },

  // Ultra large (landing page heroes)
  '7xl': {
    fontSize: '4.5rem', // 72px
    lineHeight: '1',
  },

  // Maximum size (special occasions)
  '8xl': {
    fontSize: '6rem', // 96px
    lineHeight: '1',
  },

  '9xl': {
    fontSize: '8rem', // 128px
    lineHeight: '1',
  },
} as const

// Font weights
export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const

// Letter spacing for different contexts
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
  // Special spacing for addresses
  address: '0.025em', // Slightly wider for better readability
  mono: '0em', // Normal for monospace code
} as const

// Web3 and DeFi specific typography scales
export const web3Typography = {
  // Wallet address display
  address: {
    full: {
      fontFamily: fontFamilies.mono,
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
      letterSpacing: letterSpacing.address,
      fontWeight: fontWeights.medium,
    },
    truncated: {
      fontFamily: fontFamilies.mono,
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
      letterSpacing: letterSpacing.address,
      fontWeight: fontWeights.medium,
    },
    label: {
      fontFamily: fontFamilies.sans,
      fontSize: '0.75rem', // 12px
      lineHeight: '1rem', // 16px
      fontWeight: fontWeights.medium,
      textTransform: 'uppercase',
      letterSpacing: letterSpacing.wide,
    },
  },

  // Token amounts and financial data
  amounts: {
    large: {
      fontFamily: fontFamilies.mono,
      fontSize: '1.5rem', // 24px
      lineHeight: '2rem', // 32px
      fontWeight: fontWeights.bold,
      letterSpacing: letterSpacing.tight,
    },
    medium: {
      fontFamily: fontFamilies.mono,
      fontSize: '1.125rem', // 18px
      lineHeight: '1.75rem', // 28px
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacing.normal,
    },
    small: {
      fontFamily: fontFamilies.mono,
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
      fontWeight: fontWeights.medium,
      letterSpacing: letterSpacing.normal,
    },
    micro: {
      fontFamily: fontFamilies.mono,
      fontSize: '0.75rem', // 12px
      lineHeight: '1rem', // 16px
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Network and chain identifiers
  network: {
    name: {
      fontFamily: fontFamilies.sans,
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
      fontWeight: fontWeights.medium,
      letterSpacing: letterSpacing.normal,
    },
    badge: {
      fontFamily: fontFamilies.sans,
      fontSize: '0.75rem', // 12px
      lineHeight: '1rem', // 16px
      fontWeight: fontWeights.semibold,
      textTransform: 'uppercase',
      letterSpacing: letterSpacing.wider,
    },
  },

  // Transaction and status text
  status: {
    title: {
      fontFamily: fontFamilies.sans,
      fontSize: '1rem', // 16px
      lineHeight: '1.5rem', // 24px
      fontWeight: fontWeights.semibold,
    },
    description: {
      fontFamily: fontFamilies.sans,
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
      fontWeight: fontWeights.normal,
    },
    hash: {
      fontFamily: fontFamilies.mono,
      fontSize: '0.75rem', // 12px
      lineHeight: '1rem', // 16px
      fontWeight: fontWeights.normal,
      letterSpacing: letterSpacing.address,
    },
  },
} as const

// UI component typography
export const componentTypography = {
  // Buttons
  button: {
    small: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
      fontWeight: fontWeights.medium,
    },
    medium: {
      fontSize: '1rem', // 16px
      lineHeight: '1.5rem', // 24px
      fontWeight: fontWeights.medium,
    },
    large: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.75rem', // 28px
      fontWeight: fontWeights.semibold,
    },
  },

  // Form inputs
  input: {
    label: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
      fontWeight: fontWeights.medium,
    },
    text: {
      fontSize: '1rem', // 16px
      lineHeight: '1.5rem', // 24px
      fontWeight: fontWeights.normal,
    },
    placeholder: {
      fontSize: '1rem', // 16px
      lineHeight: '1.5rem', // 24px
      fontWeight: fontWeights.normal,
    },
    helper: {
      fontSize: '0.75rem', // 12px
      lineHeight: '1rem', // 16px
      fontWeight: fontWeights.normal,
    },
    error: {
      fontSize: '0.75rem', // 12px
      lineHeight: '1rem', // 16px
      fontWeight: fontWeights.medium,
    },
  },

  // Cards and containers
  card: {
    title: {
      fontSize: '1.25rem', // 20px
      lineHeight: '1.75rem', // 28px
      fontWeight: fontWeights.semibold,
    },
    subtitle: {
      fontSize: '1rem', // 16px
      lineHeight: '1.5rem', // 24px
      fontWeight: fontWeights.normal,
    },
    caption: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
      fontWeight: fontWeights.normal,
    },
  },

  // Navigation
  navigation: {
    brand: {
      fontSize: '1.25rem', // 20px
      lineHeight: '1.75rem', // 28px
      fontWeight: fontWeights.bold,
    },
    link: {
      fontSize: '1rem', // 16px
      lineHeight: '1.5rem', // 24px
      fontWeight: fontWeights.medium,
    },
    dropdown: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.25rem', // 20px
      fontWeight: fontWeights.normal,
    },
  },
} as const

// Heading scales for content hierarchy
export const headings = {
  h1: {
    fontFamily: fontFamilies.sans,
    fontSize: '2.25rem', // 36px
    lineHeight: '2.5rem', // 40px
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamilies.sans,
    fontSize: '1.875rem', // 30px
    lineHeight: '2.25rem', // 36px
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamilies.sans,
    fontSize: '1.5rem', // 24px
    lineHeight: '2rem', // 32px
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.tight,
  },
  h4: {
    fontFamily: fontFamilies.sans,
    fontSize: '1.25rem', // 20px
    lineHeight: '1.75rem', // 28px
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontFamily: fontFamilies.sans,
    fontSize: '1.125rem', // 18px
    lineHeight: '1.75rem', // 28px
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontFamily: fontFamilies.sans,
    fontSize: '1rem', // 16px
    lineHeight: '1.5rem', // 24px
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
} as const

// Export all typography tokens
export const typography = {
  fontFamily: fontFamilies,
  fontSize: fontSizes,
  fontWeight: fontWeights,
  letterSpacing,
  web3: web3Typography,
  component: componentTypography,
  heading: headings,
} as const

export type TypographyToken = typeof typography
export type FontSize = keyof typeof fontSizes
export type FontWeight = keyof typeof fontWeights
export type LetterSpacing = keyof typeof letterSpacing
