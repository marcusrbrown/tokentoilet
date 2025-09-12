import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {Badge} from './badge'

describe('Badge', () => {
  it('renders basic badge with text', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies default variant and size classes', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default').parentElement
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'px-3', 'py-1')
  })

  it('applies connection state variants correctly', () => {
    const {rerender} = render(<Badge variant="connected">Connected</Badge>)
    let badge = screen.getByText('Connected').parentElement
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')

    rerender(<Badge variant="connecting">Connecting</Badge>)
    badge = screen.getByText('Connecting').parentElement
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'animate-pulse')

    rerender(<Badge variant="disconnected">Disconnected</Badge>)
    badge = screen.getByText('Disconnected').parentElement
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')

    rerender(<Badge variant="error">Error</Badge>)
    badge = screen.getByText('Error').parentElement
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border')
  })

  it('applies transaction state variants correctly', () => {
    const {rerender} = render(<Badge variant="pending">Pending</Badge>)
    let badge = screen.getByText('Pending').parentElement
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'animate-pulse')

    rerender(<Badge variant="confirmed">Confirmed</Badge>)
    badge = screen.getByText('Confirmed').parentElement
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')

    rerender(<Badge variant="failed">Failed</Badge>)
    badge = screen.getByText('Failed').parentElement
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border')
  })

  it('applies network indicator variants correctly', () => {
    const {rerender} = render(<Badge variant="mainnet">Ethereum</Badge>)
    let badge = screen.getByText('Ethereum').parentElement
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')

    rerender(<Badge variant="polygon">Polygon</Badge>)
    badge = screen.getByText('Polygon').parentElement
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800')

    rerender(<Badge variant="arbitrum">Arbitrum</Badge>)
    badge = screen.getByText('Arbitrum').parentElement
    expect(badge).toHaveClass('bg-sky-100', 'text-sky-800')

    rerender(<Badge variant="optimism">Optimism</Badge>)
    badge = screen.getByText('Optimism').parentElement
    expect(badge).toHaveClass('bg-rose-100', 'text-rose-800')

    rerender(<Badge variant="testnet">Testnet</Badge>)
    badge = screen.getByText('Testnet').parentElement
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800')
  })

  it('applies violet brand variant correctly', () => {
    render(<Badge variant="violet">Token Toilet</Badge>)
    const badge = screen.getByText('Token Toilet').parentElement
    expect(badge).toHaveClass('bg-violet-100', 'text-violet-800')
  })

  it('applies different sizes correctly', () => {
    const {rerender} = render(<Badge size="sm">Small</Badge>)
    let badge = screen.getByText('Small').parentElement
    expect(badge).toHaveClass('px-2', 'py-0.5', 'h-5')

    rerender(<Badge size="md">Medium</Badge>)
    badge = screen.getByText('Medium').parentElement
    expect(badge).toHaveClass('px-3', 'py-1', 'h-6')

    rerender(<Badge size="lg">Large</Badge>)
    badge = screen.getByText('Large').parentElement
    expect(badge).toHaveClass('px-3.5', 'py-1.5', 'h-7')
  })

  it('renders with icon when provided', () => {
    const TestIcon = () => <svg data-testid="test-icon" />
    render(
      <Badge icon={<TestIcon />} variant="mainnet">
        Ethereum
      </Badge>,
    )

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    const badge = screen.getByText('Ethereum').parentElement
    expect(badge).toHaveClass('gap-1.5')
  })

  it('renders with dot indicator when showDot is true', () => {
    render(
      <Badge variant="connected" showDot>
        Connected
      </Badge>,
    )

    const badge = screen.getByText('Connected').parentElement
    expect(badge).toHaveClass('pl-1.5')

    // Check for dot element
    const dot = badge?.querySelector('div[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveClass('h-2', 'w-2', 'rounded-full', 'bg-green-600')
  })

  it('renders different dot colors based on variant', () => {
    const {rerender} = render(
      <Badge variant="connected" showDot>
        Connected
      </Badge>,
    )

    let badge = screen.getByText('Connected').parentElement
    let dot = badge?.querySelector('div[aria-hidden="true"]')
    expect(dot).toHaveClass('bg-green-600')

    rerender(
      <Badge variant="pending" showDot>
        Pending
      </Badge>,
    )
    badge = screen.getByText('Pending').parentElement
    dot = badge?.querySelector('div[aria-hidden="true"]')
    expect(dot).toHaveClass('bg-yellow-600')

    rerender(
      <Badge variant="error" showDot>
        Error
      </Badge>,
    )
    badge = screen.getByText('Error').parentElement
    dot = badge?.querySelector('div[aria-hidden="true"]')
    expect(dot).toHaveClass('bg-red-600')

    rerender(
      <Badge variant="polygon" showDot>
        Polygon
      </Badge>,
    )
    badge = screen.getByText('Polygon').parentElement
    dot = badge?.querySelector('div[aria-hidden="true"]')
    expect(dot).toHaveClass('bg-purple-600')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Test</Badge>)
    const badge = screen.getByText('Test').parentElement
    expect(badge).toHaveClass('custom-class')
  })

  it('forwards additional props', () => {
    render(<Badge data-testid="badge-test">Test</Badge>)
    expect(screen.getByTestId('badge-test')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(
      <Badge aria-label="Connection status badge" variant="connected">
        Connected
      </Badge>,
    )

    const badge = screen.getByLabelText('Connection status badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('role', 'status')
  })

  it('hides icon and dot from screen readers', () => {
    const TestIcon = () => <svg data-testid="test-icon" />
    render(
      <Badge icon={<TestIcon />} showDot variant="mainnet">
        Ethereum
      </Badge>,
    )

    const icon = screen.getByTestId('test-icon').parentElement
    const dot = screen.getByText('Ethereum').parentElement?.querySelector('div[aria-hidden="true"]')

    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(dot).toHaveAttribute('aria-hidden', 'true')
  })

  it('works with both withIcon and icon props', () => {
    const TestIcon = () => <svg data-testid="test-icon" />
    render(
      <Badge withIcon icon={<TestIcon />}>
        Test
      </Badge>,
    )

    const badge = screen.getByText('Test').parentElement
    expect(badge).toHaveClass('gap-1.5')
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('works with both withDot and showDot props', () => {
    render(
      <Badge withDot showDot variant="connected">
        Test
      </Badge>,
    )

    const badge = screen.getByText('Test').parentElement
    expect(badge).toHaveClass('pl-1.5')

    const dot = badge?.querySelector('div[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })
})
