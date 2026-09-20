---
title: 'feat: E2E burn path coverage'
type: feat
status: active
date: 2026-09-20
origin: docs/brainstorms/2026-09-20-e2e-burn-path-coverage-requirements.md
---

# feat: E2E burn path coverage

## Overview

Build a Playwright suite that verifies how the disposal flow constructs its burn transactions. A synthetic EIP-1193 wallet drives the running application in Chromium; outbound transactions are captured and decoded before submission so tests can assert recipient, amount, token contract, chain, and ordering. Discovery and receipt traffic are stubbed at the network boundary. The suite becomes a required pull-request check.

## Problem Frame

Disposal calls ERC-20 `transfer()` to `0x000000000000000000000000000000000000dEaD` with no approval step, no custody contract, and no recovery path. Every test proving that flow correct runs in jsdom against mocked wagmi hooks, so it cannot observe the calldata viem actually produced — the mock replaces the code that produces it (see origin: `docs/brainstorms/2026-09-20-e2e-burn-path-coverage-requirements.md`).

On Sepolia the immediate beneficiary is the maintainer, not end users holding value. This work exists to make a mainnet decision available, not to respond to present user harm.

## Requirements Trace

Requirement IDs refer to the origin document.

- R1–R5. Playwright harness, synthetic provider, request recording, unconditional `eth_accounts`, discovery stubbing.
- R6–R8. Decode and assert transaction construction; assert Sepolia; assert one sequential transaction per selected token.
- R9–R11. Assert confirmation gates block independently; assert failure does not abort the batch; assert confirm-step safety content.
- R12. Assert selection keys off contract address, not symbol.
- R13–R15. Assert in-progress states, accessibility, and escape paths.
- R16. Assert what the wallet is asked to sign matches what was displayed.
- R17–R18. Required per-PR check; measure before tuning.

## Scope Boundaries

- On-chain settlement. No local chain, no real receipts, no post-burn balance verification.
- Real wallet software, WalletConnect relay behavior, live Sepolia transactions from CI.
- Cross-browser coverage, sharding, visual regression.
- **Value-dependent confirmation branches**, which Unit 6 removes rather than tests. `hooks/use-token-filtering.ts:304` is the only production call site of `categorizeToken` and passes `undefined` for metadata, so `priceUSD` and therefore `estimatedValueUSD` are always undefined and `TokenValueClass` is always `UNKNOWN`. Every token demands typed confirmation, the confirm step's per-token value always reads "Value unknown", and the threshold logic in `requiresTypedConfirmation` is dead code that unit tests reach only by passing metadata directly. The behavior fails safe. The suite does not cover branches production cannot reach; the inert pricing path is tracked separately.
- Mid-batch disconnect is no longer a scope boundary. Unit 5 fixes the cascade, so Unit 10 asserts the corrected behavior directly instead of hedging with sentinels.

### Deferred to Separate Tasks

- Disposition of existing skipped and misnamed tests: `docs/brainstorms/2026-09-20-wallet-test-disposition-requirements.md`, serving issue #1171.
- Settlement-level verification for fee-on-transfer tokens, `false`-returning ERC-20s, and on-chain-only reverts: the named follow-up gate in the origin document.

## Context & Research

### Relevant Code and Patterns

- `components/web3/disposal-flow.tsx` — `select → confirm → dispose → results` state machine. `DisposalExecutor` is keyed by token address and remounts per token; `handleDisposalComplete` appends a result and advances the index.
- `hooks/use-token-disposal.ts` — exports `BURN_ADDRESS`. Runs `useSimulateContract` then writes only `simulateData.request`, never blind.
- `lib/web3/alchemy-endpoints.ts` — `getAlchemyEndpoint` builds `https://eth-sepolia.g.alchemy.com/v2/{key}` from `NEXT_PUBLIC_ALCHEMY_API_KEY`.
- `lib/web3/token-discovery.ts` — constructs its own `createPublicClient` against that endpoint. Does not reuse the wagmi config.
- `lib/web3/transaction-queue.ts` — polls `waitForTransactionReceipt` on a 5s interval with 1s internal polling. `TransactionQueue` renders on both the dispose and results steps.
- `lib/web3/token-filtering.ts` — `TokenValueClass` drives `requiresTypedConfirmation`.
- `.github/actions/setup/action.yaml` — Node 22, pnpm, dependency and build caching. The Playwright job reuses this.
- Existing accessible handles in the confirm step: `role="alert"` warning, `Copy burn address` label, acknowledgement checkbox label, `Type BURN…` input label, `Cancel` / `Confirm Burn` buttons.

