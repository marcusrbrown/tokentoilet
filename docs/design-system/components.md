# Component API Reference

This comprehensive guide documents all components in the Token Toilet Design System, providing detailed API references, usage examples, and best practices for Web3 DeFi applications.

## Table of Contents

- [Component Architecture](#component-architecture)
- [Core Components](#core-components)
  - [Button](#button)
  - [Card](#card)
  - [Badge](#badge)
- [Web3 Components](#web3-components)
  - [Address Display](#address-display)
  - [Network Badge](#network-badge)
  - [Token Input](#token-input)
  - [Connection Status](#connection-status)
- [Component Patterns](#component-patterns)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Best Practices](#best-practices)

## Component Architecture

All components in the Token Toilet Design System follow consistent architectural patterns:

### Variant System

Components use **class-variance-authority (cva)** for type-safe variant management:

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const componentVariants = cva(
  // Base classes applied to all variants
  ['base-class-1', 'base-class-2'],
  {
    variants: {
      variant: {
        default: ['variant-class-1'],
        secondary: ['variant-class-2'],
      },
      size: {
        sm: ['size-sm-class'],
        md: ['size-md-class'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)
```

### Props Interface

All components extend HTML attributes and include variant props:

```typescript
interface ComponentProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {
  // Component-specific props
}
```

### Glass Morphism Support

Most components include glass morphism variants using:

- `bg-white/60` - Semi-transparent background
- `backdrop-blur-md` - Backdrop blur effect
- `border-white/20` - Subtle border
- `shadow-sm` - Soft shadow

---

## Core Components

### Button

Versatile button component with Web3-specific states and comprehensive accessibility.

#### Import

```tsx
import { Button } from '@/components/ui/button'
```

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Primary violet button | Main actions, wallet connections |
| `destructive` | Red button for dangerous actions | Token disposal, disconnection |
| `secondary` | Glass morphism button | Secondary actions |
| `outline` | Outlined button | Alternative actions |
| `ghost` | Minimal button | Subtle interactions |
| `link` | Link-styled button | Navigation, external links |
| `web3Connected` | Green button for connected state | Active wallet display |
| `web3Pending` | Orange pulsing button | Transaction pending |

#### Sizes

| Size | Height | Padding | Use Case |
|------|--------|---------|----------|
| `sm` | 36px | 12px | Compact interfaces |
| `default` | 40px | 16px | Standard buttons |
| `lg` | 44px | 32px | Prominent actions |
| `xl` | 48px | 40px | Hero sections |
| `icon` | 40px × 40px | - | Icon-only buttons |
| `iconSm` | 32px × 32px | - | Small icon buttons |
| `iconLg` | 48px × 48px | - | Large icon buttons |

#### Props

```typescript
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Show loading spinner */
  loading?: boolean
  /** Icon displayed on the left */
  leftIcon?: React.ReactNode
  /** Icon displayed on the right */
  rightIcon?: React.ReactNode
  /** Make button full width */
  fullWidth?: boolean
}
```

#### Examples

```tsx
// Basic button
<Button>Connect Wallet</Button>

// Web3 connected state with address
<Button variant="web3Connected" leftIcon={<Wallet />}>
  0x1234...5678
</Button>

// Loading state
<Button loading disabled>
  Processing Transaction...
</Button>

// Glass morphism secondary action
<Button variant="secondary" size="lg" fullWidth>
  Dispose Tokens
</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

#### Accessibility

- Full keyboard navigation support
- ARIA attributes for loading states
- Focus ring with violet theming
- Screen reader announcements for state changes

---

### Card

Flexible container component with glass morphism effects and elevation system.

#### Card Import

```tsx
import { Card } from '@/components/ui/card'
```

#### Card Variants

| Variant | Description | Visual Effect |
|---------|-------------|---------------|
| `default` | Glass morphism card | Semi-transparent with backdrop blur |
| `solid` | Opaque card | Solid background, no transparency |
| `ghost` | Minimal card | Transparent with hover effects |
| `elevated` | Enhanced glass card | Stronger blur and shadow |
| `web3` | Web3-themed card | Violet accents and borders |

#### Elevation Levels

| Level | Shadow | Usage |
|-------|--------|-------|
| `flat` | None | Flush with background |
| `low` | Subtle | Slight elevation |
| `medium` | Moderate | Standard cards |
| `high` | Pronounced | Important content |
| `float` | Dramatic | Overlays and modals |
| `glow` | Violet-tinted | Web3 components |

#### Card Props

```typescript
interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Card content */
  children: React.ReactNode
  /** Make card interactive (clickable) */
  interactive?: 'none' | 'subtle' | 'enhanced'
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /** Elevation level */
  elevation?: 'flat' | 'low' | 'medium' | 'high' | 'float' | 'glow'
}
```

#### Card Examples

```tsx
// Default glass morphism card
<Card padding="md" elevation="medium">
  <h3>Wallet Balance</h3>
  <p>$1,234.56</p>
</Card>

// Interactive Web3 card
<Card
  variant="web3"
  interactive="enhanced"
  elevation="glow"
  onClick={handleCardClick}
>
  <TokenBalance token={selectedToken} />
</Card>

// Elevated overlay card
<Card variant="elevated" elevation="float" padding="lg">
  <TransactionDetails />
</Card>
```

---

### Badge

Status indicator component for connection states, networks, and transactions.

#### Badge Import

```tsx
import { Badge } from '@/components/ui/badge'
```

#### Badge Variants

| Category | Variants | Colors |
|----------|----------|--------|
| **Connection** | `connected`, `connecting`, `disconnected`, `error` | Green, Yellow, Red |
| **Transaction** | `pending`, `confirmed`, `failed` | Orange, Green, Red |
| **Network** | `mainnet`, `testnet`, `polygon`, `arbitrum`, `optimism` | Blue, Amber, Purple, Sky, Rose |
| **General** | `default`, `violet` | Gray, Violet |

#### Badge Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| `sm` | 20px | 8px | 10px |
| `md` | 24px | 12px | 12px |
| `lg` | 28px | 14px | 14px |

#### Badge Props

```typescript
interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Badge content */
  children: React.ReactNode
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}
```

#### Badge Examples

```tsx
// Connection status
<Badge variant="connected">Connected</Badge>
<Badge variant="connecting">Connecting...</Badge>

// Network indicators
<Badge variant="mainnet" size="sm">Ethereum</Badge>
<Badge variant="polygon">Polygon</Badge>

// Transaction status
<Badge variant="pending">Pending</Badge>
<Badge variant="confirmed">Confirmed</Badge>
```

---

## Web3 Components

### Address Display

Specialized component for displaying Web3 addresses with copy functionality and formatting.

#### Address Display Import

```tsx
import { AddressDisplay } from '@/components/ui/address-display'
```

#### Address Display Features

- Automatic address formatting (`0x1234...5678`)
- One-click copy to clipboard
- Address validation
- Etherscan/block explorer links
- Multiple display variants

#### Address Display Variants

| Variant | Description | Styling |
|---------|-------------|---------|
| `default` | Minimal text display | Plain text with hover effects |
| `card` | Card-style with background | Background, border, padding |
| `glass` | Glass morphism effect | Semi-transparent with blur |
| `badge` | Compact badge style | Rounded, minimal padding |

#### Address Display Props

```typescript
interface AddressDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof addressDisplayVariants> {
  /** Ethereum address to display */
  address: string
  /** Show copy button */
  showCopy?: boolean
  /** Show external link button */
  showExternalLink?: boolean
  /** Custom format override */
  format?: 'short' | 'medium' | 'full'
  /** Chain ID for explorer links */
  chainId?: number
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
}
```

#### Address Display Examples

```tsx
// Basic address display
<AddressDisplay
  address="0x1234567890abcdef1234567890abcdef12345678"
  showCopy
  showExternalLink
/>

// Glass card variant
<AddressDisplay
  address={walletAddress}
  variant="glass"
  size="lg"
  chainId={1}
/>

// Compact badge style
<AddressDisplay
  address={contractAddress}
  variant="badge"
  size="sm"
  format="short"
/>
```

---

### Network Badge

Component for displaying and switching between blockchain networks.

#### Network Badge Import

```tsx
import { NetworkBadge } from '@/components/ui/network-badge'
```

#### Network Badge Features

- Current network display
- Network switching dropdown
- Chain validation
- Auto-detection of connected network
- Support for major chains (Ethereum, Polygon, Arbitrum)

#### Network Badge Props

```typescript
interface NetworkBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof networkBadgeVariants> {
  /** Show network switching dropdown */
  showSwitcher?: boolean
  /** Compact display mode */
  compact?: boolean
  /** Custom chain filter */
  allowedChains?: number[]
  /** Disable interaction */
  disabled?: boolean
}
```

#### Network Badge Examples

```tsx
// Basic network display
<NetworkBadge />

// Interactive network switcher
<NetworkBadge
  showSwitcher
  variant="interactive"
  allowedChains={[1, 137, 42161]}
/>

// Compact glass variant
<NetworkBadge
  variant="glass"
  size="sm"
  compact
/>
```

---

### Token Input

Specialized input component for token amounts with selection and validation.

#### Token Input Import

```tsx
import { TokenInput } from '@/components/ui/token-input'
```

#### Token Input Features

- Token amount validation
- Token selection dropdown
- Balance display and max button
- USD value calculation
- Error state handling
- Decimal precision support

#### Token Input Props

```typescript
interface TokenInputProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tokenInputVariants> {
  /** Input value */
  value: string
  /** Change handler */
  onChange: (value: string) => void
  /** Selected token */
  selectedToken?: TokenData
  /** Available tokens */
  tokens?: TokenData[]
  /** Token selection handler */
  onTokenSelect?: (token: TokenData) => void
  /** Show balance and max button */
  showBalance?: boolean
  /** Validation error message */
  error?: string
  /** Placeholder text */
  placeholder?: string
  /** Disable input */
  disabled?: boolean
  /** Size variant */
  size?: 'sm' | 'default' | 'lg' | 'xl'
}
```

#### Token Input Examples

```tsx
// Basic token input
<TokenInput
  value={amount}
  onChange={setAmount}
  selectedToken={selectedToken}
  tokens={availableTokens}
  onTokenSelect={setSelectedToken}
  showBalance
  placeholder="0.0"
/>

// Error state
<TokenInput
  value={invalidAmount}
  onChange={setAmount}
  variant="error"
  error="Insufficient balance"
  selectedToken={token}
/>

// Large size for primary input
<TokenInput
  value={disposeAmount}
  onChange={setDisposeAmount}
  size="xl"
  variant="web3"
  tokens={userTokens}
/>
```

---

### Connection Status

Comprehensive component for displaying wallet connection state with actions.

#### Connection Status Import

```tsx
import { ConnectionStatus } from '@/components/ui/connection-status'
```

#### Connection Status Features

- Real-time connection state
- Network validation
- Error handling and display
- Action buttons for connection/switching
- Customizable layout and content

#### Connection Status Props

```typescript
interface ConnectionStatusProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof connectionStatusVariants> {
  /** Show network switching button */
  showNetworkSwitch?: boolean
  /** Show detailed error messages */
  showErrorDetails?: boolean
  /** Custom action button */
  actionButton?: React.ReactNode
  /** Hide status badge */
  hideBadge?: boolean
  /** Hide wallet address when connected */
  hideAddress?: boolean
}
```

#### Connection Status Examples

```tsx
// Full connection status display
<ConnectionStatus
  variant="card"
  showNetworkSwitch
  showErrorDetails
/>

// Compact status for header
<ConnectionStatus
  variant="compact"
  size="sm"
  hideBadge
/>

// Custom glass variant
<ConnectionStatus
  variant="glass"
  actionButton={<CustomConnectButton />}
/>
```

---

## Component Patterns

### Responsive Design

All components support responsive design through Tailwind's responsive prefixes:

```tsx
<Button className="w-full md:w-auto lg:px-8">
  Responsive Button
</Button>

<Card className="p-4 md:p-6 lg:p-8">
  Responsive padding
</Card>
```

### Dark Mode Support

Components automatically adapt to dark mode through `dark:` variants:

```tsx
// Automatic dark mode support
<Card variant="default">
  Content adapts to theme
</Card>

// Custom dark mode overrides
<Button className="dark:bg-violet-800 dark:hover:bg-violet-700">
  Custom dark styling
</Button>
```

### Composition Patterns

Components are designed for composition:

```tsx
<Card variant="web3" elevation="glow">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">Token Balance</h3>
    <NetworkBadge compact />
  </div>

  <TokenInput
    value={amount}
    onChange={setAmount}
    selectedToken={token}
    showBalance
  />

  <div className="flex gap-2 mt-4">
    <Button variant="secondary" fullWidth>
      Cancel
    </Button>
    <Button variant="default" fullWidth>
      Dispose Tokens
    </Button>
  </div>
</Card>
```

### Error Handling Patterns

Components provide consistent error state handling:

```tsx
<TokenInput
  value={amount}
  onChange={setAmount}
  variant={hasError ? 'error' : 'default'}
  error={validationError}
/>

<ConnectionStatus
  showErrorDetails
  showNetworkSwitch
/>
```

---

## Accessibility Guidelines

### Focus Management

All interactive components support keyboard navigation:

- **Tab order**: Logical tab sequence
- **Focus rings**: Violet-themed focus indicators
- **Skip links**: For complex interfaces

### Screen Reader Support

Components include appropriate ARIA attributes:

```tsx
// Button with loading state
<Button loading aria-label="Processing transaction">
  {loading ? 'Processing...' : 'Submit'}
</Button>

// Status with live region
<Badge variant="connected" role="status" aria-live="polite">
  Connected
</Badge>
```

### Color Contrast

All color combinations meet WCAG 2.1 AA standards:

- **Text contrast**: Minimum 4.5:1 ratio
- **Interactive elements**: Enhanced contrast on focus
- **Status indicators**: Color + text/icon combinations

### Reduced Motion

Components respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .transition-all {
    transition: none;
  }
  .animate-pulse {
    animation: none;
  }
}
```

---

## Best Practices

### Performance Optimization

1. **Tree Shaking**: Import only needed components
2. **Lazy Loading**: Use dynamic imports for large components
3. **Memoization**: Wrap components with `React.memo` when appropriate

```tsx
// Efficient imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Lazy loading
const TokenInput = lazy(() => import('@/components/ui/token-input'))
```

### Component Composition

1. **Single Responsibility**: Each component has one clear purpose
2. **Prop Drilling**: Use context for deeply nested props
3. **Composition over Configuration**: Prefer composable APIs

```tsx
// Good: Composable
<Card>
  <CardHeader>
    <CardTitle>Token Balance</CardTitle>
  </CardHeader>
  <CardContent>
    <TokenInput {...props} />
  </CardContent>
</Card>

// Avoid: Over-configured
<Card
  title="Token Balance"
  showInput
  inputProps={props}
  headerProps={headerProps}
/>
```

### Styling Guidelines

1. **Design Token Usage**: Use design tokens over arbitrary values
2. **Variant System**: Leverage cva for consistent variants
3. **Glass Morphism**: Use appropriate backdrop blur and transparency

```tsx
// Good: Using design tokens
<Card
  variant="web3"
  elevation="glow"
  className="space-y-4"
>

// Avoid: Arbitrary values
<Card
  className="bg-violet-500/30 backdrop-blur-xl shadow-lg p-6"
>
```

### Web3 Integration

1. **Error Handling**: Always handle connection failures gracefully
2. **Loading States**: Provide clear feedback during async operations
3. **Network Validation**: Validate supported networks

```tsx
// Good: Error handling
<ConnectionStatus
  showErrorDetails
  showNetworkSwitch
  fallback={<Button>Connect Wallet</Button>}
/>

// Loading states
<Button loading={isPending} disabled={isPending}>
  {isPending ? 'Processing...' : 'Submit Transaction'}
</Button>
```

### Testing Recommendations

1. **Unit Tests**: Test component props and variants
2. **Integration Tests**: Test Web3 component interactions
3. **Accessibility Tests**: Validate ARIA attributes and keyboard navigation

```tsx
// Component testing
test('Button renders with correct variant classes', () => {
  render(<Button variant="web3Connected">Test</Button>)
  expect(screen.getByRole('button')).toHaveClass('bg-green-600')
})

// Web3 testing with mocks
test('AddressDisplay shows copy functionality', async () => {
  render(<AddressDisplay address="0x123..." showCopy />)
  const copyButton = screen.getByLabelText('Copy address')
  await user.click(copyButton)
  expect(mockClipboard.writeText).toHaveBeenCalled()
})
```

---

For more information about design tokens, styling patterns, and project setup, see:

- [Design Tokens Reference](./design-tokens.md)
- [Getting Started Guide](./getting-started.md)
- [Token Toilet Copilot Instructions](../../.github/copilot-instructions.md)
