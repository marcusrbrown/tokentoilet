# Bundle Size Monitoring Strategy

**Purpose:** Track and maintain optimal bundle size as Token Toilet scales with new features
**Status:** ✅ Monitoring Infrastructure Complete
**Date:** 2025-10-11

## Overview

Token Toilet implements a comprehensive bundle size monitoring strategy using Next.js Bundle Analyzer, automated telemetry, and CI/CD integration to ensure the application maintains optimal performance as features are added.

## Monitoring Tools

### 1. Next.js Bundle Analyzer

**Configuration:** `next.config.ts` includes `@next/bundle-analyzer` integration

**Usage:**
```bash
# Generate comprehensive bundle analysis
NEXT_BUILD_ENV_ANALYZE=true pnpm build

# View interactive visualizations
open .next/analyze/client.html  # Client-side bundles
open .next/analyze/nodejs.html  # Server-side bundles
open .next/analyze/edge.html    # Edge runtime bundles
```

**What It Shows:**
- Total bundle size breakdown by route
- Chunk distribution and dependencies
- Largest modules and their sizes
- Duplicate dependencies across chunks
- Dynamic import boundaries

### 2. Build-Time Reporting

Next.js automatically reports bundle sizes after each build:

```
Route (app)                              Size     First Load JS
┌ ○ /                                    15.3 kB         536 KB
└ ○ /_not-found                          1.03 kB         104 KB
+ First Load JS shared by all            103 kB
```

**Key Metrics:**
- **Size**: Page-specific JavaScript
- **First Load JS**: Total JS for initial page load
- **Shared JS**: Common chunks across routes

### 3. Telemetry System

**Dynamic Import Tracking:**

The application automatically tracks dynamic component loading:

```typescript
// Automatic telemetry for all dynamic imports
trackDynamicImport({
  component: 'TokenList',
  loadTime: 150, // milliseconds
  success: true,
  error: null, // or error details if failed
})
```

**Tracked Metrics:**
- Component load times
- Success/failure rates
- Error patterns
- User impact (loading skeleton visibility time)

**Access Telemetry Data:**
```bash
# View telemetry logs (if configured)
pnpm logs:telemetry
```

## Bundle Size Targets

### Current Baseline (2025-10-11)

| Metric | Value | Status |
|--------|-------|--------|
| **First Load JS** | 536 KB | ✅ Baseline established |
| **Page-specific JS** | ~433 KB | ✅ Landing page optimized |
| **Shared JS** | 103 KB | ✅ Minimal shared code |

### Target After Integration

| Metric | Baseline | Target | Reduction |
|--------|----------|--------|-----------|
| **First Load JS** | 536 KB | **~487 KB** | -50 to -100 KB |
| **Feature Pages** | N/A | **< 450 KB** | Dynamic loading active |

### Monitoring Thresholds

**Warning Thresholds:**
- First Load JS > 500 KB → Review for optimization opportunities
- Page-specific JS increase > 50 KB → Investigate new dependencies
- Shared JS increase > 20 KB → Check for duplicate dependencies

**Critical Thresholds:**
- First Load JS > 600 KB → Bundle size regression, immediate action required
- Any single chunk > 300 KB → May need aggressive code splitting
- Unused dependencies > 100 KB → Audit and remove

## Monitoring Workflow

### During Development

**Before Each Commit:**
```bash
# Quick build to check bundle impact
pnpm build
# Review "First Load JS" in output
```

**Weekly Development:**
```bash
# Generate full analysis
NEXT_BUILD_ENV_ANALYZE=true pnpm build

# Review bundle composition
open .next/analyze/client.html

# Check for:
# - Unexpected bundle size increases
# - New large dependencies
# - Duplicate modules across chunks
```

### Pull Request Process

**Required Checks:**
1. Build successfully completes
2. Bundle size reported in PR (if CI configured)
3. No critical threshold violations
4. New features use dynamic imports where appropriate

**Bundle Size Report Template:**
```markdown
## Bundle Size Impact

| Metric | Before | After | Change | Status |
|--------|--------|-------|--------|--------|
| First Load JS | XXX KB | YYY KB | ±ZZ KB | ✅/⚠️/❌ |
| Page-specific | XXX KB | YYY KB | ±ZZ KB | ✅/⚠️/❌ |

**Analysis:** [Brief explanation of changes]
```

### Production Deployment

**Post-Deployment Validation:**
1. Generate bundle analysis from production build
2. Compare against baseline metrics
3. Verify dynamic imports loading correctly
4. Monitor telemetry for dynamic import failures
5. Track Time to Interactive (TTI) improvements

## CI/CD Integration

### Recommended GitHub Actions Workflow