### Institutional Learnings

- `docs/solutions/workflow-issues/library-changes-need-consumer-verification-2026-06-21.md` — verify at the consumer, not the helper. Assertions should observe app-rendered behavior, not just that an underlying function returned the right value.
- `docs/solutions/workflow-issues/research-provider-error-shapes-2026-06-21.md` — provider failures arrive in multiple wire shapes. This repo already handles Alchemy auth errors in two distinct viem shapes. Failure stubs must model real shapes, not one invented status.

### External References

- EIP-6963 announce/request handshake: https://eips.ethereum.org/EIPS/eip-6963
- Playwright CI guidance (single worker, install only the browser under test): https://playwright.dev/docs/ci

### Spike Evidence

A throwaway spike (branch deleted; findings retained) proved against the running app:

- AppKit discovers a hand-written provider announced over EIP-6963.
- Connect requires **zero** modal interaction — wagmi's silent reconnect calls `eth_accounts`, and returning an account unconditionally auto-connects.
- Minimum `info`: `rdns` only. Minimum RPC for connect: `eth_accounts` + `eth_chainId`.
- Announce-once is never discovered, even delayed. A persistent `eip6963:requestProvider` listener that re-announces is mandatory.
- `pnpm dev` works as the Playwright `webServer`.

## Prior-Art Survey

```json
{
  "schema_version": 2,
  "verdict": "build-new-within-scope",
  "scope": "repo root, with focused search across components/web3/__tests__/, hooks/, scripts/, vitest.setup.ts, and .storybook/",
  "freshness": {
    "vcs_reference": "c4f41f2e77d7f4fb334129d7bd5f51c73bbd14df"
  },
  "budget": {
    "max_search_passes": 2,
    "max_candidate_inspections": 6,
    "exhausted": false
  },
  "candidates": [
    {
      "path_or_symbol": "components/web3/__tests__/token-workflows.e2e.test.tsx",
      "description": "Vitest/jsdom 'E2E' workflow test with mocked wagmi/AppKit and token/wallet factories; exercises component flows and selection logic.",
      "disposition": "insufficient",
      "insufficiency_reason": "It mounts components in jsdom with mocked hooks, so it cannot observe the running app, real browser events, or outbound JSON-RPC/transaction traffic."
    },
    {
      "path_or_symbol": "hooks/use-token-disposal.test.ts",
      "description": "Hook test that asserts useSimulateContract -> writeContract uses the simulated request object and the burn-address constant.",
      "disposition": "insufficient",
      "insufficiency_reason": "It verifies hook behavior only through mocks; there is no browser, no rendered UI, and no live interception of wallet RPC traffic."
    },
    {
      "path_or_symbol": "vitest.setup.ts",
      "description": "Shared jsdom bootstrap with accessibility matchers and global DOM mocks (localStorage, matchMedia, canvas, next/dynamic).",
      "disposition": "insufficient",
      "insufficiency_reason": "This only supports the unit-test runner; it cannot host a browser E2E gate or capture the app's real outbound network/RPC traffic."
    },
    {
      "path_or_symbol": ".storybook/main.ts / .storybook/preview.ts",
      "description": "Storybook configuration with story globs, addon-interactions, and AppKit/Wagmi decorators around rendered stories.",
      "disposition": "insufficient",
      "insufficiency_reason": "It provides a component playground, but there is no Storybook test-runner, no play-function coverage, and no CI job that executes it as a browser gate."
    },
    {
      "path_or_symbol": "scripts/validate-web3-integration.ts",
      "description": "Static validation script for Web3 provider-chain and component/file presence, including Reown AppKit and Wagmi integration checks.",
      "disposition": "insufficient",
      "insufficiency_reason": "It is a file/config validator; it does not drive the live application, inspect transaction construction in a browser, or assert against JSON-RPC traffic."
    },
    {
      "path_or_symbol": "scripts/validate-design-system.ts",
      "description": "Static validator for design-system completeness, component tests/stories, and Storybook configuration.",
      "disposition": "insufficient",
      "insufficiency_reason": "It checks component/storybook completeness only; it does not run a browser, exercise wallet flows, or verify transaction construction."
    }
  ]
}
```

