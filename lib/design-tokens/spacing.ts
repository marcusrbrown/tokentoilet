/**
 * Spacing design tokens for Token Toilet
 * Optimized spacing scale for glass morphism layouts and DeFi interfaces
 */

// Base spacing scale (extends Tailwind's default spacing)
export const baseSpacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const

// Glass morphism specific spacing for layered effects
export const glassSpacing = {
  // Backdrop blur distances
  blur: {
    none: '0',
    sm: '4px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px',
  },

  // Glass container padding optimized for readability
  container: {
    xs: '0.75rem', // 12px - for badges and small elements
    sm: '1rem', // 16px - for buttons and form elements
    md: '1.5rem', // 24px - for cards and modals
    lg: '2rem', // 32px - for sections and layouts
    xl: '3rem', // 48px - for hero sections
    '2xl': '4rem', // 64px - for major layout blocks
  },

  // Border radius for glass morphism effects
  radius: {
    none: '0',
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px - common for cards
    '3xl': '2rem', // 32px - for large containers
    full: '9999px',
  },
} as const

// Layout spacing for Web3 components
export const web3Spacing = {
  // Wallet connection layouts
  wallet: {
    buttonPadding: {
      x: '1.5rem', // 24px
      y: '0.75rem', // 12px
    },
    modalPadding: '2rem', // 32px
    accountGap: '1rem', // 16px between account elements
  },

  // Transaction interface spacing
  transaction: {
    formGap: '1.5rem', // 24px between form sections
    inputPadding: '1rem', // 16px inside inputs
    buttonGap: '0.75rem', // 12px between buttons
    statusGap: '0.5rem', // 8px for status indicators
  },

  // Address display spacing
  address: {
    padding: '0.5rem', // 8px inside address containers
    gap: '0.25rem', // 4px between address parts
    iconGap: '0.5rem', // 8px between icon and address
  },

  // Network and chain indicators
  network: {
    badgePadding: {
      x: '0.75rem', // 12px
      y: '0.25rem', // 4px
    },
    indicatorSize: '0.5rem', // 8px for status dots
    switcherGap: '0.5rem', // 8px between network options
  },
} as const

// Section spacing for page layouts
export const sectionSpacing = {
  // Vertical spacing between major sections
  section: {
    xs: '2rem', // 32px
    sm: '3rem', // 48px
    md: '4rem', // 64px
    lg: '5rem', // 80px
    xl: '6rem', // 96px
    '2xl': '8rem', // 128px
  },

  // Container max widths and padding
  container: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '7xl': '80rem', // Custom for Token Toilet (1280px)
    },
    padding: {
      mobile: '1rem', // 16px on mobile
      tablet: '2rem', // 32px on tablet
      desktop: '3rem', // 48px on desktop
    },
  },

  // Navigation spacing
  navigation: {
    height: '4rem', // 64px navbar height
    padding: '1.5rem', // 24px navbar padding
    gap: '2rem', // 32px between nav items
    logoGap: '0.5rem', // 8px between logo and text
  },

  // Footer spacing
  footer: {
    padding: '3rem', // 48px footer padding
    sectionGap: '2rem', // 32px between footer sections
    linkGap: '1.5rem', // 24px between footer links
  },
} as const

// Grid spacing for component layouts
export const gridSpacing = {
  // Feature grids
  features: {
    gap: '2rem', // 32px between feature cards
    cardPadding: '1.5rem', // 24px inside feature cards
    iconMargin: '1rem', // 16px below feature icons
  },

  // Stats grids
  stats: {
    gap: '2rem', // 32px between stat items
    padding: '2rem', // 32px inside stats container
    itemGap: '0.5rem', // 8px between stat number and label
  },

  // Form grids
  forms: {
    fieldGap: '1rem', // 16px between form fields
    sectionGap: '2rem', // 32px between form sections
    buttonGap: '0.75rem', // 12px between form buttons
  },
} as const

// Z-index scale for layering
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const

// Export all spacing tokens
export const spacing = {
  base: baseSpacing,
  glass: glassSpacing,
  web3: web3Spacing,
  section: sectionSpacing,
  grid: gridSpacing,
  zIndex,
} as const

export type SpacingToken = typeof spacing
export type BaseSpacing = keyof typeof baseSpacing
export type GlassBlur = keyof typeof glassSpacing.blur
export type GlassRadius = keyof typeof glassSpacing.radius
