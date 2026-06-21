---
title: Library-internal changes need explicit downstream-consumer verification
date: 2026-06-21
category: workflow-issues
module: review-verification
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - changing a shared or exported function's signature or return shape
  - rewriting a function consumed by hooks, UI, or orchestration code
  - extending an error or result union with a new member
  - switching the implementation path inside a library API
  - downstream code branches on partial success vs fatal failure
related_components:
  - tooling
tags:
  - review-blind-spot
  - consumer-contracts
  - downstream-verification
  - blast-radius
  - regression-prevention
  - pr-review
  - verification-workflow
---

# Library-internal changes need explicit downstream-consumer verification

## Context

Two consecutive PRs showed the same failure mode. A thorough local multi-persona code review passed and approved the change, and the changed unit's own tests were green — but an independent per-PR bot review then caught a real, user-visible regression. In both cases the library change looked correct in isolation; what broke was a **contract the consumers were built against**. The gap was never unit correctness. It was contract drift at the consumer boundary, invisible to a review focused on the changed function.

## Guidance

When you change a library function's behavior or return shape, explicitly trace and verify its **consumers** — callers, hooks, UI state classifiers, and any code that interprets its errors or partial results — not just the function itself.

1. **Treat "the changed unit's tests pass" as necessary but not sufficient.** Add at least one consumer-level assertion that proves the downstream contract still holds (e.g. a UI test that the consumer renders correctly for the new result shape).
2. **Enumerate consumers before changing a shared contract.** A behavior the old code path enforced (a filter, a default, an ordering) can silently disappear in a rewrite. Grep for callers and read how each interprets the result.
3. **Keep an independent second review lane** (a bot, or a different reviewer persona) precisely *because* it does not share the author's unit-focused mental model. It will reach for the consumer-side blast radius the author's review skips.
4. **Re-examine "low-priority residual" findings before deferring them.** A finding that looks cosmetic at the unit level can be a contract regression at the consumer level. Check the blast radius before downgrading it.
5. **When a function gains a new partial/error state, audit every consumer that branches on success vs failure.** A new result-union member changes the classification logic downstream.

## Why This Matters

This is exactly how a regression ships behind a green review. The blast radius lands on the consumer side — where the behavior users actually see lives — while the review signed off on a correct-looking unit. Thorough-but-unit-focused review has a **predictable blind spot**: it validates the changed function, not the contracts the surrounding code depends on. Naming the blind spot lets you cover it deliberately instead of relying on a second reviewer to catch it after the fact.

## When to Apply

- Changing a shared/exported function's signature or return shape
- Rewriting a function consumed by hooks, UI, or orchestration code
- Extending an error/result union with a new member
- Switching implementation paths inside a library API
- Any change where consumers branch on partial success vs fatal failure

## Examples

### 1. A rewrite silently dropped a filtering contract

`discoverUserTokens` was rewritten to enumerate wallet tokens via an external API. The new path capped results by count but dropped the `minBalanceThreshold` filter the old path applied — a behavior-contract regression for any caller that set the threshold. The enumeration unit tests passed; no test asserted the threshold contract.

Before (regressed):

```ts
const balances = await fetchWalletTokenBalances(client, userAddress)
// minBalanceThreshold filtering was lost in the rewrite
const cappedBalances = balances.slice(0, discoveryConfig.maxTokensPerChain)
```

After (fixed):

```ts
const thresholdBalances = balances.filter(b => b.balance >= discoveryConfig.minBalanceThreshold)
const cappedBalances = thresholdBalances.slice(0, discoveryConfig.maxTokensPerChain)
```

### 2. A consumer treated partial success as fatal

A library fix made `discoverUserTokens` return **partial** results — some tokens plus an `UNSUPPORTED_CHAIN` error — when one chain in the set is unmapped. But the UI consumer classified *any* non-auth discovery error as fatal, so a partial success rendered the full-screen "Could not scan wallet" error instead of the tokens that were found.

Before (regressed — `components/web3/token-list.tsx`):

```tsx
const hasDiscoveryError = safeDiscoveryErrors.length > 0 && !hasAuthMissing
// any non-auth error → fatal screen, even when tokens were discovered
```

After (fixed):

```tsx
// UNSUPPORTED_CHAIN is a partial-discovery warning, not a fatal failure.
const fatalDiscoveryErrors = safeDiscoveryErrors.filter(
  e => e.type !== 'AUTH_MISSING' && e.type !== 'UNSUPPORTED_CHAIN',
)
const hasDiscoveryError = fatalDiscoveryErrors.length > 0 && discoveredTokens.length === 0
```

## Related

- `docs/brainstorms/2026-06-21-wallet-token-enumeration-requirements.md` — the feature whose discovery rewrite surfaced both regressions.
- Both regressions were caught by the per-PR Fro Bot review after a green local `ce:review`, which is the empirical basis for keeping an independent review lane.
