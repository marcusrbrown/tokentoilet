import {cva} from 'class-variance-authority'

export const skeletonVariants = cva(
  ['inline-block', 'rounded', 'bg-gradient-to-r', 'animate-pulse', 'select-none', 'pointer-events-none'],
  {
    variants: {
      variant: {
        // Default skeleton with subtle gray gradient
        default: ['from-gray-200', 'to-gray-300', 'dark:from-gray-700', 'dark:to-gray-600'],
        // Web3 skeleton with violet accent for wallet-related content
        web3: ['from-violet-100', 'to-violet-200', 'dark:from-violet-900/30', 'dark:to-violet-800/30'],
        // Shimmer effect for address and transaction loading
        shimmer: [
          'from-gray-200',
          'via-gray-100',
          'to-gray-200',
          'dark:from-gray-700',
          'dark:via-gray-600',
          'dark:to-gray-700',
          'animate-[shimmer_2s_ease-in-out_infinite]',
        ],
        // Success state loading for confirmed transactions
        success: ['from-green-100', 'to-green-200', 'dark:from-green-900/30', 'dark:to-green-800/30'],
        // Warning state loading for pending transactions
        warning: ['from-amber-100', 'to-amber-200', 'dark:from-amber-900/30', 'dark:to-amber-800/30'],
        // Error state loading for failed operations
        error: ['from-red-100', 'to-red-200', 'dark:from-red-900/30', 'dark:to-red-800/30'],
      },
      size: {
        // Text sizes
        text: ['h-4'],
        caption: ['h-3'],
        small: ['h-5'],
        base: ['h-6'],
        large: ['h-8'],
        title: ['h-10'],

        // Web3 specific sizes
        address: ['h-5', 'w-32'], // Wallet address skeleton
        hash: ['h-4', 'w-20'], // Transaction hash skeleton
        amount: ['h-6', 'w-24'], // Token amount skeleton
        balance: ['h-8', 'w-28'], // Balance display skeleton

        // Component sizes
        button: ['h-10', 'w-24'],
        badge: ['h-6', 'w-16'],
        avatar: ['h-10', 'w-10', 'rounded-full'],
        card: ['h-32', 'w-full'],
        input: ['h-12', 'w-full'],
      },
      animation: {
        // Standard pulse animation
        pulse: ['animate-pulse'],
        // Slower pulse for background elements
        slow: ['animate-[pulse_2s_ease-in-out_infinite]'],
        // Shimmer effect for interactive elements
        shimmer: ['animate-[shimmer_2s_ease-in-out_infinite]'],
        // No animation for static placeholders
        none: ['animate-none'],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'text',
      animation: 'pulse',
    },
  },
)
