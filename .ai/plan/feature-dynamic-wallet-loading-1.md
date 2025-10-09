---
goal: Implement Dynamic Wallet Provider Loading for Bundle Optimization
version: 1.1
date_created: 2025-10-01
last_updated: 2025-10-09
owner: marcusrbrown
status: 'Blocked - Architectural Decision Required'
tags: ['feature', 'performance', 'optimization', 'bundle-size', 'web3', 'blocked']
---

# Implement Dynamic Wallet Provider Loading for Bundle Optimization

![Status: Blocked](https://img.shields.io/badge/status-Blocked-red)

Reduce initial bundle size by implementing dynamic imports for wallet provider code. Currently, all wallet providers (MetaMask, WalletConnect, Coinbase) are loaded upfront in the main bundle. This feature will lazy-load wallet providers only when users initiate connection.

## 1. Requirements & Constraints

- **REQ-001**: Reduce initial bundle size from 537KB to target < 450KB (15-25% reduction)
- **REQ-002**: Implement dynamic imports for wallet provider connectors
- **REQ-003**: Maintain all existing wallet connection functionality
- **REQ-004**: Provide seamless loading states during wallet provider loading
- **REQ-005**: No regression in wallet connection speed or user experience
- **REQ-006**: All 914 tests must continue passing
- **SEC-001**: Ensure no security vulnerabilities introduced by code splitting
- **SEC-002**: Validate wallet provider integrity before execution
- **CON-001**: Must work with Next.js App Router and Server Components
- **CON-002**: Must maintain compatibility with Wagmi v2 and Reown AppKit
- **CON-003**: Changes must not break multi-chain support
- **GUD-001**: Follow Next.js dynamic import patterns
- **GUD-002**: Implement proper error boundaries for loading failures
- **GUD-003**: Add telemetry for bundle size monitoring
- **PAT-001**: Use React.lazy() for component-level code splitting
- **PAT-002**: Use dynamic import() for utility-level code splitting
- **PAT-003**: Implement fallback UI during loading states

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

### Phase 2: Implement Dynamic Connector Loading

- GOAL-002: Create dynamic import wrappers for wallet connectors

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007 | Create `lib/web3/connectors/dynamic-metamask.ts` with lazy MetaMask connector | ✅ | 2025-10-08 |
| TASK-008 | Create `lib/web3/connectors/dynamic-walletconnect.ts` with lazy WalletConnect | ✅ | 2025-10-08 |
| TASK-009 | Create `lib/web3/connectors/dynamic-coinbase.ts` with lazy Coinbase connector | ✅ | 2025-10-08 |
| TASK-010 | Implement connector factory with loading states and error handling | ✅ | 2025-10-08 |
| TASK-011 | Update `lib/web3/config.ts` to use dynamic connectors | 🚫 | 2025-10-09 |
| TASK-012 | Add TypeScript types for dynamic connector loading | ✅ | 2025-10-08 |

**⚠️ CRITICAL BLOCKER:** TASK-011 is blocked due to architectural constraints. After researching Reown AppKit documentation and type definitions, discovered that:

1. AppKit REQUIRES `WagmiAdapter` - no way to use standard Wagmi `createConfig`
2. `WagmiAdapter` internally bundles all connectors (WalletConnect, Coinbase, Injected) automatically
3. Custom connectors are ADDITIVE only, not replacements

**Original approach (Option A) is not feasible.** See [issue #641 comment](https://github.com/marcusrbrown/tokentoilet/issues/641#issuecomment-3383768032) for detailed analysis and revised options:
- **Option B (Recommended)**: Module-level dynamic imports (~50-100 KB reduction)
- **Option C (High Risk)**: Fork/patch WagmiAdapter (~250-310 KB reduction)

**Awaiting architectural decision** before proceeding with Phase 3-7. Dynamic connector infrastructure (TASK-007 through TASK-010) remains valid for future use if Option C is chosen.

### Phase 3: Update useWallet Hook for Dynamic Loading

- GOAL-003: Enhance useWallet hook to handle async connector initialization

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | Add loading state for wallet provider initialization in `hooks/use-wallet.ts` | | |
| TASK-014 | Implement connector pre-loading on wallet button hover (prefetch) | | |
| TASK-015 | Add error handling for failed connector loading | | |
| TASK-016 | Update wallet connection flow to await connector loading | | |
| TASK-017 | Add telemetry for connector load times | | |
| TASK-018 | Update useWallet TypeScript types for new loading states | | |

### Phase 4: UI Components for Loading States

- GOAL-004: Implement loading indicators and error boundaries

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-019 | Create `WalletLoadingSpinner` component for connector initialization | | |
| TASK-020 | Update `WalletButton` to show loading state during connector load | | |
| TASK-021 | Add error boundary for wallet connector loading failures | | |
| TASK-022 | Implement retry mechanism for failed connector loads | | |
| TASK-023 | Add user-friendly error messages for loading failures | | |
| TASK-024 | Update Storybook stories for loading states | | |

### Phase 5: Testing Dynamic Loading

- GOAL-005: Comprehensive testing of dynamic import functionality

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-025 | Update test mocks to handle dynamic imports in Vitest | | |
| TASK-026 | Add tests for connector loading states | | |
| TASK-027 | Add tests for connector loading errors | | |
| TASK-028 | Add tests for connector prefetch on hover | | |
| TASK-029 | Update all wallet-specific tests (MetaMask, WalletConnect, Coinbase) | | |
| TASK-030 | Run full test suite: verify 914/914 passing | | |

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
| TASK-037 | Update architecture documentation with dynamic loading pattern | | |
| TASK-038 | Add code comments explaining dynamic import strategy | | |
| TASK-039 | Update CONTRIBUTING.md with dynamic import guidelines | | |
| TASK-040 | Create deployment guide with rollback plan | | |
| TASK-041 | Update CHANGELOG.md with performance improvements | | |
| TASK-042 | Create monitoring dashboard for bundle size tracking | | |

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

- **FILE-001**: `next.config.ts` - MODIFIED: Add bundle analyzer configuration
- **FILE-002**: `lib/web3/connectors/dynamic-metamask.ts` - NEW: Dynamic MetaMask connector
- **FILE-003**: `lib/web3/connectors/dynamic-walletconnect.ts` - NEW: Dynamic WalletConnect
- **FILE-004**: `lib/web3/connectors/dynamic-coinbase.ts` - NEW: Dynamic Coinbase connector
- **FILE-005**: `lib/web3/connectors/index.ts` - NEW: Connector factory with loading
- **FILE-006**: `lib/web3/config.ts` - MODIFIED: Use dynamic connectors
- **FILE-007**: `hooks/use-wallet.ts` - MODIFIED: Handle async connector initialization
- **FILE-008**: `components/web3/wallet-button.tsx` - MODIFIED: Show loading states
- **FILE-009**: `components/web3/wallet-loading-spinner.tsx` - NEW: Loading indicator
- **FILE-010**: `components/web3/wallet-error-boundary.tsx` - NEW: Error boundary for loading
- **FILE-011**: `vitest.setup.ts` - MODIFIED: Mock dynamic imports for tests

## 6. Testing

- **TEST-001**: Test dynamic import of MetaMask connector
- **TEST-002**: Test dynamic import of WalletConnect connector
- **TEST-003**: Test dynamic import of Coinbase connector
- **TEST-004**: Test connector loading states in UI
- **TEST-005**: Test connector loading error handling
- **TEST-006**: Test connector prefetch on button hover
- **TEST-007**: Test wallet connection flow with dynamic loading
- **TEST-008**: Test multi-chain support with dynamic connectors
- **TEST-009**: Test fallback behavior when dynamic load fails
- **TEST-010**: Verify bundle size < 450KB in production build
- **TEST-011**: Verify no increase in Time to First Byte (TTFB)
- **TEST-012**: Verify Lighthouse performance score improvement
- **TEST-013**: Test wallet connection speed (baseline vs optimized)
- **TEST-014**: Verify all 914 existing tests still pass

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
- **RISK-006**: ⚠️ **NEW** - Maintenance burden if Option C (forking) chosen
  - Impact: Must track upstream WagmiAdapter changes
  - Mitigation: Use patch-package with comprehensive test coverage
- **ASSUMPTION-001**: Users typically connect only one wallet provider per session
- **ASSUMPTION-002**: Network latency for dynamic imports < 200ms on good connections
- **ASSUMPTION-003**: Bundle analyzer accurately represents production bundle sizes
- **ASSUMPTION-004**: ❌ **INVALIDATED** - Wagmi connectors do NOT support lazy initialization within AppKit constraints

## 8. Related Specifications / Further Reading

- [Next.js Dynamic Imports Documentation](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)
- [Webpack Code Splitting Guide](https://webpack.js.org/guides/code-splitting/)
- [React.lazy() and Suspense](https://react.dev/reference/react/lazy)
- [Web Vitals - Time to Interactive](https://web.dev/tti/)
- [Wagmi Connectors Documentation](https://wagmi.sh/react/api/connectors)
- [Bundle Analysis with Next.js](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Performance Budgets Guide](https://web.dev/performance-budgets-101/)
- [Audit Report - Performance Analysis Section](#)
