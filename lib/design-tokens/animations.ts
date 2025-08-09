/**
 * Animation design tokens for Token Toilet
 * Wallet connection flow presets and Web3 interaction animations
 */

// Base timing functions
export const timingFunctions = {
  // Standard easing curves
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Bouncy and elastic curves
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',

  // Web3 specific curves
  wallet: 'cubic-bezier(0.4, 0, 0.6, 1)', // Smooth for wallet interactions
  transaction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Confident for transactions
  loading: 'cubic-bezier(0.4, 0, 0.6, 1)', // Steady for loading states
} as const

// Duration scales
export const durations = {
  instant: '0ms',
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '750ms',
  slowest: '1000ms',

  // Extended durations for complex animations
  extended: '2000ms',
  marathon: '4000ms',
} as const

// Delay scales for staggered animations
export const delays = {
  none: '0ms',
  short: '75ms',
  medium: '150ms',
  long: '300ms',
  longer: '500ms',
  longest: '750ms',
} as const

// Base keyframe animations
export const keyframes = {
  // Fade animations
  fadeIn: {
    '0%': {opacity: '0'},
    '100%': {opacity: '1'},
  },
  fadeOut: {
    '0%': {opacity: '1'},
    '100%': {opacity: '0'},
  },

  // Scale animations
  scaleIn: {
    '0%': {
      opacity: '0',
      transform: 'scale(0.9)',
    },
    '100%': {
      opacity: '1',
      transform: 'scale(1)',
    },
  },
  scaleOut: {
    '0%': {
      opacity: '1',
      transform: 'scale(1)',
    },
    '100%': {
      opacity: '0',
      transform: 'scale(0.9)',
    },
  },

  // Slide animations
  slideInFromTop: {
    '0%': {
      opacity: '0',
      transform: 'translateY(-10px)',
    },
    '100%': {
      opacity: '1',
      transform: 'translateY(0)',
    },
  },
  slideInFromBottom: {
    '0%': {
      opacity: '0',
      transform: 'translateY(10px)',
    },
    '100%': {
      opacity: '1',
      transform: 'translateY(0)',
    },
  },
  slideInFromLeft: {
    '0%': {
      opacity: '0',
      transform: 'translateX(-10px)',
    },
    '100%': {
      opacity: '1',
      transform: 'translateX(0)',
    },
  },
  slideInFromRight: {
    '0%': {
      opacity: '0',
      transform: 'translateX(10px)',
    },
    '100%': {
      opacity: '1',
      transform: 'translateX(0)',
    },
  },

  // Pulse animations
  pulse: {
    '0%, 100%': {opacity: '1'},
    '50%': {opacity: '0.5'},
  },
  pulseSlow: {
    '0%, 100%': {opacity: '1'},
    '50%': {opacity: '0.8'},
  },
  pulseSubtle: {
    '0%, 100%': {opacity: '1'},
    '50%': {opacity: '0.9'},
  },

  // Spin animations
  spin: {
    '0%': {transform: 'rotate(0deg)'},
    '100%': {transform: 'rotate(360deg)'},
  },
  spinSlow: {
    '0%': {transform: 'rotate(0deg)'},
    '100%': {transform: 'rotate(360deg)'},
  },

  // Bounce animations
  bounce: {
    '0%, 20%, 53%, 80%, 100%': {
      animationTimingFunction: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      transform: 'translate3d(0, 0, 0)',
    },
    '40%, 43%': {
      animationTimingFunction: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
      transform: 'translate3d(0, -30px, 0)',
    },
    '70%': {
      animationTimingFunction: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
      transform: 'translate3d(0, -15px, 0)',
    },
    '90%': {
      transform: 'translate3d(0, -4px, 0)',
    },
  },

  // Flow animations for token movement
  flowRight: {
    '0%': {transform: 'translateX(0)'},
    '100%': {transform: 'translateX(100%)'},
  },
  flowLeft: {
    '0%': {transform: 'translateX(0)'},
    '100%': {transform: 'translateX(-100%)'},
  },

  // Shake animation for errors
  shake: {
    '0%, 100%': {transform: 'translateX(0)'},
    '10%, 30%, 50%, 70%, 90%': {transform: 'translateX(-10px)'},
    '20%, 40%, 60%, 80%': {transform: 'translateX(10px)'},
  },

  // Glow effect for highlights
  glow: {
    '0%, 100%': {
      boxShadow: '0 0 5px rgb(124 58 237 / 0.2)',
    },
    '50%': {
      boxShadow: '0 0 20px rgb(124 58 237 / 0.4)',
    },
  },
} as const

