import type {Meta, StoryObj} from '@storybook/react'
import {useState} from 'react'
import {TokenInput, type TokenInputProps} from './token-input'

// Sample token data for stories
const SAMPLE_TOKENS = [
  {
    address: '0xa0b86a33e6441bb6bb0874b298f3a4e5e9b9b0e5',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce.png',
    balance: '1250000000000000000000',
    price: 0.000008,
    totalSupply: '589000000000000000000000000000000',
    isUnwanted: true,
  },
  {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png',
    balance: '50000000000000000000',
    price: 1,
    totalSupply: '4800000000000000000000000000',
    isUnwanted: false,
  },
  {
    address: '0xa0b86a33e6441bb6bb0874b298f3a4e5e9b9b0e5',
    symbol: 'SAFEMOON',
    name: 'SafeMoon',
    decimals: 9,
    logoURI: 'https://tokens.1inch.io/0x8076c74c5e3f5852037f31ff0093eeb8c8add8d3.png',
    balance: '1000000000000',
    price: 0.0003,
    totalSupply: '1000000000000000000000',
    isUnwanted: true,
  },
  {
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png',
    balance: '25000000000000000000',
    price: 6.45,
    totalSupply: '1000000000000000000000000000',
    isUnwanted: false,
  },
]

const meta: Meta<typeof TokenInput> = {
  title: 'UI/TokenInput',
  component: TokenInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A specialized input component for token amounts with selection, validation, and USD value conversion. Designed for Web3 DeFi applications with glass morphism effects and comprehensive token management features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {type: 'select'},
      options: ['default', 'web3', 'error', 'success'],
      description: 'Visual style variant of the token input',
    },
    size: {
      control: {type: 'select'},
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'Size variant of the token input',
    },
    value: {
      control: {type: 'text'},
      description: 'Current token amount value in decimal string format',
    },
    placeholder: {
      control: {type: 'text'},
      description: 'Placeholder text for amount input',
    },
    disabled: {
      control: {type: 'boolean'},
      description: 'Whether the input is disabled',
    },
    readOnly: {
      control: {type: 'boolean'},
      description: 'Whether the input is read-only',
    },
    showUsdValue: {
      control: {type: 'boolean'},
      description: 'Whether to show USD value conversion',
    },
    showBalance: {
      control: {type: 'boolean'},
      description: 'Whether to show balance display and max button',
    },
    allowTokenSelection: {
      control: {type: 'boolean'},
      description: 'Whether to allow token selection',
    },
    maxDecimals: {
      control: {type: 'number'},
      description: 'Maximum number of decimal places to allow',
    },
    onAmountChange: {
      action: 'amount-changed',
      description: 'Callback when amount value changes',
    },
    onTokenChange: {
      action: 'token-changed',
      description: 'Callback when token selection changes',
    },
    onMaxClick: {
      action: 'max-clicked',
      description: 'Callback when max button is clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Interactive wrapper for controlled stories
const TokenInputWrapper = (props: Partial<TokenInputProps>) => {
  const [value, setValue] = useState(props.value ?? '')
  const [selectedToken, setSelectedToken] = useState(props.selectedToken || SAMPLE_TOKENS[0])

  return (
    <TokenInput
      {...props}
      value={value}
      selectedToken={selectedToken}
      onAmountChange={setValue}
      onTokenChange={setSelectedToken}
      tokens={SAMPLE_TOKENS}
    />
  )
}

// Default token input story
export const Default: Story = {
  render: () => (
    <div className="w-96">
      <TokenInputWrapper
        label="Token Amount"
        placeholder="0.0"
        variant="default"
        size="default"
        showUsdValue
        showBalance
        allowTokenSelection
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default token input with glass morphism effects, USD conversion, and token selection.',
      },
    },
  },
}

// All token input variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Token Input Variants</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Default</h3>
          <TokenInputWrapper label="Default Variant" variant="default" showUsdValue allowTokenSelection />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Web3</h3>
          <TokenInputWrapper label="Web3 Variant with Violet Accent" variant="web3" showUsdValue allowTokenSelection />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Error</h3>
          <TokenInputWrapper
            label="Error State"
            variant="error"
            error="Insufficient balance"
            value="999999"
            showUsdValue
            allowTokenSelection
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Success</h3>
          <TokenInputWrapper
            label="Success State"
            variant="success"
            success="Valid amount for disposal"
            value="1000"
            showUsdValue
            allowTokenSelection
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All available token input variants with different visual states.',
      },
    },
  },
}

