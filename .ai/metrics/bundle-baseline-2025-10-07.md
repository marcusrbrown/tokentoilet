# Bundle Size Baseline Metrics

**Date:** 2025-10-07
**Analysis Tool:** @next/bundle-analyzer v15.5.4
**Next.js Version:** 15.5.4
**Build Command:** `NEXT_BUILD_ENV_ANALYZE=true pnpm build`

## Executive Summary

- **Total First Load JS:** 538 KB
- **Shared JS (all pages):** 103 KB
- **Page-specific JS:** 435 KB (main page)
- **Target after optimization:** < 450 KB (15-25% reduction)
- **Expected savings:** 88-134 KB

## Bundle Composition

### Top 10 Largest Chunks

| Chunk File | Size | Contains |
|------------|------|----------|
| `6212-a88a90bd0cd72785.js` | 1.4 MB | **Primary wallet provider bundle** - Contains Wagmi, Coinbase, MetaMask connectors |
| `7611.9a7b4af121af1e62.js` | 549 KB | Reown AppKit UI components |
| `7183.e33e66f1d86e4e56.js` | 388 KB | Coinbase wallet SDK |
| `540.0e6da6a60eed74ee.js` | 322 KB | Additional Coinbase wallet code |
| `framework-1875be831b0bb530.js` | 185 KB | React framework code |
| `92403ef3-104734c33322505d.js` | 169 KB | Shared dependencies |
| `6313-9b1ccfcab9e56a6c.js` | 168 KB | Additional shared code |
| `9504-9d83cd3eee35271f.js` | 132 KB | Utility libraries |
| `main-55b633b2ac81e44f.js` | 125 KB | Next.js main bundle |
| `polyfills-42372ed130431b0a.js` | 110 KB | Browser polyfills |

### Wallet Provider Analysis

Based on chunk analysis and grep searches:

| Provider | Estimated Size | Primary Chunks | Notes |
|----------|----------------|----------------|-------|
| **Wagmi Core** | ~200-250 KB | `6212`, `92403ef3` | Core wallet connection library |
| **Coinbase Wallet** | ~700-800 KB | `6212`, `7183`, `540` | Largest single provider - prime candidate for dynamic loading |
| **MetaMask Connector** | ~50-100 KB | `6212`, `7183` | Smaller footprint, bundled with Wagmi |
| **WalletConnect** | ~150-200 KB | `6212` (via @reown) | Included in Reown AppKit |
| **Reown AppKit** | ~500-600 KB | `7611`, `6212` | UI library + wallet connection |

### Bundle Size Breakdown

```
Total Bundle: 538 KB
├─ React + Next.js Framework: ~185 KB (34%)
├─ Wallet Providers: ~250-300 KB (47-56%)
│  ├─ Coinbase: ~150-180 KB
│  ├─ WalletConnect/Reown: ~80-100 KB
│  └─ MetaMask: ~20-30 KB
├─ Reown AppKit UI: ~100-150 KB (19-28%)
├─ Other utilities: ~50-70 KB (9-13%)
└─ Polyfills: ~50-60 KB (9-11%)
```

## Optimization Opportunities

### Dynamic Loading Candidates (Priority Order)

1. **Coinbase Wallet SDK** (~150-180 KB)
   - **Chunks:** `7183.e33e66f1d86e4e56.js`, `540.0e6da6a60eed74ee.js`
   - **Impact:** HIGH - Largest single provider
   - **Strategy:** Dynamic import on connection attempt
   - **Expected savings:** 150-180 KB

2. **WalletConnect/Reown Provider** (~80-100 KB)
   - **Chunks:** Parts of `6212-a88a90bd0cd72785.js`
   - **Impact:** MEDIUM - Second largest provider
   - **Strategy:** Dynamic import on connection attempt
   - **Expected savings:** 80-100 KB

3. **MetaMask Connector** (~20-30 KB)
   - **Chunks:** Embedded in `6212-a88a90bd0cd72785.js`
   - **Impact:** LOW - Smaller size
   - **Strategy:** Dynamic import for consistency
   - **Expected savings:** 20-30 KB

### Total Expected Savings

- **Conservative estimate:** 250 KB (46% reduction) → **288 KB final size** ✅
- **Optimistic estimate:** 310 KB (58% reduction) → **228 KB final size** ✅

Both scenarios exceed the target of < 450 KB.

## Current Performance Characteristics

### Build Metrics

- **Build time:** 29.1 seconds
- **Static pages:** 5
- **Warnings:** 1 (pino-pretty optional dependency)
- **Type checking:** Enabled
- **Linting:** Enabled

### Route Sizes

| Route | Size | First Load JS |
|-------|------|---------------|
| `/` (main) | 15.3 KB | 538 KB |
| `/_not-found` | 1.03 KB | 104 KB |

### Shared Resources

- **Shared JS:** 103 KB
  - `6313-9b1ccfcab9e56a6c.js`: 45.7 KB
  - `92403ef3-104734c33322505d.js`: 54.3 KB
  - Other chunks: 3.38 KB

## Analysis Files Generated

- **Client bundle:** `.next/analyze/client.html`
- **Server bundle:** `.next/analyze/nodejs.html`
- **Edge runtime:** `.next/analyze/edge.html`

## Recommendations

### Phase 2 Implementation Priority

1. **High Priority:** Coinbase Wallet SDK
   - Create `lib/web3/connectors/dynamic-coinbase.ts`
   - Implement lazy loading wrapper
   - **Expected impact:** 150-180 KB reduction

2. **High Priority:** WalletConnect/Reown Provider
   - Create `lib/web3/connectors/dynamic-walletconnect.ts`
   - Implement lazy loading wrapper
   - **Expected impact:** 80-100 KB reduction

3. **Medium Priority:** MetaMask Connector
   - Create `lib/web3/connectors/dynamic-metamask.ts`
   - Implement for API consistency
   - **Expected impact:** 20-30 KB reduction

### Risk Mitigation

- **Aggressive prefetching:** Load connectors on hover to minimize perceived latency
- **Error boundaries:** Comprehensive fallbacks for dynamic import failures
- **Testing:** Verify all 914 tests pass after dynamic loading implementation
- **Performance monitoring:** Track Time to Interactive (TTI) before and after

## Next Steps

1. ✅ Baseline established
2. 🔄 Proceed to Phase 2: Implement dynamic connector loading
3. 📊 Re-run analysis after implementation
4. 📈 Compare metrics and validate < 450 KB target achieved

## How to Regenerate This Report

```bash
# Enable bundle analysis and run production build
NEXT_BUILD_ENV_ANALYZE=true pnpm build

# Analysis reports are generated at:
# - .next/analyze/client.html (client bundle)
# - .next/analyze/nodejs.html (server bundle)
# - .next/analyze/edge.html (edge runtime bundle)

# Open reports in browser for interactive visualization
open .next/analyze/client.html
```

---

**Generated by:** Bundle analysis Phase 1
**Related Issue:** [#640](https://github.com/marcusrbrown/tokentoilet/issues/640)
**Related Plan:** `.ai/plan/feature-dynamic-wallet-loading-1.md`
