---
goal: Implement Module-Level Dynamic Imports for Bundle Optimization
version: 2.5
date_created: 2025-10-01
last_updated: 2025-10-11
owner: marcusrbrown
status: 'In Progress'
tags: ['feature', 'performance', 'optimization', 'bundle-size', 'web3']
---

# Implement Module-Level Dynamic Imports for Bundle Optimization

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

**Revised Approach (Option B)**: Reduce initial bundle size through strategic module-level dynamic imports in application code. After architectural analysis revealed AppKit's WagmiAdapter requirement (which auto-bundles connectors), this approach focuses on lazy-loading Web3 interactions and UI components rather than connector-level splitting.

**Previous Approach (Deprecated)**: Original plan to replace WagmiAdapter with custom dynamic connectors proved architecturally incompatible with Reown AppKit. See [issue #641](https://github.com/marcusrbrown/tokentoilet/issues/641#issuecomment-3383768032) for detailed analysis.

## 1. Requirements & Constraints

**Revised Targets (Option B - Module-Level Imports):**
- **REQ-001**: Reduce initial bundle size from 537KB to ~487KB (50-100 KB / 10-18% reduction)
- **REQ-002**: Implement dynamic imports for Web3 UI components and utilities
- **REQ-003**: Maintain all existing wallet connection functionality
- **REQ-004**: Provide seamless loading states during component loading
- **REQ-005**: No regression in wallet connection speed or user experience
- **REQ-006**: All 935 tests must continue passing
- **SEC-001**: Ensure no security vulnerabilities introduced by code splitting
- **SEC-002**: Validate module integrity before execution
- **CON-001**: Must work with Next.js App Router and Server Components
- **CON-002**: Must maintain compatibility with Wagmi v2 and Reown AppKit (WagmiAdapter required)
- **CON-003**: Changes must not break multi-chain support
- **GUD-001**: Follow Next.js dynamic import patterns (next/dynamic)
- **GUD-002**: Implement proper error boundaries for loading failures
- **GUD-003**: Add telemetry for bundle size monitoring
- **PAT-001**: Use next/dynamic for component-level code splitting
- **PAT-002**: Use dynamic import() for utility-level code splitting
- **PAT-003**: Implement fallback UI during loading states with Suspense

## 2. Implementation Steps

### Phase 1: Analysis & Bundle Profiling

- GOAL-001: Analyze current bundle composition and identify optimization targets

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Install and configure `@next/bundle-analyzer` for bundle analysis | ✅ | 2025-10-07 |
| TASK-002 | Generate bundle analysis report: `ANALYZE=true pnpm build` | ✅ | 2025-10-07 |
| TASK-003 | Identify wallet provider bundle sizes in analysis report | ✅ | 2025-10-07 |
| TASK-004 | Document current bundle breakdown by provider (MetaMask, WalletConnect, Coinbase) | ✅ | 2025-10-07 |
| TASK-005 | Calculate expected savings from dynamic loading strategy | ✅ | 2025-10-07 |
| TASK-006 | Create baseline metrics document for comparison | ✅ | 2025-10-07 |

### Phase 2: Implement Module-Level Dynamic Imports (Revised)

- GOAL-002: Implement strategic dynamic imports for Web3 components and utilities

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007 | ~~Create dynamic connector infrastructure~~ (Deprecated - removed due to AppKit constraints) | 🗑️ | 2025-10-09 |
| TASK-008 | ~~Create dynamic connector infrastructure~~ (Deprecated - removed due to AppKit constraints) | 🗑️ | 2025-10-09 |
| TASK-009 | ~~Create dynamic connector infrastructure~~ (Deprecated - removed due to AppKit constraints) | 🗑️ | 2025-10-09 |
| TASK-010 | ~~Implement connector factory~~ (Deprecated - removed due to AppKit constraints) | 🗑️ | 2025-10-09 |
| TASK-011 | ~~Update config.ts~~ (Not feasible - AppKit requires WagmiAdapter) | 🚫 | 2025-10-09 |
| TASK-012 | ~~Add dynamic connector types~~ (Deprecated - removed due to AppKit constraints) | 🗑️ | 2025-10-09 |

**📋 Decision: Option B Selected (2025-10-09)**
User selected Option B (module-level dynamic imports) and requested removal of unused dynamic connector infrastructure. Pivoting to component and utility-level code splitting that works within AppKit's architectural constraints.

### Phase 3: Implement Dynamic Imports for Web3 Components

- GOAL-003: Implement strategic dynamic imports for non-critical Web3 components and utilities

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | Analyze Web3 components usage patterns and identify code-splitting candidates (TokenList, TokenDetail, TransactionQueue, WalletDashboard, etc.) | ✅ | 2025-10-08 |
| TASK-014 | Create dynamic wrapper components using `next/dynamic` for 10+ non-critical Web3 components | ✅ | 2025-10-08 |
| TASK-015 | Implement Suspense boundaries with loading skeletons for dynamically imported components | ✅ | 2025-10-08 |
| TASK-016 | Identify and implement dynamic imports for Web3 utility modules (token-discovery, token-metadata, token-price) | ⏭️ | Deferred to Phase 4 |
| TASK-017 | Update component imports throughout the application to use dynamic wrappers where appropriate | ⏭️ | Not applicable (no app pages yet) |
| TASK-018 | Run bundle analysis to validate 50-100 KB reduction target achieved | ✅ | 2025-10-08 |

### Phase 4: Create Loading States and Error Boundaries

- GOAL-004: Implement loading indicators and error boundaries for dynamic components

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-019 | Create reusable loading skeleton components for Web3 features (TokenDetailSkeleton, TransactionStatusSkeleton, TokenSelectionSkeleton) | ✅ | 2025-10-09 |
| TASK-020 | Implement error boundary component for dynamic import failures with retry mechanism (exponential backoff: 1s→2s→4s→8s max) | ✅ | 2025-10-09 |
| TASK-021 | Add fallback UI components for graceful degradation when dynamic imports fail (4 specialized components) | ✅ | 2025-10-09 |
| TASK-022 | Verify transaction components have proper loading states (TransactionStatusSkeleton, verified all transaction wrappers) | ✅ | 2025-10-09 |
| TASK-023 | Update Storybook stories to document loading and error states (20 comprehensive stories across 3 story files) | ✅ | 2025-10-09 |
| TASK-024 | Add telemetry for tracking dynamic import performance and failures (complete system with 15 test cases) | ✅ | 2025-10-09 |

### Phase 5: Testing Dynamic Component Loading

- GOAL-005: Comprehensive testing of dynamic import functionality

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-025 | Update Vitest configuration to handle next/dynamic imports in test environment | ✅ | 2025-10-11 |
| TASK-026 | Add tests for dynamic component loading states and Suspense boundaries | ✅ | 2025-10-11 |
| TASK-027 | Add tests for dynamic import error handling and fallback UI | ✅ | 2025-10-10 |
| TASK-028 | Verify all existing component tests pass with dynamic wrappers | ✅ | 2025-10-11 |
| TASK-029 | Add integration tests for dynamic component rendering in user flows | ✅ | 2025-10-11 |
| TASK-030 | Run full test suite: verify 1000/1012 tests passing (1000 passed + 12 skipped) | ✅ | 2025-10-11 |

### Phase 6: Performance Validation

- GOAL-006: Validate bundle size reduction and performance improvements

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-031 | Generate new bundle analysis report with dynamic imports | | |
| TASK-032 | Compare before/after bundle sizes, verify < 450KB target | | |
| TASK-033 | Measure Time to Interactive (TTI) improvement | | |
| TASK-034 | Test wallet connection speed (should be equal or faster with prefetch) | | |
| TASK-035 | Run Lighthouse performance audit, verify score improvement | | |
| TASK-036 | Document performance improvements in metrics report | | |

### Phase 7: Documentation & Rollout

- GOAL-007: Document changes and prepare for production deployment

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-037 | Update architecture documentation with module-level dynamic loading patterns | | |
| TASK-038 | Add code comments explaining dynamic import strategy and Suspense boundaries | | |
| TASK-039 | Update CONTRIBUTING.md with guidelines for when to use dynamic imports | | |
| TASK-040 | Document bundle size improvements and performance metrics | | |
| TASK-041 | Update CHANGELOG.md with performance improvements and breaking changes (if any) | | |
| TASK-042 | Create monitoring strategy for tracking bundle size regression | | |

## 3. Alternatives

- **ALT-001**: Static code splitting by route only (no wallet-specific splitting)
  - Rejected: Wallet providers still loaded on home page, minimal savings
- **ALT-002**: Load all wallet providers in single dynamic chunk
  - Rejected: Doesn't provide per-provider splitting, limited optimization
- **ALT-003**: Use Suspense boundaries for wallet provider loading
  - Considered: May implement in future iteration for enhanced UX
- **ALT-004**: Implement service worker caching for wallet provider bundles
  - Future: Consider for PWA optimization in later phase

## 4. Dependencies

- **DEP-001**: `@next/bundle-analyzer` - Bundle size analysis tool (dev dependency)
- **DEP-002**: `next` v15+ - Dynamic import support with App Router
- **DEP-003**: `react` v19+ - React.lazy() and Suspense support
- **DEP-004**: `wagmi` v2+ - Must support dynamic connector initialization
- **DEP-005**: `@reown/appkit` - Must support async connector loading

## 5. Files

- **FILE-001**: `next.config.ts` - MODIFIED: Add bundle analyzer configuration (✅ Phase 1)
- **FILE-002**: ~~`lib/web3/connectors/*`~~ - REMOVED: Dynamic connector infrastructure (deprecated)
- **FILE-003**: `components/web3/dynamic/token-list.tsx` - NEW: Dynamic wrapper for TokenList
- **FILE-004**: `components/web3/dynamic/token-detail.tsx` - NEW: Dynamic wrapper for TokenDetail
- **FILE-005**: `components/web3/dynamic/transaction-queue.tsx` - NEW: Dynamic wrapper for TransactionQueue
- **FILE-006**: `components/web3/dynamic/wallet-dashboard.tsx` - NEW: Dynamic wrapper for WalletDashboard
- **FILE-007**: `components/web3/dynamic/index.ts` - NEW: Barrel exports for dynamic components
- **FILE-008**: `components/ui/skeletons/token-list-skeleton.tsx` - NEW: Loading skeleton for TokenList
- **FILE-009**: `components/ui/skeletons/wallet-dashboard-skeleton.tsx` - NEW: Loading skeleton for WalletDashboard
- **FILE-010**: `components/web3/dynamic-import-error-boundary.tsx` - NEW: Error boundary for dynamic imports
- **FILE-011**: `vitest.setup.ts` - MODIFIED: Mock next/dynamic for tests

## 6. Testing

- **TEST-001**: Test dynamic import of TokenList component with Suspense boundary
- **TEST-002**: Test dynamic import of TransactionQueue component with loading state
- **TEST-003**: Test dynamic import of WalletDashboard component with skeleton loader
- **TEST-004**: Test dynamic component loading states render correctly
- **TEST-005**: Test dynamic import error handling and fallback UI
- **TEST-006**: Test error boundary catches and handles failed dynamic imports
- **TEST-007**: Test user flows work correctly with dynamically loaded components
- **TEST-008**: Test that critical path components (WalletButton, providers) remain static
- **TEST-009**: Test Suspense boundaries don't cause layout shift
- **TEST-010**: Verify bundle size reduced by 50-100 KB (target: ~487KB from 537KB baseline)
- **TEST-011**: Verify no increase in Time to First Byte (TTFB) or First Contentful Paint (FCP)
- **TEST-012**: Verify Lighthouse performance score improvement
- **TEST-013**: Test component loading time on slow connections (< 200ms target)
- **TEST-014**: Verify all 935 existing tests still pass with dynamic imports

## 7. Architectural Constraints & Findings (2025-10-09)

### AppKit/WagmiAdapter Architecture

**Critical Discovery**: The original approach (Option A) to replace WagmiAdapter with standard Wagmi `createConfig` is **architecturally impossible** with Reown AppKit.

**Key Constraints:**
1. **AppKit Requires WagmiAdapter**: `createAppKit()` MUST use the `adapters` parameter with a `WagmiAdapter` instance
   - Source: [@reown/appkit-adapter-wagmi TypeScript definitions](https://github.com/reown-com/appkit)
   - No `wagmiConfig` option exists in `CreateAppKit` interface

2. **WagmiAdapter Auto-Bundles Connectors**: Internal implementation automatically includes:
   - WalletConnect connector (~80-100 KB)
   - Coinbase Wallet connector (~150-180 KB)
   - Injected connector for MetaMask (~20-30 KB)
   - Total: ~250-310 KB bundled regardless of configuration

3. **Custom Connectors Are Additive Only**: The `connectors` option in `createAppKit()` adds ADDITIONAL connectors, not replacements
   - Cannot override or disable built-in connectors
   - Dynamic connector factory (TASK-007 through TASK-010) cannot be used as replacements

**Evidence:**
```typescript
// From @reown/appkit-adapter-wagmi/dist/types/src/client.d.ts
export declare class WagmiAdapter extends AdapterBlueprint {
    wagmiChains: readonly [Chain, ...Chain[]] | undefined;
    wagmiConfig: Config;
    constructor(configParams: Partial<CreateConfigParameters> & {
        networks: AppKitNetwork[];
        pendingTransactionsFilter?: PendingTransactionsFilter;
        projectId: string;
        customRpcUrls?: CustomRpcUrlMap;
    });
    // ... internal methods that bundle connectors
    private addWagmiConnectors;
    private addThirdPartyConnectors;
}
```

**Implications:**
- Original optimization target (250-310 KB reduction) unachievable without forking library
- Dynamic connector infrastructure (Phase 2) remains useful for Option C approach
- Phase 3-7 blocked pending decision on Option B vs Option C

### Revised Optimization Approaches

See [GitHub issue #641 comment](https://github.com/marcusrbrown/tokentoilet/issues/641#issuecomment-3383768032) for detailed analysis of:
- **Option B**: Module-level dynamic imports (50-100 KB, recommended)
- **Option C**: Fork/patch WagmiAdapter (250-310 KB, high risk)

## 8. Risks & Assumptions

- **RISK-001**: ⚠️ **CRITICAL** - AppKit architecture prevents aggressive bundle optimization
  - Impact: Cannot achieve original 250-310 KB reduction without library fork
  - Mitigation: Pivot to Option B (module-level imports) or Option C (fork)
- **RISK-002**: Dynamic imports failing in certain browser environments
  - Mitigation: Comprehensive error boundaries with fallback to static loading
- **RISK-003**: ✅ **VALIDATED** - Wagmi/Reown AppKit incompatibility confirmed
  - Status: Architectural research completed, constraints documented
  - Decision: Awaiting user input on Option B vs C
- **RISK-004**: Increased complexity in error handling and debugging
  - Mitigation: Enhanced logging and telemetry for dynamic loading
- **RISK-005**: Cache invalidation issues with split chunks
  - Mitigation: Proper cache-busting strategies with Next.js build IDs
- **RISK-006**: ✅ **RESOLVED** - Option B selected, no forking required
- **RISK-007**: ⚠️ **NEW** - Dynamic imports may cause layout shift if loading states not properly handled
  - Impact: Poor user experience, CLS (Cumulative Layout Shift) regression
  - Mitigation: Use fixed-height skeleton loaders matching component dimensions
- **RISK-008**: ⚠️ **NEW** - Over-aggressive code splitting could increase total load time
  - Impact: More network requests, potential performance regression on slow connections
  - Mitigation: Only split components not needed on initial page load
- **ASSUMPTION-001**: ✅ **UPDATED** - Non-critical Web3 components are not needed on initial page load
- **ASSUMPTION-002**: Network latency for dynamic imports < 200ms on good connections
- **ASSUMPTION-003**: Bundle analyzer accurately represents production bundle sizes
- **ASSUMPTION-004**: ❌ **INVALIDATED** - Wagmi connectors do NOT support lazy initialization within AppKit constraints
- **ASSUMPTION-005**: ✅ **NEW** - Most users will interact with at most 2-3 dynamically loaded components per session

## 8. Related Specifications / Further Reading

- [Next.js Dynamic Imports Documentation](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)
- [Webpack Code Splitting Guide](https://webpack.js.org/guides/code-splitting/)
- [React.lazy() and Suspense](https://react.dev/reference/react/lazy)
- [Web Vitals - Time to Interactive](https://web.dev/tti/)
- [Wagmi Connectors Documentation](https://wagmi.sh/react/api/connectors)
- [Bundle Analysis with Next.js](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Performance Budgets Guide](https://web.dev/performance-budgets-101/)
- [Audit Report - Performance Analysis Section](#)