// Size variants
export const SizeVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Size Variants</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Small</h3>
          <TokenInputWrapper label="Small Size" size="sm" showUsdValue allowTokenSelection />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Default</h3>
          <TokenInputWrapper label="Default Size" size="default" showUsdValue allowTokenSelection />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Large</h3>
          <TokenInputWrapper label="Large Size" size="lg" showUsdValue allowTokenSelection />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Extra Large</h3>
          <TokenInputWrapper label="Extra Large Size" size="xl" showUsdValue allowTokenSelection />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All available size variants for the token input component.',
      },
    },
  },
}

// Web3 token disposal use case
export const Web3TokenDisposal: Story = {
  render: () => (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dispose Unwanted Tokens</h2>
        <p className="text-gray-600 dark:text-gray-400">Enter the amount of tokens you want to dispose for charity</p>
      </div>

      <TokenInputWrapper
        label="Token to Dispose"
        helperText="Select from your unwanted tokens"
        variant="web3"
        size="lg"
        showUsdValue
        showBalance
        allowTokenSelection
        placeholder="0.0"
        tokens={SAMPLE_TOKENS.filter(token => token.isUnwanted)}
      />

      <div className="text-xs text-gray-500 dark:text-gray-400">* Only showing tokens marked as unwanted</div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Web3 token disposal use case showing unwanted token selection for charitable giving.',
      },
    },
  },
}

// Feature showcase
export const FeatureShowcase: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Feature Showcase</div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">With Balance and Max Button</h3>
          <TokenInputWrapper
            label="Amount"
            showUsdValue
            showBalance
            allowTokenSelection
            helperText="Click 'Max' to use full balance"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">USD Value Conversion</h3>
          <TokenInputWrapper
            label="Amount"
            value="1000"
            showUsdValue
            allowTokenSelection
            helperText="Real-time USD value conversion"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Token Selection Disabled</h3>
          <TokenInputWrapper
            label="Fixed Token"
            allowTokenSelection={false}
            showUsdValue
            helperText="Token selection is disabled"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Read-only with Value</h3>
          <TokenInputWrapper
            label="Read-only Amount"
            value="500.25"
            readOnly
            showUsdValue
            allowTokenSelection={false}
            helperText="Display-only token input"
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
          'Showcase of various features including balance display, USD conversion, and different interaction modes.',
      },
    },
  },
}

// Validation states
export const ValidationStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Validation States</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Insufficient Balance</h3>
          <TokenInputWrapper
            label="Amount"
            variant="error"
            value="99999999"
            error="Insufficient balance. You only have 1,250 SHIB."
            showUsdValue
            allowTokenSelection
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Below Minimum</h3>
          <TokenInputWrapper
            label="Amount"
            variant="error"
            value="0.001"
            error="Amount is below minimum disposal amount of 1 token."
            showUsdValue
            allowTokenSelection
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Valid Amount</h3>
          <TokenInputWrapper
            label="Amount"
            variant="success"
            value="100"
            success="Valid amount for token disposal."
            showUsdValue
            allowTokenSelection
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">High Gas Warning</h3>
          <TokenInputWrapper
            label="Amount"
            value="10"
            warning="Network gas fees are high. Consider disposing larger amounts to minimize costs."
            showUsdValue
            allowTokenSelection
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Various validation states including errors, warnings, and success messages.',
      },
    },
  },
}

// Disabled and loading states
export const DisabledStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Disabled States</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Disabled Input</h3>
          <TokenInputWrapper
            label="Amount"
            disabled
            value="100"
            helperText="Input is disabled"
            showUsdValue
            allowTokenSelection
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">No Tokens Available</h3>
          <TokenInputWrapper
            label="Amount"
            tokens={[]}
            helperText="No tokens available for disposal"
            allowTokenSelection
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Disabled states and edge cases like no available tokens.',
      },
    },
  },
}