## Key Technical Decisions

- **Two interception layers, not one.** The injected provider captures `eth_sendTransaction`, but `TransactionQueue` polls for receipts through `wagmiConfig.getClient()` — a *different* transport from the Alchemy discovery endpoint. Receipt routing must target the wagmi Sepolia transport (`NEXT_PUBLIC_SEPOLIA_RPC_URL`, falling through to the chain default) or match on JSON-RPC method regardless of host. Routing only the Alchemy URL intercepts nothing and the queue spins to timeout.
- **Configurable latency in the provider.** An instantly-responding provider moves through `queued → simulating → writing → success` within one tick, so transient states never paint. Per-method delay is what makes them observable.
- **Displayed-versus-signed uses a non-18-decimal token.** The confirm step renders a formatted balance while the wallet receives a raw `uint256`, and decimals appear nowhere in the DOM, so the fixture must own the mapping. That alone would be near-circular — the fixture supplies the decimals the app formats with *and* the decimals the test reconciles with. Using a 6-decimal fixture token breaks the circularity for the defect class that matters: an app that assumes 18 decimals anywhere in the display path produces a mismatch the test catches.
- **The burn address is stated literally in tests, not imported.** Importing `BURN_ADDRESS` from the application would move both sides of the assertion together, so a mutated constant would still pass. The expected recipient is written out in the test as an independent statement of intent.
- **Test affordances added to shipped components.** Token rows are clickable `div`s with icon-only controls. Stable hooks are added to the components rather than relying on text or position matching, which would make the suite brittle against copy changes.
- **Disconnect behavior left unasserted.** Asserting the current cascade would cement a defect. Recorded in Scope Boundaries.
- **Gate assertions use DOM state plus a no-side-effect check, never a click.** Playwright's real `.click()` hangs against this app's rendered page — reproduced at blank coordinates with no element present, while JS stayed responsive, so it is Chromium's input-ACK path and not app CSS. `dispatchEvent('click')` was verified safe: a native `disabled` button suppresses the event entirely and records zero transactions. Gate tests therefore assert `toBeDisabled()` **and** that no `eth_sendTransaction` was recorded. The second assertion is what catches a regression where someone swaps the native `disabled` attribute for `aria-disabled` without gating the handler.
- **Exclude the suite from Vitest.** `test.exclude` gains the Playwright directory so `pnpm test` does not collect browser specs. One config line.
- **The harness is fenced off from the application build.** Directory placement is not a boundary. Nothing under `e2e/` may be reachable from application code, and CI enforces that rather than trusting convention.

## Open Questions

### Resolved During Planning

- Does AppKit discover a hand-written EIP-6963 provider? Yes — spike-verified, no modal interaction needed.
- Dev server or production build for `webServer`? Dev server; the spike ran green and it is faster to iterate.
- Where is the discovery seam? `getAlchemyEndpoint`'s constructed URL, intercepted by Playwright route matching.

### Deferred to Implementation

