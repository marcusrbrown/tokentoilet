> **⚠️ ARCHIVED — Superseded post-v1.0 vision.** This document describes the original multi-chain / charity / NFT / Fountain product vision, most of which was intentionally deferred when the MVP was rebaselined to a single-chain (Sepolia) ERC-20 burn-address disposal flow. It is retained for historical reference and future roadmap planning only. For current scope, see [`docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md`](../../brainstorms/2026-04-16-mvp-rebaseline-requirements.md).

# RFC-008: Animations & UX Polish

## Summary

This RFC defines the animation system for Token Toilet, including the signature flush animation, success celebrations, and micro-interactions that create a cohesive, delightful user experience. The implementation prioritizes performance (60fps), accessibility (prefers-reduced-motion), and mobile optimization.

## Features Addressed

| Feature ID | Feature Name | Priority | Phase |
|------------|--------------|----------|-------|
| F7.1 | Flush Animation | Should Have | 3 |
| F7.2 | Success Celebration | Should Have | 3 |
| - | Loading States | Must Have | 2 |
| - | Micro-interactions | Should Have | 3 |

## Dependencies

### Requires
- RFC-007: Token Disposal Flow (animation triggers from disposal events)
- RFC-006: Transaction Infrastructure (transaction status for animation states)

### Required By
- None (terminal feature)

## Technical Specification

### Animation Library Selection

Use **Framer Motion** for complex animations with CSS fallbacks for simpler states:

```typescript
// lib/animations/config.ts
export const animationConfig = {
  // Respect user preferences
  reducedMotion: typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false,
  
  // Performance thresholds
  targetFps: 60,
  maxAnimatedElements: 20, // Prevent performance degradation
  
  // Duration constants (in seconds)
  durations: {
    flush: 2.5,
    celebration: 1.5,
    microInteraction: 0.2,
    stateTransition: 0.3,
  },
} as const

export type AnimationDuration = keyof typeof animationConfig.durations
```

### 1. Flush Animation System

The signature animation where tokens spiral down a drain:

```typescript
// components/animations/flush-animation.tsx
'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useCallback, useMemo } from 'react'
import type { TokenInfo } from '@/lib/web3/token-metadata'

interface FlushAnimationProps {
  tokens: TokenInfo[]
  isActive: boolean
  onComplete: () => void
}

export function FlushAnimation({ tokens, isActive, onComplete }: FlushAnimationProps) {
  const shouldReduceMotion = useReducedMotion()
  
  // Generate spiral paths for each token
  const tokenPaths = useMemo(() => 
    tokens.slice(0, 20).map((token, index) => ({
      token,
      delay: index * 0.1,
      // Spiral calculation with randomized offset
      spiralOffset: Math.random() * 360,
      spiralRadius: 100 + Math.random() * 50,
    })),
    [tokens]
  )
  
  const handleAnimationComplete = useCallback(() => {
    onComplete()
  }, [onComplete])
  
  if (shouldReduceMotion) {
    return (
      <ReducedMotionFlush 
        tokens={tokens} 
        isActive={isActive} 
        onComplete={onComplete} 
      />
    )
  }
  
  return (
    <div className="flush-container relative w-full h-96 overflow-hidden">
      {/* Drain visual */}
      <motion.div
        className="drain absolute bottom-0 left-1/2 -translate-x-1/2"
        animate={isActive ? { scale: [1, 1.2, 1], rotate: 360 } : {}}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
      >
        <DrainVisual />
      </motion.div>
      
      {/* Water swirl effect */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="water-swirl absolute inset-0"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.6, rotate: 720 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: 'easeIn' }}
          >
            <WaterSwirlSVG />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Animated tokens */}
      <AnimatePresence onExitComplete={handleAnimationComplete}>
        {isActive && tokenPaths.map(({ token, delay, spiralOffset, spiralRadius }) => (
          <motion.div
            key={token.address}
            className="token-item absolute"
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 1, 
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: [0, spiralRadius * Math.cos(spiralOffset), 0],
              y: [0, spiralRadius * Math.sin(spiralOffset), 300],
              scale: [1, 0.8, 0],
              opacity: [1, 0.8, 0],
              rotate: [0, 360, 720],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2.5,
              delay,
              ease: [0.4, 0, 0.2, 1], // Custom easing for spiral effect
            }}
          >
            <TokenIcon token={token} size="md" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Reduced motion alternative - simple fade out
function ReducedMotionFlush({ tokens, isActive, onComplete }: FlushAnimationProps) {
  return (
    <div className="flush-container-reduced">
      <AnimatePresence onExitComplete={onComplete}>
        {isActive && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {tokens.map((token) => (
              <TokenIcon key={token.address} token={token} size="sm" />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {isActive && (
        <p className="text-center text-muted-foreground mt-4">
          Disposing {tokens.length} tokens...
        </p>
      )}
    </div>
  )
}
```

