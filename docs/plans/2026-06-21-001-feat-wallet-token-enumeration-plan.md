---
title: "feat: Wallet token enumeration (real discovery)"
type: feat
status: active
date: 2026-06-21
origin: docs/brainstorms/2026-06-21-wallet-token-enumeration-requirements.md
---

# feat: Wallet Token Enumeration (Real Discovery)

## Overview

Replace the hardcoded-list token discovery in `lib/web3/token-discovery.ts` with real wallet enumeration via Alchemy's Token API (`alchemy_getTokenBalances` + `alchemy_getTokenMetadata`), called browser-direct through viem `publicClient.request()`. This makes the app surface the unwanted junk a wallet actually holds — the abandoned/airdropped/dead tokens that are the product's reason to exist — instead of a curated ~10-address blue-chip list. The `useTokenDiscovery` hook's public contract is preserved; the rewrite is internal to `discoverUserTokens()`.

This is the load-bearing prerequisite for mainnet (spike path A). It makes discovery *correct*; it does not flip the chain. This effort prepares the plumbing and validates via fixtures — it is not validated production mainnet UX.

## Problem Frame

`lib/web3/token-discovery.ts` iterates `COMMON_TOKEN_ADDRESSES[chainId]` (~10 well-known addresses) and calls `balanceOf` on each — it never enumerates what the wallet holds. Junk/scam/dead tokens are invisible because they are not in any curated list. On mainnet the app would find essentially nothing to dispose while claiming to clean wallets (see origin: `docs/brainstorms/2026-06-21-wallet-token-enumeration-requirements.md`, and the spike `docs/brainstorms/2026-06-21-mainnet-readiness-spike.md`).

## Requirements Trace

- R1–R5. Real Alchemy enumeration (balances + metadata, browser-direct viem), full pagination, zero-balance exclusion, best-effort metadata, stable `useTokenDiscovery` contract.
- R6–R8. Spam surfaced + badged; attacker-controlled display fields sanitized; simulate-preflight (burn) + display sanitization both hold.
- R9–R11. Alchemy key drives discovery; explicit "discovery unavailable" when absent (no hardcoded fallback); explicit "could not scan wallet" on API failure; four distinct UX states.
- R9a–R9d. Distinct loading/empty-success/error/unavailable states; spam badge filterable + never auto-selected; many-token list scaling; privacy disclosure for wallet→Alchemy.
- R12–R13. Fix wrong mainnet USDC address; audit `KNOWN_VALUABLE_TOKENS`.
- R14–R15. Mainnet-scale-correct enumeration; `SUPPORTED_NETWORKS_V1` stays `[sepolia]`.

**Requirements-to-unit map (every R1–R15 must appear):**

| Requirement | Unit(s) |
|-------------|---------|
| R1 | 1, 3, 4 |
| R2 | 3 |
| R3 | 3 |
| R4 | 3 |
| R5 | 4, 7 |
| R6 | 4, 6 |
| R7 | 2, 4 |
| R8 | 4 |
| R9 | 1, 4, 6 |
| R9a | 6 |
| R9b | 6 |
| R9c | 6 |
| R9d | 6b |
| R10 | 4, 7 |
| R11 | 4 |
| R12 | 5 |
| R13 | 5 |
| R14 | 4 |
| R15 | 4 |

## Scope Boundaries