```yaml
name: Bundle Size Check

on:
  pull_request:
    branches: [main]

jobs:
  analyze-bundle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build with analysis
        run: NEXT_BUILD_ENV_ANALYZE=true pnpm build

      - name: Upload bundle analysis
        uses: actions/upload-artifact@v4
        with:
          name: bundle-analysis
          path: .next/analyze/

      - name: Check bundle size
        run: |
          # Extract bundle size from build output
          # Compare against baseline
          # Fail if critical threshold exceeded
```

### Bundle Size Comparison

Consider using tools like:
- [next-bundle-analyzer-action](https://github.com/hashicorp/nextjs-bundle-analysis)
- [bundlewatch](https://github.com/bundlewatch/bundlewatch)
- [size-limit](https://github.com/ai/size-limit)

## Dynamic Import Monitoring

### Key Metrics

**Performance Metrics:**
- Average load time per component
- 95th percentile load time
- Network conditions impact (fast 3G, slow 3G, offline)

**Reliability Metrics:**
- Dynamic import success rate (target: >99.5%)
- Error rate by component
- Retry success rate (with exponential backoff)

**User Experience Metrics:**
- Skeleton loader visibility time (target: <200ms)
- Layout shift during dynamic loading (target: CLS < 0.1)
- User-perceived latency improvements

### Telemetry Dashboard (Future)

Recommended metrics to track:
- Component load time histogram
- Dynamic import failure rate over time
- Most frequently loaded dynamic components
- Bundle size trend over time
- Feature page performance comparison

## Maintenance Schedule

### Weekly
- Review bundle analysis for significant changes
- Check telemetry for dynamic import issues
- Monitor for new large dependencies

### Monthly
- Comprehensive bundle audit
- Update baseline metrics
- Review optimization opportunities
- Analyze user impact of dynamic loading

### Quarterly
- Deep dive into bundle composition
- Evaluate new optimization strategies
- Update monitoring thresholds if needed
- Review and update documentation

## Alerting Strategy

### Critical Alerts (Immediate Action)

**Trigger:** First Load JS > 600 KB (>10% regression)
**Action:**
1. Identify source of bundle increase
2. Evaluate if new feature requires dynamic import
3. Remove or optimize offending dependencies
4. Block deployment until resolved

**Trigger:** Dynamic import failure rate > 1%
**Action:**
1. Check error logs for patterns
2. Verify CDN/network configuration
3. Review error boundary behavior
4. Consider temporary rollback if critical

### Warning Alerts (Review Within 24h)

**Trigger:** First Load JS increase > 50 KB
**Action:**
1. Review recent changes for heavy dependencies
2. Evaluate dynamic import opportunities
3. Plan optimization if warranted

**Trigger:** Shared chunk size increase > 20 KB
**Action:**
1. Check for duplicate dependencies
2. Audit common imports across routes
3. Consider code splitting if needed

## Optimization Playbook

### When Bundle Size Increases

1. **Generate Analysis:**
   ```bash
   NEXT_BUILD_ENV_ANALYZE=true pnpm build
   open .next/analyze/client.html
   ```

2. **Identify Culprit:**
   - Look for new large chunks
   - Check recently added dependencies
   - Identify duplicate modules

3. **Apply Fix:**
   - Add dynamic import for heavy components
   - Remove unused dependencies
   - Replace large libraries with lighter alternatives
   - Split large utilities into smaller modules

4. **Validate:**
   - Rebuild and compare bundle sizes
   - Test dynamic loading behavior
   - Run full test suite
   - Deploy to staging for validation

### When Dynamic Imports Fail

1. **Check Telemetry:**
   - Identify failing components
   - Analyze error patterns
   - Determine user impact

2. **Validate Infrastructure:**
   - Verify error boundaries working
   - Test retry mechanism
   - Check fallback UI rendering

3. **Fix Root Cause:**
   - Update component if buggy
   - Improve network resilience
   - Enhance error logging

## Resources

### Documentation
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Dynamic Loading Architecture](docs/development/architecture.md#dynamic-loading-architecture)
- [Performance Summary](docs/performance/dynamic-loading-summary.md)

### Tools
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Bundlephobia](https://bundlephobia.com/) - Check package sizes
- [Import Cost VSCode Extension](https://marketplace.visualstudio.com/items?itemName=wix.vscode-import-cost)

### Commands Reference
```bash
# Bundle analysis
NEXT_BUILD_ENV_ANALYZE=true pnpm build

# Quick build check
pnpm build

# Type check + build
pnpm type-check && pnpm build

# Full validation
pnpm validate
```

---

**Maintained by:** Development Team
**Last Updated:** 2025-10-11
**Review Cycle:** Quarterly or after major features