### 2. Success Celebration Animation

Confetti/particle burst on successful disposal:

```typescript
// components/animations/success-celebration.tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

interface SuccessCelebrationProps {
  isActive: boolean
  onComplete: () => void
  tokenCount: number
  variant?: 'confetti' | 'sparkle' | 'burst'
}

interface Particle {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  color: string
  delay: number
}

const CELEBRATION_COLORS = [
  'var(--color-violet-400)',
  'var(--color-violet-500)',
  'var(--color-fuchsia-400)',
  'var(--color-cyan-400)',
  'var(--color-emerald-400)',
]

export function SuccessCelebration({ 
  isActive, 
  onComplete, 
  tokenCount,
  variant = 'confetti' 
}: SuccessCelebrationProps) {
  const shouldReduceMotion = useReducedMotion()
  const [hasCompleted, setHasCompleted] = useState(false)
  
  // Scale particle count based on tokens disposed
  const particleCount = useMemo(() => 
    Math.min(50, 20 + tokenCount * 3),
    [tokenCount]
  )
  
  const particles = useMemo<Particle[]>(() => 
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      color: CELEBRATION_COLORS[i % CELEBRATION_COLORS.length],
      delay: Math.random() * 0.3,
    })),
    [particleCount]
  )
  
  useEffect(() => {
    if (isActive && !hasCompleted) {
      const timer = setTimeout(() => {
        setHasCompleted(true)
        onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isActive, hasCompleted, onComplete])
  
  if (!isActive || shouldReduceMotion) {
    // Reduced motion: simple checkmark animation
    if (isActive && shouldReduceMotion) {
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center"
        >
          <div className="rounded-full bg-emerald-500/20 p-4">
            <CheckIcon className="h-12 w-12 text-emerald-500" />
          </div>
        </motion.div>
      )
    }
    return null
  }
  
  return (
    <div className="celebration-container fixed inset-0 pointer-events-none z-50">
      {variant === 'confetti' && (
        <ConfettiParticles particles={particles} />
      )}
      {variant === 'sparkle' && (
        <SparkleParticles particles={particles} />
      )}
      {variant === 'burst' && (
        <BurstParticles particles={particles} />
      )}
      
      {/* Success message */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <span className="text-6xl">🚽</span>
          </motion.div>
          <p className="text-xl font-semibold text-foreground mt-2">
            Flushed!
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function ConfettiParticles({ particles }: { particles: Particle[] }) {
  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{ 
            backgroundColor: particle.color,
            left: `${particle.x}%`,
          }}
          initial={{ 
            y: -20, 
            rotate: 0, 
            opacity: 1,
            scale: particle.scale,
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: particle.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: particle.delay,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      ))}
    </>
  )
}

function SparkleParticles({ particles }: { particles: Particle[] }) {
  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, particle.scale, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.8,
            delay: particle.delay,
          }}
        >
          <SparkleIcon color={particle.color} />
        </motion.div>
      ))}
    </>
  )
}

function BurstParticles({ particles }: { particles: Particle[] }) {
  const centerX = 50
  const centerY = 50
  
  return (
    <>
      {particles.map((particle) => {
        const angle = (particle.id / particles.length) * Math.PI * 2
        const distance = 30 + Math.random() * 20
        
        return (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: particle.color,
              left: `${centerX}%`,
              top: `${centerY}%`,
            }}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, particle.scale, 0],
              x: Math.cos(angle) * distance * 10,
              y: Math.sin(angle) * distance * 10,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 1,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </>
  )
}
```

