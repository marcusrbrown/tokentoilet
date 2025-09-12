import {cn} from '@/lib/utils'
import {cva, type VariantProps} from 'class-variance-authority'
import React from 'react'

/**
 * Card component variants using class-variance-authority
 * Provides glass morphism effects and elevation levels for consistent card styling
 */
const cardVariants = cva(
  // Base classes applied to all cards
  ['rounded-xl', 'border', 'transition-all', 'duration-200', 'ease-in-out'],
  {
    variants: {
      variant: {
        // Default glass morphism card with subtle background
        default: [
          'bg-white/80',
          'backdrop-blur-md',
          'border-white/20',
          'dark:bg-gray-900/80',
          'dark:border-gray-600/20',
        ],
        // Solid card without glass effect
        solid: ['bg-white', 'border-gray-200', 'dark:bg-gray-900', 'dark:border-gray-700'],
        // Ghost card with minimal styling
        ghost: ['bg-transparent', 'border-transparent', 'hover:bg-gray-50/50', 'dark:hover:bg-gray-800/50'],
        // Elevated card with stronger glass effect
        elevated: [
          'bg-white/60',
          'backdrop-blur-lg',
          'border-white/30',
          'dark:bg-gray-800/60',
          'dark:border-gray-500/30',
        ],
        // Web3 variant with violet accent
        web3: [
          'bg-white/80',
          'backdrop-blur-md',
          'border-violet-200/50',
          'dark:bg-gray-900/80',
          'dark:border-violet-500/30',
        ],
      },
      elevation: {
        // Flat - no shadow (flush with background)
        flat: ['shadow-none'],
        // Low - subtle shadow for slight elevation
        low: ['shadow-sm', 'hover:shadow-md'],
        // Medium - moderate shadow for cards
        medium: ['shadow-md', 'hover:shadow-lg'],
        // High - pronounced shadow for important content
        high: ['shadow-lg', 'hover:shadow-xl'],
        // Float - dramatic shadow for overlays
        float: ['shadow-xl', 'hover:shadow-2xl'],
        // Glow - violet-tinted shadow for Web3 components
        glow: [
          'shadow-lg',
          'shadow-violet-500/10',
          'hover:shadow-xl',
          'hover:shadow-violet-500/20',
          'dark:shadow-violet-500/20',
          'dark:hover:shadow-violet-500/30',
        ],
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      interactive: {
        none: '',
        // Subtle interaction for clickable cards
        subtle: [
          'cursor-pointer',
          'hover:scale-[1.02]',
          'active:scale-[0.98]',
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-violet-500/50',
          'focus:ring-offset-2',
          'focus:ring-offset-white',
          'dark:focus:ring-offset-gray-900',
        ],
        // Enhanced interaction for important cards
        enhanced: [
          'cursor-pointer',
          'hover:scale-105',
          'active:scale-95',
          'hover:border-violet-300/50',
          'dark:hover:border-violet-400/50',
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-violet-500',
          'focus:ring-offset-2',
          'focus:ring-offset-white',
          'dark:focus:ring-offset-gray-900',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
      elevation: 'low',
      padding: 'md',
      interactive: 'none',
    },
  },
)

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  /**
   * Whether the card should be rendered as a different HTML element
   * Useful for semantic markup (article, section, etc.)
   */
  as?: React.ElementType
}

/**
 * Card component with glass morphism effects and elevation levels
 *
 * Provides a flexible container component that supports various styling variants,
 * elevation levels, and interaction states. Built with accessibility in mind and
 * optimized for Web3 DeFi interfaces.
 *
 * @example
 * ```tsx
 * // Basic card
 * <Card>Content here</Card>
 *
 * // Elevated card with Web3 styling
 * <Card variant="web3" elevation="high" interactive="subtle">
 *   <CardHeader>
 *     <CardTitle>Wallet Connection</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     Connect your wallet to continue
 *   </CardContent>
 * </Card>
 *
 * // Clickable card with enhanced interaction
 * <Card interactive="enhanced" onClick={handleClick}>
 *   Interactive card content
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({className, variant, elevation, padding, interactive, as: component = 'div', ...props}, ref) => {
    const Component = component
    return (
      <Component
        className={cn(cardVariants({variant, elevation, padding, interactive}), className)}
        ref={ref}
        {...props}
      />
    )
  },
)
Card.displayName = 'Card'

/**
 * CardHeader component for card titles and descriptions
 * Provides consistent spacing and typography for card headers
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({className, ...props}, ref) => {
    return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  },
)
CardHeader.displayName = 'CardHeader'

/**
 * CardTitle component for card titles
 * Uses semantic heading with appropriate typography
 */
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({className, ...props}, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-50', className)}
        {...props}
      />
    )
  },
)
CardTitle.displayName = 'CardTitle'

/**
 * CardDescription component for card descriptions
 * Provides muted text styling for card subtitles and descriptions
 */
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({className, ...props}, ref) => {
    return <p ref={ref} className={cn('text-sm text-gray-600 dark:text-gray-400', className)} {...props} />
  },
)
CardDescription.displayName = 'CardDescription'

/**
 * CardContent component for main card content
 * Provides consistent padding for card body content
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({className, ...props}, ref) => {
    return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  },
)
CardContent.displayName = 'CardContent'

/**
 * CardFooter component for card actions and footer content
 * Provides consistent spacing for card footer elements
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({className, ...props}, ref) => {
    return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  },
)
CardFooter.displayName = 'CardFooter'

export {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle}
