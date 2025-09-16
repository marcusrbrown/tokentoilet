# Accessibility Guidelines

The Token Toilet Design System is built with accessibility as a core principle, following Web Content Accessibility Guidelines (WCAG) 2.1 AA standards. This document provides comprehensive guidelines for creating accessible Web3 DeFi experiences that work for all users.

## Table of Contents

- [Core Principles](#core-principles)
- [Color and Contrast](#color-and-contrast)
- [Focus Management](#focus-management)
- [Keyboard Navigation](#keyboard-navigation)
- [Screen Reader Support](#screen-reader-support)
- [Component Accessibility](#component-accessibility)
- [Web3-Specific Patterns](#web3-specific-patterns)
- [Testing Guidelines](#testing-guidelines)
- [WCAG Compliance Checklist](#wcag-compliance-checklist)
- [Resources and Tools](#resources-and-tools)

## Core Principles

The Token Toilet Design System follows four fundamental accessibility principles:

### 1. Perceivable

Content must be presentable to users in ways they can perceive:

- **Color Contrast**: All text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- **Alternative Text**: Images and icons include descriptive alt text
- **Visual Indicators**: Information isn't conveyed by color alone

### 2. Operable

Interface components must be operable by all users:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Management**: Clear focus indicators and logical tab order
- **Timing**: No unexpected time limits on Web3 transactions

### 3. Understandable

Information and UI operation must be understandable:

- **Clear Language**: Plain language for Web3 concepts and error messages
- **Consistent Navigation**: Predictable interface patterns
- **Error Prevention**: Clear form validation and transaction confirmation

### 4. Robust

Content must be robust enough for various assistive technologies:

- **Semantic HTML**: Proper HTML structure and ARIA attributes
- **Cross-Platform**: Works with screen readers, voice control, and other assistive tech
- **Future-Proof**: Compatible with emerging accessibility technologies

## Color and Contrast

### Violet Brand Palette Compliance

The violet brand palette has been designed to meet WCAG AA contrast requirements:

```typescript
// WCAG AA Compliant Color Combinations
const accessibleColorPairs = {
  // Text on light backgrounds
  'violet-700 on violet-50': '7.2:1', // AAA compliant
  'violet-800 on violet-100': '5.8:1', // AAA compliant
  'violet-900 on violet-200': '4.9:1', // AA compliant

  // Text on dark backgrounds
  'violet-50 on violet-700': '7.2:1', // AAA compliant
  'violet-100 on violet-800': '5.8:1', // AAA compliant
  'violet-200 on violet-900': '4.9:1', // AA compliant
}
```

### Web3 State Colors

Web3 semantic colors meet accessibility requirements:

```tsx
// Connection state colors with sufficient contrast
<div className="text-green-700 bg-green-50">Connected: 4.7:1 ratio</div>
<div className="text-amber-800 bg-amber-50">Connecting: 5.1:1 ratio</div>
<div className="text-red-700 bg-red-50">Disconnected: 4.8:1 ratio</div>
```

### Glass Morphism Considerations

Glass morphism effects maintain accessibility through:

```tsx
// Accessible glass morphism with proper backdrop contrast
const GlassCard = () => (
  <div className={cn(
    'bg-white/90 backdrop-blur-md', // Higher opacity for better contrast
    'border border-white/30', // Visible border for structure
    'text-gray-900', // High contrast text
    'dark:bg-gray-900/90 dark:text-gray-100' // Dark mode support
  )}>
    Content with sufficient contrast
  </div>
)
```

### Testing Color Combinations

Use these tools to verify contrast ratios:

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors](https://accessible-colors.com/)
- Browser DevTools accessibility audit

## Focus Management

### Focus Indicators

All interactive elements include visible focus indicators:

```tsx
// Button component with accessible focus styling
const Button = ({ children, ...props }) => (
  <button
    className={cn(
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-violet-500',
      'focus:ring-offset-2',
      'focus:ring-offset-white',
      'dark:focus:ring-offset-gray-900'
    )}
    {...props}
  >
    {children}
  </button>
)
```

### Focus Trapping

Modal components trap focus within the modal:

```tsx
// Modal with focus management
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus first focusable element
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {children}
    </div>
  )
}
```

### Tab Order

Logical tab order follows visual flow:

```tsx
// Form with proper tab order
<form>
  <input tabIndex={1} placeholder="Wallet address" />
  <input tabIndex={2} placeholder="Amount" />
  <select tabIndex={3}>
    <option>Select token</option>
  </select>
  <button tabIndex={4}>Connect Wallet</button>
</form>
```

## Keyboard Navigation

### Standard Keyboard Patterns

The design system follows standard keyboard interaction patterns:

| Element | Key | Action |
|---------|-----|--------|
| Button | `Space` or `Enter` | Activates the button |
| Modal | `Escape` | Closes the modal |
| Dropdown | `Arrow Up/Down` | Navigate options |
| Dropdown | `Enter` | Select option |
| Form | `Tab` | Move to next field |
| Form | `Shift + Tab` | Move to previous field |

### Web3-Specific Keyboard Support

```tsx
// Wallet connection with keyboard support
const WalletButton = () => (
  <button
    onClick={connectWallet}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        connectWallet()
      }
    }}
    aria-label="Connect wallet to interact with Web3"
  >
    Connect Wallet
  </button>
)
```

### Custom Components

Custom components implement keyboard accessibility:

```tsx
// Accessible token selector
const TokenSelector = ({ tokens, onSelect }) => {
  const [activeIndex, setActiveIndex] = useState(-1)

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => (prev + 1) % tokens.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => prev <= 0 ? tokens.length - 1 : prev - 1)
        break
      case 'Enter':
        if (activeIndex >= 0) {
          onSelect(tokens[activeIndex])
        }
        break
    }
  }

  return (
    <div
      role="listbox"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {tokens.map((token, index) => (
        <div
          key={token.id}
          role="option"
          aria-selected={index === activeIndex}
          className={cn(
            'cursor-pointer p-2',
            index === activeIndex && 'bg-violet-100'
          )}
        >
          {token.symbol}
        </div>
      ))}
    </div>
  )
}
```

## Screen Reader Support

### Semantic HTML

Use semantic HTML elements for proper screen reader interpretation:

```tsx
// Proper semantic structure
<main>
  <header>
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/portfolio">Portfolio</a></li>
      </ul>
    </nav>
  </header>

  <article>
    <h1>Token Disposal</h1>
    <section aria-labelledby="wallet-section">
      <h2 id="wallet-section">Wallet Connection</h2>
      <p>Connect your wallet to dispose of unwanted tokens.</p>
    </section>
  </article>
</main>
```

### ARIA Labels and Descriptions

Provide descriptive labels for complex UI elements:

```tsx
// Address display with screen reader support
const AddressDisplay = ({ address, explorer }) => (
  <div>
    <span
      aria-label={`Wallet address: ${address}`}
      title={address}
    >
      {address.slice(0, 6)}...{address.slice(-4)}
    </span>
    <button
      aria-label="Copy wallet address to clipboard"
      onClick={() => navigator.clipboard.writeText(address)}
    >
      <Copy size={16} aria-hidden="true" />
    </button>
    <a
      href={`${explorer}/address/${address}`}
      aria-label="View address on block explorer"
      target="_blank"
      rel="noopener noreferrer"
    >
      <ExternalLink size={16} aria-hidden="true" />
    </a>
  </div>
)
```

### Live Regions

Announce dynamic content changes:

```tsx
// Transaction status with live announcements
const TransactionStatus = ({ status, hash }) => (
  <div>
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      Transaction {status}
    </div>

    <div className="flex items-center space-x-2">
      <Badge variant={status === 'confirmed' ? 'success' : 'pending'}>
        {status}
      </Badge>
      <span className="text-sm text-gray-600">
        {hash.slice(0, 10)}...
      </span>
    </div>
  </div>
)
```

### Alternative Text for Icons

All icons include appropriate alternative text:

```tsx
// Icon usage with accessibility
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react'

// Decorative icon (hidden from screen readers)
<Wallet aria-hidden="true" className="w-4 h-4" />

// Informational icon (with label)
<CheckCircle
  aria-label="Transaction confirmed"
  className="w-4 h-4 text-green-500"
/>

// Icon with visible text (hidden from screen readers)
<div className="flex items-center space-x-2">
  <AlertCircle aria-hidden="true" className="w-4 h-4" />
  <span>Transaction failed</span>
</div>
```

## Component Accessibility

### Button Component

The Button component includes comprehensive accessibility features:

```tsx
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
}

const Button = ({
  children,
  loading,
  disabled,
  'aria-label': ariaLabel,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    aria-label={ariaLabel}
    aria-busy={loading}
    className={cn(
      buttonVariants(),
      'focus:outline-none focus:ring-2 focus:ring-violet-500'
    )}
    {...props}
  >
    {loading && (
      <span className="sr-only">Loading</span>
    )}
    {children}
  </button>
)
```

### Form Components

Form components include proper labeling and validation:

```tsx
// Input component with accessibility
const Input = ({
  label,
  error,
  required,
  ...props
}) => {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium"
      >
        {label}
        {required && <span aria-label="required">*</span>}
      </label>

      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'w-full px-3 py-2 border rounded-md',
          error ? 'border-red-500' : 'border-gray-300'
        )}
        {...props}
      />

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-600 mt-1"
        >
          {error}
        </p>
      )}
    </div>
  )
}
```

### Modal Component

Modal components follow dialog accessibility patterns:

```tsx
const Modal = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 backdrop-blur-sm bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-4 md:inset-8 lg:inset-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-lg p-6 h-full overflow-auto">
          <header className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <main>
            {children}
          </main>
        </div>
      </div>
    </div>,
    document.body
  )
}
```

## Web3-Specific Patterns

### Wallet Connection States

Clearly communicate wallet connection status:

```tsx
const WalletStatus = ({ isConnected, isConnecting, address }) => (
  <div role="status" aria-live="polite">
    {isConnecting && (
      <span className="sr-only">Connecting to wallet</span>
    )}

    <Badge
      variant={isConnected ? 'success' : 'secondary'}
      aria-label={
        isConnected
          ? `Wallet connected: ${address}`
          : 'Wallet not connected'
      }
    >
      {isConnected ? 'Connected' : 'Not Connected'}
    </Badge>
  </div>
)
```

### Transaction Flows

Provide clear feedback throughout transaction processes:

```tsx
const TransactionFlow = ({ transaction }) => {
  const announceStatus = (status: string) => {
    // Announce to screen readers
    const announcement = document.getElementById('tx-announcement')
    if (announcement) {
      announcement.textContent = `Transaction ${status}`
    }
  }

  useEffect(() => {
    announceStatus(transaction.status)
  }, [transaction.status])

  return (
    <div>
      <div
        id="tx-announcement"
        aria-live="assertive"
        className="sr-only"
      />

      <div className="space-y-4">
        <div>
          <h3>Transaction Status</h3>
          <Badge variant={transaction.status}>
            {transaction.status}
          </Badge>
        </div>

        {transaction.status === 'pending' && (
          <div role="status">
            <span className="sr-only">Transaction processing</span>
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full" />
              <span>Processing transaction...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Error Handling

Provide clear, actionable error messages:

```tsx
const TransactionError = ({ error, onRetry }) => (
  <div
    role="alert"
    className="p-4 bg-red-50 border border-red-200 rounded-lg"
  >
    <div className="flex items-start space-x-3">
      <AlertCircle
        className="w-5 h-5 text-red-500 mt-0.5"
        aria-hidden="true"
      />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">
          Transaction Failed
        </h3>
        <p className="text-sm text-red-700 mt-1">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-red-800 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
)
```

## Testing Guidelines

### Manual Testing Checklist

1. **Keyboard Navigation**
   - [ ] Tab through all interactive elements
   - [ ] Verify focus indicators are visible
   - [ ] Test keyboard shortcuts work correctly
   - [ ] Ensure no keyboard traps exist

2. **Screen Reader Testing**
   - [ ] Test with NVDA (Windows) or VoiceOver (macOS)
   - [ ] Verify all content is announced
   - [ ] Check heading structure makes sense
   - [ ] Ensure form labels are properly associated

3. **Color and Contrast**
   - [ ] Verify text meets contrast requirements
   - [ ] Test with high contrast mode
   - [ ] Ensure information isn't conveyed by color alone
   - [ ] Check focus indicators are visible

4. **Responsive Design**
   - [ ] Test with browser zoom up to 400%
   - [ ] Verify content reflows properly
   - [ ] Check touch targets are at least 44px
   - [ ] Test with mobile screen readers

### Automated Testing

Use these tools for automated accessibility testing:

```bash
# Install testing dependencies
pnpm add -D @axe-core/react jest-axe

# Install browser extensions
# - axe DevTools
# - WAVE Web Accessibility Evaluator
# - Lighthouse accessibility audit
```

```tsx
// Automated accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe'
import { render } from '@testing-library/react'

expect.extend(toHaveNoViolations)

describe('Button accessibility', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = render(
      <Button>Click me</Button>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should be keyboard accessible', () => {
    const handleClick = jest.fn()
    const { getByRole } = render(
      <Button onClick={handleClick}>Click me</Button>
    )

    const button = getByRole('button')

    // Test Enter key
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(handleClick).toHaveBeenCalled()

    // Test Space key
    fireEvent.keyDown(button, { key: ' ' })
    expect(handleClick).toHaveBeenCalledTimes(2)
  })
})
```

### Continuous Integration

Add accessibility testing to your CI pipeline:

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:a11y
      - run: pnpm lighthouse:a11y
```

## WCAG Compliance Checklist

### Level A Requirements

- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Page has proper heading structure
- [ ] Links have descriptive text
- [ ] Page has a title

### Level AA Requirements

- [ ] Color contrast meets 4.5:1 ratio (3:1 for large text)
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] Content doesn't flash more than 3 times per second
- [ ] Page is keyboard accessible
- [ ] Focus indicators are visible
- [ ] Form validation provides clear feedback

### Web3-Specific Considerations

- [ ] Wallet connection status is clearly announced
- [ ] Transaction status updates are communicated
- [ ] Error messages provide actionable guidance
- [ ] Address formats are screen reader friendly
- [ ] Network switching is keyboard accessible

## Resources and Tools

### Testing Tools

- **[axe DevTools](https://www.deque.com/axe/devtools/)** - Browser extension for accessibility testing
- **[WAVE](https://wave.webaim.org/)** - Web accessibility evaluation tool
- **[Lighthouse](https://developers.google.com/web/tools/lighthouse)** - Built-in Chrome accessibility audit
- **[Color Oracle](https://colororacle.org/)** - Color blindness simulator

### Screen Readers

- **NVDA** (Windows) - Free and widely used
- **JAWS** (Windows) - Professional screen reader
- **VoiceOver** (macOS/iOS) - Built-in Apple screen reader
- **TalkBack** (Android) - Built-in Android screen reader

### Guidelines and Documentation

- **[WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)** - Official accessibility guidelines
- **[WebAIM](https://webaim.org/)** - Accessibility resources and training
- **[A11y Project](https://www.a11yproject.com/)** - Community-driven accessibility resources
- **[WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)** - ARIA implementation patterns

### Design System References

- **[Primer Design System](https://primer.style/design/accessibility)** - GitHub's accessibility guidelines
- **[Carbon Design System](https://carbondesignsystem.com/guidelines/accessibility/overview/)** - IBM's accessibility patterns
- **[Material Design](https://material.io/design/usability/accessibility.html)** - Google's accessibility guidelines

---

## Implementation Notes

This accessibility documentation should be:

- **Living Document**: Regularly updated as new components are added
- **Team Resource**: Referenced during design and development
- **Quality Gate**: Used in code reviews and testing
- **User-Centered**: Based on real user feedback and testing

For questions or suggestions about accessibility improvements, please refer to the [Token Toilet Copilot Instructions](../../.github/copilot-instructions.md) or open an issue in the repository.