### 3. Animation Hooks

Custom hooks for managing animation state:

```typescript
// hooks/use-flush-animation.ts
'use client'

import { useState, useCallback } from 'react'
import type { TokenInfo } from '@/lib/web3/token-metadata'

type FlushPhase = 'idle' | 'preparing' | 'flushing' | 'celebrating' | 'complete'

interface UseFlushAnimationOptions {
  onFlushStart?: () => void
  onFlushComplete?: () => void
  onCelebrationComplete?: () => void
}

interface UseFlushAnimationReturn {
  phase: FlushPhase
  isAnimating: boolean
  startFlush: (tokens: TokenInfo[]) => void
  skipAnimation: () => void
  reset: () => void
}

export function useFlushAnimation(
  options: UseFlushAnimationOptions = {}
): UseFlushAnimationReturn {
  const [phase, setPhase] = useState<FlushPhase>('idle')
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  
  const { onFlushStart, onFlushComplete, onCelebrationComplete } = options
  
  const startFlush = useCallback((tokensToFlush: TokenInfo[]) => {
    setTokens(tokensToFlush)
    setPhase('preparing')
    
    // Short delay before animation starts
    setTimeout(() => {
      setPhase('flushing')
      onFlushStart?.()
    }, 300)
  }, [onFlushStart])
  
  const handleFlushComplete = useCallback(() => {
    setPhase('celebrating')
    onFlushComplete?.()
    
    // Celebration auto-completes
    setTimeout(() => {
      setPhase('complete')
      onCelebrationComplete?.()
    }, 1500)
  }, [onFlushComplete, onCelebrationComplete])
  
  const skipAnimation = useCallback(() => {
    setPhase('complete')
    onFlushComplete?.()
    onCelebrationComplete?.()
  }, [onFlushComplete, onCelebrationComplete])
  
  const reset = useCallback(() => {
    setPhase('idle')
    setTokens([])
  }, [])
  
  return {
    phase,
    isAnimating: phase !== 'idle' && phase !== 'complete',
    startFlush,
    skipAnimation,
    reset,
  }
}
```

```typescript
// hooks/use-reduced-motion.ts
'use client'

import { useState, useEffect } from 'react'

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  return reducedMotion
}
```

### 4. Micro-interactions

Button, card, and component micro-interactions:

```typescript
// lib/animations/variants.ts
import type { Variants } from 'framer-motion'

export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
  disabled: { opacity: 0.5, scale: 1 },
}

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  },
}

export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
}

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
}
```

```typescript
// components/ui/animated-button.tsx
'use client'

import { motion } from 'framer-motion'
import { forwardRef } from 'react'
import { Button, type ButtonProps } from './button'
import { buttonVariants } from '@/lib/animations/variants'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

const MotionButton = motion(Button)

export const AnimatedButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function AnimatedButton(props, ref) {
    const reducedMotion = useReducedMotion()
    
    if (reducedMotion) {
      return <Button ref={ref} {...props} />
    }
    
    return (
      <MotionButton
        ref={ref}
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        {...props}
      />
    )
  }
)
```

### 5. Loading State Animations

Skeleton and loading animations:

