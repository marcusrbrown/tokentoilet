import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle} from './modal'

describe('Modal', () => {
  describe('Open/Closed State', () => {
    it('renders nothing when open is false', () => {
      render(
        <Modal open={false} onClose={vi.fn()}>
          <div>Modal content</div>
        </Modal>,
      )
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
    })

    it('renders content when open is true', () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          <div>Modal content</div>
        </Modal>,
      )
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has role="dialog" on the modal container', () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          Content
        </Modal>,
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal="true"', () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          Content
        </Modal>,
      )
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('sets aria-labelledby when title is provided', () => {
      render(
        <Modal open={true} onClose={vi.fn()} title="Wallet Settings">
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    })

    it('sets aria-describedby when description is provided', () => {
      render(
        <Modal open={true} onClose={vi.fn()} description="Choose your wallet provider">
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description')
    })

    it('renders sr-only title for screen readers', () => {
      render(
        <Modal open={true} onClose={vi.fn()} title="Wallet Settings">
          Content
        </Modal>,
      )
      const title = document.querySelector('#modal-title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Wallet Settings')
      expect(title).toHaveClass('sr-only')
    })

    it('renders sr-only description for screen readers', () => {
      render(
        <Modal open={true} onClose={vi.fn()} description="Choose your wallet provider">
          Content
        </Modal>,
      )
      const desc = document.querySelector('#modal-description')
      expect(desc).toBeInTheDocument()
      expect(desc).toHaveTextContent('Choose your wallet provider')
      expect(desc).toHaveClass('sr-only')
    })
  })

  describe('Close Button', () => {
    it('shows close button by default', () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          Content
        </Modal>,
      )
      expect(screen.getByLabelText('Close')).toBeInTheDocument()
    })

    it('hides close button when showCloseButton is false', () => {
      render(
        <Modal open={true} onClose={vi.fn()} showCloseButton={false}>
          Content
        </Modal>,
      )
      expect(screen.queryByLabelText('Close')).not.toBeInTheDocument()
    })

    it('uses custom close button label', () => {
      render(
        <Modal open={true} onClose={vi.fn()} closeButtonLabel="Dismiss">
          Content
        </Modal>,
      )
      expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn()
      render(
        <Modal open={true} onClose={onClose}>
          Content
        </Modal>,
      )
      await userEvent.click(screen.getByLabelText('Close'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Backdrop Click', () => {
    it('calls onClose when backdrop is clicked by default', async () => {
      const onClose = vi.fn()
      render(
        <Modal open={true} onClose={onClose}>
          Content
        </Modal>,
      )
      // Click the backdrop (role="presentation" wrapper)
      const backdrop = screen.getByRole('presentation')
      await userEvent.click(backdrop)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when backdrop click is disabled', async () => {
      const onClose = vi.fn()
      render(
        <Modal open={true} onClose={onClose} closeOnBackdropClick={false}>
          Content
        </Modal>,
      )
      const backdrop = screen.getByRole('presentation')
      await userEvent.click(backdrop)
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Escape Key', () => {
    it('calls onClose when Escape key is pressed', async () => {
      const onClose = vi.fn()
      render(
        <Modal open={true} onClose={onClose}>
          Content
        </Modal>,
      )
      await userEvent.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose on Escape when closeOnEscape is false', async () => {
      const onClose = vi.fn()
      render(
        <Modal open={true} onClose={onClose} closeOnEscape={false}>
          Content
        </Modal>,
      )
      await userEvent.keyboard('{Escape}')
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Variants', () => {
    it('applies default variant classes', () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('bg-white/90', 'backdrop-blur-lg')
    })

    it('applies solid variant classes', () => {
      render(
        <Modal open={true} onClose={vi.fn()} variant="solid">
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('bg-white', 'border-gray-200')
    })

    it('applies web3 variant classes', () => {
      render(
        <Modal open={true} onClose={vi.fn()} variant="web3">
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('border-violet-200/50')
    })

    it('applies elevated variant classes', () => {
      render(
        <Modal open={true} onClose={vi.fn()} variant="elevated">
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('bg-white/95', 'backdrop-blur-xl')
    })
  })

  describe('Sizes', () => {
    it('applies md size by default', () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('max-w-md')
    })

    it('applies sm size', () => {
      render(
        <Modal open={true} onClose={vi.fn()} size="sm">
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('max-w-sm')
    })

    it('applies lg size', () => {
      render(
        <Modal open={true} onClose={vi.fn()} size="lg">
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('max-w-lg')
    })

    it('applies full size', () => {
      render(
        <Modal open={true} onClose={vi.fn()} size="full">
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('max-w-none', 'mx-4')
    })
  })

  describe('Body Scroll Lock', () => {
    it('locks body scroll when modal is open', () => {
      render(
        <Modal open={true} onClose={vi.fn()}>
          Content
        </Modal>,
      )
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body scroll when modal is closed', async () => {
      const {rerender} = render(
        <Modal open={true} onClose={vi.fn()}>
          Content
        </Modal>,
      )
      expect(document.body.style.overflow).toBe('hidden')

      rerender(
        <Modal open={false} onClose={vi.fn()}>
          Content
        </Modal>,
      )
      await waitFor(() => {
        expect(document.body.style.overflow).not.toBe('hidden')
      })
    })
  })

  describe('Custom Props', () => {
    it('applies custom className to dialog', () => {
      render(
        <Modal open={true} onClose={vi.fn()} className="custom-modal">
          Content
        </Modal>,
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('custom-modal')
    })
  })
})

describe('ModalHeader', () => {
  it('renders children', () => {
    render(<ModalHeader>Header content</ModalHeader>)
    expect(screen.getByText('Header content')).toBeInTheDocument()
  })

  it('applies header layout classes', () => {
    render(<ModalHeader data-testid="header">Header</ModalHeader>)
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-2', 'p-6', 'pb-0')
  })
})

describe('ModalTitle', () => {
  it('renders as h2 element', () => {
    render(<ModalTitle>Modal Title</ModalTitle>)
    const title = screen.getByRole('heading', {level: 2})
    expect(title).toHaveTextContent('Modal Title')
  })

  it('applies title typography classes', () => {
    render(<ModalTitle data-testid="title">Title</ModalTitle>)
    const title = screen.getByTestId('title')
    expect(title).toHaveClass('text-xl', 'font-semibold', 'leading-tight', 'tracking-tight')
  })
})

describe('ModalDescription', () => {
  it('renders as paragraph element', () => {
    render(<ModalDescription>Description text</ModalDescription>)
    expect(screen.getByText('Description text').tagName).toBe('P')
  })

  it('applies muted text classes', () => {
    render(<ModalDescription data-testid="desc">Description</ModalDescription>)
    const desc = screen.getByTestId('desc')
    expect(desc).toHaveClass('text-sm', 'text-gray-600')
  })
})

describe('ModalContent', () => {
  it('renders children', () => {
    render(<ModalContent>Main content</ModalContent>)
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })

  it('applies content padding classes', () => {
    render(<ModalContent data-testid="content">Content</ModalContent>)
    const content = screen.getByTestId('content')
    expect(content).toHaveClass('p-6')
  })
})

describe('ModalFooter', () => {
  it('renders children', () => {
    render(<ModalFooter>Footer content</ModalFooter>)
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('applies footer layout classes', () => {
    render(<ModalFooter data-testid="footer">Footer</ModalFooter>)
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('flex', 'items-center', 'justify-end', 'space-x-2', 'p-6', 'pt-0')
  })
})

describe('Modal Composition', () => {
  it('renders a complete modal with all sub-components', () => {
    render(
      // Do not pass title prop here to avoid duplicate sr-only h2 alongside ModalTitle
      <Modal open={true} onClose={vi.fn()}>
        <ModalHeader>
          <ModalTitle>Connect Wallet</ModalTitle>
          <ModalDescription>Choose your preferred wallet provider</ModalDescription>
        </ModalHeader>
        <ModalContent>Wallet options here</ModalContent>
        <ModalFooter>
          <button type="button">Cancel</button>
        </ModalFooter>
      </Modal>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Connect Wallet'})).toBeInTheDocument()
    expect(screen.getByText('Choose your preferred wallet provider')).toBeInTheDocument()
    expect(screen.getByText('Wallet options here')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Cancel'})).toBeInTheDocument()
  })
})
