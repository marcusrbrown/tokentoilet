# Getting Started with Token Toilet Design System

Welcome to the Token Toilet Design System! This comprehensive design system provides a unified set of components, design tokens, and patterns specifically built for Web3 DeFi applications with a focus on violet branding and glass morphism aesthetics.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Design Tokens](#design-tokens)
- [Component Usage](#component-usage)
- [Styling Patterns](#styling-patterns)
- [Web3 Integration](#web3-integration)
- [Theming and Dark Mode](#theming-and-dark-mode)
- [Development Workflow](#development-workflow)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Installation

The Token Toilet Design System is built into the project and doesn't require separate installation. However, ensure you have the required dependencies:

### Prerequisites

- **Node.js 18+**
- **pnpm** (preferred package manager)
- **Next.js 15** with App Router
- **TailwindCSS v4**

### Required Dependencies

The design system relies on these key dependencies:

```json
{
  "dependencies": {
    "next": "15.5.3",
    "react": "19.1.1",
    "react-dom": "19.1.1",
    "next-themes": "^0.4.4",
    "lucide-react": "^0.542.0",
    "react-hot-toast": "^2.6.0"
  },
  "devDependencies": {
    "@storybook/react": "9.x",
    "@storybook/nextjs": "9.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  }
}
```

### Setup Commands

```bash
# Install all dependencies
pnpm bootstrap

# Start development server
pnpm dev

# Start Storybook for component development
pnpm storybook

# Run tests
pnpm test
```

## Quick Start

### 1. Import Components

All design system components are available from the `@/components/ui` path:

```typescript
import { AddressDisplay } from '@/components/ui/address-display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

### 2. Basic Component Usage

```typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function MyComponent() {
  // Card with padding
  // Welcome heading with violet colors
  // Description text
  // Connect wallet button
  return null
}
```

### 3. Web3 Component Integration

For Web3-specific functionality, use specialized components:

```typescript
import { AddressDisplay } from '@/components/ui/address-display'
import { ConnectionStatus } from '@/components/ui/connection-status'
import { NetworkBadge } from '@/components/ui/network-badge'
import { WalletButton } from '@/components/web3/wallet-button'

export function WalletSection() {
  // Container with spacing
  // WalletButton component
  // ConnectionStatus component
  // AddressDisplay with copy functionality
  // NetworkBadge for chain display
  return null
}
```

## Design Tokens

The design system uses a comprehensive token system built with TailwindCSS v4 and CSS custom properties.

### Color Tokens

**Violet Brand Palette:**

```css
/* Primary brand colors */
--color-violet-50: #f5f3ff;
--color-violet-500: #8b5cf6; /* Primary brand color */
--color-violet-900: #4c1d95;
```

**Web3 State Colors:**

```css
/* Connection states */
--color-web3-connected: #10b981;
--color-web3-connecting: #f59e0b;
--color-web3-disconnected: #ef4444;

/* Transaction states */
--color-web3-pending: #f59e0b;
--color-web3-confirmed: #10b981;
--color-web3-failed: #ef4444;
```

### Using Design Tokens

**In Components:**

```css
/* Use semantic color classes */
.primary-action { @apply bg-violet-500 text-white; }
.connected-state { @apply text-web3-connected; }
```

**In JavaScript:**

```typescript
import { violetPalette, web3States } from '@/lib/design-tokens/colors'

const primaryColor = violetPalette[500] // #8b5cf6
const connectedState = web3States.connected // #10b981
```

## Component Usage

### Button Component

The Button component supports multiple variants and Web3-specific states:

```typescript
import { Button } from '@/components/ui/button'

// Variants
// Primary, secondary, glass, web3 variants
// Small, medium, large sizes
// Loading and disabled states
```

### Card Component

Cards provide glass morphism effects and consistent spacing:

```typescript
import { Card } from '@/components/ui/card'

// Standard card with padding
// Glass morphism variant available
```

### Web3 Components

**Address Display:**

```typescript
import { AddressDisplay } from '@/components/ui/address-display'

// Shows formatted address with copy functionality
// Supports short and full format options
```

**Network Badge:**

```typescript
import { NetworkBadge } from '@/components/ui/network-badge'

// Displays network badges for Ethereum, Polygon, Arbitrum
```

**Connection Status:**

```typescript
import { ConnectionStatus } from '@/components/ui/connection-status'

// Shows connection state: connected, connecting, disconnected
// Displays address and network information
```

## Styling Patterns

### Glass Morphism

The design system features glass morphism as a core aesthetic:

```css
/* Glass container utilities */
.glass-container {
  @apply bg-white/80 backdrop-blur-md border border-white/20;
}

.glass-card {
  @apply glass-container rounded-lg shadow-glass-subtle;
}

.glass-button {
  @apply glass-container hover:bg-white/90 active:bg-white/95;
}
```

### Gradient Backgrounds

Use predefined gradient patterns:

```css
/* Hero section gradients */
.hero-gradient {
  @apply bg-gradient-to-br from-violet-50 to-blue-50;
  @apply dark:from-violet-900/20 dark:to-blue-900/20;
}

/* Button gradients */
.gradient-button {
  @apply bg-gradient-to-r from-violet-400 to-blue-600;
}
```

### Address Formatting

Consistent address truncation pattern:

```typescript
// Manual formatting
const formatAddress = (address) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`

// Using AddressDisplay component (recommended)
// Component handles formatting automatically
```

## Web3 Integration

### Provider Setup

Ensure your app is wrapped with the Web3 provider chain:

```typescript
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  // HTML structure with Providers wrapper
}
```

### Using Web3 Components

Web3 components require the 'use client' directive:

```typescript
'use client'

import { WalletButton } from '@/components/web3/wallet-button'
import { useWallet } from '@/hooks/use-wallet'

export function WalletSection() {
  const { address, isConnected, connect, disconnect } = useWallet()

  // Conditional rendering based on connection state
  // AddressDisplay and disconnect button when connected
  // WalletButton when disconnected
}
```

## Theming and Dark Mode

### Theme Setup

The design system integrates with `next-themes` for seamless dark mode:

```typescript
// In your component
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  // Button to toggle between light and dark themes
}
```

### Dark Mode Classes

Use Tailwind's `dark:` modifier for dark mode styles:

```css
.theme-aware-content {
  @apply bg-white dark:bg-gray-900;
  @apply text-gray-900 dark:text-white;
}
```

### Theme-Aware Glass Effects

Glass morphism adapts to theme automatically:

```typescript
// Light mode: bg-white/80
// Dark mode: bg-gray-900/80
// Card with automatic theme adaptation
```

## Development Workflow

### Storybook Development

Use Storybook for component development and testing:

```bash
# Start Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook
```

View components in isolation at `http://localhost:6006`

### Component Testing

Test components with the included test setup:

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run specific component tests
pnpm vitest address-display.test.tsx

# Run tests matching pattern
pnpm vitest -t "wallet connection"
```

### Linting and Formatting

Maintain code quality:

```bash
# Run ESLint
pnpm lint

# Auto-fix issues
pnpm fix
```

### Design System Validation

Validate design system integrity with comprehensive checks:

```bash
# Validate design system completeness
pnpm validate:design-system

# Run type checking
pnpm type-check

# Validate Storybook stories build
pnpm validate:stories

# Run complete validation suite (CI/CD ready)
pnpm validate
```

The `validate:design-system` script checks:

- **Component completeness**: Ensures all UI components have test and story files
- **Design tokens**: Verifies all required design token files exist
- **Documentation**: Confirms all required documentation is present
- **Storybook configuration**: Validates Storybook setup

Use `pnpm validate` in CI/CD pipelines to run all quality checks: linting, type-checking, testing, design system validation, and Storybook build verification.

## Best Practices

### Component Development

1. **Use TypeScript**: All components should have proper TypeScript interfaces
2. **Follow atomic design**: Build components from smallest to largest (atoms → molecules → organisms)
3. **Include accessibility**: Ensure WCAG 2.1 AA compliance
4. **Write tests**: Include unit tests for all components
5. **Document props**: Use JSDoc comments for component APIs

### Styling Guidelines

1. **Use design tokens**: Prefer semantic color names over arbitrary values
2. **Maintain consistency**: Use established spacing and typography scales
3. **Support dark mode**: Always include dark mode variants
4. **Glass morphism**: Use established glass utility classes
5. **Web3 states**: Use semantic Web3 state colors for connection status

### Performance Considerations

1. **Tree shaking**: Import only needed components
2. **Client-side only**: Use 'use client' only when necessary
3. **Lazy loading**: Consider dynamic imports for large components
4. **Bundle analysis**: Monitor bundle size impact

### Code Organization

```text
components/
├── ui/              # Core design system components
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── web3/            # Web3-specific components
│   ├── wallet-button.tsx
│   └── web3-provider.tsx
└── theme-sync.tsx   # Theme integration components

lib/
├── design-tokens/   # Design token definitions
│   ├── colors.ts
│   ├── spacing.ts
│   └── ...
├── utils.ts         # Utility functions
└── web3/           # Web3 configuration
```

## Troubleshooting

### Common Issues

**Component not found:**

```bash
# Ensure proper import path
# Use @/components/ui/button (correct)
# Avoid relative imports
```

**Styles not applying:**

```bash
# Verify TailwindCSS configuration
# Check if component has proper className merging
# Use cn utility from @/lib/utils
```

**Web3 components not working:**

```typescript
// Ensure component is client-side with 'use client'
// Verify Web3 provider is properly configured
// Check that useWallet hook is available
```

**Dark mode not working:**

```typescript
// Verify next-themes provider is set up
// Check that dark: classes are properly applied
// Ensure CSS custom properties support dark variants
```

### Getting Help

1. **Storybook**: Check component examples and documentation
2. **Tests**: Look at test files for usage examples
3. **GitHub Issues**: Report bugs or request features
4. **Code Review**: Follow established patterns in existing components

### Migration from Custom Styles

When migrating from custom Tailwind classes to design system components:

1. **Identify patterns**: Look for repeated styling patterns
2. **Use components**: Replace custom styles with design system components
3. **Preserve behavior**: Ensure functionality remains the same
4. **Test thoroughly**: Verify visual and functional compatibility

## Next Steps

After completing this getting started guide:

1. **Explore components**: Browse the Component Documentation (components.md)
2. **Learn design tokens**: Read the Design Tokens Reference (design-tokens.md)
3. **Check accessibility**: Review Accessibility Guidelines (accessibility.md)
4. **Start building**: Use Storybook to develop new components

## Resources

- [TailwindCSS v4 Documentation](https://tailwindcss.com)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [Wagmi Documentation](https://wagmi.sh)
- [Storybook Documentation](https://storybook.js.org)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Need help?** Open an issue in the Token Toilet repository or check the existing documentation for more detailed information about specific components and patterns.
