# Design Tokens Reference

Design tokens are the core visual design atoms of the Token Toilet Design System. They establish consistent spacing, colors, typography, shadows, and animations across all components and provide the foundation for the violet-branded glass morphism aesthetic.

## Table of Contents

- [Overview](#overview)
- [Color Tokens](#color-tokens)
- [Spacing Tokens](#spacing-tokens)
- [Typography Tokens](#typography-tokens)
- [Shadow Tokens](#shadow-tokens)
- [Animation Tokens](#animation-tokens)
- [Usage Patterns](#usage-patterns)
- [CSS Custom Properties](#css-custom-properties)
- [JavaScript Access](#javascript-access)
- [Web3-Specific Patterns](#web3-specific-patterns)
- [Theme Integration](#theme-integration)
- [Best Practices](#best-practices)

## Overview

Design tokens in Token Toilet are organized into five main categories:

1. **Colors** - Violet brand palette, Web3 states, glass morphism effects
2. **Spacing** - Consistent spacing scale, glass container padding, Web3 layouts
3. **Typography** - Font families, sizes, weights optimized for DeFi interfaces
4. **Shadows** - Elevation system with glass morphism support
5. **Animations** - Timing functions, durations, and keyframes for Web3 interactions

All tokens are available as both TypeScript constants and CSS custom properties for maximum flexibility.

## Color Tokens

### Violet Brand Palette

The primary violet palette forms the core brand identity:

```typescript
import { violetPalette } from '@/lib/design-tokens'

// Available shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
const primaryColor = violetPalette[600] // #7c3aed
```

**TailwindCSS Usage:**

```tsx
<div className="bg-violet-600 text-violet-50 border-violet-300">
  Primary brand colors
</div>
```

**CSS Custom Properties:**

```css
.custom-component {
  background-color: var(--color-violet-600);
  color: var(--color-violet-50);
  border-color: var(--color-violet-300);
}
```

### Web3 Semantic Colors

Specialized colors for Web3 states and blockchain networks:

```typescript
import { web3States } from '@/lib/design-tokens'

// Connection states
web3States.connected    // #10b981 (green-500)
web3States.connecting   // #f59e0b (amber-500)
web3States.disconnected // #ef4444 (red-500)
web3States.error        // #dc2626 (red-600)

// Transaction states
web3States.pending      // #f59e0b (amber-500)
web3States.confirmed    // #10b981 (green-500)
web3States.failed       // #ef4444 (red-500)

// Network indicators
web3States.mainnet      // #627eea (ethereum blue)
web3States.polygon      // #8247e5 (polygon purple)
web3States.arbitrum     // #28a0f0 (arbitrum blue)
```

**Usage in Components:**

```tsx
import { web3States } from '@/lib/design-tokens'

const ConnectionStatus = ({ status }) => (
  <div
    className="px-3 py-1 rounded-full text-white"
    style={{ backgroundColor: web3States[status] }}
  >
    {status}
  </div>
)
```

### Glass Morphism Colors

Optimized colors for glass morphism effects with light/dark mode support:

```typescript
import { glassMorphism } from '@/lib/design-tokens'

// Light mode glass effects
glassMorphism.light.primary   // rgb(255 255 255 / 0.8)
glassMorphism.light.secondary // rgb(255 255 255 / 0.6)
glassMorphism.light.border    // rgb(255 255 255 / 0.2)

// Dark mode glass effects
glassMorphism.dark.primary    // rgb(17 24 39 / 0.8)
glassMorphism.dark.secondary  // rgb(31 41 55 / 0.8)
glassMorphism.dark.border     // rgb(75 85 99 / 0.2)
```

**Glass Component Pattern:**

```tsx
const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 dark:border-gray-600/20 rounded-2xl">
    {children}
  </div>
)
```

### Gradient Combinations

Pre-defined gradients for hero sections and interactive elements:

```typescript
import { gradients } from '@/lib/design-tokens'

// Hero backgrounds
gradients.hero.light // from-violet-50 to-blue-50
gradients.hero.dark  // from-gray-900 to-gray-800

// Text gradients
gradients.text.primary   // from-violet-600 to-blue-600
gradients.text.secondary // from-violet-500 to-cyan-500

// Button gradients
gradients.button.primary // from-violet-400 to-violet-600
gradients.button.hover   // from-violet-500 to-violet-700
```

**CSS Usage:**

```css
.hero-section {
  background: linear-gradient(to bottom, var(--color-violet-50), var(--color-blue-50));
}

.gradient-text {
  background: linear-gradient(to right, var(--color-violet-600), var(--color-blue-600));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Address Display Colors

Specialized colors for cryptocurrency address display:

```typescript
import { addressColors } from '@/lib/design-tokens'

// Text colors
addressColors.text.light      // #374151 (gray-700)
addressColors.text.dark       // #d1d5db (gray-300)

// Background colors
addressColors.background.light // #f3f4f6 (gray-100)
addressColors.background.dark  // #374151 (gray-700)

// Copy button states
addressColors.copy.idle       // violet-600
addressColors.copy.hover      // violet-700
addressColors.copy.active     // violet-800
```

## Spacing Tokens

### Base Spacing Scale

Consistent spacing scale extending Tailwind's default system:

```typescript
import { baseSpacing } from '@/lib/design-tokens'

// Common spacing values
baseSpacing[0]    // 0px
baseSpacing[1]    // 0.25rem (4px)
baseSpacing[2]    // 0.5rem (8px)
baseSpacing[4]    // 1rem (16px)
baseSpacing[8]    // 2rem (32px)
baseSpacing[16]   // 4rem (64px)
baseSpacing[32]   // 8rem (128px)
```

### Glass Morphism Spacing

Optimized spacing for glass morphism layouts:

```typescript
import { glassSpacing } from '@/lib/design-tokens'

// Backdrop blur distances
glassSpacing.blur.sm     // 4px
glassSpacing.blur.md     // 12px (default)
glassSpacing.blur.lg     // 16px
glassSpacing.blur.xl     // 24px

// Container padding
glassSpacing.container.xs  // 0.75rem (12px)
glassSpacing.container.sm  // 1rem (16px)
glassSpacing.container.md  // 1.5rem (24px)
glassSpacing.container.lg  // 2rem (32px)
glassSpacing.container.xl  // 3rem (48px)

// Border radius
glassSpacing.radius.sm    // 0.25rem (4px)
glassSpacing.radius.md    // 0.5rem (8px)
glassSpacing.radius.lg    // 0.75rem (12px)
glassSpacing.radius['2xl'] // 1.5rem (24px) - common for cards
```

**Glass Container Example:**

```tsx
import { glassSpacing } from '@/lib/design-tokens'

const GlassContainer = () => (
  <div
    className="bg-white/80 backdrop-blur-md rounded-2xl"
    style={{
      padding: glassSpacing.container.md,
      backdropFilter: `blur(${glassSpacing.blur.md})`
    }}
  >
    Glass content
  </div>
)
```

### Web3 Layout Spacing

Specialized spacing for Web3 component layouts:

```typescript
import { web3Spacing } from '@/lib/design-tokens'

// Wallet layouts
web3Spacing.wallet.buttonPadding.x  // 1.5rem (24px)
web3Spacing.wallet.buttonPadding.y  // 0.75rem (12px)
web3Spacing.wallet.modalPadding     // 2rem (32px)
web3Spacing.wallet.accountGap       // 1rem (16px)

// Transaction interfaces
web3Spacing.transaction.formGap     // 1.5rem (24px)
web3Spacing.transaction.inputPadding // 1rem (16px)
web3Spacing.transaction.buttonGap   // 0.75rem (12px)
web3Spacing.transaction.statusGap   // 0.5rem (8px)
```

### Grid System

Responsive grid spacing and breakpoints:

```typescript
import { gridSpacing } from '@/lib/design-tokens'

// Grid gaps
gridSpacing.gap.xs    // 0.5rem (8px)
gridSpacing.gap.sm    // 1rem (16px)
gridSpacing.gap.md    // 1.5rem (24px)
gridSpacing.gap.lg    // 2rem (32px)
gridSpacing.gap.xl    // 3rem (48px)

// Container max-widths
gridSpacing.container.sm   // 640px
gridSpacing.container.md   // 768px
gridSpacing.container.lg   // 1024px
gridSpacing.container.xl   // 1280px
gridSpacing.container['2xl'] // 1536px
```

## Typography Tokens

### Font Families

Carefully selected font stacks for Web3 interfaces:

```typescript
import { fontFamilies } from '@/lib/design-tokens'

// Sans-serif (primary)
fontFamilies.sans // ['Inter', 'system-ui', ...]

// Monospace (addresses, code)
fontFamilies.mono // ['"Fira Code"', '"JetBrains Mono"', ...]

// Serif (marketing, headings)
fontFamilies.serif // ['"Playfair Display"', 'ui-serif', ...]
```

### Font Sizes

DeFi-optimized font scale with line heights:

```typescript
import { fontSizes } from '@/lib/design-tokens'

fontSizes.xs    // { fontSize: '0.75rem', lineHeight: '1rem' }
fontSizes.sm    // { fontSize: '0.875rem', lineHeight: '1.25rem' }
fontSizes.base  // { fontSize: '1rem', lineHeight: '1.5rem' }
fontSizes.lg    // { fontSize: '1.125rem', lineHeight: '1.75rem' }
fontSizes.xl    // { fontSize: '1.25rem', lineHeight: '1.75rem' }
fontSizes['2xl'] // { fontSize: '1.5rem', lineHeight: '2rem' }
fontSizes['3xl'] // { fontSize: '1.875rem', lineHeight: '2.25rem' }
```

**Usage in Components:**

```tsx
import { fontSizes } from '@/lib/design-tokens'

const Typography = () => (
  <div>
    <h1 style={fontSizes['3xl']}>Large Heading</h1>
    <p style={fontSizes.base}>Body text</p>
    <small style={fontSizes.xs}>Fine print</small>
  </div>
)
```

### Font Weights

Semantic font weight scale:

```typescript
import { fontWeights } from '@/lib/design-tokens'

fontWeights.thin       // 100
fontWeights.extralight // 200
fontWeights.light      // 300
fontWeights.normal     // 400
fontWeights.medium     // 500
fontWeights.semibold   // 600
fontWeights.bold       // 700
fontWeights.extrabold  // 800
fontWeights.black      // 900
```

### Web3 Typography

Specialized typography for DeFi interfaces:

```typescript
import { web3Typography } from '@/lib/design-tokens'

// Address display
web3Typography.address.mobile    // { fontSize: '0.75rem', fontFamily: 'mono' }
web3Typography.address.desktop   // { fontSize: '0.875rem', fontFamily: 'mono' }

// Amount display
web3Typography.amount.small      // { fontSize: '1rem', fontWeight: '600' }
web3Typography.amount.large      // { fontSize: '1.5rem', fontWeight: '700' }
web3Typography.amount.hero       // { fontSize: '2.25rem', fontWeight: '800' }

// Status indicators
web3Typography.status.compact    // { fontSize: '0.75rem', fontWeight: '500' }
web3Typography.status.standard   // { fontSize: '0.875rem', fontWeight: '500' }
```

## Shadow Tokens

### Base Shadows

Standard shadow scale for component elevation:

```typescript
import { baseShadows } from '@/lib/design-tokens'

baseShadows.none  // 'none'
baseShadows.sm    // '0 1px 2px 0 rgb(0 0 0 / 0.05)'
baseShadows.md    // '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
baseShadows.lg    // '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
baseShadows.xl    // '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
baseShadows['2xl'] // '0 25px 50px -12px rgb(0 0 0 / 0.25)'
```

### Glass Shadows

Theme-aware shadows for glass morphism:

```typescript
import { glassShadows } from '@/lib/design-tokens'

// Light mode
glassShadows.light.subtle      // Subtle elevation
glassShadows.light.moderate    // Standard cards
glassShadows.light.pronounced  // Modals, overlays
glassShadows.light.dramatic    // Hero sections

// Dark mode (more pronounced)
glassShadows.dark.subtle       // Enhanced visibility
glassShadows.dark.moderate     // Dark mode cards
glassShadows.dark.pronounced   // Dark overlays
glassShadows.dark.dramatic     // Dark hero sections

// Violet brand shadows
glassShadows.violet.subtle     // Branded elements
glassShadows.violet.glow       // Interactive focus states
```

### Elevation System

Semantic elevation levels for component layering:

```typescript
import { elevation } from '@/lib/design-tokens'

elevation.surface    // Ground level (no shadow)
elevation.raised     // Cards, buttons
elevation.overlay    // Dropdowns, popovers
elevation.modal      // Modals, dialogs
elevation.tooltip    // Tooltips, notifications
elevation.backdrop   // Full-screen overlays
```

**Usage Example:**

```tsx
import { elevation, glassShadows } from '@/lib/design-tokens'

const ElevatedCard = () => (
  <div
    className="bg-white/80 backdrop-blur-md rounded-2xl"
    style={{
      boxShadow: glassShadows.light.moderate,
      zIndex: elevation.raised
    }}
  >
    Elevated content
  </div>
)
```

## Animation Tokens

### Timing Functions

Carefully crafted easing curves for different interactions:

```typescript
import { timingFunctions } from '@/lib/design-tokens'

// Standard curves
timingFunctions.linear     // 'linear'
timingFunctions.easeIn     // 'cubic-bezier(0.4, 0, 1, 1)'
timingFunctions.easeOut    // 'cubic-bezier(0, 0, 0.2, 1)'
timingFunctions.easeInOut  // 'cubic-bezier(0.4, 0, 0.2, 1)'

// Expressive curves
timingFunctions.bounce     // 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
timingFunctions.elastic    // 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'

// Web3-specific curves
timingFunctions.wallet      // Smooth wallet interactions
timingFunctions.transaction // Confident transaction flows
timingFunctions.loading     // Steady loading states
```

### Duration Scale

Consistent timing scale for all animations:

```typescript
import { durations } from '@/lib/design-tokens'

durations.instant   // '0ms'
durations.fast      // '150ms'  - Micro-interactions
durations.normal    // '300ms'  - Standard transitions
durations.slow      // '500ms'  - Complex animations
durations.slower    // '750ms'  - Page transitions
durations.slowest   // '1000ms' - Loading states
```

### Web3 Animation Presets

Pre-built animations for common Web3 interactions:

```typescript
import { web3Animations } from '@/lib/design-tokens'

// Wallet connection flow
web3Animations.wallet.connect.duration    // '500ms'
web3Animations.wallet.connect.timing      // 'cubic-bezier(0.4, 0, 0.6, 1)'
web3Animations.wallet.disconnect.duration // '300ms'

// Transaction states
web3Animations.transaction.pending.duration   // '2000ms'
web3Animations.transaction.confirmed.duration // '400ms'
web3Animations.transaction.failed.duration    // '300ms'

// Balance updates
web3Animations.balance.update.duration    // '600ms'
web3Animations.balance.update.timing      // 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
```

**Animation Usage Example:**

```tsx
import { web3Animations, timingFunctions } from '@/lib/design-tokens'

const AnimatedBalance = ({ balance }: { balance: string }) => (
  <div
    className="transition-all"
    style={{
      transitionDuration: web3Animations.balance.update.duration,
      transitionTimingFunction: web3Animations.balance.update.timing
    }}
  >
    {balance} ETH
  </div>
)
```

## Usage Patterns

### TailwindCSS Integration

Design tokens are automatically available as TailwindCSS utilities:

```tsx
// Colors
<div className="bg-violet-600 text-violet-50">Violet branding</div>

// Spacing
<div className="p-6 m-4 gap-3">Consistent spacing</div>

// Typography
<h1 className="text-3xl font-bold">Typography scale</h1>

// Shadows
<div className="shadow-lg">Elevated content</div>

// Glass morphism pattern
<div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg">
  Glass container
</div>
```

### CSS Custom Properties

All tokens are available as CSS custom properties:

```css
.custom-component {
  /* Colors */
  background-color: var(--color-violet-600);
  color: var(--color-violet-50);

  /* Spacing */
  padding: var(--spacing-6);
  margin: var(--spacing-4);

  /* Typography */
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);

  /* Shadows */
  box-shadow: var(--shadow-lg);

  /* Animations */
  transition-duration: var(--duration-normal);
  transition-timing-function: var(--timing-ease-out);
}
```

### JavaScript/TypeScript Access

Import and use tokens directly in component logic:

```typescript
import {
  violetPalette,
  web3States,
  durations,
  timingFunctions
} from '@/lib/design-tokens'

// Dynamic styling based on state
const getStatusColor = (status: 'connected' | 'connecting' | 'disconnected') => {
  return web3States[status]
}

// Animation configuration
const animationConfig = {
  duration: durations.normal,
  easing: timingFunctions.easeOut
}

// Responsive breakpoints
const getResponsiveSpacing = (size: 'mobile' | 'desktop') => {
  return size === 'mobile' ? baseSpacing[4] : baseSpacing[8]
}
```

## CSS Integration

### Theme Variables

All design tokens are available as CSS custom properties with theme support:

```css
:root {
  /* Color tokens */
  --color-violet-50: #f5f3ff;
  --color-violet-600: #7c3aed;
  --color-violet-900: #4c1d95;

  /* Spacing tokens */
  --spacing-1: 0.25rem;
  --spacing-4: 1rem;
  --spacing-8: 2rem;

  /* Typography tokens */
  --font-size-base: 1rem;
  --font-weight-normal: 400;
  --font-weight-semibold: 600;

  /* Shadow tokens */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Animation tokens */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --timing-ease-out: cubic-bezier(0, 0, 0.2, 1);
}

[data-theme="dark"] {
  /* Dark mode overrides */
  --color-glass-primary: rgb(17 24 39 / 0.8);
  --color-glass-border: rgb(75 85 99 / 0.2);
}
```

### Component-Specific Variables

Create component-scoped CSS variables for better maintainability:

```css
.wallet-button {
  --button-bg: var(--color-violet-600);
  --button-hover-bg: var(--color-violet-700);
  --button-padding-x: var(--spacing-6);
  --button-padding-y: var(--spacing-3);
  --button-transition: var(--duration-normal) var(--timing-ease-out);

  background-color: var(--button-bg);
  padding: var(--button-padding-y) var(--button-padding-x);
  transition: background-color var(--button-transition);
}

.wallet-button:hover {
  background-color: var(--button-hover-bg);
}
```

## JavaScript Access

### Token Imports

Import specific token categories or individual tokens:

```typescript
// Import entire categories
import { colors, spacing, typography } from '@/lib/design-tokens'

// Import specific token groups
import { violetPalette, web3States } from '@/lib/design-tokens/colors'
import { glassSpacing, web3Spacing } from '@/lib/design-tokens/spacing'

// Import individual tokens
import {
  fontSizes,
  fontWeights
} from '@/lib/design-tokens/typography'
```

### Dynamic Token Usage

Use tokens dynamically based on props or state:

```typescript
import { web3States, glassShadows } from '@/lib/design-tokens'

interface StatusIndicatorProps {
  status: keyof typeof web3States
  theme: 'light' | 'dark'
}

const StatusIndicator = ({ status, theme }: StatusIndicatorProps) => {
  const style = {
    backgroundColor: web3States[status],
    boxShadow: glassShadows[theme].subtle,
    color: 'white'
  }

  return <div style={style}>{status}</div>
}
```

### Type Safety

Design tokens are fully typed for better developer experience:

```typescript
import type {
  VioletShade,
  Web3State,
  SemanticColor
} from '@/lib/design-tokens'

// Type-safe color usage
const primaryShade: VioletShade = 600
const connectionState: Web3State = 'connected'
const semanticColor: SemanticColor = 'success'

// Type-safe component props
interface ThemedComponentProps {
  shade: VioletShade
  state: Web3State
}
```

## Web3-Specific Patterns

### Wallet Connection States

Use semantic colors and animations for wallet states:

```tsx
import { web3States, web3Animations } from '@/lib/design-tokens'

const WalletStatus = ({ isConnected, isConnecting }: WalletStatusProps) => {
  const getStatus = () => {
    if (isConnecting) return 'connecting'
    return isConnected ? 'connected' : 'disconnected'
  }

  const status = getStatus()

  return (
    <div
      className="px-3 py-1 rounded-full text-white transition-all"
      style={{
        backgroundColor: web3States[status],
        transitionDuration: web3Animations.wallet.connect.duration
      }}
    >
      {status}
    </div>
  )
}
```

### Address Display

Specialized typography and colors for cryptocurrency addresses:

```tsx
import { addressColors, web3Typography } from '@/lib/design-tokens'

const AddressDisplay = ({ address, theme }: AddressDisplayProps) => (
  <code
    className="px-2 py-1 rounded font-mono text-sm"
    style={{
      backgroundColor: addressColors.background[theme],
      color: addressColors.text[theme],
      ...web3Typography.address.desktop
    }}
  >
    {address.slice(0, 6)}...{address.slice(-4)}
  </code>
)
```

### Transaction States

Visual feedback for transaction progression:

```tsx
import { web3States, web3Animations } from '@/lib/design-tokens'

const TransactionStatus = ({ status }: { status: 'pending' | 'confirmed' | 'failed' }) => (
  <div
    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white"
    style={{
      backgroundColor: web3States[status],
      animation: status === 'pending' ?
        `pulse ${web3Animations.transaction.pending.duration} infinite` :
        'none'
    }}
  >
    <StatusIcon status={status} />
    {status}
  </div>
)
```

### Network Indicators

Chain-specific branding with semantic colors:

```tsx
import { web3States } from '@/lib/design-tokens'

const NetworkBadge = ({ network }: { network: keyof typeof web3States }) => (
  <div
    className="px-2 py-1 rounded text-white text-xs font-medium"
    style={{ backgroundColor: web3States[network] }}
  >
    {network}
  </div>
)
```

## Theme Integration

### Dark Mode Support

Design tokens automatically support dark mode through CSS custom properties:

```css
/* Light mode (default) */
:root {
  --color-glass-primary: rgb(255 255 255 / 0.8);
  --color-glass-border: rgb(255 255 255 / 0.2);
}

/* Dark mode */
[data-theme="dark"] {
  --color-glass-primary: rgb(17 24 39 / 0.8);
  --color-glass-border: rgb(75 85 99 / 0.2);
}
```

### Next-themes Integration

Design tokens work seamlessly with next-themes:

```tsx
import { useTheme } from 'next-themes'
import { glassShadows } from '@/lib/design-tokens'

const ThemedComponent = () => {
  const { theme } = useTheme()

  return (
    <div
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md"
      style={{
        boxShadow: glassShadows[theme as 'light' | 'dark']?.moderate
      }}
    >
      Theme-aware content
    </div>
  )
}
```

### System Preference Detection

Respect user's system color scheme preference:

```css
/* System preference support */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --color-glass-primary: rgb(17 24 39 / 0.8);
    --color-glass-border: rgb(75 85 99 / 0.2);
  }
}
```

## Best Practices

### Consistency

1. **Use semantic tokens** - Prefer `violetPalette[600]` over hardcoded colors
2. **Leverage token categories** - Import from specific categories for better tree-shaking
3. **Follow naming conventions** - Use descriptive names that indicate purpose

### Performance

1. **CSS custom properties** - Use for dynamic theming and runtime changes
2. **Static imports** - Use TypeScript imports for build-time optimizations
3. **Selective imports** - Import only needed tokens to reduce bundle size

### Maintainability

1. **Centralized definitions** - All tokens defined in `/lib/design-tokens/`
2. **Type safety** - Use TypeScript types for compile-time validation
3. **Documentation** - Comment complex token calculations and relationships

### Accessibility

1. **Color contrast** - All color combinations meet WCAG AA standards
2. **Reduced motion** - Respect `prefers-reduced-motion` media query
3. **Focus indicators** - Use violet glow shadows for focus states

### Example: Complete Component

```tsx
import {
  violetPalette,
  glassSpacing,
  glassShadows,
  web3Typography,
  durations,
  timingFunctions
} from '@/lib/design-tokens'

const GlassButton = ({
  children,
  variant = 'primary',
  theme = 'light'
}: GlassButtonProps) => {
  const styles = {
    background: variant === 'primary' ? violetPalette[600] : 'transparent',
    color: variant === 'primary' ? 'white' : violetPalette[600],
    padding: `${glassSpacing.container.sm} ${glassSpacing.container.md}`,
    borderRadius: glassSpacing.radius.lg,
    boxShadow: glassShadows[theme].moderate,
    fontSize: web3Typography.status.standard.fontSize,
    fontWeight: web3Typography.status.standard.fontWeight,
    transition: `all ${durations.normal} ${timingFunctions.easeOut}`,
    border: variant === 'secondary' ?
      `1px solid ${violetPalette[300]}` : 'none'
  }

  return (
    <button
      className="backdrop-blur-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-500"
      style={styles}
    >
      {children}
    </button>
  )
}
```

This comprehensive example demonstrates:

- Multiple token category usage
- Type-safe props and token access
- Theme-aware styling
- Responsive design patterns
- Accessibility considerations
- Performance optimizations

## Summary

Design tokens are the foundation of the Token Toilet Design System. They provide:

1. **Consistency** - Unified visual language across all components
2. **Maintainability** - Centralized design decisions
3. **Flexibility** - Multiple access patterns (CSS, JS, TailwindCSS)
4. **Type Safety** - Full TypeScript support
5. **Performance** - Optimized for modern bundlers
6. **Accessibility** - WCAG-compliant color combinations
7. **Web3 Focus** - Specialized tokens for DeFi interfaces

Use these tokens as the building blocks for all custom components and styling to ensure consistency with the design system.
