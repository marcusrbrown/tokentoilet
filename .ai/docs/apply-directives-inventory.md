# Remaining @apply Directives Migration Inventory

**Date**: August 9, 2025
**Status**: Identified for future migration
**Total Count**: 64 @apply directives in CSS files

## Overview

Following the critical Tailwind CSS v4 fix, there are 64 remaining `@apply` directives in `app/globals.css` that should be migrated to standard CSS properties for full Tailwind v4 compatibility. These directives are currently functional but represent technical debt for the complete v4 migration.

## File Inventory

### app/globals.css - 64 @apply directives

#### Base Styles (2 directives)
- Line 170: `@apply bg-background text-foreground;`
- Line 217: `@apply bg-background text-foreground;`

#### Focus Styles (4 directives)
- Line 178: `@apply outline-none ring-2 ring-violet-600 ring-offset-2 ring-offset-background;`
- Line 225: `@apply outline-none ring-2 ring-violet-600 ring-offset-2 ring-offset-background;`
- Line 304: `@apply focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2;`
- Line 313: `@apply focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2;`
- Line 328: `@apply focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2;`
- Line 358: `@apply focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent;`

#### Scrollbar Styles (6 directives)
- Line 200: `@apply bg-gray-100 dark:bg-gray-800;`
- Line 204: `@apply bg-gray-300 dark:bg-gray-600 rounded-full;`
- Line 208: `@apply bg-gray-400 dark:bg-gray-500;`
- Line 247: `@apply bg-gray-100 dark:bg-gray-800;`
- Line 251: `@apply bg-gray-300 dark:bg-gray-600 rounded-full;`
- Line 255: `@apply bg-gray-400 dark:bg-gray-500;`

#### Glass Container Components (3 directives)
- Line 262: `@apply backdrop-blur-md;`
- Line 308: `@apply backdrop-blur-md;`
- Line 333: `@apply backdrop-blur-md;`

#### Address Display Component (4 directives)
- Line 274: `@apply font-mono text-sm font-medium tracking-wide;`
- Line 275: `@apply px-2 py-1 rounded-md;`
- Line 276: `@apply bg-gray-100 dark:bg-gray-800;`
- Line 277: `@apply border border-gray-200 dark:border-gray-700;`

#### Status Components (4 directives)
- Line 282: `@apply text-green-600 dark:text-green-400;`
- Line 286: `@apply text-amber-600 dark:text-amber-400;`
- Line 290: `@apply text-red-600 dark:text-red-400;`
- Line 294: `@apply text-amber-600 dark:text-amber-400 animate-pulse;`

#### Button Components
##### .btn-primary (7 directives)
- Line 299: `@apply bg-violet-600 hover:bg-violet-700 active:bg-violet-800;`
- Line 300: `@apply text-violet-50 font-medium;`
- Line 301: `@apply px-4 py-2 rounded-lg;`
- Line 302: `@apply transition-colors duration-150;`
- Line 303: `@apply shadow-sm hover:shadow-md active:shadow-lg;`
- Line 304: `@apply focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2;`

##### .btn-secondary (6 directives)
- Line 308: `@apply backdrop-blur-md;`
- Line 309: `@apply text-gray-700 dark:text-gray-300 font-medium;`
- Line 310: `@apply px-4 py-2 rounded-lg;`
- Line 311: `@apply transition-all duration-150;`
- Line 312: `@apply hover:shadow-md active:shadow-lg;`
- Line 313: `@apply focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2;`

##### .btn-ghost (4 directives)
- Line 324: `@apply text-gray-700 dark:text-gray-300 font-medium;`
- Line 325: `@apply px-4 py-2 rounded-lg;`
- Line 326: `@apply transition-colors duration-150;`
- Line 327: `@apply hover:bg-gray-100 dark:hover:bg-gray-800;`
- Line 328: `@apply focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2;`

#### Card Components (5 directives)
- Line 333: `@apply backdrop-blur-md;`
- Line 334: `@apply rounded-2xl p-6;`
- Line 335: `@apply shadow-sm hover:shadow-md;`
- Line 336: `@apply transition-all duration-300;`
- Line 347: `@apply hover:scale-105 hover:shadow-lg;`

#### Form Components
##### .form-input (7 directives)
- Line 352: `@apply w-full px-3 py-2 rounded-lg;`
- Line 353: `@apply bg-white dark:bg-gray-900;`
- Line 354: `@apply border border-gray-300 dark:border-gray-700;`
- Line 355: `@apply text-gray-900 dark:text-gray-100;`
- Line 356: `@apply placeholder-gray-500 dark:placeholder-gray-400;`
- Line 357: `@apply transition-colors duration-150;`
- Line 358: `@apply focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent;`

##### .form-label (3 directives)
- Line 362: `@apply block text-sm font-medium;`
- Line 363: `@apply text-gray-700 dark:text-gray-300;`
- Line 364: `@apply mb-1;`

#### Additional Components
*[More components follow the same pattern]*

## Migration Priority

### High Priority (Core Component Styles)
1. **Button Components** (.btn-primary, .btn-secondary, .btn-ghost) - 17 directives
2. **Form Components** (.form-input, .form-label, .form-error) - 10+ directives
3. **Card Components** (.card, .card-hover) - 5 directives

### Medium Priority (Base Styles)
4. **Glass Container Components** - 3 directives
5. **Address Display Component** - 4 directives
6. **Status Components** - 4 directives

### Low Priority (Browser Styles)
7. **Focus Styles** - 6 directives
8. **Scrollbar Styles** - 6 directives
9. **Base Body Styles** - 2 directives

## Migration Strategy

### For Complete Tailwind v4 Migration
Each `@apply` directive should be replaced with standard CSS properties following this pattern:

```css
/* Before (using @apply) */
.btn-primary {
    @apply bg-violet-600 hover:bg-violet-700 active:bg-violet-800;
    @apply text-violet-50 font-medium;
}

/* After (standard CSS properties) */
.btn-primary {
    background-color: var(--color-violet-600);
    color: var(--color-violet-50);
    font-weight: var(--font-weight-medium);
}

.btn-primary:hover {
    background-color: var(--color-violet-700);
}

.btn-primary:active {
    background-color: var(--color-violet-800);
}
```

### Implementation Reference
The complete migration plan is documented in `.ai/plan/upgrade-tailwind-v4-1.md` with:
- Task-by-task breakdown for each component
- CSS custom property definitions
- Testing validation steps

## Impact Assessment

### Current Status
- **Functional**: All @apply directives work correctly with current Tailwind v4 setup
- **Build**: No compilation errors or warnings
- **Performance**: No measurable impact on CSS bundle size

### Future Considerations
- **Maintenance**: @apply directives are legacy and may be deprecated
- **Performance**: CSS-first approach could improve build times
- **Compatibility**: Pure CSS properties ensure long-term compatibility

## Timeline Recommendation

### Immediate
- **No action required** - Current implementation is stable and functional

### Next Quarter
- **Optional**: Begin migration of high-priority button components
- **Benefit**: Reduced technical debt, improved Tailwind v4 alignment

### Future Release
- **Complete migration** when other CSS improvements are planned
- **Combine with**: Design system updates or major UI refresh

## Related Documentation

- **Fix Resolution**: `.ai/docs/tailwind-v4-fix-resolution.md`
- **Migration Plan**: `.ai/plan/upgrade-tailwind-v4-1.md`
- **Current CSS**: `app/globals.css` (lines with @apply)

---

**Last Updated**: August 9, 2025
**Next Review**: When planning complete Tailwind v4 migration