```typescript
// components/ui/animated-skeleton.tsx
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface AnimatedSkeletonProps {
  className?: string
  variant?: 'pulse' | 'shimmer' | 'wave'
}

export function AnimatedSkeleton({ 
  className, 
  variant = 'shimmer' 
}: AnimatedSkeletonProps) {
  const reducedMotion = useReducedMotion()
  
  if (reducedMotion) {
    return (
      <div 
        className={cn(
          'bg-muted rounded-md',
          className
        )} 
      />
    )
  }
  
  if (variant === 'shimmer') {
    return (
      <div 
        className={cn(
          'relative overflow-hidden bg-muted rounded-md',
          className
        )}
      >
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ translateX: ['−100%', '100%'] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    )
  }
  
  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn('bg-muted rounded-md', className)}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    )
  }
  
  // Wave variant
  return (
    <motion.div
      className={cn('bg-muted rounded-md', className)}
      animate={{ 
        background: [
          'hsl(var(--muted))',
          'hsl(var(--muted) / 0.7)',
          'hsl(var(--muted))',
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}
```

### 6. Performance Optimization

```typescript
// lib/animations/performance.ts
'use client'

/**
 * Animation performance utilities
 */

// Check if device can handle heavy animations
export function canHandleHeavyAnimations(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false
  }
  
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2
  if (cores < 4) return false
  
  // Check device memory (if available)
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (memory && memory < 4) return false
  
  return true
}

// Limit particle count based on device capability
export function getOptimalParticleCount(baseCount: number): number {
  if (!canHandleHeavyAnimations()) {
    return Math.min(baseCount, 10)
  }
  return baseCount
}

// RequestAnimationFrame throttler for custom animations
export function createAnimationLoop(
  callback: (deltaTime: number) => boolean // Return false to stop
): { start: () => void; stop: () => void } {
  let animationId: number | null = null
  let lastTime = 0
  
  const loop = (currentTime: number) => {
    const deltaTime = currentTime - lastTime
    lastTime = currentTime
    
    const shouldContinue = callback(deltaTime)
    
    if (shouldContinue) {
      animationId = requestAnimationFrame(loop)
    }
  }
  
  return {
    start: () => {
      lastTime = performance.now()
      animationId = requestAnimationFrame(loop)
    },
    stop: () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    },
  }
}
```

## File Structure

```
components/
├── animations/
│   ├── flush-animation.tsx       # Main flush animation
│   ├── success-celebration.tsx   # Confetti/sparkle celebration
│   ├── drain-visual.tsx          # Drain SVG component
│   ├── water-swirl.tsx           # Water effect SVG
│   ├── particles/
│   │   ├── confetti.tsx
│   │   ├── sparkle.tsx
│   │   └── burst.tsx
│   └── index.ts
├── ui/
│   ├── animated-button.tsx       # Button with micro-interactions
│   ├── animated-card.tsx         # Card with enter/exit animations
│   └── animated-skeleton.tsx     # Loading skeleton animations

hooks/
├── use-flush-animation.ts        # Flush animation state management
└── use-reduced-motion.ts         # Accessibility hook

lib/
└── animations/
    ├── config.ts                 # Animation configuration
    ├── variants.ts               # Framer Motion variants
    ├── performance.ts            # Performance utilities
    └── index.ts
```

## Acceptance Criteria

### F7.1 Flush Animation
- [ ] Animation duration is 2-3 seconds
- [ ] Maintains 60fps on target devices
- [ ] Tokens visually spiral down drain
- [ ] Supports prefers-reduced-motion with simple fade alternative
- [ ] Works on mobile devices without frame drops
- [ ] Animation can be skipped

### F7.2 Success Celebration
- [ ] Celebration triggers after successful disposal
- [ ] Duration is 1-2 seconds
- [ ] Particle count scales with tokens disposed
- [ ] Multiple variants available (confetti, sparkle, burst)
- [ ] Respects prefers-reduced-motion

### Performance Requirements
- [ ] No layout shifts during animations
- [ ] GPU-accelerated transforms only (no animating width/height)
- [ ] Animations don't block main thread
- [ ] Memory is released after animation completes
- [ ] Works in Safari, Chrome, Firefox, Edge

### Accessibility Requirements
- [ ] All animations respect prefers-reduced-motion
- [ ] Reduced motion alternatives provide equivalent feedback
- [ ] No flashing effects (WCAG 2.3.1)
- [ ] Animation state is announced to screen readers

## Testing Strategy

