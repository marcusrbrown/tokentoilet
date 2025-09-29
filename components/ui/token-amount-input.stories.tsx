import type {TokenData} from '@/lib/token-utils'
import type {Meta, StoryObj} from '@storybook/react'
import {useState} from 'react'
import {TokenAmountInput} from './token-amount-input'

// Sample tokens for stories
const SAMPLE_TOKENS: TokenData[] = [
  {
    address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1c',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    balance: '5000000000000000000', // 5 ETH
    price: 2000,
    logoUrl: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/6ed5f/eth-diamond-black.webp',
  },
  {
    address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1d',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: '10000000', // 10,000 USDC
    price: 1,
    logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  {
    address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1e',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    decimals: 18,
    balance: '1000000000000000000000000', // 1M SHIB
    price: 0.000008,
    logoUrl: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png',
  },
  {
    address: '0xA0b86a33E6441b1e78a8C46B9d688d5d5d3B2D1f',
    symbol: 'DUST',
    name: 'Dust Token',
    decimals: 18,
    balance: '100000000000000000', // 0.1 DUST
    price: 0.000001,
    logoUrl: '',
  },
]

const meta: Meta<typeof TokenAmountInput> = {
  title: 'Components/UI/TokenAmountInput',
  component: TokenAmountInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Enhanced token amount input with comprehensive validation, real-time balance verification, and advanced features like quick percentage selection and detailed feedback.',
      },
    },
  },
  argTypes: {
    value: {
      control: {type: 'text'},
      description: 'Current token amount value',
    },
    selectedToken: {
      control: {type: 'object'},
      description: 'Currently selected token',
    },
    validationConfig: {
      control: {type: 'object'},
      description: 'Validation configuration options',
    },
    showDetailedFeedback: {
      control: {type: 'boolean'},
      description: 'Show detailed validation feedback',
    },
    showBalanceVerification: {
      control: {type: 'boolean'},
      description: 'Show balance verification status',
    },
    showPercentageOfBalance: {
      control: {type: 'boolean'},
      description: 'Show amount as percentage of balance',
    },
    enableQuickPercentages: {
      control: {type: 'boolean'},
      description: 'Enable quick percentage buttons',
    },
    disabled: {
      control: {type: 'boolean'},
      description: 'Whether the input is disabled',
    },
    readOnly: {
      control: {type: 'boolean'},
      description: 'Whether the input is read-only',
    },
    onAmountChange: {
      action: 'amount-changed',
      description: 'Callback when amount value changes',
    },
    onValidationChange: {
      action: 'validation-changed',
      description: 'Callback when validation result changes',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Interactive wrapper for controlled stories
const TokenAmountInputWrapper = (props: Parameters<typeof TokenAmountInput>[0]) => {
  const [value, setValue] = useState(props.value ?? '')
  const [selectedToken] = useState(props.selectedToken || SAMPLE_TOKENS[0])

  return (
    <div className="w-96 space-y-4">
      <TokenAmountInput
        {...props}
        value={value}
        selectedToken={selectedToken}
        onAmountChange={setValue}
        tokens={SAMPLE_TOKENS}
      />
    </div>
  )
}

// Default token amount input story
export const Default: Story = {
  render: () => (
    <TokenAmountInputWrapper
      label="Token Amount"
      placeholder="0.0"
      showDetailedFeedback
      showBalanceVerification
      enableQuickPercentages
    />
  ),
}

// Validation states showcase
export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Validation States</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Valid Amount</h3>
          <TokenAmountInputWrapper
            label="Amount"
            value="1.5"
            selectedToken={SAMPLE_TOKENS[0]}
            showDetailedFeedback
            showPercentageOfBalance
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Insufficient Balance</h3>
          <TokenAmountInputWrapper label="Amount" value="10" selectedToken={SAMPLE_TOKENS[0]} showDetailedFeedback />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Dust Warning</h3>
          <TokenAmountInputWrapper
            label="Amount"
            value="0.0001"
            validationConfig={{dustThreshold: '0.001'}}
            selectedToken={SAMPLE_TOKENS[0]}
            showDetailedFeedback
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">High Balance Usage</h3>
          <TokenAmountInputWrapper
            label="Amount"
            value="4.8"
            selectedToken={SAMPLE_TOKENS[0]}
            showDetailedFeedback
            showPercentageOfBalance
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Custom Error</h3>
          <TokenAmountInputWrapper
            label="Amount"
            value="100"
            errorOverride="Custom validation error message"
            selectedToken={SAMPLE_TOKENS[0]}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Custom Warning</h3>
          <TokenAmountInputWrapper
            label="Amount"
            value="1.0"
            warningOverride="Custom warning about gas fees"
            selectedToken={SAMPLE_TOKENS[0]}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}

// Real-time balance verification
export const RealTimeBalance: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Real-time Balance Verification</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            With Balance Verification Enabled
          </h3>
          <TokenAmountInputWrapper
            label="Amount to Dispose"
            selectedToken={SAMPLE_TOKENS[0]}
            validationConfig={{enableRealTimeBalance: true}}
            showDetailedFeedback
            showBalanceVerification
            showPercentageOfBalance
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Standard Validation Only</h3>
          <TokenAmountInputWrapper
            label="Amount to Dispose"
            selectedToken={SAMPLE_TOKENS[0]}
            showDetailedFeedback={false}
            showBalanceVerification={false}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}

