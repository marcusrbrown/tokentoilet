import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from './card'

describe('Card', () => {
  describe('Basic Rendering', () => {
    it('renders card with children', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('renders as a div by default', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card.tagName).toBe('DIV')
    })

    it('renders as a custom element when as prop is provided', () => {
      render(
        <Card as="article" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card.tagName).toBe('ARTICLE')
    })

    it('applies base classes to all cards', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-xl', 'border', 'transition-all')
    })
  })

  describe('Variants', () => {
    it('applies default variant classes', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-white/80', 'backdrop-blur-md')
    })

    it('applies solid variant classes', () => {
      render(
        <Card variant="solid" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-white', 'border-gray-200')
    })

    it('applies ghost variant classes', () => {
      render(
        <Card variant="ghost" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-transparent', 'border-transparent')
    })

    it('applies elevated variant classes', () => {
      render(
        <Card variant="elevated" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-white/60', 'backdrop-blur-lg')
    })

    it('applies web3 variant classes with violet accent', () => {
      render(
        <Card variant="web3" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('border-violet-200/50')
    })
  })

  describe('Elevation', () => {
    it('applies flat elevation (no shadow)', () => {
      render(
        <Card elevation="flat" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-none')
    })

    it('applies low elevation by default', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-sm')
    })

    it('applies medium elevation', () => {
      render(
        <Card elevation="medium" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-md')
    })

    it('applies high elevation', () => {
      render(
        <Card elevation="high" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-lg')
    })

    it('applies glow elevation with violet shadow', () => {
      render(
        <Card elevation="glow" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-violet-500/10')
    })
  })

  describe('Padding', () => {
    it('applies md padding by default', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('p-6')
    })

    it('applies no padding when padding is none', () => {
      render(
        <Card padding="none" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).not.toHaveClass('p-4', 'p-6', 'p-8', 'p-10')
    })

    it('applies sm padding', () => {
      render(
        <Card padding="sm" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('p-4')
    })

    it('applies lg padding', () => {
      render(
        <Card padding="lg" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('p-8')
    })
  })

  describe('Interactive', () => {
    it('applies no interactive classes by default', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).not.toHaveClass('cursor-pointer')
    })

    it('applies subtle interactive classes', () => {
      render(
        <Card interactive="subtle" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('cursor-pointer', 'hover:scale-[1.02]')
    })

    it('applies enhanced interactive classes', () => {
      render(
        <Card interactive="enhanced" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('cursor-pointer', 'hover:scale-105')
    })

    it('fires onClick when interactive card is clicked', async () => {
      const handleClick = vi.fn()
      render(
        <Card interactive="subtle" onClick={handleClick} data-testid="card">
          Clickable Card
        </Card>,
      )
      await userEvent.click(screen.getByTestId('card'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(
        <Card className="custom-class" data-testid="card">
          Content
        </Card>,
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
    })

    it('forwards additional HTML attributes', () => {
      render(
        <Card data-testid="card" aria-label="card label">
          Content
        </Card>,
      )
      expect(screen.getByTestId('card')).toHaveAttribute('aria-label', 'card label')
    })
  })
})

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header content</CardHeader>)
    expect(screen.getByText('Header content')).toBeInTheDocument()
  })

  it('applies header layout classes', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>)
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
  })
})

describe('CardTitle', () => {
  it('renders as h3 element', () => {
    render(<CardTitle>Card Title</CardTitle>)
    const title = screen.getByRole('heading', {level: 3})
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Card Title')
  })

  it('applies title typography classes', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>)
    const title = screen.getByTestId('title')
    expect(title).toHaveClass('text-lg', 'font-semibold', 'leading-none', 'tracking-tight')
  })
})

describe('CardDescription', () => {
  it('renders as paragraph element', () => {
    render(<CardDescription>Description text</CardDescription>)
    expect(screen.getByText('Description text').tagName).toBe('P')
  })

  it('applies muted text classes', () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>)
    const desc = screen.getByTestId('desc')
    expect(desc).toHaveClass('text-sm', 'text-gray-600')
  })
})

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Main content</CardContent>)
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })

  it('applies content padding classes', () => {
    render(<CardContent data-testid="content">Content</CardContent>)
    const content = screen.getByTestId('content')
    expect(content).toHaveClass('p-6', 'pt-0')
  })
})

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer content</CardFooter>)
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('applies footer layout classes', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>)
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
  })
})

describe('Card Composition', () => {
  it('renders a complete card with all sub-components', () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>Connect your wallet to continue</CardDescription>
        </CardHeader>
        <CardContent>Main content here</CardContent>
        <CardFooter>
          <span>Footer action</span>
        </CardFooter>
      </Card>,
    )

    expect(screen.getByTestId('full-card')).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Wallet Connection'})).toBeInTheDocument()
    expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument()
    expect(screen.getByText('Main content here')).toBeInTheDocument()
    expect(screen.getByText('Footer action')).toBeInTheDocument()
  })
})