### Unit Tests
```typescript
// components/animations/__tests__/flush-animation.test.tsx
describe('FlushAnimation', () => {
  it('renders without crashing', () => {
    render(<FlushAnimation tokens={[]} isActive={false} onComplete={vi.fn()} />)
  })
  
  it('respects reduced motion preference', () => {
    mockMatchMedia({ matches: true }) // prefers-reduced-motion: reduce
    render(<FlushAnimation tokens={mockTokens} isActive={true} onComplete={vi.fn()} />)
    expect(screen.getByText(/disposing/i)).toBeInTheDocument()
  })
  
  it('calls onComplete after animation', async () => {
    const onComplete = vi.fn()
    render(<FlushAnimation tokens={mockTokens} isActive={true} onComplete={onComplete} />)
    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 3000 })
  })
  
  it('limits token count to prevent performance issues', () => {
    const manyTokens = Array.from({ length: 50 }, (_, i) => createMockToken(i))
    render(<FlushAnimation tokens={manyTokens} isActive={true} onComplete={vi.fn()} />)
    // Should only render 20 animated tokens
    expect(screen.getAllByTestId('token-item')).toHaveLength(20)
  })
})

describe('useFlushAnimation', () => {
  it('transitions through phases correctly', () => {
    const { result } = renderHook(() => useFlushAnimation())
    
    expect(result.current.phase).toBe('idle')
    
    act(() => result.current.startFlush(mockTokens))
    expect(result.current.phase).toBe('preparing')
    
    // Wait for phase transitions...
  })
  
  it('allows skipping animation', () => {
    const callbacks = { onFlushComplete: vi.fn(), onCelebrationComplete: vi.fn() }
    const { result } = renderHook(() => useFlushAnimation(callbacks))
    
    act(() => result.current.startFlush(mockTokens))
    act(() => result.current.skipAnimation())
    
    expect(callbacks.onFlushComplete).toHaveBeenCalled()
    expect(callbacks.onCelebrationComplete).toHaveBeenCalled()
  })
})
```

### Visual Regression Tests
```typescript
// Storybook stories with Chromatic
export default {
  title: 'Animations/FlushAnimation',
  component: FlushAnimation,
  parameters: {
    chromatic: { 
      pauseAnimationAtEnd: true,
      delay: 3000, // Capture at end of animation
    },
  },
}

export const Default: Story = {
  args: {
    tokens: mockTokens,
    isActive: true,
    onComplete: action('complete'),
  },
}

export const ReducedMotion: Story = {
  args: { ...Default.args },
  parameters: {
    chromatic: { prefersReducedMotion: 'reduce' },
  },
}
```

### Performance Tests
```typescript
// tests/performance/animations.bench.tsx
describe('Animation Performance', () => {
  bench('flush animation maintains 60fps', async () => {
    const frames: number[] = []
    let lastTime = performance.now()
    
    const measureFrame = () => {
      const now = performance.now()
      frames.push(now - lastTime)
      lastTime = now
    }
    
    // Run animation and measure frame times
    render(<FlushAnimation tokens={mockTokens} isActive={true} onComplete={vi.fn()} />)
    
    // Measure for 2.5 seconds
    for (let i = 0; i < 150; i++) {
      await new Promise(resolve => requestAnimationFrame(resolve))
      measureFrame()
    }
    
    const avgFrameTime = frames.reduce((a, b) => a + b, 0) / frames.length
    expect(avgFrameTime).toBeLessThan(17) // 60fps = 16.67ms per frame
  })
})
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Animation frame rate | ≥60fps | Performance profiling |
| Animation completion rate | 100% | No dropped/stuck animations |
| Reduced motion coverage | 100% | All animations have alternatives |
| Mobile performance | ≥30fps | Device testing |
| User satisfaction | ≥4.0/5.0 | User feedback surveys |
| Lighthouse performance | ≥90 | Lighthouse audit |

## Implementation Notes

### Dependencies to Add
```json
{
  "dependencies": {
    "framer-motion": "^11.0.0"
  }
}
```

### CSS Requirements
```css
/* globals.css additions */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome for Android 90+