// Quick percentage features
export const QuickPercentages: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Quick Percentage Selection</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">ETH Token (5 ETH Balance)</h3>
          <TokenAmountInputWrapper
            label="Disposal Amount"
            selectedToken={SAMPLE_TOKENS[0]}
            enableQuickPercentages
            showPercentageOfBalance
            showDetailedFeedback
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            USDC Token (10,000 USDC Balance)
          </h3>
          <TokenAmountInputWrapper
            label="Disposal Amount"
            selectedToken={SAMPLE_TOKENS[1]}
            enableQuickPercentages
            showPercentageOfBalance
            showDetailedFeedback
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">SHIB Token (1M SHIB Balance)</h3>
          <TokenAmountInputWrapper
            label="Disposal Amount"
            selectedToken={SAMPLE_TOKENS[2]}
            enableQuickPercentages
            showPercentageOfBalance
            showDetailedFeedback
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}

// Custom validation scenarios
export const CustomValidation: Story = {
  render: () => {
    const customValidator = (amount: string, token?: TokenData) => {
      const num = Number.parseFloat(amount)

      // Custom business logic validation
      if (token?.symbol === 'USDC' && num > 1000) {
        return {
          isValid: false,
          type: 'error' as const,
          message: 'USDC disposal limit is 1,000 per transaction',
          suggestion: 'Try splitting into multiple smaller transactions',
          severity: 'medium' as const,
        }
      }

      if (token?.symbol === 'SHIB' && num < 100000) {
        return {
          isValid: true,
          type: 'warning' as const,
          message: 'Small SHIB amounts may not be worth the gas fees',
          suggestion: 'Consider disposing larger amounts to optimize costs',
          severity: 'low' as const,
        }
      }

      return null
    }

    return (
      <div className="space-y-6 p-6 max-w-2xl">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Custom Validation Logic</div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              USDC with Disposal Limit (1,000 max)
            </h3>
            <TokenAmountInputWrapper
              label="USDC Amount"
              selectedToken={SAMPLE_TOKENS[1]}
              validationConfig={{customValidator}}
              showDetailedFeedback
              placeholder="Try entering 1500"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              SHIB with Minimum Recommendation
            </h3>
            <TokenAmountInputWrapper
              label="SHIB Amount"
              selectedToken={SAMPLE_TOKENS[2]}
              validationConfig={{customValidator}}
              showDetailedFeedback
              placeholder="Try entering 50000"
            />
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    layout: 'fullscreen',
  },
}

// Different token types showcase
export const TokenVariations: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Different Token Types</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">High Value Token (ETH)</h3>
          <TokenAmountInputWrapper
            label="Amount"
            selectedToken={SAMPLE_TOKENS[0]}
            showDetailedFeedback
            showPercentageOfBalance
            enableQuickPercentages
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Stablecoin (USDC)</h3>
          <TokenAmountInputWrapper
            label="Amount"
            selectedToken={SAMPLE_TOKENS[1]}
            showDetailedFeedback
            showPercentageOfBalance
            enableQuickPercentages
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">High Supply Token (SHIB)</h3>
          <TokenAmountInputWrapper
            label="Amount"
            selectedToken={SAMPLE_TOKENS[2]}
            showDetailedFeedback
            showPercentageOfBalance
            enableQuickPercentages
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Low Value/Dust Token</h3>
          <TokenAmountInputWrapper
            label="Amount"
            selectedToken={SAMPLE_TOKENS[3]}
            validationConfig={{dustThreshold: '0.001'}}
            showDetailedFeedback
            showPercentageOfBalance
            enableQuickPercentages
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}

// Interactive playground
export const Playground: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Interactive Playground</div>

      <div className="space-y-4">
        <TokenAmountInputWrapper
          label="Token Disposal Amount"
          placeholder="Enter amount to dispose"
          selectedToken={SAMPLE_TOKENS[0]}
          validationConfig={{
            enableRealTimeBalance: true,
            dustThreshold: '0.001',
            minAmount: '0.001',
          }}
          showDetailedFeedback
          showBalanceVerification
          showPercentageOfBalance
          enableQuickPercentages
          helperText="Enter the amount of tokens you want to dispose of"
        />

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Try different scenarios:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Enter amounts larger than balance (5 ETH available)</li>
            <li>Enter very small amounts (dust warning)</li>
            <li>Use quick percentage buttons</li>
            <li>Enter negative numbers or invalid text</li>
            <li>Use more than 18 decimal places</li>
          </ul>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}

// Loading and error states
export const LoadingAndErrorStates: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-2xl">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Loading and Error States</div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Disabled State</h3>
          <TokenAmountInputWrapper
            label="Amount"
            value="1.5"
            selectedToken={SAMPLE_TOKENS[0]}
            disabled
            showDetailedFeedback
            enableQuickPercentages
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Read-only State</h3>
          <TokenAmountInputWrapper
            label="Amount"
            value="2.5"
            selectedToken={SAMPLE_TOKENS[0]}
            readOnly
            showDetailedFeedback
            enableQuickPercentages
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Error Override</h3>
          <TokenAmountInputWrapper
            label="Amount"
            value="1.0"
            selectedToken={SAMPLE_TOKENS[0]}
            errorOverride="Network connection failed. Please try again."
            showDetailedFeedback
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}
