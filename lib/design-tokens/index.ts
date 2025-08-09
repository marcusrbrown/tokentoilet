/**
 * Design Tokens for Token Toilet
 * Centralized export for all design tokens including colors, spacing, typography, shadows, and animations
 *
 * This file provides a single import point for all design tokens used throughout the application.
 * The tokens establish the violet-based brand identity with glass morphism effects and Web3-optimized
 * semantic color system.
 */

// Import all design token modules
import {
  violetPalette,
  web3States,
  glassMorphism,
  gradients,
  semanticColors,
  addressColors,
  type VioletShade,
  type Web3State,
  type SemanticColor,
} from './colors'
import {baseSpacing, glassSpacing, web3Spacing, sectionSpacing, gridSpacing, zIndex} from './spacing'
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacing,
  web3Typography,
  componentTypography,
  headings,
} from './typography'
import {
  baseShadows,
  glassShadows,
  elevation,
  web3Shadows,
  interactionShadows,
  effectShadows,
  type BaseShadow,
} from './shadows'
import {
  timingFunctions,
  durations,
  delays,
  keyframes,
  web3Animations,
  loadingAnimations,
  pageTransitions,
} from './animations'

// Re-export all design token modules and types
export {type ColorToken, type VioletShade, type Web3State, type SemanticColor} from './colors'
export {type SpacingToken, type BaseSpacing, type GlassBlur, type GlassRadius} from './spacing'
export {type TypographyToken, type FontSize, type FontWeight, type LetterSpacing} from './typography'
export {type ShadowToken, type BaseShadow, type GlassShadow, type ElevationLevel} from './shadows'
export {type AnimationToken, type Duration, type TimingFunction, type Delay} from './animations'

// Re-export specific commonly used tokens for convenience
export {
  violetPalette,
  web3States,
  glassMorphism,
  gradients,
  semanticColors,
  addressColors,
  baseSpacing,
  glassSpacing,
  web3Spacing,
  sectionSpacing,
  gridSpacing,
  zIndex,
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacing,
  web3Typography,
  componentTypography,
  headings,
  baseShadows,
  glassShadows,
  elevation,
  web3Shadows,
  interactionShadows,
  effectShadows,
  timingFunctions,
  durations,
  delays,
  keyframes,
  web3Animations,
  loadingAnimations,
  pageTransitions,
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
    letterSpacing: letterSpacing,
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