- Whether the spoofed-metadata fixture is a fabricated token in the discovery stub or a deployed Sepolia impersonator.
- Exact latency values that make transient states reliably observable without inflating suite runtime.
- Whether accessibility assertions use a library or direct role/name queries.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
Playwright test
  │
  ├─ addInitScript ──────────► synthetic EIP-1193 provider (in page)
  │                              • announces over EIP-6963, re-announces on request
  │                              • eth_accounts returns account unconditionally → silent reconnect
  │                              • records every request
  │                              • optional per-method delay
  │                              • eth_sendTransaction → record + return stub hash
  │
  ├─ page.route ─────────────► Alchemy discovery endpoint → fixture token balances + metadata
  │
  └─ page.route ─────────────► RPC eth_getTransactionReceipt → synthetic success receipt
                                 (keeps TransactionQueue from spinning)

  assertions read: recorded requests (decoded with viem) + rendered DOM
```

## Delivery

One branch, one pull request, covering every unit below plus the requirements and plan documents. `feat/e2e-burn-path-coverage`.

Unit 4 modifies shipped components while the rest is test infrastructure. That is not grounds for a separate pull request here: Unit 5 cannot select tokens deterministically without it, so splitting them would create a cross-PR dependency and force a rebase between two open reviews.

Order of work, driven by dependencies rather than preference:

1. Unit 1 — nothing else runs without the harness.
2. Unit 2 — Unit 3's scenarios need a connected wallet to observe.
3. Unit 3 and Unit 4 — independent of each other once Unit 2 lands.
4. Units 5–7 — product fixes, independent of each other, before the assertions that cover them.
5. Unit 8, then Units 9 and 10.
6. Unit 11 last, so CI gates a suite that already passes locally.

Running two Playwright suites concurrently against the same port either collides or silently reuses the wrong dev server. Units execute in sequence in one worktree unless a unit explicitly needs otherwise.

---

## Implementation Units

- [ ] **Unit 1: Playwright harness scaffold**

**Goal:** A runnable browser test harness that does not interfere with the existing unit suite.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/README.md`
- Modify: `package.json` (add `@playwright/test`, add `test:e2e` script)
- Modify: `vitest.config.ts` (add `test.exclude` entry for `e2e/**`)
- Modify: `.gitignore` (`test-results/`, `playwright-report/`)

**Approach:**
- Chromium only, one worker, one retry, trace on retry.
- `webServer` runs `pnpm dev`, reusing an existing server locally.
- Confirm `pnpm test` collects nothing under `e2e/`.
- Establish the production boundary: `e2e/` is excluded from the app's TypeScript build scope, and a check fails if any module under `app/`, `components/`, `hooks/`, or `lib/` imports from `e2e/`.

**Patterns to follow:** Existing script naming in `package.json`; `scripts/validate-web3-integration.ts` as the precedent for a repo-level static check.

**Test scenarios:**
- Happy path: a trivial spec under `e2e/` runs via `pnpm test:e2e`.
- Integration: `pnpm test` completes without collecting any file under `e2e/`.
- Error path: an import of `e2e/` from application source fails the boundary check.

**Verification:** Both runners execute independently; the boundary check rejects a deliberately-added import from application code into `e2e/`.

---

- [ ] **Unit 2: Synthetic wallet provider**

**Goal:** A provider the app discovers and connects to, that records everything and can be slowed deliberately.

**Requirements:** R2, R3, R4

**Dependencies:** Unit 1

**Files:**
- Create: `e2e/fixtures/wallet-provider.ts`
- Create: `e2e/fixtures/wallet-provider.spec.ts`

**Approach:**
- Announce per EIP-6963 with conformant metadata; keep a persistent `eip6963:requestProvider` listener that re-announces.
- `eth_accounts` returns the account unconditionally so wagmi's silent reconnect connects with no modal.
- Record every request with method, params, and timestamp; expose to tests.
- Accept a per-method delay map so transient UI states can be held open.
- Generate the key in memory at test startup. It is never written to disk, never committed, and never read from configuration — there is no code path that accepts a supplied key.
- Redact key material from recorded requests, logs, traces, and Playwright report artifacts.
- Abort the run if the derived account has a nonzero balance on the configured chain. A funded account in this harness means something is wrong.
- `eth_sendTransaction` records and returns a stub hash. It never broadcasts.

**Patterns to follow:** Spike evidence above for the minimum viable surface.

