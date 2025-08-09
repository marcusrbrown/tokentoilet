import type {Config} from 'tailwindcss'
import {
  violetPalette,
  semanticColors,
  glassMorphism,
  web3States,
  baseSpacing,
  glassSpacing,
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacing as letterSpacingScale,
  baseShadows,
  glassShadows,
  timingFunctions,
  durations,
  keyframes,
  zIndex,
} from './lib/design-tokens'

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Extended color palette with violet brand and semantic colors
      colors: {
        // Keep existing CSS custom property colors for compatibility
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        border: 'hsl(var(--border))',

        // Add violet brand palette
        violet: violetPalette,

        // Add semantic color system
        success: semanticColors.success,
        warning: semanticColors.warning,
        error: semanticColors.error,
        info: semanticColors.info,

        // Add Web3 state colors
        web3: {
          connected: web3States.connected,
          connecting: web3States.connecting,
          disconnected: web3States.disconnected,
          error: web3States.error,
          pending: web3States.pending,
          confirmed: web3States.confirmed,
          failed: web3States.failed,
          mainnet: web3States.mainnet,
          testnet: web3States.testnet,
          polygon: web3States.polygon,
          arbitrum: web3States.arbitrum,
          optimism: web3States.optimism,
        },

        // Glass morphism colors
        glass: {
          light: glassMorphism.light.primary,
          'light-secondary': glassMorphism.light.secondary,
          'light-tertiary': glassMorphism.light.tertiary,
          dark: glassMorphism.dark.primary,
          'dark-secondary': glassMorphism.dark.secondary,
          'dark-tertiary': glassMorphism.dark.tertiary,
        },
      },

      // Extended spacing with glass morphism tokens
      spacing: {
        ...baseSpacing,
        // Add semantic spacing tokens
        'glass-xs': glassSpacing.container.xs,
        'glass-sm': glassSpacing.container.sm,
        'glass-md': glassSpacing.container.md,
        'glass-lg': glassSpacing.container.lg,
        'glass-xl': glassSpacing.container.xl,
        'glass-2xl': glassSpacing.container['2xl'],
      },

      // Extended font families
      fontFamily: {
        sans: fontFamilies.sans,
        mono: fontFamilies.mono,
        serif: fontFamilies.serif,
      },

      // Extended font sizes with line heights
      fontSize: fontSizes,

      // Extended font weights
      fontWeight: fontWeights,

      // Extended letter spacing
      letterSpacing: letterSpacingScale,

      // Extended border radius for glass morphism
      borderRadius: {
        none: '0',
        sm: glassSpacing.radius.sm,
        md: glassSpacing.radius.md,
        lg: glassSpacing.radius.lg,
        xl: glassSpacing.radius.xl,
        '2xl': glassSpacing.radius['2xl'],
        '3xl': glassSpacing.radius['3xl'],
        full: glassSpacing.radius.full,
      },

      // Extended shadows
      boxShadow: {
        ...baseShadows,
        // Glass morphism shadows
        'glass-light': glassShadows.light.subtle,
        'glass-light-md': glassShadows.light.moderate,
        'glass-light-lg': glassShadows.light.pronounced,
        'glass-dark': glassShadows.dark.subtle,
        'glass-dark-md': glassShadows.dark.moderate,
        'glass-dark-lg': glassShadows.dark.pronounced,
        // Violet brand shadows
        'violet-glow': glassShadows.violet.glow,
        'violet-subtle': glassShadows.violet.subtle,
        'violet-md': glassShadows.violet.moderate,
        'violet-lg': glassShadows.violet.pronounced,
      },

      // Extended backdrop blur
      backdropBlur: {
        none: '0',
        sm: glassSpacing.blur.sm,
        md: glassSpacing.blur.md,
        lg: glassSpacing.blur.lg,
        xl: glassSpacing.blur.xl,
        '2xl': glassSpacing.blur['2xl'],
        '3xl': glassSpacing.blur['3xl'],
      },

      // Z-index scale
      zIndex: zIndex,

      // Extended animation timing functions
      transitionTimingFunction: timingFunctions,

      // Extended animation durations
      transitionDuration: durations,

      // Enhanced animations
      animation: {
        // Existing animations
        'flow-right': 'flow-right 2s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',

        // New design system animations
        'fade-in': 'fadeIn 300ms cubic-bezier(0.4, 0, 0.6, 1)',
        'fade-out': 'fadeOut 200ms cubic-bezier(0.4, 0, 0.6, 1)',
        'scale-in': 'scaleIn 300ms cubic-bezier(0.4, 0, 0.6, 1)',
        'scale-out': 'scaleOut 200ms cubic-bezier(0.4, 0, 0.6, 1)',
        'slide-in-top': 'slideInFromTop 300ms cubic-bezier(0.4, 0, 0.6, 1)',
        'slide-in-bottom': 'slideInFromBottom 300ms cubic-bezier(0.4, 0, 0.6, 1)',
        'slide-in-left': 'slideInFromLeft 300ms cubic-bezier(0.4, 0, 0.6, 1)',
        'slide-in-right': 'slideInFromRight 300ms cubic-bezier(0.4, 0, 0.6, 1)',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spinSlow 2s linear infinite',
        'bounce-gentle': 'bounce 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        shake: 'shake 500ms cubic-bezier(0.4, 0, 0.6, 1)',
        glow: 'glow 1s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate',

        // Web3 specific animations
        'wallet-connect': 'scaleIn 300ms cubic-bezier(0.4, 0, 0.6, 1)',
        'wallet-disconnect': 'shake 500ms cubic-bezier(0.4, 0, 0.6, 1)',
        'transaction-pending': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'transaction-success': 'bounce 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'transaction-error': 'shake 500ms cubic-bezier(0.4, 0, 0.6, 1)',
        'token-flush': 'flowRight 2s linear, scaleOut 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },

      // Enhanced keyframes
      keyframes: {
        // Existing keyframes
        'flow-right': {
          '0%': {transform: 'translateX(0)'},
          '100%': {transform: 'translateX(100%)'},
        },

        // New design system keyframes
        ...keyframes,
      },
    },
  },
  plugins: [
    // Custom utilities for glass morphism effects
    function ({addUtilities}: {addUtilities: (utilities: Record<string, Record<string, string>>) => void}) {
      const newUtilities = {
        // Glass morphism backgrounds
        '.glass-light': {
          'background-color': glassMorphism.light.primary,
          'backdrop-filter': `blur(${glassSpacing.blur.md})`,
        },
        '.glass-light-secondary': {
          'background-color': glassMorphism.light.secondary,
          'backdrop-filter': `blur(${glassSpacing.blur.md})`,
        },
        '.glass-dark': {
          'background-color': glassMorphism.dark.primary,
          'backdrop-filter': `blur(${glassSpacing.blur.md})`,
        },
        '.glass-dark-secondary': {
          'background-color': glassMorphism.dark.secondary,
          'backdrop-filter': `blur(${glassSpacing.blur.md})`,
        },

        // Address formatting utilities
        '.address-truncate': {
          'font-family': fontFamilies.mono.join(', '),
          'font-size': '0.875rem',
          'line-height': '1.25rem',
          'letter-spacing': '0.025em',
          'font-weight': '500',
        },

        // Web3 component utilities
        '.wallet-button': {
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.6, 1)',
        },
        '.transaction-card': {
          'background-color': glassMorphism.light.primary,
          'backdrop-filter': `blur(${glassSpacing.blur.md})`,
          'border-radius': glassSpacing.radius['2xl'],
          padding: glassSpacing.container.md,
          'box-shadow': glassShadows.light.subtle,
        },
        '.transaction-card.dark': {
          'background-color': glassMorphism.dark.primary,
          'box-shadow': glassShadows.dark.subtle,
        },

        // Focus styles for accessibility
        '.focus-violet': {
          outline: 'none',
          'box-shadow': `0 0 0 3px ${violetPalette[600]}40`, // 40 = 25% opacity
        },

        // Gradient text utilities
        '.text-gradient-violet': {
          background: `linear-gradient(to right, ${violetPalette[600]}, ${semanticColors.info[600]})`,
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
      }

      addUtilities(newUtilities)
    },
  ],
  darkMode: 'class',
} as Config
