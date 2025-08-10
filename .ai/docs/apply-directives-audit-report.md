# @apply Directives Audit Report

**Audit Date**: August 10, 2025
**Migration Phase**: Phase 1 - Backup and Preparation
**Total @apply Directives**: 64
**File**: `app/globals.css`

## Summary by Component Category

### 1. Base & Focus Styles (4 directives)
| Line | Component | @apply Directive |
|------|-----------|------------------|
| 170 | `body` (light mode) | `bg-background text-foreground` |
| 178 | `*:focus-visible` (light) | `outline-none ring-2 ring-violet-600 ring-offset-2 ring-offset-background` |
| 217 | `body` (dark mode) | `bg-background text-foreground` |
| 225 | `*:focus-visible` (dark) | `outline-none ring-2 ring-violet-600 ring-offset-2 ring-offset-background` |

### 2. Scrollbar Styles (6 directives)
| Line | Component | @apply Directive |
|------|-----------|------------------|
| 200 | `::-webkit-scrollbar-track` (light) | `bg-gray-100 dark:bg-gray-800` |
| 204 | `::-webkit-scrollbar-thumb` (light) | `bg-gray-300 dark:bg-gray-600 rounded-full` |
| 208 | `::-webkit-scrollbar-thumb:hover` (light) | `bg-gray-400 dark:bg-gray-500` |
| 247 | `::-webkit-scrollbar-track` (dark) | `bg-gray-100 dark:bg-gray-800` |
| 251 | `::-webkit-scrollbar-thumb` (dark) | `bg-gray-300 dark:bg-gray-600 rounded-full` |
| 255 | `::-webkit-scrollbar-thumb:hover` (dark) | `bg-gray-400 dark:bg-gray-500` |

### 3. Glass Container Utility (3 directives)
| Line | Component | @apply Directive |
|------|-----------|------------------|
| 262 | `.glass-container` (light) | `backdrop-blur-md` |
| 308 | `.glass-container` (dark - btn-secondary) | `backdrop-blur-md` |
| 333 | `.glass-container` (dark - card) | `backdrop-blur-md` |

### 4. Address Display Component (4 directives)
| Line | Component | @apply Directive |
|------|-----------|------------------|
| 274 | `.address-display` | `font-mono text-sm font-medium tracking-wide` |
| 275 | `.address-display` | `px-2 py-1 rounded-md` |
| 276 | `.address-display` | `bg-gray-100 dark:bg-gray-800` |
| 277 | `.address-display` | `border border-gray-200 dark:border-gray-700` |

### 5. Status Indicator Components (4 directives)
| Line | Component | @apply Directive |
|------|-----------|------------------|
| 282 | `.status-connected` | `text-green-600 dark:text-green-400` |
| 286 | `.status-connecting` | `text-amber-600 dark:text-amber-400` |
| 290 | `.status-error` | `text-red-600 dark:text-red-400` |
| 294 | `.status-pending` | `text-amber-600 dark:text-amber-400 animate-pulse` |

### 6. Button Components (17 directives)

#### .btn-primary (7 directives)
| Line | @apply Directive |
|------|------------------|
| 299 | `bg-violet-600 hover:bg-violet-700 active:bg-violet-800` |
| 300 | `text-violet-50 font-medium` |
| 301 | `px-4 py-2 rounded-lg` |
| 302 | `transition-colors duration-150` |
| 303 | `shadow-sm hover:shadow-md active:shadow-lg` |
| 304 | `focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2` |

#### .btn-secondary (6 directives)
| Line | @apply Directive |
|------|------------------|
| 308 | `backdrop-blur-md` |
| 309 | `text-gray-700 dark:text-gray-300 font-medium` |
| 310 | `px-4 py-2 rounded-lg` |
| 311 | `transition-all duration-150` |
| 312 | `hover:shadow-md active:shadow-lg` |
| 313 | `focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2` |

#### .btn-ghost (4 directives)
| Line | @apply Directive |
|------|------------------|
| 324 | `text-gray-700 dark:text-gray-300 font-medium` |
| 325 | `px-4 py-2 rounded-lg` |
| 326 | `transition-colors duration-150` |
| 327 | `hover:bg-gray-100 dark:hover:bg-gray-800` |
| 328 | `focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2` |

