---
date: 2026-09-20
topic: wallet-test-disposition
---

# Wallet Test Disposition

## Summary

Resolve every skipped and misnamed test in the wallet and discovery suites. Three scenarios move to the browser harness, two are rewritten to describe what they can actually prove, two are diagnosed and fixed as unit tests, and one misnamed file is renamed. Issue #1171 closes with a recorded gap rather than a coverage claim the suite cannot support.

---

## Problem Frame

Seven tests are skipped and one is misnamed. The disposition is not uniform, and issue #1171's framing — "migrate jsdom-limited wallet integration tests to E2E" — treats them as one group.

Five skips in `hooks/use-wallet.integration.test.ts` share a stated reason: jsdom cannot update hook state through `renderHook` after mock changes. Two of those describe browser behavior with no jsdom equivalent, one is a hook-integration scenario, and two are named for wallet brands the project cannot automate.

The remaining two skips are unrelated. `hooks/use-token-discovery.test.tsx` and `hooks/use-token-price.test.tsx` each carry a skip with no stated reason, and both appear to be react-query async-state problems rather than environment limitations. Migrating them to a browser suite would move a broken unit test rather than fix it.

Separately, `components/web3/__tests__/token-workflows.e2e.test.tsx` is named as an E2E test and is a jsdom test with mocked hooks. Its own header says so.

The issue's triage comment reports ten skipped scenarios in the wallet integration file. There are five — the legacy multi-chain scenarios the comment counted were removed in #1172.

---

## Requirements

**Browser migration**

- R1. Reload persistence, disconnect cleanup, and error recovery are rewritten as browser tests using the harness from `docs/brainstorms/2026-09-20-e2e-burn-path-coverage-requirements.md`, and their `it.skip` blocks are removed.
- R2. The two wallet-brand scenarios are rewritten as generic injected-wallet connection tests covering connect, chain validation, and state transitions. They are renamed to describe what they verify rather than which wallet they once claimed to cover.
- R3. One smoke test confirms the AppKit modal opens and presents a wallet-selection surface.

**Unit test repair**

- R4. The skipped tests in `hooks/use-token-discovery.test.tsx` and `hooks/use-token-price.test.tsx` are diagnosed, fixed, and unskipped as jsdom unit tests. They are not migrated to the browser suite.
- R5. If either proves genuinely unfixable in jsdom, it is deleted with a stated reason rather than left skipped.

**Naming**

- R6. `components/web3/__tests__/token-workflows.e2e.test.tsx` is renamed to reflect that it is a jsdom integration test with mocked hooks.

**Issue closure**

- R7. Issue #1171 records that MetaMask and WalletConnect behavior remain unverified, that an injected provider cannot prove either, and that its triage comment's count of ten skipped scenarios was stale.

---

## Success Criteria

- No skipped test remains in the repository without a stated reason and a recorded disposition.
- No test name overstates what the test verifies.
- A reader of #1171 can tell which wallet behaviors are covered, which are deliberately out of scope, and which are simply unverified.

---

## Scope Boundaries

- Building the browser harness. That is specified in `docs/brainstorms/2026-09-20-e2e-burn-path-coverage-requirements.md` and is a prerequisite for R1–R3.
- Burn-path transaction verification.
- Real MetaMask, WalletConnect, or browser-extension automation.

---

## Key Decisions

- Fix the two react-query skips in place rather than migrating them: their stated problem is async state handling, not the environment. Moving a broken unit test into a browser suite hides the bug behind slower infrastructure.
- Rewrite the wallet-brand tests instead of porting them: an injected EIP-6963 provider is not MetaMask and is not WalletConnect. Keeping the original names would repeat the error that produced the misnamed `.e2e.tsx` file.
- Close #1171 with a documented gap: recording what remains unverified is more useful than a closure that implies coverage the suite does not have.

---

## Dependencies / Assumptions

- R1, R2, and R3 depend on the Playwright harness and injected wallet provider from the burn-path requirements document.
- R4, R5, and R6 have no harness dependency and can proceed independently.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R4][Technical] Whether the two react-query skips share a single root cause.
- [Affects R1][Technical] Whether reload persistence can be asserted through storage state alone or needs a full browser-context reload.
- [Affects R6][Technical] What the renamed file should be called, given the repo's co-located `*.test.tsx` convention.

---

## Sources / Research

- Issue #1171 — the tracking issue, including the triage comment whose skipped-scenario count is stale.
- #1172 — removed the legacy multi-chain scenarios the triage comment counted.
- `hooks/use-wallet.integration.test.ts` — the five wallet skips and their stated reason.
- `hooks/use-token-discovery.test.tsx` and `hooks/use-token-price.test.tsx` — the two unexplained skips.
- `components/web3/__tests__/token-workflows.e2e.test.tsx` — the misnamed jsdom test.