// Web3 specific animation presets
export const web3Animations = {
  // Wallet connection flow
  walletConnection: {
    // Modal entrance
    modalEnter: {
      animation: 'scaleIn 300ms cubic-bezier(0.4, 0, 0.6, 1)',
      animationFillMode: 'both',
    },
    modalExit: {
      animation: 'scaleOut 200ms cubic-bezier(0.4, 0, 0.6, 1)',
      animationFillMode: 'both',
    },

    // Button states
    buttonHover: {
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.6, 1)',
    },
    buttonPress: {
      transition: 'all 75ms cubic-bezier(0.4, 0, 0.6, 1)',
    },

    // Connection status
    connecting: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    connected: {
      animation: 'scaleIn 300ms cubic-bezier(0.4, 0, 0.6, 1)',
    },
    disconnected: {
      animation: 'shake 500ms cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },

  // Transaction states
  transaction: {
    // Pending state
    pending: {
      animation: 'spin 1s linear infinite',
    },
    pendingPulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },

    // Success state
    confirmed: {
      animation: 'bounce 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    confirmedGlow: {
      animation: 'glow 1s cubic-bezier(0.4, 0, 0.6, 1) 2',
    },

    // Error state
    failed: {
      animation: 'shake 500ms cubic-bezier(0.4, 0, 0.6, 1)',
    },
    failedFlash: {
      animation: 'pulse 300ms cubic-bezier(0.4, 0, 0.6, 1) 3',
    },
  },

  // Token flow animations
  tokenFlow: {
    // Token disposal flow
    dispose: {
      animation: 'flowRight 2s linear infinite',
    },
    disposeStagger: {
      animation: 'flowRight 2s linear infinite',
      animationDelay: 'var(--stagger-delay, 0ms)',
    },

    // Token flushing effect
    flush: {
      animation: 'scaleOut 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    flushSpin: {
      animation: 'spin 300ms linear, scaleOut 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
  },

  // Network switching
  networkSwitch: {
    // Network indicator changes
    switching: {
      animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    switched: {
      animation: 'scaleIn 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },

    // Chain selection
    chainHover: {
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.6, 1)',
    },
    chainSelect: {
      animation: 'scaleIn 200ms cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },

  // Address interactions
  address: {
    // Copy to clipboard
    copy: {
      animation: 'scaleIn 150ms cubic-bezier(0.4, 0, 0.6, 1)',
    },
    copied: {
      animation: 'pulse 300ms cubic-bezier(0.4, 0, 0.6, 1) 2',
    },

    // Address reveal
    reveal: {
      animation: 'slideInFromRight 300ms cubic-bezier(0.4, 0, 0.6, 1)',
    },
    hide: {
      animation: 'slideInFromLeft 200ms cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
} as const

// Loading animations
export const loadingAnimations = {
  // Spinner variants
  spinner: {
    basic: {
      animation: 'spin 1s linear infinite',
    },
    slow: {
      animation: 'spinSlow 2s linear infinite',
    },
    pulseSpin: {
      animation: 'spin 1s linear infinite, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
  },

  // Skeleton loading
  skeleton: {
    pulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    shimmer: {
      animation: 'flowRight 2s ease-in-out infinite',
    },
  },

  // Dots loading
  dots: {
    bounce: {
      animation: 'bounce 1.4s ease-in-out infinite both',
    },
    bounceStagger: {
      animation: 'bounce 1.4s ease-in-out infinite both',
      animationDelay: 'var(--dot-delay, 0ms)',
    },
  },
} as const

// Page transition animations
export const pageTransitions = {
  // Route changes
  routeEnter: {
    animation: 'slideInFromRight 300ms cubic-bezier(0.4, 0, 0.6, 1)',
  },
  routeExit: {
    animation: 'slideInFromLeft 200ms cubic-bezier(0.4, 0, 0.6, 1)',
  },

  // Modal overlays
  overlayEnter: {
    animation: 'fadeIn 200ms cubic-bezier(0.4, 0, 0.6, 1)',
  },
  overlayExit: {
    animation: 'fadeOut 150ms cubic-bezier(0.4, 0, 0.6, 1)',
  },

  // Toast notifications
  toastEnter: {
    animation: 'slideInFromTop 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  toastExit: {
    animation: 'slideInFromTop 200ms cubic-bezier(0.4, 0, 0.6, 1) reverse',
  },
} as const

// Export all animation tokens
export const animations = {
  timing: timingFunctions,
  duration: durations,
  delay: delays,
  keyframes,
  web3: web3Animations,
  loading: loadingAnimations,
  page: pageTransitions,
} as const

export type AnimationToken = typeof animations
export type Duration = keyof typeof durations
export type TimingFunction = keyof typeof timingFunctions
export type Delay = keyof typeof delays
