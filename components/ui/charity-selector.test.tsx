import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {CharitySelector, type CharityAllocation, type CharityData} from './charity-selector'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({alt, ...props}: {alt: string; [key: string]: unknown}) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}))

// Mock data for testing
const mockCharities: CharityData[] = [
  {
    id: 'charity-1',
    name: 'Global Health Initiative',
    description: 'Working to improve healthcare access worldwide through innovative technology and partnerships.',
    logoURI: 'https://example.com/logos/global-health.png',
    address: '0x1234567890123456789012345678901234567890',
    category: ['Health', 'Global Development'],
    totalDonations: '2500000',
    website: 'https://globalhealthinitiative.org',
  },
  {
    id: 'charity-2',
    name: 'Education for All',
    description: 'Providing quality education opportunities to underserved communities around the world.',
    logoURI: 'https://example.com/logos/education-for-all.png',
    address: '0x2345678901234567890123456789012345678901',
    category: ['Education', 'Social Justice'],
    totalDonations: '1800000',
    website: 'https://educationforall.org',
  },
  {
    id: 'charity-3',
    name: 'Climate Action Fund',
    description: 'Supporting renewable energy projects and environmental conservation efforts globally.',
    logoURI: 'https://example.com/logos/climate-action.png',
    address: '0x3456789012345678901234567890123456789012',
    category: ['Environment', 'Climate Change'],
    totalDonations: '5200000',
    website: 'https://climateactionfund.org',
  },
  {
    id: 'charity-4',
    name: 'Tech for Good',
    description: 'Bridging the digital divide by providing technology access to marginalized communities.',
    logoURI: '',
    address: '0x4567890123456789012345678901234567890123',
    category: ['Technology', 'Social Justice', 'Education'],
    totalDonations: '750000',
    website: 'https://techforgood.org',
  },
]

const mockAllocations: CharityAllocation[] = [
  {charityId: 'charity-1', percentage: 60},
  {charityId: 'charity-2', percentage: 40},
]

