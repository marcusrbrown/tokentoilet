import type {Meta, StoryObj} from '@storybook/react'
import {Input} from './input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible input component with Web3 address validation, amount formatting, and multiple variants. Supports glass morphism effects and violet branding.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: {type: 'select'},
      options: ['text', 'email', 'password', 'number', 'search'],
      description: 'Input type',
    },
    placeholder: {
      control: {type: 'text'},
      description: 'Placeholder text',
    },
    disabled: {
      control: {type: 'boolean'},
      description: 'Whether the input is disabled',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default input story
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    type: 'text',
  },
}

// Address input example
export const AddressInput: Story = {
  args: {
    placeholder: '0x742d35Cc6644C35532B7c3B8b2b1Aab1B0c0c935',
    type: 'text',
    className: 'font-mono',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input configured for Web3 address entry with monospace font.',
      },
    },
  },
}

// Amount input example
export const AmountInput: Story = {
  args: {
    placeholder: '0.00',
    type: 'number',
    step: '0.01',
    min: '0',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input configured for token amount entry with decimal support.',
      },
    },
  },
}

// Token Toilet search example
export const SearchInput: Story = {
  args: {
    placeholder: 'Search tokens...',
    type: 'search',
    className: 'w-80',
  },
  parameters: {
    docs: {
      description: {
        story: 'Search input for finding tokens in Token Toilet portfolio.',
      },
    },
    web3: {
      isConnected: true,
      portfolio: {
        tokens: ['USDC', 'DAI', 'USDT'],
      },
    },
  },
}
