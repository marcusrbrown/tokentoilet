import type {Meta, StoryObj} from '@storybook/react'
import {CharitySelector, type CharityAllocation, type CharityData} from './charity-selector'

const meta: Meta<typeof CharitySelector> = {
  title: 'UI/CharitySelector',
  component: CharitySelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A Web3 charity selector component for token disposal targeting. Allows users to select charitable organizations and allocate percentages for distributing unwanted tokens. Features glass morphism design, multiple selection modes, and comprehensive donation tracking.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: ['default', 'web3', 'card', 'compact'],
      description: 'Visual style variant of the charity selector',
    },
    size: {
      control: {type: 'select'},
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'Size variant of the charity selector',
    },
    allowMultiple: {
      control: {type: 'boolean'},
      description: 'Whether to allow multiple charity selection',
    },
    showAllocationSliders: {
      control: {type: 'boolean'},
      description: 'Whether to show allocation sliders for multiple selection',
    },
    showDescriptions: {
      control: {type: 'boolean'},
      description: 'Whether to show charity descriptions',
    },
    showTotalDonations: {
      control: {type: 'boolean'},
      description: 'Whether to show total donations information',
    },
    showCategories: {
      control: {type: 'boolean'},
      description: 'Whether to show charity categories',
    },
    showWebsiteLinks: {
      control: {type: 'boolean'},
      description: 'Whether to show external website links',
    },
    disabled: {
      control: {type: 'boolean'},
      description: 'Whether the selector is disabled',
    },
    readOnly: {
      control: {type: 'boolean'},
      description: 'Whether the selector is read-only',
    },
    maxSelections: {
      control: {type: 'number'},
      description: 'Maximum number of charities that can be selected',
    },
    minAllocation: {
      control: {type: 'number'},
      description: 'Minimum allocation percentage required',
    },
    onSelectionChange: {
      action: 'selection-changed',
      description: 'Callback when charity selection changes',
    },
    onAllocationChange: {
      action: 'allocation-changed',
      description: 'Callback when allocation percentages change',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample Web3 charities for DeFi token disposal
const SAMPLE_CHARITIES: CharityData[] = [
  {
    id: 'unicef-crypto',
    name: 'UNICEF CryptoFund',
    description:
      'Investing in blockchain and cryptocurrency solutions to benefit children and young people around the world.',
    logoURI: 'https://www.unicef.org/sites/default/files/2019-06/UNICEF-logo-Icon-Blue.png',
    address: '0x1234567890123456789012345678901234567890',
    category: ['Children', 'Technology', 'Global Development'],
    totalDonations: '15000000',
    website: 'https://www.unicef.org/innovation/blockchain',
  },
  {
    id: 'giveth',
    name: 'Giveth',
    description:
      'Building the future of giving using blockchain technology to create a completely free, open-source platform.',
    logoURI: 'https://giveth.io/images/giveth-logo-purple.svg',
    address: '0x2345678901234567890123456789012345678901',
    category: ['Technology', 'Philanthropy', 'Decentralization'],
    totalDonations: '8500000',
    website: 'https://giveth.io',
  },
  {
    id: 'gitcoin-grants',
    name: 'Gitcoin Grants',
    description: 'Funding open source projects and public goods through quadratic funding and community support.',
    logoURI: 'https://gitcoin.co/static/v2/images/logo_med.png',
    address: '0x3456789012345678901234567890123456789012',
    category: ['Open Source', 'Technology', 'Public Goods'],
    totalDonations: '12000000',
    website: 'https://gitcoin.co/grants',
  },
  {
    id: 'ethereum-foundation',
    name: 'Ethereum Foundation',
    description:
      'Supporting Ethereum protocol development, growing the ecosystem, and advocating for decentralized technologies.',
    logoURI: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/31987/ethereum-icon-purple.png',
    address: '0x4567890123456789012345678901234567890123',
    category: ['Technology', 'Blockchain', 'Research'],
    totalDonations: '45000000',
    website: 'https://ethereum.foundation',
  },
  {
    id: 'climate-collective',
    name: 'Climate Collective',
    description: 'Leveraging Web3 technologies to fund climate solutions and carbon offset projects worldwide.',
    logoURI: 'https://example.com/logos/climate-collective.png',
    address: '0x5678901234567890123456789012345678901234',
    category: ['Environment', 'Climate Change', 'Carbon Credits'],
    totalDonations: '6800000',
    website: 'https://climatecollective.org',
  },
  {
    id: 'endaoment',
    name: 'Endaoment',
    description:
      'Community-owned and operated donor-advised fund protocol built on Ethereum for tax-efficient charitable giving.',
    logoURI: 'https://endaoment.org/logo.png',
    address: '0x6789012345678901234567890123456789012345',
    category: ['Philanthropy', 'Tax Efficiency', 'DeFi'],
    totalDonations: '3200000',
    website: 'https://endaoment.org',
  },
]

// Sample allocations for testing
const SAMPLE_ALLOCATIONS: CharityAllocation[] = [
  {charityId: 'unicef-crypto', percentage: 40},
  {charityId: 'giveth', percentage: 30},
  {charityId: 'gitcoin-grants', percentage: 30},
]

// Default charity selector story
export const Default: Story = {
  args: {
    label: 'Select Charity for Token Disposal',
    helperText: 'Choose where to send your unwanted tokens',
    charities: SAMPLE_CHARITIES,
    variant: 'default',
    size: 'default',
    showDescriptions: true,
    showCategories: true,
  },
}

// All charity selector variants showcase
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-6 max-w-4xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Charity Selector Variants</div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Default Variant</h3>
          <CharitySelector
            label="Default Style"
            charities={SAMPLE_CHARITIES.slice(0, 3)}
            variant="default"
            showDescriptions
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Web3 Variant</h3>
          <CharitySelector
            label="Web3 Style with Violet Accent"
            charities={SAMPLE_CHARITIES.slice(0, 3)}
            variant="web3"
            showDescriptions
            showCategories
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Card Variant</h3>
          <CharitySelector
            label="Card Style with Glass Morphism"
            charities={SAMPLE_CHARITIES.slice(0, 3)}
            variant="card"
            showDescriptions
            showTotalDonations
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Compact Variant</h3>
          <CharitySelector
            label="Compact Style for Smaller Spaces"
            charities={SAMPLE_CHARITIES.slice(0, 3)}
            variant="compact"
            size="sm"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'All available charity selector variants with different visual treatments and glass morphism effects for Web3 DeFi applications.',
      },
    },
  },
}