### 7. Card Components (5 directives)
| Line | Component | @apply Directive |
|------|-----------|------------------|
| 333 | `.card` | `backdrop-blur-md` |
| 334 | `.card` | `rounded-2xl p-6` |
| 335 | `.card` | `shadow-sm hover:shadow-md` |
| 336 | `.card` | `transition-all duration-300` |
| 347 | `.card-hover` | `hover:scale-105 hover:shadow-lg` |

### 8. Form Components (10 directives)

#### .form-input (7 directives)
| Line | @apply Directive |
|------|------------------|
| 352 | `w-full px-3 py-2 rounded-lg` |
| 353 | `bg-white dark:bg-gray-900` |
| 354 | `border border-gray-300 dark:border-gray-700` |
| 355 | `text-gray-900 dark:text-gray-100` |
| 356 | `placeholder-gray-500 dark:placeholder-gray-400` |
| 357 | `transition-colors duration-150` |
| 358 | `focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent` |

#### .form-label (3 directives)
| Line | @apply Directive |
|------|------------------|
| 362 | `block text-sm font-medium` |
| 363 | `text-gray-700 dark:text-gray-300` |
| 364 | `mb-1` |

#### .form-error (2 directives)
| Line | @apply Directive |
|------|------------------|
| 368 | `text-sm text-red-600 dark:text-red-400` |
| 369 | `mt-1` |

### 9. Navigation Components (4 directives)
| Line | Component | @apply Directive |
|------|-----------|------------------|
| 374 | `.nav-link` | `text-gray-700 dark:text-gray-300 font-medium` |
| 375 | `.nav-link` | `transition-colors duration-150` |
| 376 | `.nav-link` | `hover:text-violet-600 dark:hover:text-violet-400` |
| 377 | `.nav-link` | `focus-visible:text-violet-600 dark:focus-visible:text-violet-400` |
| 381 | `.nav-link.active` | `text-violet-600 dark:text-violet-400` |

### 10. Loading & Animation Components (5 directives)
| Line | Component | @apply Directive |
|------|-----------|------------------|
| 386 | `.loading-spinner` | `animate-spin rounded-full border-2 border-gray-300` |
| 387 | `.loading-spinner` | `border-t-violet-600` |
| 391 | `.loading-skeleton` | `animate-pulse bg-gray-200 dark:bg-gray-700 rounded` |
| 396 | `.text-gradient` | `bg-gradient-to-r from-violet-600 to-blue-600` |
| 397 | `.text-gradient` | `bg-clip-text text-transparent` |

### 11. Utility Components (1 directive)
| Line | Component | @apply Directive |
|------|-----------|------------------|
| 417 | `.font-mono-address` | `font-mono text-sm tracking-wide` |

## Migration Priority Analysis

### High Priority (34 directives) - Core Interactive Components
1. **Button Components** (17 directives) - Critical for user interaction
2. **Form Components** (10 directives) - Essential for user input
3. **Navigation Components** (5 directives) - Core site navigation
4. **Status Components** (4 directives) - Web3 feedback

### Medium Priority (18 directives) - Display & Layout
5. **Card Components** (5 directives) - Layout structure
6. **Address Display** (4 directives) - Web3 functionality
7. **Loading Components** (5 directives) - User feedback
8. **Glass Container** (3 directives) - Design system utility
9. **Utility** (1 directive) - Helper class

### Low Priority (12 directives) - Browser/Base Styles
10. **Scrollbar Styles** (6 directives) - Browser customization
11. **Focus Styles** (4 directives) - Global accessibility
12. **Base Styles** (2 directives) - Document defaults

## Conversion Strategy

### Phase 3 Approach
1. **Start with High Priority** components (user-facing interactions)
2. **Convert by component group** to maintain consistency
3. **Test after each component** to ensure visual parity
4. **Use CSS custom properties** from existing design tokens
5. **Preserve responsive behavior** with proper breakpoint handling

### CSS Custom Property Mapping
- Colors: Use existing `--color-*` variables
- Spacing: Use existing `--spacing-*` and Tailwind defaults
- Shadows: Use existing `--shadow-*` variables
- Transitions: Define new `--duration-*` and `--timing-*` variables

**Total Directives to Convert**: 64
**Estimated Conversion Time**: 2-3 weeks (systematic approach)
**Risk Level**: Medium (complex components with multiple states)
