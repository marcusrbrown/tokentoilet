/**
 * Design Tokens for Token Toilet
 * Centralized export for all design tokens including colors, spacing, typography, shadows, and animations
 *
 * This file provides a single import point for all design tokens used throughout the application.
 * The tokens establish the violet-based brand identity with glass morphism effects and Web3-optimized
 * semantic color system.
 */

import {
  delays,
  durations,
  keyframes,
  loadingAnimations,
  pageTransitions,
  timingFunctions,
  web3Animations,
} from './animations'
// Import all design token modules
import {
  addressColors,
  glassMorphism,
  gradients,
  semanticColors,
  violetPalette,
  web3States,
  type SemanticColor,
  type VioletShade,
  type Web3State,
} from './colors'
import {
  baseShadows,
  effectShadows,
  elevation,
  glassShadows,
  interactionShadows,
  web3Shadows,
  type BaseShadow,
} from './shadows'
import {baseSpacing, glassSpacing, gridSpacing, sectionSpacing, web3Spacing, zIndex} from './spacing'
import {
  componentTypography,
  fontFamilies,
  fontSizes,
  fontWeights,
  headings,
  letterSpacing,
  web3Typography,
} from './typography'

export {type AnimationToken, type Delay, type Duration, type TimingFunction} from './animations'
// Re-export all design token modules and types
export {type ColorToken, type SemanticColor, type VioletShade, type Web3State} from './colors'
export {type BaseShadow, type ElevationLevel, type GlassShadow, type ShadowToken} from './shadows'
export {type BaseSpacing, type GlassBlur, type GlassRadius, type SpacingToken} from './spacing'
export {type FontSize, type FontWeight, type LetterSpacing, type TypographyToken} from './typography'

// Re-export specific commonly used tokens for convenience
export {
  addressColors,
  baseShadows,
  baseSpacing,
  componentTypography,
  delays,
  durations,
  effectShadows,
  elevation,
  fontFamilies,
  fontSizes,
  fontWeights,
  glassMorphism,
  glassShadows,
  glassSpacing,
  gradients,
  gridSpacing,
  headings,
  interactionShadows,
  keyframes,
  letterSpacing,
  loadingAnimations,
  pageTransitions,
  sectionSpacing,
  semanticColors,
  timingFunctions,
  violetPalette,
  web3Animations,
  web3Shadows,
  web3Spacing,
  web3States,
  web3Typography,
  zIndex,
}

// Consolidated design token object for easy access
export const designTokens = {
  colors: {
    violet: violetPalette,
    web3: web3States,
    glass: glassMorphism,
    gradients,
    semantic: semanticColors,
    address: addressColors,
  },
  spacing: {
    base: baseSpacing,
    glass: glassSpacing,
    web3: web3Spacing,
    section: sectionSpacing,
    grid: gridSpacing,
    zIndex,
  },
  typography: {
    fontFamily: fontFamilies,
    fontSize: fontSizes,
    fontWeight: fontWeights,
    letterSpacing,
    web3: web3Typography,
    component: componentTypography,
    heading: headings,
  },
  shadows: {
    base: baseShadows,
    glass: glassShadows,
    elevation,
    web3: web3Shadows,
    interaction: interactionShadows,
    effect: effectShadows,
  },
  animations: {
    timing: timingFunctions,
    duration: durations,
    delay: delays,
    keyframes,
    web3: web3Animations,
    loading: loadingAnimations,
    page: pageTransitions,
  },
} as const

// Type for the complete design token system
export type DesignTokens = typeof designTokens

// Utility functions for working with design tokens

/**
 * Get a violet shade by key
 * @param shade - The violet shade key (50-950)
 * @returns The hex color value
 */
export function getVioletShade(shade: VioletShade): string {
  return violetPalette[shade]
}

/**
 * Get a Web3 state color
 * @param state - The Web3 state key
 * @returns The hex color value
 */
export function getWeb3StateColor(state: Web3State): string {
  return web3States[state]
}

/**
 * Get glass morphism background for light/dark mode
 * @param mode - 'light' or 'dark'
 * @param level - 'primary', 'secondary', or 'tertiary'
 * @returns The CSS color value
 */
export function getGlassBackground(mode: 'light' | 'dark', level: 'primary' | 'secondary' | 'tertiary'): string {
  return glassMorphism[mode][level]
}

/**
 * Get semantic color by name and shade
 * @param color - The semantic color name
 * @param shade - The shade key (50-900 or 'DEFAULT')
 * @returns The hex color value
 */
export function getSemanticColor(color: SemanticColor, shade: keyof typeof semanticColors.primary): string {
  return (semanticColors[color] as Record<string, string>)[shade]
}

/**
 * Get shadow by category and level
 * @param category - The shadow category
 * @param level - The shadow level
 * @returns The CSS shadow value
 */
export function getShadow(category: 'base' | 'glass', level: string): string {
  if (category === 'base') {
    return baseShadows[level as BaseShadow]
  }
  // For glass shadows, default to light mode subtle
  return glassShadows.light.subtle
}

/**
 * Generate CSS custom properties from design tokens
 * @returns Object with CSS custom property names and values
 */
export function generateCSSCustomProperties(): Record<string, string> {
  const cssProps: Record<string, string> = {}

  // Generate color custom properties
  Object.entries(violetPalette).forEach(([shade, value]) => {
    cssProps[`--color-violet-${shade}`] = value
  })

  Object.entries(web3States).forEach(([state, value]) => {
    cssProps[`--color-web3-${state}`] = value
  })

  // Generate spacing custom properties
  Object.entries(baseSpacing).forEach(([key, value]) => {
    cssProps[`--spacing-${key}`] = value
  })

  // Generate shadow custom properties
  Object.entries(baseShadows).forEach(([key, value]) => {
    cssProps[`--shadow-${key}`] = value
  })

  return cssProps
}

/**
 * Brand-specific color utilities
 */
export const brand = {
  // Primary violet brand color
  primary: violetPalette[600],
  primaryHover: violetPalette[700],
  primaryActive: violetPalette[800],
  primaryText: violetPalette[50],

  // Glass morphism backgrounds
  glassLight: glassMorphism.light.primary,
  glassDark: glassMorphism.dark.primary,

  // Web3 state colors
  connected: web3States.connected,
  disconnected: web3States.disconnected,
  pending: web3States.pending,

  // Gradients
  heroGradient: gradients.hero.light,
  textGradient: gradients.text.primary,
  buttonGradient: gradients.button.primary,
} as const

// Export brand utilities
export type Brand = typeof brand