// Single charity selection for token disposal
export const SingleCharity: Story = {
  args: {
    label: 'Choose Charity for Token Disposal',
    helperText: 'Select a single charity to receive your unwanted tokens',
    charities: SAMPLE_CHARITIES,
    variant: 'web3',
    allowMultiple: false,
    showDescriptions: true,
    showCategories: true,
    showTotalDonations: true,
    showWebsiteLinks: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Single charity selection mode for direct token disposal to one charitable organization.',
      },
    },
  },
}

// Multiple charity selection with allocation
export const MultipleCharitiesWithAllocation: Story = {
  args: {
    label: 'Distribute Tokens Across Multiple Charities',
    helperText: 'Choose multiple charities and set allocation percentages',
    charities: SAMPLE_CHARITIES,
    selectedAllocations: SAMPLE_ALLOCATIONS,
    variant: 'card',
    allowMultiple: true,
    showAllocationSliders: true,
    showDescriptions: true,
    showCategories: true,
    showTotalDonations: true,
    maxSelections: 5,
    minAllocation: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multiple charity selection with percentage allocation sliders for distributing tokens across several charitable organizations.',
      },
    },
  },
}

// Web3 DeFi use case example
export const Web3TokenDisposal: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Token Disposal</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select charities to receive your unwanted tokens and support meaningful causes
        </p>
      </div>

      <CharitySelector
        label="Charity Selection"
        helperText="Your tokens will be converted to ETH and donated to selected charities"
        charities={SAMPLE_CHARITIES}
        variant="web3"
        size="lg"
        allowMultiple={true}
        showAllocationSliders={true}
        showDescriptions={true}
        showCategories={true}
        showTotalDonations={true}
        showWebsiteLinks={true}
        maxSelections={3}
        minAllocation={10}
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Complete Web3 token disposal flow showing how users can select charities and allocate percentages for unwanted token distribution.',
      },
    },
  },
}

// Error states
export const ErrorStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Error States</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Validation Error</h3>
          <CharitySelector
            label="Charity Selection"
            charities={SAMPLE_CHARITIES.slice(0, 3)}
            error="Allocation percentages must total 100%"
            allowMultiple={true}
            showAllocationSliders={true}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">No Charities Available</h3>
          <CharitySelector label="Charity Selection" charities={[]} helperText="No charities available at this time" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Disabled State</h3>
          <CharitySelector
            label="Charity Selection"
            charities={SAMPLE_CHARITIES.slice(0, 3)}
            disabled={true}
            helperText="Charity selection is currently disabled"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Various error and disabled states for the charity selector component.',
      },
    },
  },
}

// Loading state
export const LoadingState: Story = {
  args: {
    label: 'Loading Charities...',
    charities: [],
    helperText: 'Fetching available charities from the network',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state when charities are being fetched from the blockchain or API.',
      },
    },
  },
}

// Size variants
export const SizeVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Size Variants</div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Small</h3>
          <CharitySelector label="Small Size" charities={SAMPLE_CHARITIES.slice(0, 2)} size="sm" variant="card" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Default</h3>
          <CharitySelector
            label="Default Size"
            charities={SAMPLE_CHARITIES.slice(0, 2)}
            size="default"
            variant="card"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Large</h3>
          <CharitySelector label="Large Size" charities={SAMPLE_CHARITIES.slice(0, 2)} size="lg" variant="card" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Extra Large</h3>
          <CharitySelector label="Extra Large Size" charities={SAMPLE_CHARITIES.slice(0, 2)} size="xl" variant="card" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All available size variants for the charity selector component.',
      },
    },
  },
}
