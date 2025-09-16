import type {Meta, StoryObj} from '@storybook/react'
import {useState} from 'react'
import {Button} from './button'
import {Modal} from './modal'

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile modal component with backdrop blur and Web3Modal theming integration. Features glass morphism effects, multiple size variants, and comprehensive accessibility support for DeFi applications.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: {type: 'boolean'},
      description: 'Whether the modal is open',
    },
    variant: {
      control: {type: 'select'},
      options: ['default', 'solid', 'web3', 'elevated'],
      description: 'Visual style variant of the modal',
    },
    size: {
      control: {type: 'select'},
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', 'full'],
      description: 'Size variant of the modal',
    },
    backdropVariant: {
      control: {type: 'select'},
      options: ['default', 'web3', 'elevated'],
      description: 'Backdrop style variant',
    },
    closeOnBackdropClick: {
      control: {type: 'boolean'},
      description: 'Whether clicking the backdrop should close the modal',
    },
    closeOnEscape: {
      control: {type: 'boolean'},
      description: 'Whether pressing Escape should close the modal',
    },
    showCloseButton: {
      control: {type: 'boolean'},
      description: 'Whether to show the close button',
    },
    title: {
      control: {type: 'text'},
      description: 'Modal title for accessibility',
    },
    description: {
      control: {type: 'text'},
      description: 'Modal description for accessibility',
    },
    onClose: {
      action: 'close',
      description: 'Callback fired when the modal should close',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Modal wrapper component for interactive stories
const ModalWrapper = ({children, ...props}: Omit<React.ComponentProps<typeof Modal>, 'open' | 'onClose'>) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal {...props} open={open} onClose={() => setOpen(false)}>
        {children}
      </Modal>
    </>
  )
}

// Default modal story
export const Default: Story = {
  render: () => (
    <ModalWrapper
      title="Default Modal"
      description="A basic modal with glass morphism effects"
      variant="default"
      size="md"
      showCloseButton
    >
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Welcome to Token Toilet</h2>
        <p className="text-gray-600 dark:text-gray-400">
          This is a default modal with glass morphism effects and backdrop blur. Perfect for displaying information or
          forms in Web3 DeFi applications.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button variant="default" size="sm">
            Confirm
          </Button>
        </div>
      </div>
    </ModalWrapper>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Default modal with glass morphism effects and backdrop blur.',
      },
    },
  },
}

// All modal variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 p-6">
      <ModalWrapper title="Default Glass Modal" variant="default" size="md" showCloseButton>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-2">Default Variant</h3>
          <p className="text-gray-600 dark:text-gray-400">Glass morphism with subtle backdrop blur</p>
        </div>
      </ModalWrapper>

      <ModalWrapper title="Solid Modal" variant="solid" size="md" showCloseButton>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-2">Solid Variant</h3>
          <p className="text-gray-600 dark:text-gray-400">Solid background without glass effects</p>
        </div>
      </ModalWrapper>

      <ModalWrapper title="Web3 Themed Modal" variant="web3" size="md" showCloseButton>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-2">Web3 Variant</h3>
          <p className="text-gray-600 dark:text-gray-400">Violet-themed for Web3 DeFi applications</p>
        </div>
      </ModalWrapper>

      <ModalWrapper title="Elevated Modal" variant="elevated" size="md" showCloseButton>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-2">Elevated Variant</h3>
          <p className="text-gray-600 dark:text-gray-400">Enhanced glass effect with stronger blur</p>
        </div>
      </ModalWrapper>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'All available modal variants showcasing different visual treatments.',
      },
    },
  },
}

// Size variants
export const SizeVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 p-6">
      <ModalWrapper title="Small Modal" size="sm" showCloseButton>
        <div className="p-4">
          <h3 className="text-base font-medium mb-2">Small Modal</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Compact size for simple confirmations</p>
        </div>
      </ModalWrapper>

      <ModalWrapper title="Medium Modal" size="md" showCloseButton>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-2">Medium Modal</h3>
          <p className="text-gray-600 dark:text-gray-400">Default size for most use cases</p>
        </div>
      </ModalWrapper>

      <ModalWrapper title="Large Modal" size="lg" showCloseButton>
        <div className="p-6">
          <h3 className="text-xl font-medium mb-2">Large Modal</h3>
          <p className="text-gray-600 dark:text-gray-400">Larger size for forms and detailed content</p>
        </div>
      </ModalWrapper>

      <ModalWrapper title="Extra Large Modal" size="xl" showCloseButton>
        <div className="p-8">
          <h3 className="text-2xl font-medium mb-2">Extra Large Modal</h3>
          <p className="text-gray-600 dark:text-gray-400">Extra large size for complex interfaces</p>
        </div>
      </ModalWrapper>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Different size variants for various use cases.',
      },
    },
  },
}