**Test scenarios:**
- Happy path: app auto-connects and displays the account with no modal interaction.
- Happy path: app reports Sepolia.
- Edge case: with a delay configured, a request observably takes at least that long.
- Edge case: two runs derive different accounts — no key is persisted between them.
- Error path: an unhandled RPC method rejects rather than returning undefined.
- Error path: a nonzero-balance account aborts the run with a clear message.

**Verification:** A test connects and reads the recorded request log without touching modal DOM. No key material appears in any emitted artifact.

---

- [ ] **Unit 3: Network stubbing**

**Goal:** Deterministic token discovery and resolved receipts, with no dependency on Alchemy or a live chain.

**Requirements:** R5

**Dependencies:** Unit 1

**Files:**
- Create: `e2e/fixtures/network-stubs.ts`
- Create: `e2e/fixtures/tokens.ts`
- Create: `e2e/fixtures/network-stubs.spec.ts`

**Approach:**
- Route the Alchemy discovery endpoint and serve fixture balances and metadata.
- Route the **wagmi Sepolia transport** separately for `eth_getTransactionReceipt`. This is a different host from discovery — the queue resolves its client via `wagmiConfig.getClient()`, which uses `NEXT_PUBLIC_SEPOLIA_RPC_URL` or the chain default. Prefer matching on JSON-RPC method so the route survives a transport change.
- The token fixture owns contract address, symbol, name, raw balance, decimals, and estimated value. At least one fixture token uses **6 decimals**, not 18, so the Unit 7 reconciliation can catch a hardcoded-18 assumption.
- Include a spoofed-metadata token whose symbol impersonates a well-known asset while its contract address differs.
- Model discovery failure using the error shapes this repo actually handles — both the bare HTTP status and the JSON-RPC error body — per the institutional learning above. A single invented status would test a fiction.

**Patterns to follow:** `lib/web3/alchemy-endpoints.ts` for the URL shape; `lib/web3/alchemy-token-api.ts` for the response shape and real error shapes.

**Test scenarios:**
- Happy path: fixture tokens appear in the selection list.
- Happy path: a submitted transaction reaches a settled state in the transaction queue.
- Error path: a stubbed discovery failure surfaces the app's explicit failure state, not an ambiguous empty list.
- Error path: each real provider error shape is handled — HTTP status and JSON-RPC body.
- Error path: a reverted receipt (`status: 'reverted'`) marks the transaction failed rather than confirmed. A success-only stub would never exercise this.
- Edge case: zero discovered tokens renders the empty state.

**Verification:** The suite runs with no Alchemy key present and produces identical results across runs. Receipt interception is confirmed by observing the queue settle, not by assuming the route matched.

---

- [ ] **Unit 4: Test affordances for token selection**

**Goal:** Deterministic handles for selecting a specific token by contract address.

**Requirements:** R6, R12

**Dependencies:** None

**Files:**
- Modify: `components/web3/token-list-item.tsx`
- Modify: `components/web3/token-list.tsx`
- Modify: existing co-located tests for both

**Approach:**
- Give each row a stable handle keyed on contract address and an accessible name for its selection control.
- Prefer accessible roles and names over bespoke attributes so the change improves the product rather than only serving tests.
- Behavior must not change.

**Execution note:** Assert the new accessible names in the existing jsdom tests first, then make them pass.

**Patterns to follow:** The confirm step already exposes good accessible names; mirror that.

**Test scenarios:**
- Happy path: a row's selection control is addressable by role and accessible name.
- Happy path: two tokens with identical symbols but different contracts are independently addressable.
- Integration: selection behavior is unchanged from before the edit.

**Verification:** `pnpm test`, `pnpm lint`, `pnpm type-check`, and `pnpm run validate:design-system` pass; no visual change.

---

Units 5–7 are product fixes for defects this work uncovered. They land before the assertions that depend on them so the tests encode corrected behavior rather than current behavior.

- [ ] **Unit 5: Halt the batch on global failure**

**Goal:** A wallet disconnect mid-batch stops the run instead of failing every remaining token.

**Dependencies:** None

