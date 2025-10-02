# Design System Migration Guide

A comprehensive guide for migrating existing components and ad-hoc Tailwind CSS styles to the Token Toilet Design System. This guide provides step-by-step instructions, conversion patterns, and troubleshooting tips to ensure a smooth transition.

## Table of Contents

- [Migration Overview](#migration-overview)
- [Pre-Migration Checklist](#pre-migration-checklist)
- [Migration Strategies](#migration-strategies)
- [Component Conversion Patterns](#component-conversion-patterns)
- [Common Migration Scenarios](#common-migration-scenarios)
- [Web3-Specific Migrations](#web3-specific-migrations)
- [Tailwind v4 Considerations](#tailwind-v4-considerations)
- [Quality Assurance](#quality-assurance)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Migration Overview

### What Is Being Migrated?

The Token Toilet Design System migration transforms:

- **Raw HTML Elements** → Design System Components
- **Ad-hoc Tailwind Classes** → Structured Component Props
- **Inline Styles** → Design Tokens and CSS Custom Properties
- **Custom CSS Classes** → Component Variants

### Benefits of Migration

✅ **Consistency**: Unified styling across the application
✅ **Type Safety**: Full TypeScript support with prop validation
✅ **Accessibility**: Built-in WCAG 2.1 AA compliance
✅ **Maintainability**: Centralized component logic and styling
✅ **Performance**: Optimized class variance authority
✅ **Web3 Integration**: Specialized components for DeFi interfaces

### Migration Scope

- **Phase 1**: Core UI elements (buttons, cards, inputs)
- **Phase 2**: Layout components (navigation, headers, footers)
- **Phase 3**: Web3-specific components (wallet buttons, transaction cards)
- **Phase 4**: Complex interactive components (modals, forms, tooltips)

## Pre-Migration Checklist

Before starting the migration process:

- [ ] **Review Design System Documentation**
  - [Getting Started Guide](./getting-started.md)
  - [Component API Reference](./components.md)
  - [Design Tokens Reference](./design-tokens.md)

- [ ] **Audit Current Code**
  - Identify raw HTML elements (`<button>`, `<input>`, `<div>` with card-like styling)
  - Document existing Tailwind class patterns
  - List Web3-specific UI elements

- [ ] **Set Up Development Environment**
  - Install dependencies: `pnpm bootstrap`
  - Start Storybook: `pnpm storybook`
  - Run development server: `pnpm dev`

- [ ] **Create Backup**
  - Commit current changes
  - Create migration branch: `git checkout -b migrate-design-system`

- [ ] **Review Accessibility Requirements**
  - Check [Accessibility Guidelines](./accessibility.md)
  - Ensure keyboard navigation patterns
  - Plan ARIA attribute preservation

## Migration Strategies

### Strategy 1: Incremental Component Migration

**Best for**: Large codebases with many components

**Approach**: Migrate one component at a time, testing after each change.

```bash
# Migration workflow
1. Select target component
2. Convert to design system components
3. Run tests: pnpm test
4. Verify in Storybook
5. Commit changes
6. Move to next component
```

### Strategy 2: Pattern-Based Migration

**Best for**: Codebases with repeated patterns

**Approach**: Identify common patterns, migrate all instances at once.

```bash
# Example: Migrate all buttons
1. Search for all <button> elements: grep -r "<button" app/
2. Convert all to <Button> component
3. Run comprehensive tests
4. Commit batch changes
```

### Strategy 3: Feature-Branch Migration

**Best for**: Critical production applications

**Approach**: Maintain parallel implementations, gradual rollout.

```bash
# Feature flag approach
1. Add new design system components alongside old
2. Implement feature flag: USE_DESIGN_SYSTEM
3. Gradually enable flag for different sections
4. Remove old components once validated
```

## Component Conversion Patterns

### Pattern 1: Button Migration

#### Before: Raw Button Element

```tsx
<button
  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
  onClick={handleClick}
>
  Connect Wallet
</button>
```

#### After: Design System Button

```tsx
import { Button } from '@/components/ui/button'

<Button
  variant="default"
  size="default"
  onClick={handleClick}
>
  Connect Wallet
</Button>
```

**Key Changes**:
- Import `Button` from `@/components/ui/button`
- Replace `className` with `variant` and `size` props
- Remove manual color, padding, and transition classes
- Preserve event handlers and other HTML attributes

### Pattern 2: Card/Container Migration

#### Before: Div with Glass Morphism

```tsx
<div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-md dark:bg-gray-900/80 dark:border-gray-700/30">
  <h3 className="text-xl font-semibold mb-4">Wallet Balance</h3>
  <p className="text-gray-600 dark:text-gray-400">$1,234.56</p>
</div>
```

#### After: Design System Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card variant="default" elevation="medium" padding="md">
  <CardHeader>
    <CardTitle>Wallet Balance</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-gray-600 dark:text-gray-400">$1,234.56</p>
  </CardContent>
</Card>
```

**Key Changes**:
- Import `Card` and sub-components
- Replace manual glass morphism classes with `variant="default"`
- Use structured `CardHeader`, `CardTitle`, `CardContent`
- Maintain semantic HTML structure
- Preserve dark mode support

### Pattern 3: Input Migration

#### Before: Raw Input Element

```tsx
<input
  type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-600"
  placeholder="Enter amount"
  value={value}
  onChange={handleChange}
/>
```

#### After: Design System Input

```tsx
import { Input } from '@/components/ui/input'

<Input
  type="text"
  placeholder="Enter amount"
  value={value}
  onChange={handleChange}
  className="w-full"
/>
```

**Key Changes**:
- Import `Input` from `@/components/ui/input`
- Remove manual border, focus, and dark mode classes
- Preserve value, onChange, and other form attributes
- Keep layout classes (e.g., `w-full`) in `className` prop

### Pattern 4: Badge/Status Migration

#### Before: Span with Colored Background

```tsx
<span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full dark:bg-green-900/30 dark:text-green-400">
  Connected
</span>
```

#### After: Design System Badge

```tsx
import { Badge } from '@/components/ui/badge'

<Badge variant="connected">
  Connected
</Badge>
```

**Key Changes**:
- Import `Badge` from `@/components/ui/badge`
- Replace manual color classes with semantic `variant`
- Use Web3-specific variants: `connected`, `disconnected`, `pending`

## Common Migration Scenarios

### Scenario 1: Navigation Bar

#### Before: Custom Navigation

```tsx
<nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-700">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Droplets className="h-8 w-8 text-violet-600" />
      <span className="text-xl font-bold">Token Toilet</span>
    </div>
    <div className="flex items-center gap-4">
      <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
        Toggle Theme
      </button>
      <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
        Connect Wallet
      </button>
    </div>
  </div>
</nav>
```

#### After: Design System Navigation

```tsx
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { WalletButton } from '@/components/web3/wallet-button'

<nav className="fixed top-0 z-50 w-full px-6 py-4">
  <Card variant="default" className="mx-auto max-w-7xl" padding="sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Droplets className="h-8 w-8 text-violet-600" />
        <span className="text-xl font-bold">Token Toilet</span>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <WalletButton />
      </div>
    </div>
  </Card>
</nav>
```

**Migration Steps**:
1. Replace outer `<nav>` background with `Card` component
2. Use `ThemeToggle` instead of raw button
3. Use `WalletButton` for wallet connections
4. Preserve layout structure and spacing
5. Test dark mode functionality

### Scenario 2: Feature Cards Grid

#### Before: Manual Grid with Divs

```tsx
<div className="grid gap-8 md:grid-cols-3">
  <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:shadow-lg transition-shadow dark:bg-gray-900/80 dark:border-gray-700/30">
    <div className="mb-4 rounded-lg bg-violet-100 p-3 dark:bg-violet-900/30">
      <Droplets className="h-8 w-8 text-violet-600" />
    </div>
    <h3 className="mb-2 text-xl font-semibold">Easy Disposal</h3>
    <p className="text-gray-600 dark:text-gray-400">Simple one-click token disposal</p>
  </div>
  {/* More cards... */}
</div>
```

#### After: Design System Card Grid

```tsx
import { Card } from '@/components/ui/card'

<div className="grid gap-8 md:grid-cols-3">
  <Card variant="default" elevation="low" interactive="subtle" className="group">
    <div className="mb-4 rounded-lg bg-violet-100 p-3 dark:bg-violet-900/30">
      <Droplets className="h-8 w-8 text-violet-600 dark:text-violet-400" />
    </div>
    <h3 className="mb-2 text-xl font-semibold">Easy Disposal</h3>
    <p className="text-gray-600 dark:text-gray-400">Simple one-click token disposal</p>
  </Card>
  {/* More cards... */}
</div>
```

**Migration Steps**:
1. Replace each `<div>` with `<Card>` component
2. Add `elevation="low"` for subtle shadow
3. Add `interactive="subtle"` for hover effects
4. Preserve grid layout classes
5. Maintain icon and text styling

### Scenario 3: Form with Validation

#### Before: Custom Form Elements

```tsx
<form className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Token Address
    </label>
    <input
      type="text"
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
  <button
    type="submit"
    className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
  >
    Submit
  </button>
</form>
```

#### After: Design System Form

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

<form className="space-y-4">
  <div>
    <Label htmlFor="token-address">Token Address</Label>
    <Input
      id="token-address"
      type="text"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      aria-invalid={!!error}
      aria-describedby={error ? 'token-address-error' : undefined}
    />
    {error && (
      <p id="token-address-error" className="mt-1 text-sm text-red-600">
        {error}
      </p>
    )}
  </div>
  <Button type="submit" className="w-full">
    Submit
  </Button>
</form>
```

**Migration Steps**:
1. Import `Button`, `Input`, and `Label` components
2. Replace raw elements with design system components
3. Add proper ARIA attributes for accessibility
4. Preserve form validation logic
5. Test keyboard navigation and screen reader support

## Web3-Specific Migrations

### Web3 Pattern 1: Wallet Connection Button

#### Before: Custom Wallet Button

```tsx
<button
  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
    isConnected
      ? 'bg-green-600 text-white'
      : 'bg-violet-600 text-white hover:bg-violet-700'
  }`}
  onClick={isConnected ? handleDisconnect : handleConnect}
>
  {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
</button>
```

#### After: Design System Wallet Button

```tsx
import { WalletButton } from '@/components/web3/wallet-button'

<WalletButton />
```

**Migration Steps**:
1. Import `WalletButton` from `@/components/web3/wallet-button`
2. Remove custom wallet connection logic
3. Component automatically handles connection state
4. Address formatting is built-in
5. Network switching is integrated

### Web3 Pattern 2: Address Display

#### Before: Custom Address Formatting

```tsx
<div className="flex items-center gap-2">
  <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
  </span>
  {address && (
    <button
      onClick={() => navigator.clipboard.writeText(address)}
      className="p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-800"
    >
      <Copy className="h-4 w-4" />
    </button>
  )}
</div>
```

#### After: Design System Address Display

```tsx
import { AddressDisplay } from '@/components/ui/address-display'

<AddressDisplay
  address={address}
  showCopy
  showExternalLink
  variant="default"
  size="default"
/>
```

**Migration Steps**:
1. Import `AddressDisplay` from `@/components/ui/address-display`
2. Pass `address` prop
3. Enable `showCopy` for clipboard functionality
4. Enable `showExternalLink` for block explorer link
5. Component handles formatting automatically

### Web3 Pattern 3: Network Badge

#### Before: Custom Network Indicator

```tsx
<span
  className={`px-2 py-1 rounded-full text-xs font-medium ${
    chainId === 1
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  }`}
>
  {chainId === 1 ? 'Ethereum' : chainId === 137 ? 'Polygon' : 'Unknown'}
</span>
```

#### After: Design System Network Badge

```tsx
import { NetworkBadge } from '@/components/ui/network-badge'

<NetworkBadge
  chainId={chainId}
  showIcon
  size="default"
/>
```

**Migration Steps**:
1. Import `NetworkBadge` from `@/components/ui/network-badge`
2. Pass `chainId` prop
3. Enable `showIcon` for chain icon
4. Component automatically maps chain IDs to names and colors

### Web3 Pattern 4: Transaction Status

#### Before: Custom Transaction Card

```tsx
<div className="bg-white rounded-lg p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
  <div className="flex items-center justify-between mb-2">
    <span className="font-medium">Token Disposal</span>
    <span
      className={`px-2 py-1 rounded-full text-xs ${
        status === 'pending'
          ? 'bg-yellow-100 text-yellow-800'
          : status === 'confirmed'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
      }`}
    >
      {status}
    </span>
  </div>
  <p className="text-sm text-gray-600 dark:text-gray-400">Amount: {amount} USDC</p>
  <a
    href={`https://etherscan.io/tx/${txHash}`}
    className="text-sm text-violet-600 hover:text-violet-700 mt-2 inline-block"
  >
    View on Etherscan
  </a>
</div>
```

#### After: Design System Transaction Card

```tsx
import { TransactionCard } from '@/components/ui/transaction-card'

<TransactionCard
  type="disposal"
  status={status}
  amount={amount}
  token="USDC"
  txHash={txHash}
  chainId={1}
/>
```

**Migration Steps**:
1. Import `TransactionCard` from `@/components/ui/transaction-card`
2. Pass transaction details as props
3. Component handles status badge styling
4. Etherscan link is automatically generated
5. Supports multiple transaction types

## Tailwind v4 Considerations

### CSS-First Approach

Token Toilet uses **Tailwind CSS v4** with CSS-first configuration. Keep these patterns in mind during migration:

#### ✅ DO: Use Utility Classes

```tsx
<Card className="max-w-7xl mx-auto" padding="md">
  {/* Utility classes for layout, component props for design system */}
</Card>
```

#### ❌ DON'T: Use @apply Directives

```css
/* INCORRECT - @apply directives removed in v4 migration */
.custom-card {
  @apply bg-white/80 backdrop-blur-md;
}

/* CORRECT - Use design system components or CSS properties */
.custom-card {
  background-color: var(--color-glass-light-primary);
  backdrop-filter: blur(12px);
}
```

### Design Tokens and CSS Custom Properties

Use CSS custom properties for theme-aware styling:

```tsx
// Access design tokens
<div
  style={{
    backgroundColor: 'var(--color-violet-500)',
    padding: 'var(--spacing-glass-md)',
    boxShadow: 'var(--shadow-glass-subtle)',
  }}
>
  Custom styled element
</div>
```

### Glass Morphism Pattern

The design system provides consistent glass morphism:

```tsx
// ✅ CORRECT: Use Card component with glass variant
<Card variant="default">
  {/* Automatic backdrop-blur-md and semi-transparent background */}
</Card>

// ❌ INCORRECT: Manual glass morphism classes
<div className="bg-white/80 backdrop-blur-md border border-white/20">
  {/* Inconsistent with design system */}
</div>
```

### Dark Mode Support

Dark mode is handled automatically by components:

```tsx
// ✅ CORRECT: Component handles dark mode
<Card variant="default">
  <p className="text-gray-600 dark:text-gray-400">Content</p>
</Card>

// Component automatically applies:
// - bg-white/80 dark:bg-gray-900/80
// - border-gray-200 dark:border-gray-700
```

## Quality Assurance

### Post-Migration Testing Checklist

After migrating components, verify:

- [ ] **Visual Parity**: Component looks identical to before migration
- [ ] **Functionality**: All interactions work as expected
- [ ] **Responsive Design**: Layout works on mobile, tablet, desktop
- [ ] **Dark Mode**: Theming works correctly
- [ ] **Accessibility**: Keyboard navigation and screen reader support
- [ ] **Web3 Integration**: Wallet connections and transactions function properly

### Testing Commands

```bash
# Linting verification
pnpm lint

# Type checking
pnpm type-check  # if available

# Test suite
pnpm test

# Build verification
pnpm build

# Visual testing in Storybook
pnpm storybook
```

### Manual Testing Checklist

- [ ] **Hover States**: Verify hover effects work correctly
- [ ] **Focus States**: Tab through interactive elements
- [ ] **Click/Touch**: Test all button and link interactions
- [ ] **Form Validation**: Test input validation and error states
- [ ] **Loading States**: Verify loading spinners and skeletons
- [ ] **Error Handling**: Test error boundaries and fallback UI
- [ ] **Web3 Wallets**: Test with MetaMask, WalletConnect, Coinbase Wallet

## Troubleshooting

### Issue: Component Not Found

**Problem**: `Module not found: Can't resolve '@/components/ui/button'`

**Solution**:
```tsx
// Verify correct import path
import { Button } from '@/components/ui/button'

// Check tsconfig.json path alias
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: Styles Not Applying

**Problem**: Component renders but styling looks incorrect

**Solution**:
1. Check if component has `'use client'` directive (if interactive)
2. Verify TailwindCSS is properly configured
3. Use `cn()` utility from `@/lib/utils` for className merging
4. Check for conflicting custom CSS

```tsx
import { cn } from '@/lib/utils'

<Button className={cn('custom-class', props.className)}>
  Properly merged classes
</Button>
```

### Issue: Web3 Components Not Working

**Problem**: WalletButton or other Web3 components throw errors

**Solution**:
```tsx
// Ensure component is client-side
'use client'

// Verify Web3 provider is configured in layout
// app/layout.tsx → app/providers.tsx → Web3Provider

// Check wagmi and Reown AppKit configuration
// lib/web3/config.ts
```

### Issue: Dark Mode Not Toggling

**Problem**: Theme toggle button doesn't switch modes

**Solution**:
1. Verify `next-themes` provider is set up
2. Check ThemeProvider configuration
3. Ensure components use `dark:` variant classes

```tsx
// app/providers.tsx
import { ThemeProvider } from 'next-themes'

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

### Issue: Type Errors After Migration

**Problem**: TypeScript errors with component props

**Solution**:
```tsx
// Check VariantProps usage
import { Button, type ButtonProps } from '@/components/ui/button'

// Extend props if needed
interface CustomButtonProps extends ButtonProps {
  customProp?: string
}

// Use proper prop spreading
<Button {...buttonProps} />
```

### Issue: Missing Design Tokens

**Problem**: CSS custom property not found

**Solution**:
```bash
# Verify design tokens are defined in globals.css
# Check @theme blocks in app/globals.css

# Ensure proper CSS import order
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
@theme { /* tokens */ }
```

## Best Practices

### 1. Gradual Migration

✅ **DO**: Migrate one feature or page at a time
❌ **DON'T**: Attempt to migrate entire codebase at once

### 2. Component Composition

✅ **DO**: Use component composition

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

❌ **DON'T**: Over-configure components with too many props

### 3. Preserve Accessibility

✅ **DO**: Maintain ARIA attributes and semantic HTML

```tsx
<Button
  aria-label="Connect wallet"
  aria-describedby="wallet-status"
  onClick={handleConnect}
>
  Connect
</Button>
```

❌ **DON'T**: Remove accessibility features during migration

### 4. Test Continuously

✅ **DO**: Run tests after each migration step
❌ **DON'T**: Accumulate untested changes

### 5. Document Changes

✅ **DO**: Document non-obvious migrations in commit messages

```bash
git commit -m "feat: Migrate navigation to design system Card component

- Replaced manual glass morphism with Card variant='default'
- Integrated ThemeToggle and WalletButton components
- Preserved responsive layout and accessibility
- Tested dark mode and wallet connection flows"
```

❌ **DON'T**: Make broad, undocumented changes

### 6. Leverage Storybook

✅ **DO**: Use Storybook to verify component behavior

```bash
pnpm storybook

# Navigate to migrated component story
# Verify all variants and states work correctly
```

### 7. Maintain Type Safety

✅ **DO**: Use TypeScript interfaces from components

```tsx
import { Button, type ButtonProps } from '@/components/ui/button'

const MyButton: React.FC<ButtonProps> = (props) => <Button {...props} />
```

### 8. Follow Web3 Patterns

✅ **DO**: Use specialized Web3 components for Web3 functionality

```tsx
import { WalletButton } from '@/components/web3/wallet-button'
import { AddressDisplay } from '@/components/ui/address-display'
import { NetworkBadge } from '@/components/ui/network-badge'
```

❌ **DON'T**: Build custom Web3 UI when components exist

## Migration Examples by Component Type

### Buttons

| Before | After | Notes |
|--------|-------|-------|
| `<button className="bg-violet-600">` | `<Button variant="default">` | Primary action |
| `<button className="border border-violet-600">` | `<Button variant="outline">` | Secondary action |
| `<button className="bg-green-600">` | `<Button variant="web3Connected">` | Connected state |
| `<button className="p-2 rounded">` | `<Button variant="ghost" size="icon">` | Icon button |

### Cards

| Before | After | Notes |
|--------|-------|-------|
| `<div className="bg-white/80 backdrop-blur">` | `<Card variant="default">` | Glass morphism |
| `<div className="bg-white border shadow">` | `<Card variant="solid">` | Solid background |
| `<div className="hover:shadow-lg">` | `<Card interactive="subtle">` | Hover effect |
| `<div className="border-violet-200">` | `<Card variant="web3">` | Web3 theming |

### Inputs

| Before | After | Notes |
|--------|-------|-------|
| `<input className="border rounded">` | `<Input />` | Standard input |
| `<input type="number" step="0.01">` | `<TokenInput />` | Token amount |
| `<input pattern="0x[a-fA-F0-9]">` | `<AddressInput />` | Address input |

### Badges

| Before | After | Notes |
|--------|-------|-------|
| `<span className="bg-green-100">` | `<Badge variant="connected">` | Connection status |
| `<span className="bg-yellow-100">` | `<Badge variant="pending">` | Transaction pending |
| `<span className="bg-blue-100">` | `<Badge variant="mainnet">` | Network indicator |

## Additional Resources

### Documentation

- [Getting Started Guide](./getting-started.md) - Setup and quick start
- [Component API Reference](./components.md) - Complete component documentation
- [Design Tokens Reference](./design-tokens.md) - Color, spacing, typography tokens
- [Accessibility Guidelines](./accessibility.md) - WCAG compliance and testing

### Code Examples

- [Storybook](http://localhost:6006) - Interactive component examples
- [app/page.tsx](../../app/page.tsx) - Migrated homepage example
- [Component Test Files](../../components/ui/) - Test examples with mocking patterns

### Migration Tools

- **ESLint Rules**: Enforces design system component usage (see `eslint.config.ts`)
- **TypeScript**: Provides type safety and IntelliSense for components
- **Prettier**: Ensures consistent code formatting

### External References

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [Wagmi Documentation](https://wagmi.sh/) - Web3 React hooks
- [Reown AppKit](https://docs.reown.com/appkit/overview) - Wallet connection UI

## Summary

Successfully migrating to the Token Toilet Design System requires:

1. **Planning**: Audit existing code and create migration strategy
2. **Incremental Approach**: Migrate components one at a time
3. **Testing**: Verify visual parity, functionality, and accessibility
4. **Documentation**: Record migration decisions and patterns
5. **Continuous Integration**: Run tests after each change

By following this guide, you'll ensure a smooth transition to the design system while maintaining code quality, accessibility, and Web3 functionality.

---

**Last Updated**: 2025-10-02
**Version**: 1.0
**Maintainer**: Token Toilet Development Team

For questions or issues, please refer to:
- [Contributing Guidelines](../../CONTRIBUTING.md)
- [GitHub Issues](https://github.com/marcusrbrown/tokentoilet/issues)
- [Design System Documentation](./getting-started.md)