// Web3 wallet connection modal
export const Web3WalletConnection: Story = {
  render: () => (
    <ModalWrapper
      title="Connect Wallet"
      description="Choose a wallet to connect to Token Toilet"
      variant="web3"
      backdropVariant="web3"
      size="md"
      showCloseButton
    >
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a wallet to start disposing of unwanted tokens for charity
          </p>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-3 h-12">
            <div className="w-6 h-6 bg-orange-500 rounded"></div>
            MetaMask
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 h-12">
            <div className="w-6 h-6 bg-blue-500 rounded"></div>
            WalletConnect
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 h-12">
            <div className="w-6 h-6 bg-blue-600 rounded"></div>
            Coinbase Wallet
          </Button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          By connecting a wallet, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </ModalWrapper>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Web3-specific wallet connection modal with violet theming and glass morphism.',
      },
    },
  },
}

// Token disposal confirmation modal
export const TokenDisposalConfirmation: Story = {
  render: () => (
    <ModalWrapper
      title="Confirm Token Disposal"
      description="Review and confirm your token disposal transaction"
      variant="web3"
      size="lg"
      showCloseButton
    >
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Confirm Token Disposal</h2>
          <p className="text-gray-600 dark:text-gray-400">Review the details before disposing of your tokens</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Tokens to dispose</span>
            <span className="font-medium">1,250 SHIB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Estimated value</span>
            <span className="font-medium">$12.45</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Network fee</span>
            <span className="font-medium">$2.30</span>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <div className="flex justify-between font-semibold">
            <span>Total donation</span>
            <span className="text-violet-600 dark:text-violet-400">$10.15</span>
          </div>
        </div>

        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-violet-500 rounded-full flex-shrink-0 mt-0.5"></div>
            <div>
              <h4 className="font-medium text-violet-900 dark:text-violet-100">UNICEF CryptoFund</h4>
              <p className="text-sm text-violet-700 dark:text-violet-300">
                Supporting children through blockchain innovation
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button variant="default" className="flex-1">
            Confirm Disposal
          </Button>
        </div>
      </div>
    </ModalWrapper>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Token disposal confirmation modal showing transaction details and charity selection.',
      },
    },
  },
}

// Transaction status modal
export const TransactionStatus: Story = {
  render: () => (
    <ModalWrapper
      title="Transaction Status"
      description="Token disposal transaction in progress"
      variant="web3"
      size="md"
      closeOnBackdropClick={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <div className="p-6 space-y-6 text-center">
        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Processing Transaction</h2>
          <p className="text-gray-600 dark:text-gray-400">Your token disposal is being processed on the blockchain</p>
        </div>

        <div className="text-left space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm">Token approval confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Processing disposal transaction...</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <span className="text-sm text-gray-500">Sending donation to charity</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          This may take a few minutes depending on network congestion
        </div>
      </div>
    </ModalWrapper>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Transaction processing modal with progress indicators and loading states.',
      },
    },
  },
}

// Glass morphism showcase
export const GlassMorphismShowcase: Story = {
  render: () => (
    <div className="min-h-[500px] bg-gradient-to-br from-violet-100 via-blue-100 to-purple-200 dark:from-violet-900/30 dark:via-blue-900/30 dark:to-purple-900/30 flex items-center justify-center p-8">
      <ModalWrapper
        title="Glass Morphism Modal"
        description="Showcase of glass morphism effects"
        variant="default"
        backdropVariant="default"
        size="lg"
        showCloseButton
      >
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Glass Morphism Effects</h2>
            <p className="text-gray-600 dark:text-gray-400">Beautiful backdrop blur and transparency effects</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
              <h4 className="font-medium mb-2">Light Glass</h4>
              <p className="text-sm text-gray-600">Subtle transparency</p>
            </div>
            <div className="bg-white/50 backdrop-blur-md rounded-lg p-4">
              <h4 className="font-medium mb-2">Medium Glass</h4>
              <p className="text-sm text-gray-600">Balanced effect</p>
            </div>
          </div>

          <Button variant="web3Connected" className="w-full">
            Experience Web3 Design
          </Button>
        </div>
      </ModalWrapper>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Showcase of glass morphism effects on gradient backgrounds.',
      },
    },
  },
}
