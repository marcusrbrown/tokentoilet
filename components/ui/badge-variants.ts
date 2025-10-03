import {cva} from 'class-variance-authority'

/**
 * Badge component variants using class-variance-authority
 * Provides consistent styling for connection states and network indicators
 */
export const badgeVariants = cva(
  // Base classes applied to all badges
  [
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-full',
    'text-xs',
    'font-semibold',
    'uppercase',
    'tracking-wider',
    'transition-all',
    'duration-150',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        // Default variant with neutral styling
        default: ['bg-gray-100', 'text-gray-800', 'dark:bg-gray-800', 'dark:text-gray-200'],
        // Web3 connection state variants
        connected: [
          'bg-green-100',
          'text-green-800',
          'shadow-[0_1px_2px_0_rgb(34_197_94_/_0.1)]',
          'dark:bg-green-900/30',
          'dark:text-green-400',
          'dark:shadow-[0_1px_2px_0_rgb(34_197_94_/_0.2)]',
        ],
        connecting: [
          'bg-yellow-100',
          'text-yellow-800',
          'shadow-[0_1px_2px_0_rgb(245_158_11_/_0.1)]',
          'animate-pulse',
          'dark:bg-yellow-900/30',
          'dark:text-yellow-400',
          'dark:shadow-[0_1px_2px_0_rgb(245_158_11_/_0.2)]',
        ],
        disconnected: [
          'bg-red-100',
          'text-red-800',
          'shadow-[0_1px_2px_0_rgb(239_68_68_/_0.1)]',
          'dark:bg-red-900/30',
          'dark:text-red-400',
          'dark:shadow-[0_1px_2px_0_rgb(239_68_68_/_0.2)]',
        ],
        error: [
          'bg-red-100',
          'text-red-800',
          'shadow-[0_1px_2px_0_rgb(239_68_68_/_0.1)]',
          'border',
          'border-red-200',
          'dark:bg-red-900/30',
          'dark:text-red-400',
          'dark:border-red-800',
          'dark:shadow-[0_1px_2px_0_rgb(239_68_68_/_0.2)]',
        ],
        // Transaction state variants
        pending: [
          'bg-orange-100',
          'text-orange-800',
          'shadow-[0_1px_2px_0_rgb(245_158_11_/_0.1)]',
          'animate-pulse',
          'dark:bg-orange-900/30',
          'dark:text-orange-400',
          'dark:shadow-[0_1px_2px_0_rgb(245_158_11_/_0.2)]',
        ],
        confirmed: [
          'bg-green-100',
          'text-green-800',
          'shadow-[0_1px_2px_0_rgb(34_197_94_/_0.1)]',
          'dark:bg-green-900/30',
          'dark:text-green-400',
          'dark:shadow-[0_1px_2px_0_rgb(34_197_94_/_0.2)]',
        ],
        failed: [
          'bg-red-100',
          'text-red-800',
          'shadow-[0_1px_2px_0_rgb(239_68_68_/_0.1)]',
          'border',
          'border-red-200',
          'dark:bg-red-900/30',
          'dark:text-red-400',
          'dark:border-red-800',
          'dark:shadow-[0_1px_2px_0_rgb(239_68_68_/_0.2)]',
        ],
        // Network indicator variants
        mainnet: [
          'bg-blue-100',
          'text-blue-800',
          'shadow-[0_1px_2px_0_rgb(59_130_246_/_0.1)]',
          'dark:bg-blue-900/30',
          'dark:text-blue-400',
          'dark:shadow-[0_1px_2px_0_rgb(59_130_246_/_0.2)]',
        ],
        testnet: [
          'bg-amber-100',
          'text-amber-800',
          'shadow-[0_1px_2px_0_rgb(245_158_11_/_0.1)]',
          'dark:bg-amber-900/30',
          'dark:text-amber-400',
          'dark:shadow-[0_1px_2px_0_rgb(245_158_11_/_0.2)]',
        ],
        polygon: [
          'bg-purple-100',
          'text-purple-800',
          'shadow-[0_1px_2px_0_rgb(147_51_234_/_0.1)]',
          'dark:bg-purple-900/30',
          'dark:text-purple-400',
          'dark:shadow-[0_1px_2px_0_rgb(147_51_234_/_0.2)]',
        ],
        arbitrum: [
          'bg-sky-100',
          'text-sky-800',
          'shadow-[0_1px_2px_0_rgb(14_165_233_/_0.1)]',
          'dark:bg-sky-900/30',
          'dark:text-sky-400',
          'dark:shadow-[0_1px_2px_0_rgb(14_165_233_/_0.2)]',
        ],
        optimism: [
          'bg-rose-100',
          'text-rose-800',
          'shadow-[0_1px_2px_0_rgb(244_63_94_/_0.1)]',
          'dark:bg-rose-900/30',
          'dark:text-rose-400',
          'dark:shadow-[0_1px_2px_0_rgb(244_63_94_/_0.2)]',
        ],
        // Violet brand variant
        violet: [
          'bg-violet-100',
          'text-violet-800',
          'shadow-[0_1px_2px_0_rgb(139_92_246_/_0.1)]',
          'dark:bg-violet-900/30',
          'dark:text-violet-400',
          'dark:shadow-[0_1px_2px_0_rgb(139_92_246_/_0.2)]',
        ],
      },
      size: {
        sm: ['px-2', 'py-0.5', 'text-xs', 'h-5', 'min-w-[1.25rem]'],
        md: ['px-3', 'py-1', 'text-xs', 'h-6', 'min-w-[1.5rem]'],
        lg: ['px-3.5', 'py-1.5', 'text-sm', 'h-7', 'min-w-[1.75rem]'],
      },
      withIcon: {
        true: ['gap-1.5'],
        false: [],
      },
      withDot: {
        true: ['pl-1.5'],
        false: [],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      withIcon: false,
      withDot: false,
    },
  },
)