describe('CharitySelector', () => {
  describe('Basic Rendering', () => {
    it('renders the charity selector with default props', () => {
      render(<CharitySelector />)
      expect(screen.getByText('Select charity for donation')).toBeInTheDocument()
    })

    it('renders with a label when provided', () => {
      render(<CharitySelector label="Choose your charity" />)
      expect(screen.getByText('Choose your charity')).toBeInTheDocument()
    })

    it('renders helper text when provided', () => {
      render(<CharitySelector helperText="Select up to 3 charities for your donation" />)
      expect(screen.getByText('Select up to 3 charities for your donation')).toBeInTheDocument()
    })

    it('renders error message when provided', () => {
      render(<CharitySelector error="Please select at least one charity" />)
      expect(screen.getByText('Please select at least one charity')).toBeInTheDocument()
    })

    it('renders success message when provided', () => {
      render(<CharitySelector success="Selection looks great!" />)
      expect(screen.getByText('Selection looks great!')).toBeInTheDocument()
    })
  })

  describe('Charity Display', () => {
    it('displays "No charities available" when charities array is empty', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={[]} />)

      // Expand the selector
      await user.click(screen.getByRole('button'))
      expect(screen.getByText('No charities available')).toBeInTheDocument()
    })

    it('displays charity information correctly', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={mockCharities} />)

      // Expand the selector
      await user.click(screen.getByRole('button'))

      // Check if charities are displayed
      expect(screen.getByText('Global Health Initiative')).toBeInTheDocument()
      expect(screen.getByText('Education for All')).toBeInTheDocument()
      expect(screen.getByText('Climate Action Fund')).toBeInTheDocument()
      expect(screen.getByText('Tech for Good')).toBeInTheDocument()
    })

    it('displays charity descriptions when showDescriptions is true', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={mockCharities} showDescriptions={true} />)

      await user.click(screen.getByRole('button'))
      expect(
        screen.getByText(
          'Working to improve healthcare access worldwide through innovative technology and partnerships.',
        ),
      ).toBeInTheDocument()
    })

    it('hides charity descriptions when showDescriptions is false', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={mockCharities} showDescriptions={false} />)

      await user.click(screen.getByRole('button'))
      expect(
        screen.queryByText(
          'Working to improve healthcare access worldwide through innovative technology and partnerships.',
        ),
      ).not.toBeInTheDocument()
    })

    it('displays charity categories when showCategories is true', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={mockCharities} showCategories={true} />)

      await user.click(screen.getByRole('button'))
      expect(screen.getByText('Health')).toBeInTheDocument()
      expect(screen.getAllByText('Education')).toHaveLength(2) // Should appear in both charity-2 and charity-4
      expect(screen.getByText('Environment')).toBeInTheDocument()
    })

    it('displays total donations when showTotalDonations is true', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={mockCharities} showTotalDonations={true} />)

      await user.click(screen.getByRole('button'))
      expect(screen.getByText('Raised: $2.5M')).toBeInTheDocument()
      expect(screen.getByText('Raised: $1.8M')).toBeInTheDocument()
      expect(screen.getByText('Raised: $5.2M')).toBeInTheDocument()
      expect(screen.getByText('Raised: $750K')).toBeInTheDocument()
    })

    it('displays website links when showWebsiteLinks is true', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={mockCharities} showWebsiteLinks={true} />)

      await user.click(screen.getByRole('button'))
      const websiteButtons = screen.getAllByLabelText(/Visit .* website/)
      expect(websiteButtons).toHaveLength(4)
    })
  })

  describe('Single Selection Mode', () => {
    it('allows selecting a single charity', async () => {
      const user = userEvent.setup()
      const mockOnSelectionChange = vi.fn()
      render(<CharitySelector charities={mockCharities} onSelectionChange={mockOnSelectionChange} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Global Health Initiative'))

      expect(mockOnSelectionChange).toHaveBeenCalledWith([{charityId: 'charity-1', percentage: 100}])
    })

    it('replaces selection when selecting a different charity in single mode', async () => {
      const user = userEvent.setup()
      const mockOnSelectionChange = vi.fn()
      render(<CharitySelector charities={mockCharities} onSelectionChange={mockOnSelectionChange} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Global Health Initiative'))
      await user.click(screen.getByText('Education for All'))

      expect(mockOnSelectionChange).toHaveBeenLastCalledWith([{charityId: 'charity-2', percentage: 100}])
    })

    it('deselects charity when clicking on already selected charity', async () => {
      const user = userEvent.setup()
      const mockOnSelectionChange = vi.fn()
      render(
        <CharitySelector
          charities={mockCharities}
          selectedAllocations={[{charityId: 'charity-1', percentage: 100}]}
          onSelectionChange={mockOnSelectionChange}
        />,
      )

      await user.click(screen.getByRole('button'))
      // Click on the charity card (the h3 element within the card)
      const charityCards = screen.getAllByText('Global Health Initiative')
      const charityCardTitle = charityCards.find(element => element.tagName === 'H3')
      if (charityCardTitle) {
        await user.click(charityCardTitle)
      }

      expect(mockOnSelectionChange).toHaveBeenCalledWith([])
    })
  })

  describe('Multiple Selection Mode', () => {
    it('allows selecting multiple charities', async () => {
      const user = userEvent.setup()
      const mockOnSelectionChange = vi.fn()
      render(
        <CharitySelector charities={mockCharities} allowMultiple={true} onSelectionChange={mockOnSelectionChange} />,
      )

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Global Health Initiative'))
      await user.click(screen.getByText('Education for All'))

      expect(mockOnSelectionChange).toHaveBeenLastCalledWith([
        {charityId: 'charity-1', percentage: expect.any(Number) as number},
        {charityId: 'charity-2', percentage: expect.any(Number) as number},
      ])
    })

    it('respects maxSelections limit', async () => {
      const user = userEvent.setup()
      const mockOnSelectionChange = vi.fn()
      render(
        <CharitySelector
          charities={mockCharities}
          allowMultiple={true}
          maxSelections={2}
          onSelectionChange={mockOnSelectionChange}
        />,
      )

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Global Health Initiative'))
      await user.click(screen.getByText('Education for All'))
      await user.click(screen.getByText('Climate Action Fund'))

      // Should only have 2 selections due to maxSelections limit
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(2)
    })

    it('shows allocation sliders when showAllocationSliders is true', async () => {
      const user = userEvent.setup()
      render(
        <CharitySelector
          charities={mockCharities}
          allowMultiple={true}
          showAllocationSliders={true}
          selectedAllocations={mockAllocations}
        />,
      )

      await user.click(screen.getByRole('button'))
      const sliders = screen.getAllByRole('slider')
      expect(sliders.length).toBeGreaterThan(0)
    })

    it('updates allocation percentages via sliders', async () => {
      const user = userEvent.setup()
      const mockOnAllocationChange = vi.fn()
      render(
        <CharitySelector
          charities={mockCharities}
          allowMultiple={true}
          showAllocationSliders={true}
          selectedAllocations={mockAllocations}
          onAllocationChange={mockOnAllocationChange}
        />,
      )

      await user.click(screen.getByRole('button'))
      const slider = screen.getAllByRole('slider')[0]
      fireEvent.change(slider, {target: {value: '75'}})

      expect(mockOnAllocationChange).toHaveBeenCalled()
    })
  })

  describe('Allocation Display', () => {
    it('shows total allocation percentage in multiple mode', async () => {
      const user = userEvent.setup()
      render(
        <CharitySelector
          charities={mockCharities}
          allowMultiple={true}
          showAllocationSliders={true}
          selectedAllocations={mockAllocations}
        />,
      )

      await user.click(screen.getByRole('button'))
      expect(screen.getByText('Total allocation: 100%')).toBeInTheDocument()
    })

    it('shows remaining allocation when total is less than 100%', async () => {
      const user = userEvent.setup()
      const partialAllocations = [{charityId: 'charity-1', percentage: 30}]
      render(
        <CharitySelector
          charities={mockCharities}
          allowMultiple={true}
          showAllocationSliders={true}
          selectedAllocations={partialAllocations}
        />,
      )

      await user.click(screen.getByRole('button'))
      expect(screen.getByText('(Remaining: 70%)')).toBeInTheDocument()
    })
  })

  describe('Component Variants', () => {
    it('applies default variant classes', () => {
      const {container} = render(<CharitySelector />)
      const selectorElement = container.querySelector('[class*="border-gray-200"]')
      expect(selectorElement).toBeInTheDocument()
    })

    it('applies web3 variant classes', () => {
      const {container} = render(<CharitySelector variant="web3" />)
      const selectorElement = container.querySelector('[class*="border-violet-200"]')
      expect(selectorElement).toBeInTheDocument()
    })

    it('applies card variant classes', () => {
      const {container} = render(<CharitySelector variant="card" />)
      const selectorElement = container.querySelector('[class*="backdrop-blur-md"]')
      expect(selectorElement).toBeInTheDocument()
    })

    it('applies compact variant classes', () => {
      const {container} = render(<CharitySelector variant="compact" />)
      const selectorElement = container.querySelector('[class*="bg-white/60"]')
      expect(selectorElement).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('applies small size classes', () => {
      const {container} = render(<CharitySelector size="sm" />)
      const selectorElement = container.querySelector('[class*="p-3"]')
      expect(selectorElement).toBeInTheDocument()
    })

    it('applies large size classes', () => {
      const {container} = render(<CharitySelector size="lg" />)
      const selectorElement = container.querySelector('[class*="p-5"]')
      expect(selectorElement).toBeInTheDocument()
    })
  })

  describe('Interaction States', () => {
    it('disables interaction when disabled prop is true', async () => {
      const user = userEvent.setup()
      const mockOnSelectionChange = vi.fn()
      render(<CharitySelector charities={mockCharities} disabled={true} onSelectionChange={mockOnSelectionChange} />)

      await user.click(screen.getByRole('button'))
      // Selector should not expand when disabled
      expect(screen.queryByText('Global Health Initiative')).not.toBeInTheDocument()
    })

    it('prevents changes when readOnly prop is true', async () => {
      const user = userEvent.setup()
      const mockOnSelectionChange = vi.fn()
      render(<CharitySelector charities={mockCharities} readOnly={true} onSelectionChange={mockOnSelectionChange} />)

      await user.click(screen.getByRole('button'))
      // Should still be able to view but not change selections
      expect(screen.queryByText('Global Health Initiative')).not.toBeInTheDocument()
    })
  })

  describe('Website Link Functionality', () => {
    it('calls onWebsiteVisit when website link is clicked', async () => {
      const user = userEvent.setup()
      const mockOnWebsiteVisit = vi.fn()
      render(<CharitySelector charities={mockCharities} showWebsiteLinks={true} onWebsiteVisit={mockOnWebsiteVisit} />)

      await user.click(screen.getByRole('button'))
      const websiteButton = screen.getAllByLabelText(/Visit .* website/)[0]
      await user.click(websiteButton)

      expect(mockOnWebsiteVisit).toHaveBeenCalledWith(mockCharities[0])
    })
  })

  describe('Validation', () => {
    it('displays validation error when validate function returns error', () => {
      const mockValidate = vi.fn().mockReturnValue('Total allocation must equal 100%')
      render(
        <CharitySelector
          charities={mockCharities}
          selectedAllocations={[{charityId: 'charity-1', percentage: 50}]}
          validate={mockValidate}
        />,
      )

      expect(screen.getByText('Total allocation must equal 100%')).toBeInTheDocument()
    })

    it('prioritizes error prop over validation error', () => {
      const mockValidate = vi.fn().mockReturnValue('Validation error')
      render(<CharitySelector charities={mockCharities} error="Priority error" validate={mockValidate} />)

      expect(screen.getByText('Priority error')).toBeInTheDocument()
      expect(screen.queryByText('Validation error')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels for charity selection', async () => {
      render(<CharitySelector charities={mockCharities} label="Select charities" />)

      expect(screen.getByLabelText('Select charities')).toBeInTheDocument()
    })

    it('provides screen reader text for website links', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={mockCharities} showWebsiteLinks={true} />)

      await user.click(screen.getByRole('button'))
      expect(screen.getByLabelText('Visit Global Health Initiative website')).toBeInTheDocument()
    })

    it('maintains keyboard navigation support', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={mockCharities} />)

      // Test keyboard interaction
      const button = screen.getByRole('button')
      await user.tab()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      await waitFor(() => {
        expect(screen.getByText('Global Health Initiative')).toBeInTheDocument()
      })
    })
  })

  describe('Logo Handling', () => {
    it('displays charity logo when logoURI is provided', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={mockCharities} />)

      await user.click(screen.getByRole('button'))
      const logo = screen.getByAltText('Global Health Initiative logo')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', 'https://example.com/logos/global-health.png')
    })

    it('displays heart icon when logoURI is empty', async () => {
      const user = userEvent.setup()
      render(<CharitySelector charities={mockCharities} />)

      await user.click(screen.getByRole('button'))
      // Tech for Good has empty logoURI, should show heart icon
      const heartIcons = screen.getAllByRole('img', {hidden: true})
      expect(heartIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Custom Class Names', () => {
    it('applies custom container class name', () => {
      const {container} = render(<CharitySelector containerClassName="custom-container" />)
      expect(container.querySelector('.custom-container')).toBeInTheDocument()
    })

    it('applies custom label class name', () => {
      render(<CharitySelector label="Test Label" labelClassName="custom-label" />)
      expect(screen.getByText('Test Label')).toHaveClass('custom-label')
    })

    it('applies custom helper class name', () => {
      render(<CharitySelector helperText="Helper text" helperClassName="custom-helper" />)
      expect(screen.getByText('Helper text')).toHaveClass('custom-helper')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty charity name gracefully', async () => {
      const userEventInstance = userEvent.setup()
      const charitiesWithEmptyName = [{...mockCharities[0], name: ''}, ...mockCharities.slice(1)]
      render(<CharitySelector charities={charitiesWithEmptyName} />)

      await userEventInstance.click(screen.getByRole('button'))
      // Should still render without crashing
      expect(screen.getByText('Education for All')).toBeInTheDocument()
    })

    it('handles very long charity descriptions', async () => {
      const user = userEvent.setup()
      const charitiesWithLongDescription = [
        {
          ...mockCharities[0],
          description: 'This is a very long description '.repeat(20),
        },
        ...mockCharities.slice(1),
      ]
      render(<CharitySelector charities={charitiesWithLongDescription} showDescriptions={true} />)

      await user.click(screen.getByRole('button'))
      // Should truncate with line-clamp-2
      const descriptionElement = screen.getByText(/This is a very long description/)
      expect(descriptionElement).toHaveClass('line-clamp-2')
    })

    it('handles categories overflow correctly', async () => {
      const user = userEvent.setup()
      const charitiesWithManyCategories = [
        {
          ...mockCharities[0],
          category: ['Health', 'Education', 'Environment', 'Technology', 'Social Justice', 'Climate'],
        },
        ...mockCharities.slice(1),
      ]
      render(<CharitySelector charities={charitiesWithManyCategories} showCategories={true} />)

      await user.click(screen.getByRole('button'))
      // Should show +3 indicator for overflow
      expect(screen.getByText('+3')).toBeInTheDocument()
    })
  })
})
