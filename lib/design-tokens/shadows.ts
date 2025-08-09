/**
 * Shadow design tokens for Token Toilet
 * Elevation tokens for layered UI components with glass morphism support
 */

// Base shadow definitions
export const baseShadows = {
  // No shadow
  none: 'none',

  // Subtle shadows for elevated content
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

  // Strong shadows for modals and overlays
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const

// Glass morphism specific shadows
export const glassShadows = {
  // Light mode glass shadows
  light: {
    subtle: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    moderate: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    pronounced: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    dramatic: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Dark mode glass shadows (more pronounced)
  dark: {
    subtle: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    moderate: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    pronounced: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
    dramatic: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
  },

  // Colored shadows for violet brand elements
  violet: {
    subtle: '0 4px 6px -1px rgb(124 58 237 / 0.1), 0 2px 4px -2px rgb(124 58 237 / 0.1)',
    moderate: '0 10px 15px -3px rgb(124 58 237 / 0.15), 0 4px 6px -4px rgb(124 58 237 / 0.15)',
    pronounced: '0 20px 25px -5px rgb(124 58 237 / 0.2), 0 8px 10px -6px rgb(124 58 237 / 0.2)',
    glow: '0 0 20px rgb(124 58 237 / 0.3), 0 0 40px rgb(124 58 237 / 0.15)',
  },
} as const

// Elevation system for component layering
export const elevation = {
  // Surface levels (z-index coordination)
  flat: {
    shadow: baseShadows.none,
    zIndex: 0,
  },

  // Slightly elevated (cards, buttons)
  raised: {
    shadow: baseShadows.sm,
    zIndex: 1,
  },

  // Moderately elevated (dropdowns, tooltips)
  floating: {
    shadow: baseShadows.md,
    zIndex: 10,
  },

  // Highly elevated (modals, overlays)
  overlay: {
    shadow: baseShadows.lg,
    zIndex: 100,
  },

  // Maximum elevation (toasts, alerts)
  popup: {
    shadow: baseShadows.xl,
    zIndex: 1000,
  },
} as const

// Web3 component specific shadows
export const web3Shadows = {
  // Wallet connection components
  wallet: {
    button: {
      idle: baseShadows.sm,
      hover: baseShadows.md,
      active: baseShadows.lg,
      focus: glassShadows.violet.moderate,
    },
    modal: {
      backdrop: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      container: baseShadows['2xl'],
    },
    dropdown: {
      container: baseShadows.lg,
      option: baseShadows.sm,
    },
  },

  // Transaction components
  transaction: {
    card: {
      pending: glassShadows.violet.subtle,
      confirmed: '0 4px 6px -1px rgb(34 197 94 / 0.1), 0 2px 4px -2px rgb(34 197 94 / 0.1)',
      failed: '0 4px 6px -1px rgb(239 68 68 / 0.1), 0 2px 4px -2px rgb(239 68 68 / 0.1)',
    },
    input: {
      idle: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      focus: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05), 0 0 0 3px rgb(124 58 237 / 0.1)',
      error: 'inset 0 1px 2px 0 rgb(239 68 68 / 0.05), 0 0 0 3px rgb(239 68 68 / 0.1)',
    },
  },

  // Network and status indicators
  network: {
    badge: {
      connected: '0 1px 2px 0 rgb(34 197 94 / 0.1)',
      disconnected: '0 1px 2px 0 rgb(239 68 68 / 0.1)',
      pending: '0 1px 2px 0 rgb(245 158 11 / 0.1)',
    },
    switcher: {
      container: baseShadows.md,
      option: baseShadows.sm,
    },
  },

  // Address display components
  address: {
    container: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    copyButton: {
      idle: baseShadows.sm,
      hover: baseShadows.md,
      active: glassShadows.violet.subtle,
    },
  },
} as const

// Interactive state shadows
export const interactionShadows = {
  // Button states
  button: {
    primary: {
      idle: glassShadows.violet.subtle,
      hover: glassShadows.violet.moderate,
      active: glassShadows.violet.pronounced,
      focus: '0 0 0 3px rgb(124 58 237 / 0.2)',
      disabled: baseShadows.none,
    },
    secondary: {
      idle: baseShadows.sm,
      hover: baseShadows.md,
      active: baseShadows.lg,
      focus: '0 0 0 3px rgb(156 163 175 / 0.2)',
      disabled: baseShadows.none,
    },
    ghost: {
      idle: baseShadows.none,
      hover: baseShadows.sm,
      active: baseShadows.md,
      focus: '0 0 0 3px rgb(124 58 237 / 0.1)',
      disabled: baseShadows.none,
    },
  },

  // Card states
  card: {
    idle: baseShadows.sm,
    hover: baseShadows.md,
    active: baseShadows.lg,
    focus: glassShadows.violet.subtle,
  },

  // Input states
  input: {
    idle: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    hover: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    focus: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05), 0 0 0 3px rgb(124 58 237 / 0.1)',
    error: 'inset 0 1px 2px 0 rgb(239 68 68 / 0.05), 0 0 0 3px rgb(239 68 68 / 0.1)',
    disabled: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.025)',
  },
} as const

// Special effect shadows
export const effectShadows = {
  // Glow effects
  glow: {
    violet: {
      soft: '0 0 20px rgb(124 58 237 / 0.2)',
      medium: '0 0 30px rgb(124 58 237 / 0.3)',
      strong: '0 0 40px rgb(124 58 237 / 0.4)',
    },
    success: {
      soft: '0 0 20px rgb(34 197 94 / 0.2)',
      medium: '0 0 30px rgb(34 197 94 / 0.3)',
      strong: '0 0 40px rgb(34 197 94 / 0.4)',
    },
    warning: {
      soft: '0 0 20px rgb(245 158 11 / 0.2)',
      medium: '0 0 30px rgb(245 158 11 / 0.3)',
      strong: '0 0 40px rgb(245 158 11 / 0.4)',
    },
    error: {
      soft: '0 0 20px rgb(239 68 68 / 0.2)',
      medium: '0 0 30px rgb(239 68 68 / 0.3)',
      strong: '0 0 40px rgb(239 68 68 / 0.4)',
    },
  },

  // Inner shadows for depth
  inner: {
    subtle: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    moderate: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)',
    pronounced: 'inset 0 4px 8px 0 rgb(0 0 0 / 0.15)',
  },

  // Text shadows
  text: {
    subtle: '0 1px 2px rgb(0 0 0 / 0.1)',
    moderate: '0 2px 4px rgb(0 0 0 / 0.15)',
    pronounced: '0 4px 8px rgb(0 0 0 / 0.2)',
  },
} as const

// Export all shadow tokens
export const shadows = {
  base: baseShadows,
  glass: glassShadows,
  elevation,
  web3: web3Shadows,
  interaction: interactionShadows,
  effect: effectShadows,
} as const

export type ShadowToken = typeof shadows
export type BaseShadow = keyof typeof baseShadows
export type GlassShadow = keyof typeof glassShadows.light
export type ElevationLevel = keyof typeof elevation