- N1. Irreversibility UX on the confirm step.
- N2. E2E coverage (tracked in #1171).
- N3. Flipping `SUPPORTED_NETWORKS_V1` to mainnet.
- N4. Server-side proxy for the Alchemy key (browser-direct, domain-restricted key decided).
- N5. `alchemy-sdk` dependency (raw JSON-RPC via viem decided).

### Deferred to Separate Tasks

- Mainnet chain flip + its remaining gates (irreversibility UX, E2E): separate work once this lands.
- A persistent institutional-learnings layer (`docs/solutions/`): out of scope here.

## Context & Research

### Relevant Code and Patterns

- `lib/web3/token-discovery.ts` — `discoverUserTokens(config, userAddress, discoveryConfig)` (entry, delegated to by the hook), `discoverChainTokens`, `processBatch`, `fetchTokenMetadata`, `fetchTokenBalance`, `formatTokenBalance`, `COMMON_TOKEN_ADDRESSES` (R10 target). Types: `DiscoveredToken { address, symbol, name, decimals, balance: bigint, chainId, formattedBalance }` (no logo field — logos come from the separate enhanced-metadata pipeline), `TokenDiscoveryError { chainId, tokenAddress?, message, originalError?, type }`, `TokenDiscoveryResult { tokens, errors, chainsScanned, contractsChecked }`.
- Per-chain viem client: `lib/web3/transaction-queue.ts:322` (`wagmiConfig.getClient({chainId})`) is the closest analogue, but the wagmi transports map only has Sepolia — for other chains the rewrite must construct its own `createPublicClient({ chain, transport: http(alchemyUrl) })`.
- Env: `env.ts` uses `@t3-oss/env-nextjs` `createEnv` + zod; optional vars use `.optional()` (e.g. `NEXT_PUBLIC_SEPOLIA_RPC_URL`), required vars throw when absent. `experimental__runtimeEnv` must list every client key — omitting a key from `experimental__runtimeEnv` breaks client access even if schema validation passes. Access via `import {env} from '@/env'`.
- Filtering: `lib/web3/token-filtering.ts` — `KNOWN_VALUABLE_TOKENS` (wrong USDC at chain 1), `categorizeToken`, `calculateSpamScore` (heuristic, name/symbol/decimals patterns), `useUnwantedTokens`. `categorizeToken` already accepts optional metadata but call sites pass `undefined` today.
- Render sites (R7 targets): `components/web3/token-list-item.tsx` (symbol-initials avatar, no remote logo), `components/web3/token-detail.tsx:375-388` (the ONLY remote-logo load, via `backgroundImage: url(${metadata.logoURI})`; also `aria-label` interpolates `token.name`), `components/web3/disposal-flow.tsx` (name/symbol in select/confirm/results), `hooks/use-token-disposal.ts` + `hooks/use-token-approval.ts` (name/symbol in toasts/titles).
- Logo pipeline: `DiscoveredToken` has **no logo field**. Logos come from a separate pipeline — `EnhancedTokenMetadata` via `useTokenMetadata`/`fetchEnhancedTokenMetadata` — rendered at `components/web3/token-detail.tsx:375-388` as `backgroundImage: url(${metadata.logoURI})`. This pipeline bypasses the discovery sanitization boundary and requires its own sanitization at the render boundary (see KTD below).
- Tests: `vi.mock` with computed property names; `hooks/use-token-discovery.test.tsx` mocks the whole `token-discovery` module; `lib/web3/token-discovery.test.ts` is a 17-line stub that must be replaced.

### External References

- Alchemy `alchemy_getTokenBalances(address, "erc20", { maxCount: 100, pageKey? })` → `{ tokenBalances: [{ contractAddress, tokenBalance(hex) }], pageKey? }`; 20 CU/call; `maxCount` cap 100. `alchemy_getTokenMetadata(contractAddress)` → `{ name, symbol, decimals, logo }`; no batch variant; 10 CU/call. Endpoints `https://eth-{sepolia,mainnet}.g.alchemy.com/v2/<KEY>`. Free tier 30M CU/month, 500 CU/s. Domain allowlist for browser key. (Researched via librarian; CSP `connect-src https://*.alchemy.com` already covers both — verified.)

## Key Technical Decisions

- **Optional key + use-site check (R9 tension):** `NEXT_PUBLIC_ALCHEMY_API_KEY` is declared `.optional()` in the env schema (a required var would *throw* at validation, defeating the graceful "unavailable" state). `discoverUserTokens` checks for the key and returns an explicit `AUTH_MISSING` error (→ "discovery unavailable" UI) when absent. Never falls back to the hardcoded list.
- **Per-chain viem public client from the Alchemy URL:** construct `createPublicClient({ chain, transport: http(getAlchemyEndpoint(chainId)) })` for enumeration rather than reusing the Sepolia-only wagmi transport — this is what makes it mainnet-ready while staying chain-gated.
- **Raw JSON-RPC via `client.request()`**, no `alchemy-sdk` (N5).
- **Leave `fetchTokenMetadata` (on-chain ERC-20) intact**, add a new `fetchAlchemyTokenMetadata` alongside — `token-metadata.ts` imports and consumes the former (as `fetchBasicMetadata`, called inside `fetchOnChainMetadata` at line 314), so changing its signature would break `fetchEnhancedTokenMetadata`.
- **Layered spam signal, heuristic primary:** Alchemy metadata + existing `calculateSpamScore` heuristic + `KNOWN_VALUABLE_TOKENS` cross-check. `alchemy_getTokenMetadata` carries no explicit spam flag, so the heuristic stays the primary signal; Alchemy fields enrich it.
- **Sanitization as a shared boundary helper:** a new `lib/web3/display-sanitization.ts` applied inside `discoverUserTokens()` when constructing each `DiscoveredToken`, so every downstream render site inherits sanitized name/symbol — not per-component.
- **Two sanitization boundaries:** (a) name/symbol sanitized at the discovery boundary (covers list/disposal/approval render sites uniformly); (b) logo/description/website from the enhanced-metadata pipeline (`EnhancedTokenMetadata`) sanitized at the token-detail render boundary — this is a separate pipeline that bypasses the discovery boundary and must be handled explicitly in Unit 6.
- **Additive error types:** extend `TokenDiscoveryError.type` union with `'API_ERROR'` and `'AUTH_MISSING'` (additive; existing `type === 'RPC_ERROR'` assertions unaffected).
- **`contractsChecked` field name preserved:** the `TokenDiscoveryResult.contractsChecked` field name is kept for contract stability. Its meaning becomes the count of tokens enumerated (not contracts polled). Do not rename the field.
- **`config` arg lifecycle:** `discoverUserTokens(config, address, discoveryConfig)` currently receives the wagmi `Config`. If the rewrite builds its own per-chain Alchemy `createPublicClient`, the `config` arg may become dead. The implementing agent must explicitly decide: (a) whether `config` is still used (e.g. for the Sepolia wagmi path) or should be removed from the signature with all consumers updated, and (b) document the decision. Module-mock tests can pass even with a dead `config` arg — Unit 7 must include a real-path integration test to catch a broken integration.
- **`isSafeLogoUrl` CSS safety:** scheme allowlist alone is insufficient for the `backgroundImage: url(...)` CSS sink. The logo URL must also be CSS-safe — reject or encode characters that break out of `url()` (quotes, parentheses, whitespace, newlines). Prefer assigning via a safe DOM path if feasible; otherwise encode for CSS.
- **Homoglyph/confusable policy:** detect mixed-script / confusable identifiers (TR39-style skeleton check) and flag them as suspect (feeds the spam signal); do NOT silently rewrite them. Out-of-scope: full confusable rejection — document the residual phishing risk.
- **Metadata cache scope:** the in-memory cache in `fetchAlchemyTokenMetadataBatch` is scoped per-hook-instance or per-invocation, NOT a module-level singleton. A module-level singleton would leak stale metadata across wallet switches.
- **SSR boundary:** the new Alchemy `client.request()` path is client-only and must never run during SSR, in server components, or in route handlers. Discovery runs via the client hook; `config` has `ssr: true` but discovery is gated behind the hook lifecycle.

## Open Questions

### Resolved During Planning

- Key required-vs-optional → optional + use-site check (above).
- Spam signal source → layered, heuristic primary (above).
- Sanitization placement → shared boundary helper (above).
- `COMMON_TOKEN_ADDRESSES` removal safety → no non-test consumer relies on it; `useTokenExists` improves. Safe (R10).
- Error-shape compatibility → additive union extension fits existing `discoveryErrors`.

### Deferred to Implementation

- Exact metadata concurrency cap under Alchemy's 500 CU/s free tier for a worst-case ~300-token wallet — start at 8, tune against real throttling behavior (instrument and adjust; add backoff if needed).
- Whether the layered spam signal needs a future dedicated spam API (e.g. GoPlus) — out of scope now; the heuristic + Alchemy fields are the v1 signal.
- Whether `config` is still used after the rewrite or should be removed from the signature (see KTD above — must be resolved during Unit 4 implementation).

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
discoverUserTokens(config, userAddress, discoveryConfig)
  ├─ key missing?  → return { tokens: [], errors: [{ type: 'AUTH_MISSING' }], ... }
  └─ for each supported chainId:
       client = createPublicClient({ chain, transport: http(getAlchemyEndpoint(chainId)) })
       balances = fetchWalletTokenBalances(client, userAddress)   # paginate pageKey, filter non-zero
         └─ on failure → push { type: 'API_ERROR', chainId }  (explicit, not empty)
       metas    = fetchAlchemyTokenMetadataBatch(client, balances.addresses)  # concurrency-capped, cached, best-effort
       tokens   = balances.map(b => toDiscoveredToken(b, metas[b.address]))
                    └─ name/symbol passed through sanitizeTokenDisplay() at this boundary
→ TokenDiscoveryResult { tokens, errors, chainsScanned, contractsChecked }
```

UX state mapping (R9a) in the hook/consumer:
```
isLoading                          → "Scanning your wallet…"
isSuccess && tokens.length === 0   → "No disposable tokens found"   (empty-success)
errors has AUTH_MISSING            → "Discovery unavailable — configure key"
errors has API_ERROR               → "Could not scan wallet"        (retryable)
```

## Implementation Units

- [ ] **Unit 1: Alchemy key config + endpoint helper**

**Goal:** Add the optional Alchemy key to validated env and a chain→endpoint helper.

**Requirements:** R1, R9 (partial)

**Dependencies:** None

**Files:**
- Modify: `env.ts` (add `NEXT_PUBLIC_ALCHEMY_API_KEY: <schema>.optional()` to `schemas.client` AND to `experimental__runtimeEnv` — both are required; omitting `experimental__runtimeEnv` breaks client access even if schema validation passes)
- Modify: `.env.example` (document it, domain-restricted, optional)
- Create: `lib/web3/alchemy-endpoints.ts` (`getAlchemyEndpoint(chainId): string | undefined` mapping Sepolia/mainnet hosts; returns `undefined` when key absent or chain unmapped)
- Create: `lib/web3/alchemy-endpoints.test.ts`

**Approach:**
- Optional schema (not required) so a missing key yields graceful unavailable, not a validation throw.
- `getAlchemyEndpoint` returns `undefined` when `env.NEXT_PUBLIC_ALCHEMY_API_KEY` is empty — the signal `discoverUserTokens` uses to emit `AUTH_MISSING`.

**Patterns to follow:** `env.ts` optional-var pattern (`NEXT_PUBLIC_SEPOLIA_RPC_URL`); `lib/web3/chains.ts` for chain id constants.

**Test scenarios:**
- Happy path: `getAlchemyEndpoint(11155111)` returns the eth-sepolia URL with the key embedded.
- Happy path: `getAlchemyEndpoint(1)` returns the eth-mainnet URL.
- Edge case: returns `undefined` when key is absent/empty.
- Edge case: returns `undefined` for an unmapped chain id.

**Verification:** env validates with and without the key set; helper maps both supported hosts and degrades to `undefined`.

- [ ] **Unit 2: Display sanitization helper**

**Goal:** A reusable sanitizer for attacker-controlled token display fields (R7), including logo URL validation safe for the CSS `url()` sink.

**Requirements:** R7

**Dependencies:** None

**Files:**
- Create: `lib/web3/display-sanitization.ts` (`sanitizeTokenDisplay(s): string`, `isSafeLogoUrl(url): boolean`)
- Create: `lib/web3/display-sanitization.test.ts`

**Approach:**
- `sanitizeTokenDisplay`: strip control chars (U+0000–U+001F) and bidi/RTL overrides (U+202A–U+202E, U+2066–U+2069); Unicode-normalize (NFC); strip markup/URL fragments; truncate to a max length. Returns inert text.
- `isSafeLogoUrl`: allow `https:` only; reject `javascript:`/`data:`/other schemes. Additionally, the URL must be CSS-safe for the `backgroundImage: url(...)` sink — reject or encode characters that break out of `url()` (quotes, parentheses, whitespace, newlines). Prefer assigning via a safe DOM path if feasible; otherwise encode for CSS. Scheme allowlist alone is not sufficient.
- Homoglyph/confusable detection: detect mixed-script / confusable identifiers (TR39-style skeleton check) and flag them as suspect (feeds the spam signal); do NOT silently rewrite them. Document the residual phishing risk for cases not caught by the skeleton check.
- The helper must also expose logo validation usable by the enhanced-metadata/detail pipeline (Unit 6), since logos bypass the discovery boundary.
- Pure functions, no React.

**Patterns to follow:** existing `lib/web3/*` pure-util style; AGENTS.md no-`as any`.

**Test scenarios:**
- Happy path: ordinary `name`/`symbol` pass through unchanged.
- Edge case: RTL override char stripped; control chars stripped; NFC normalization applied.
- Edge case: overlong string truncated to max.
- Security: mixed-script / confusable identifier is flagged as suspect (not silently rewritten); benign strings are not flagged.
- `isSafeLogoUrl`: `https://example.com/logo.png` → true; `javascript:alert(1)` → false; `data:image/png,...` → false; `http://...` → false.
- CSS sink safety: a URL containing `"`, `'`, `)`, or newline characters is rejected or encoded by `isSafeLogoUrl` even if the scheme is `https:`.

**Verification:** known phishing payloads (RTL, control chars, scheme tricks, CSS breakout chars) are neutralized; benign strings untouched; confusables flagged without silent rewrite.

- [ ] **Unit 3: Alchemy token-API client**

**Goal:** Browser-direct balances + metadata via viem `request()`.

**Requirements:** R1, R2, R3, R4

**Dependencies:** Unit 1

**Files:**
- Create: `lib/web3/alchemy-token-api.ts` (`fetchWalletTokenBalances(client, address)`, `fetchAlchemyTokenMetadataBatch(client, addresses)`)
- Create: `lib/web3/alchemy-token-api.test.ts`

**Approach:**
- `fetchWalletTokenBalances`: `client.request({ method: 'alchemy_getTokenBalances', params: [address, 'erc20', { maxCount: 100, pageKey }] })`, loop on `pageKey` until exhausted, filter `tokenBalance` hex → bigint > 0n. Return `{ contractAddress: Address, balance: bigint }[]`.
- `fetchAlchemyTokenMetadataBatch`: per-address `alchemy_getTokenMetadata`, concurrency cap (start 8), in-memory cache keyed `chainId:address`. Cache is scoped per-invocation or per-hook-instance — NOT a module-level singleton (would leak stale metadata across wallet switches). A miss yields best-effort (`UNKNOWN` symbol), never throws.
- Errors bubble as typed results for the caller to map to `TokenDiscoveryError`.

**Execution note:** Implement test-first — mock viem `request` for the JSON-RPC contract.

**Patterns to follow:** viem `createPublicClient`/`request`; `transaction-queue.ts` client usage; web3-ops try/catch + `console.error`, never throw across the boundary.

**Test scenarios:**
- Happy path: single-page balances mapped to `{contractAddress, balance}`.
- Happy path: multi-page pagination follows `pageKey` until absent; results concatenated.
- Edge case: zero-balance entries filtered out.
- Edge case: metadata cache hit avoids a second request for a repeated address.
- Error path: a balances request rejection surfaces as a typed error (not a throw).
- Error path: a single metadata miss yields a best-effort token; the batch still resolves.
- Integration: concurrency cap bounds in-flight metadata calls (assert max concurrent).
- Wallet-switch: cache does not serve stale metadata across different wallet addresses (cache is not a module-level singleton).

- [ ] **Unit 4: Rewrite `discoverUserTokens`**

**Goal:** Replace the hardcoded-list loop with real enumeration; wire sanitization, AUTH_MISSING, API_ERROR, and the stable result shape.

**Requirements:** R1, R5, R6 (badge data), R7 (apply sanitizer), R8 (simulate-preflight + display sanitization both hold), R9, R10, R11, R14, R15

**Dependencies:** Units 1, 2, 3

**Files:**
- Modify: `lib/web3/token-discovery.ts` (rewrite `discoverUserTokens`/`discoverChainTokens`; remove `COMMON_TOKEN_ADDRESSES` as the discovery source, including the `COMMON_TOKEN_ADDRESSES[1]` USDC entry (Unit 5 does NOT edit `token-discovery.ts` for this); extend `TokenDiscoveryError.type` with `'API_ERROR' | 'AUTH_MISSING'`; apply `sanitizeTokenDisplay` to name/symbol when building `DiscoveredToken`)
- Modify: `lib/web3/token-discovery.test.ts` (replace the 17-line stub with real unit tests)

**Approach:**
- For each supported chain: build a per-chain Alchemy public client (Unit 1 endpoint), enumerate (Unit 3), map to `DiscoveredToken` with sanitized fields. Enumeration runs per supported chain and preserves `SUPPORTED_NETWORKS_V1 = [sepolia]` (R15).
- Key absent → single `AUTH_MISSING` error, empty tokens. Per-chain API failure → `API_ERROR` entry, not silent empty (R11).
- Preserve `DiscoveredToken` shape exactly (R5). Keep `fetchTokenMetadata` (on-chain) untouched; remove only the hardcoded-list discovery path.
- Keep the `contractsChecked` field name (contract stability); its meaning becomes the count of tokens enumerated. Do not rename the field.
- Explicitly decide whether the `config` arg is still used after the rewrite (see KTD). If it becomes dead, remove it from the signature and update all consumers; document the decision in code comments.
- Sanitization at this boundary covers name/symbol for all downstream render sites (list, disposal, approval). Logo/description/website from the enhanced-metadata pipeline are NOT covered here — they are handled at the token-detail render boundary in Unit 6.
- Invariant: `hooks/use-token-disposal.ts` and `hooks/use-token-approval.ts` consume only sanitized `DiscoveredToken` objects produced by discovery. These hooks build toast/title strings from `token.symbol`/`token.name` — because sanitization is applied here at the discovery boundary, they receive already-sanitized values.

**Test scenarios:**
- Happy path: enumerates real (mocked) balances incl. obscure tokens; sanitized name/symbol present.
- Edge case: zero-balance excluded; many-token wallet fully paginated (R14).
- Error path: no key → exactly one `AUTH_MISSING`, empty tokens, no hardcoded fallback.
- Error path: chain scan failure → `API_ERROR` in `discoveryErrors`, not empty success.
- Integration: a token with a malicious name is surfaced with sanitized display (R7 applied at the boundary).
- Regression: `DiscoveredToken` shape unchanged; existing `type === 'RPC_ERROR'` assertions still hold.
- Invariant: a token with a malicious symbol (e.g. RTL override) yields clean toast text when consumed by `use-token-disposal` / `use-token-approval` (asserts the boundary invariant).

**Verification:** discovery returns actual holdings; failure and unavailable states are explicit and distinguishable; `contractsChecked` reflects tokens enumerated.

- [ ] **Unit 5: Fix B5 USDC + audit known-valuables**

**Goal:** Correct the wrong mainnet USDC address and audit `KNOWN_VALUABLE_TOKENS`.

**Requirements:** R12, R13

**Dependencies:** None (parallelizable with 1–4 for `token-filtering.ts` and `token-validation.ts` edits; `token-discovery.ts` is NOT edited by this unit — `COMMON_TOKEN_ADDRESSES` and its USDC entry are removed by Unit 4)

**Files:**
- Modify: `lib/web3/token-filtering.ts` (`KNOWN_VALUABLE_TOKENS[1]` USDC → `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`; audit remaining mainnet/Polygon/Arbitrum entries against canonical token lists)
- Modify: `lib/web3/token-validation.ts` (audit `TOKEN_SECURITY_LISTS.verified` — research found a separate wrong USDC variant there)
- Test: `lib/web3/token-filtering.test.ts`

**Approach:**
- Replace the fabricated address; spot-check each remaining hardcoded valuable against a canonical source (Uniswap/Aave/Arbitrum lists already referenced in `token-metadata.ts`). Bounded audit: enumerate ONLY the addresses already hardcoded in `KNOWN_VALUABLE_TOKENS` and `TOKEN_SECURITY_LISTS.verified`; verify each against its canonical token list; do NOT add new entries or expand the search. If the `TOKEN_SECURITY_LISTS.verified` audit feels separable, keep it in this unit but note it is a bounded same-change audit.

**Test scenarios:**
- Happy path: real mainnet USDC (corrected address) is classified as a known-valuable and kept off burn candidates.
- Edge case: the old fabricated address no longer appears in any list.

**Verification:** `KNOWN_VALUABLE_TOKENS` correctly excludes real blue-chips by canonical addresses.

- [ ] **Unit 6: Discovery UX states + spam-badge interaction**

**Goal:** Wire the four discovery states, spam-badge interaction (never auto-select), and logo/metadata sanitization at the token-detail render boundary.

**Requirements:** R6, R8, R9a, R9b, R9c

**Dependencies:** Unit 4

**Files:**
- Modify: `components/web3/token-list.tsx` / `components/web3/token-list-item.tsx` (distinct loading / empty-success / error / unavailable states; spam badge filter/sort; never auto-select spam)
- Modify: `components/web3/token-detail.tsx` (route `metadata.logoURI`, `metadata.description`, and `metadata.website` through `isSafeLogoUrl` + sanitization at the render boundary; `aria-label` uses sanitized name; logo loaded ONLY for verified, non-spam tokens)
- Test: `components/web3/token-list.test.tsx`

**Approach:**
- Map hook state → the four R9a states with concrete copy and treatment:
  - **loading**: skeleton rows + "Scanning your wallet…" (expose partial token count from the hook if available; otherwise indeterminate)
  - **empty-success**: "No disposable tokens found in this wallet" with a subline clarifying the scan completed (neutral, not an error)
  - **error** (`API_ERROR`): "Could not scan wallet" + retry affordance
  - **unavailable** (`AUTH_MISSING`): "Token discovery unavailable — configure NEXT_PUBLIC_ALCHEMY_API_KEY" + setup guidance, no retry
- Spam tokens render badged, filterable/sortable, default-unselected; bulk-select excludes suspected-spam. Spam-badge control: a segmented filter (All / Non-spam / Spam) above the list; default shows all with spam visually de-emphasized and never auto-selected.
- List scaling (R9c): use virtualization for continuous browsing. Note: keyboard-focus and bulk-select must work correctly across offscreen rows with virtualization; if this proves prohibitively complex, fall back to pagination — state the choice explicitly in implementation, do not leave it as "implementer sees fit".
- Logo/metadata sanitization at the render boundary: `metadata.logoURI` (and `metadata.description`/`metadata.website` if rendered) must be routed through `isSafeLogoUrl` + sanitization before use. This is a separate pipeline from discovery sanitization — logos come from `EnhancedTokenMetadata` via `useTokenMetadata`/`fetchEnhancedTokenMetadata` and bypass the discovery boundary. Remote logos are loaded ONLY for verified, non-spam tokens.

**Test scenarios:**
- Happy path: discovered list renders with spam badges; spam not auto-selected.
- Edge case: empty-success state distinct from error and unavailable states (assert copy/branch).
- Edge case: suspected-spam excluded from bulk-select.
- Error path: `API_ERROR` → "Could not scan wallet"; `AUTH_MISSING` → "Token discovery unavailable — configure NEXT_PUBLIC_ALCHEMY_API_KEY".
- Integration: a spam token with an unsafe logo URL does not load a remote image.
- CSS sink: a `metadata.logoURI` containing CSS-breakout characters is rejected by `isSafeLogoUrl` and no `backgroundImage` is set.

**Verification:** all four states are visually distinct with concrete copy; spam handling is safe-by-default; logo/metadata sanitized at the render boundary.

- [ ] **Unit 6b: Privacy disclosure**

**Goal:** Deliver the R9d wallet→Alchemy privacy disclosure as a user-facing in-app notice and in developer documentation.

**Requirements:** R9d

**Dependencies:** Unit 4

**Files:**
- Modify: `.env.example` (document the Alchemy key, domain-restricted, optional; note what data is shared)
- Modify: `docs/development/environment-setup.md` (or equivalent) (R9d wallet→Alchemy disclosure for developers)
- Modify: relevant UI component (add an in-app user-facing notice visible to the wallet owner before or during discovery)

**Approach:**
- The wallet owner is the data subject. The in-app notice must state: what is shared (wallet address + token holdings), with whom (Alchemy), and why (token enumeration). Keep the framing consistent with the opt-in-telemetry posture — this is a third-party data-sharing disclosure, not a telemetry consent flow.
- Developer docs cover the key setup and the data-sharing implication.
- The in-app notice should be non-intrusive but visible (e.g. a small disclosure line near the discovery UI, not a blocking modal).

**Test scenarios:**
- The in-app disclosure is present and renders when discovery is active.
- The disclosure copy accurately names Alchemy and the data shared.

**Verification:** disclosure present in-app and in docs; copy is accurate and non-alarming.

- [ ] **Unit 7: Consumer regression check + final gate**

**Goal:** Confirm no consumer broke and the full gate passes.

**Requirements:** R5, R10

**Dependencies:** Units 1–6b

**Files:**
- Verify (read/adjust if needed): `hooks/use-token-discovery.ts` derivatives (`useTokenExists`, `useNonZeroTokens`, `useChainTokenDiscovery`, `useTokensByBalance`, `useTokensByChain`), `hooks/use-token-filtering.ts` (`useUnwantedTokens`), `lib/web3/token-metadata.ts` (`fetchEnhancedTokenMetadata` chain).

**Approach:**
- Confirm `fetchTokenMetadata` (on-chain) signature unchanged so `token-metadata.ts` still works (it imports and consumes `fetchTokenMetadata` as `fetchBasicMetadata`).
- Confirm derivatives behave with real enumeration (e.g. `useTokenExists` returns null for non-held tokens — correct).
- Confirm the `config` arg decision from Unit 4 is reflected consistently across all consumers.
- Run `pnpm validate` (lint + type-check + test + design-system + build-storybook).

**Test scenarios:**
- Integration: `useTokenExists` returns the token when held, null when not.
- Regression: existing hook tests pass against the new internal implementation.
- **Real-path integration test (required):** at least one integration test must exercise the real client-construction path (not just the module-mock boundary). A module-mock test can pass even with a dead `config` arg or broken client construction — this test must fail if the integration is broken. Mock only the network boundary (viem `request`), not the module itself.

**Verification:** full quality gate green; no consumer regression; real-path integration test confirms client construction is exercised.

## System-Wide Impact

- **Interaction graph:** `discoverUserTokens` ← `useTokenDiscovery` ← `token-list.tsx`, `disposal-flow.tsx`; `fetchTokenMetadata` ← `token-metadata.ts` (must stay intact).
- **Error propagation:** new `AUTH_MISSING`/`API_ERROR` flow through `TokenDiscoveryResult.errors` → hook `discoveryErrors` → UX states. Web3 boundary never throws.
- **State lifecycle risks:** TanStack Query caching of discovery results; metadata in-memory cache keyed by `chainId:address` (per-invocation scope, not module-level singleton — see KTD).
- **API surface parity:** sanitization applied at the discovery boundary covers list, detail, disposal, and approval render sites for name/symbol. Logo/description/website from the enhanced-metadata pipeline require separate sanitization at the token-detail render boundary (Unit 6).
- **Unchanged invariants:** `DiscoveredToken` shape, `useTokenDiscovery` return contract, `fetchTokenMetadata` signature, `SUPPORTED_NETWORKS_V1 = [sepolia]`, `contractsChecked` field name.
- **SSR boundary:** the Alchemy `client.request()` path is client-only. It must never run during SSR, in server components, or in route handlers. Discovery is gated behind the client hook lifecycle.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Rate-limit throttling for large wallets (300 tokens × 10 CU vs 500 CU/s) | Concurrency cap (start 8) + cache; instrument and tune; add backoff if observed. Deferred-to-impl tuning. |
| Mainnet-scale behavior untestable on Sepolia (R14 vs R15) | Fixture/unit tests of the spam + pagination pipeline (reviewed deliberate tradeoff per origin doc). |
| Alchemy `getTokenBalances` may miss non-indexed or include non-standard tokens | Simulate-preflight (already merged) fails closed on bad tokens; best-effort metadata; surfaced ≠ auto-selected. |
| Removing `COMMON_TOKEN_ADDRESSES` breaks a consumer | Verified no non-test consumer depends on it (Unit 7 confirms). |
| Browser-direct key abuse | Domain-restricted key + quota (ops); disclosed (R9d). Accepted tradeoff (N4). |
| Large-wallet discovery completeness/latency | Product risk: if the per-page cap (100) and concurrency cap produce slow or partial results for large wallets, partial discovery must be messaged clearly to the user. Note the completeness/latency expectation in UX copy. |
| No-key "unavailable" state reduces OSS trialability | Known accepted tradeoff: the app requires an Alchemy key for discovery. The "unavailable" state with setup guidance is the intended experience for keyless runs. |
| Mainnet UX not validated in production | This effort prepares the plumbing and validates via fixtures. Mainnet-ready-while-Sepolia-gated UX is explicitly a "prepare the plumbing, validate via fixtures" effort — not validated production mainnet UX. Mainnet validation is deferred to the chain-flip task. |
| `config` arg becomes dead after rewrite | Module-mock tests may pass even with a dead arg. Unit 7 real-path integration test is the mitigation. |
| Stale metadata cache across wallet switches | Cache scoped per-invocation, not module-level singleton. Unit 3 wallet-switch test scenario is the mitigation. |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-06-21-wallet-token-enumeration-requirements.md](docs/brainstorms/2026-06-21-wallet-token-enumeration-requirements.md)
- Spike: [docs/brainstorms/2026-06-21-mainnet-readiness-spike.md](docs/brainstorms/2026-06-21-mainnet-readiness-spike.md)
- Related code: `lib/web3/token-discovery.ts`, `lib/web3/token-filtering.ts`, `env.ts`, `lib/web3/config.ts`, `lib/web3/transaction-queue.ts`
- External docs: Alchemy Token API (`alchemy_getTokenBalances`, `alchemy_getTokenMetadata`) — researched via librarian.