**Files:**
- Modify: `components/web3/disposal-flow.tsx`
- Modify: `hooks/use-token-disposal.ts`
- Test: co-located tests for both

**Approach:**
- `disposal-flow.tsx` advances the batch on any terminal error. That is correct for a token-specific revert — the existing comment explains a reverting token must not deadlock the flow — but wrong for a disconnect, which is global and gets counted as N independent failures.
- Distinguish global failure (disconnected wallet, unsupported network) from per-token failure. Global failure halts and surfaces one clear state; per-token failure keeps advancing as today.
- Do not change per-token failure behavior. That path is already correct and regression-tested.

**Execution note:** Add a failing test reproducing the cascade first.

**Test scenarios:**
- Happy path: per-token simulation failure still advances the batch.
- Edge case: disconnect mid-batch halts; remaining tokens are neither attempted nor marked failed.
- Edge case: the halted state names the cause rather than showing N connection errors.

**Verification:** A disconnect during a three-token batch produces one halt, not two failures.

---

- [ ] **Unit 6: Remove the unreachable value threshold**

**Goal:** `requiresTypedConfirmation` states what it actually does.

**Dependencies:** None

**Files:**
- Modify: `components/web3/disposal-flow.tsx`
- Modify: `components/web3/disposal-flow.test.tsx`

**Approach:**
- `estimatedValueUSD` is never populated, so the `>= $10` / `MEDIUM_VALUE` / `HIGH_VALUE` branches never execute. Their unit tests pass only because they inject metadata the app never supplies.
- Delete the dead branches. Typed confirmation is required for every token; say so directly.
- Remove the tests that exercised the unreachable branches rather than rewriting them — they assert behavior production cannot reach.
- No behavior change. This makes existing behavior legible.

**Test scenarios:**
- Happy path: typed confirmation is required for every token.
- Test expectation: no new behavior — deletion only. Existing gate tests must still pass unchanged.

**Verification:** Gate behavior is identical before and after; the surviving tests exercise only reachable code.

---

- [ ] **Unit 7: Stop price lookups throwing on unsupported chains**

**Goal:** No repeating background failure on every disposal page load.

**Dependencies:** None

**Files:**
- Modify: `hooks/use-token-price.ts`
- Modify: co-located test

**Approach:**
- `CHAIN_TO_PLATFORM` covers chains 1, 137, and 42161 — leftovers from the pre-rebaseline multi-chain scope. Sepolia is absent, so `fetchTokenPrices` throws `Unsupported chain ID: 11155111` on every call and react-query retries it continuously.
- Return an absent price for unsupported chains instead of throwing. A chain without a price platform is an expected condition, not an error.
- Keep the existing mainnet entries. A future mainnet decision wants them.

**Test scenarios:**
- Happy path: a supported chain still resolves prices.
- Edge case: an unsupported chain returns no price and raises no error.
- Error path: a genuine fetch failure still surfaces as an error.

**Verification:** Loading the disposal flow on Sepolia produces no repeating console error.

- [ ] **Unit 8: Burn transaction construction assertions**

**Goal:** Prove the transaction the app builds is the transaction intended, and that selection limits hold. This is the unit the suite exists for.

**Requirements:** R6, R7, R8, R12

**Dependencies:** Units 2, 3, 4, and the product fixes in 5-7

**Files:**
- Create: `e2e/burn-construction.spec.ts`
- Create: `e2e/helpers/decode-transaction.ts`

**Approach:**
- Decode each recorded `eth_sendTransaction` with viem's ABI utilities.
- Assert function is ERC-20 `transfer`, recipient is `BURN_ADDRESS`, amount equals the token's full raw balance, and `to` is the intended contract.
- Assert chain is Sepolia on every outbound transaction.
- Assert exactly one transaction per selected token, submitted sequentially, with no unselected contract present.
- State the expected recipient literally in the test. Do **not** import `BURN_ADDRESS` from the application — that would move both sides of the assertion together and let a mutated constant pass.

**Test scenarios:**
- Happy path: three tokens with distinct balances produce three correctly-decoded transfers in order.
- Happy path: every outbound transaction carries chain 11155111.
- Edge case: a token deselected before confirming produces no transaction.
- Edge case: a single-token burn produces exactly one transaction.
- Edge case: zero tokens selected leaves the advance control disabled.
- Edge case: exceeding the batch cap surfaces the limit message and blocks advancing.
- Integration: a spoofed-metadata token burns its own contract, not the impersonated one.
- Integration: selecting the spoofed token selects it by contract address in the UI — the impersonated asset is not selected and not burned.

**Verification:** Mutating the application's burn-address constant, the transferred amount, or the target contract each fail the suite. Confirm by actually making each mutation once.

---

- [ ] **Unit 9: Confirmation gate assertions**

**Goal:** Prove each confirmation gate independently blocks, including the path that requires no typed confirmation.

**Requirements:** R9, R11, R14, R15

**Dependencies:** Units 2, 3, 4, and the product fixes in 5-7

**Files:**
- Create: `e2e/burn-gates.spec.ts`

**Approach:**
- Assert confirm is disabled until acknowledgement, and until typed confirmation matches exactly where required.
- The **checkbox-only path is unreachable in production and is not tested.** See Scope Boundaries — estimated value is never populated, so typed confirmation is always required. Asserting that path would require fabricating state the app cannot produce.
- Cover exact-match strictness: lowercase and surrounding whitespace must not satisfy it.
- Assert confirm-step safety content: permanence warning present, burn address rendered in full, per-token contract address and value-or-unknown shown.
- Assert escape paths: cancelling returns to selection and clears gate state; the results reset returns to a usable selection state.
- Assert accessibility: warning region exposed to assistive technology, acknowledgement and typed input have accessible names.

Selection-limit behavior (zero selected, batch cap) belongs to Unit 8, which already owns selection semantics.

**Test scenarios:**
- Happy path: all gates satisfied enables confirm.
- Edge case: acknowledgement alone, with typed confirmation required, leaves confirm disabled and produces no transaction.
- Edge case: `burn` lowercase and `" BURN "` padded both leave confirm disabled.
- Edge case: typed confirmation is demanded for every token, because estimated value is never populated. Assert this rather than a checkbox-only path.
- Edge case: changing selection count after typing invalidates the previously-correct phrase.
- Happy path: cancelling from confirm returns to selection with gate state cleared.

**Verification:** No transaction is ever recorded in any blocked-gate scenario.

---

- [ ] **Unit 10: Failure path, in-progress states, and displayed-versus-signed agreement**

**Goal:** Prove a mid-batch failure does not abort the batch, that transient states are visible, and that the wallet is asked to sign what the user saw.

**Requirements:** R10, R13, R16

**Dependencies:** Units 2, 3, 5, 8

**Files:**
- Create: `e2e/burn-failure-and-states.spec.ts`

**Approach:**
- Fail one token's simulation via the provider and assert the batch advances, remaining tokens still burn, and results distinguish succeeded from failed.
- Use the provider's configurable delay to hold simulating and awaiting-approval states open long enough to assert.
- For displayed-versus-signed: read the rendered formatted amount, look up decimals from the token fixture, and assert the recorded raw value matches. Also assert the displayed contract and destination match the recorded transaction.
- Run this against the **6-decimal** fixture token specifically. Against an 18-decimal token the check is near-circular, since the fixture supplies the decimals on both sides. With 6 decimals, an app that assumes 18 anywhere in the display path fails.
- Be precise about what this proves: the app did not corrupt the amount between display and signature, and it did not confuse one token's balance for another's. It does **not** independently verify the app's decimal handling against an external source.
- Assert the corrected disconnect behavior from Unit 5: the batch halts, remaining tokens are neither attempted nor marked failed, and one clear cause is surfaced.

**Test scenarios:**
- Happy path: the second of three tokens fails; the first and third still produce transactions.
- Happy path: results report one failure and two successes.
- Happy path: with delay configured, per-token simulating and awaiting-approval states are observable.
- Happy path: displayed amount, reconciled through fixture decimals, equals the signed raw value.
- Edge case: a token whose failure is a rejected signature rather than a failed simulation is still recorded as failed.
- Edge case: a mid-batch disconnect halts the batch — no further transactions, remaining tokens untouched, one cause shown rather than a list of connection errors.

**Verification:** Per-token failure is contained to that token; a global failure halts the batch. No token is skipped or burned twice.

---

- [ ] **Unit 11: CI integration**

**Goal:** The suite gates pull requests without inflating cost.

**Requirements:** R17, R18

**Dependencies:** Units 1-10

**Files:**
- Modify: `.github/workflows/ci.yaml`

**Approach:**
- Add an `e2e` job reusing `.github/actions/setup`, plus a Chromium-only install step.
- Chromium, one worker, one retry. Upload the Playwright report on failure only.
- Run the job with a strict environment allowlist. Production Alchemy keys, WalletConnect project credentials, and any wallet secret are explicitly absent — the suite is stubbed and needs none of them. Fail the job if one is present rather than letting a destructive-flow harness run with live credentials.
- Add the job to the gate chain so `build` depends on it.
- Record observed duration in the pull request. Tune trigger scope or parallelism only after real timings exist.

**Patterns to follow:** The `test` and `security-audit` jobs in the same workflow.

**Test scenarios:**
- Test expectation: none — CI configuration change. Verified by observing the job on the pull request itself.

**Verification:** The job runs on the PR, passes, and its duration is recorded.

## System-Wide Impact

- **Interaction graph:** Unit 4 touches shipped components (`token-list-item.tsx`, `token-list.tsx`). Existing co-located tests and stories must continue to pass unchanged.
- **Error propagation:** Discovery failure stubs must reproduce this repo's real provider error shapes; a single invented status would test a fiction.
- **State lifecycle risks:** The batch loop advances on completion regardless of outcome. Tests must distinguish "advanced because the token finished" from "advanced because it failed instantly."
- **API surface parity:** None. No public interface changes.
- **Integration coverage:** The two-layer interception is the crux — in-page provider plus network routing. Provider-only leaves the transaction queue unresolved.
- **Unchanged invariants:** `useSimulateContract`-before-write is not modified. Disposal behavior is unchanged by this plan. The burn address constant itself is untouched — tests assert against it from the outside.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Transient-state assertions flake under CI load | Delays are explicit and configurable per method, not races against real timing. One retry configured. |
| Test affordances drift from product intent | Prefer accessible roles and names, which improve the product independently of tests. |
| Suite becomes slow enough to discourage PRs | Measure first, tune after. Chromium only, one worker, no sharding until timings justify it. |
| Green suite misread as mainnet readiness | The origin document names the coverage limits; the CI job asserts construction only. |
| Fixture decimals drift from fixture balances | Both live in one fixture module; a mismatch fails Unit 7's comparison immediately. |
| Test fixtures reach the production bundle | Unit 1 establishes an enforced import boundary rather than relying on directory placement. |
| Stubs make assertions tautological | Unit 5 states the burn address independently; Unit 7 uses a non-18-decimal token; Unit 3 includes a reverted-receipt case. Each breaks a circularity the fixture would otherwise create. |

## Documentation / Operational Notes

- `e2e/README.md` states what the suite does and does not prove, and points at the settlement follow-up.
- `AGENTS.md` gains the `test:e2e` command once the script exists.

## Sources & References

- **Origin document:** `docs/brainstorms/2026-09-20-e2e-burn-path-coverage-requirements.md`
- Companion: `docs/brainstorms/2026-09-20-wallet-test-disposition-requirements.md` (issue #1171)
- Strategic context: `docs/brainstorms/2026-06-21-mainnet-readiness-spike.md` (blocker B3)
- Related code: `components/web3/disposal-flow.tsx`, `hooks/use-token-disposal.ts`, `lib/web3/transaction-queue.ts`, `lib/web3/alchemy-endpoints.ts`
- EIP-6963: https://eips.ethereum.org/EIPS/eip-6963
- Playwright CI: https://playwright.dev/docs/ci
