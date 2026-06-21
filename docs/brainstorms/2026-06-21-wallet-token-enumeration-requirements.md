---
date: 2026-06-21
topic: wallet-token-enumeration
status: requirements
seeds: docs/brainstorms/2026-06-21-mainnet-readiness-spike.md
---

# Wallet Token Enumeration — Requirements

> Replace hardcoded-list token discovery with real wallet enumeration so Token Toilet surfaces the junk users actually want gone. Prerequisite for mainnet (spike path A); discovery is made correct here, the mainnet flip stays separately gated.

## Problem

`lib/web3/token-discovery.ts` does not scan the user's wallet. It iterates a hardcoded ~10-address list (`COMMON_TOKEN_ADDRESSES[chainId]`) and calls `balanceOf` on each. The product exists to dispose of unwanted junk — airdropped scam tokens, dead-DAO governance tokens, abandoned tokens — and those are exactly the tokens not in any curated list, so they are invisible. On Sepolia this is masked (no junk on a testnet). On mainnet the app would find essentially nothing to dispose while claiming to clean wallets.

## Goal

Discovery is "correct" when it **surfaces the junk a user actually wants gone**: the abandoned/airdropped/dead tokens in their wallet appear, blue-chip valuables do not appear as burn candidates, and because junk and scams overlap heavily, suspected-spam tokens are surfaced safely rather than hidden or dumped raw.

## Requirements

### Core enumeration (Must Have)

- R1. Discover the connected wallet's actual ERC-20 holdings via the Alchemy Token API (`alchemy_getTokenBalances` with `"erc20"`), called browser-direct through viem `publicClient.request()`.
- R2. Paginate fully (Alchemy caps `maxCount` at 100; follow `pageKey` until exhausted) so wallets with many tokens are completely enumerated.
- R3. Exclude zero-balance tokens from the discovered set.
- R4. Resolve metadata (`name`, `symbol`, `decimals`, `logo`) via `alchemy_getTokenMetadata` per token, with a concurrency cap and caching; a metadata miss yields a best-effort token (e.g. `UNKNOWN` symbol), never a discovery-wide failure.
- R5. `useTokenDiscovery`'s public return contract (`DiscoveredToken[]`, loading/error/isSuccess, `discoveryErrors`, counts, refetch/refresh) is unchanged. The rewrite is internal to `discoverUserTokens()` and helpers.

### Spam / scam safety (Must Have)

- R6. Surface all discovered tokens (the junk is the point), but tag suspected-spam tokens with a clear visual indicator.
- R7. **Sanitize attacker-controlled display fields.** Token `name`/`symbol`/`logo` come from arbitrary on-chain contracts and can carry phishing payloads. Specifically:
  - Render token metadata as **inert text only** — no auto-linking, no markdown/HTML interpretation, no external navigation from name/symbol/logo, no wallet-address substitution.
  - Strip URLs, control characters, and markup from displayed name/symbol.
  - Strip bidirectional/RTL override characters; apply Unicode normalization and treat confusable/homoglyph strings as suspect.
  - **Truncate** name/symbol to a sane max length (overlong strings are a display-injection and layout vector).
  - Do not load remote logos for unverified/suspected-spam tokens; for any logo that is loaded, allowlist the URL scheme (`https:` only — reject `javascript:`/`data:`) and rely on the existing CSP `img-src`.
- R8. The existing `useSimulateContract` burn-path preflight remains the protection for *interacting* with a malicious token; R6–R7 protect the *display* surface. Both must hold. A token that enumeration surfaces but whose `transfer` simulation reverts must fail closed in the burn flow (already implemented + regression-tested), never deadlock the batch.

### Discovery UX states (Must Have)

- R9a. The discovered-token surface distinguishes four states with distinct copy: **scanning/loading**, **empty-but-successful** (wallet scanned, genuinely no disposable tokens found), **error** ("could not scan wallet", R11), and **unavailable** (no key configured, R9). These must not be conflated — an empty success is not an error.
- R9b. Spam-badge interaction: suspected-spam tokens are surfaced and badged (R6), filterable/sortable by spam status, and **never auto-selected** for burning. Default selection is empty — the user explicitly chooses what to flush. Bulk-select must not implicitly include suspected-spam.
- R9c. The discovered list handles many-token wallets without UI degradation (virtualization or pagination as the implementer sees fit) and has a defined default sort order. This is a planning detail but the requirement (no sluggish/broken list at scale) is fixed.

### Failure & configuration (Must Have)

- R9. Discovery requires `NEXT_PUBLIC_ALCHEMY_API_KEY`. When it is absent, discovery shows an explicit "discovery unavailable — configure the key" state. It must **never** silently fall back to the hardcoded list.
- R9d. **Privacy posture for wallet-address sharing.** Discovery sends the connected wallet address to Alchemy (a third party). Consistent with the opt-in-telemetry stance, this third-party data flow must be disclosed (e.g. in setup/privacy docs and/or product copy) — what is shared (wallet address), with whom (Alchemy), and why (token enumeration). Note that this address already reaches Alchemy via RPC today; the requirement is honest disclosure, not a new proxy (N4).
- R10. Remove `COMMON_TOKEN_ADDRESSES` as the discovery source. (Retained only if still needed by an unrelated consumer; if so, it must not power discovery.)
- R11. A wallet-scan API failure surfaces as an explicit discovery error ("could not scan wallet"), populating the hook's `discoveryErrors` — not an ambiguous empty state.

### Data correctness (Must Have)

- R12. Fix the wrong hardcoded mainnet USDC address `0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94` → `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (in `token-filtering.ts` `KNOWN_VALUABLE_TOKENS` and anywhere else it appears).
- R13. Audit the remaining hardcoded known-valuable / security addresses against canonical sources. With enumeration, `KNOWN_VALUABLE_TOKENS` is what keeps blue-chips off the burn-candidate list, so its correctness matters more, not less.

### Mainnet-readiness (Must Have for this work's definition of "correct")

> **Reviewed tradeoff:** document-review flagged (product-lens, scope-guardian, adversarial) that R14's mainnet-scale handling can't be exercised while R15 keeps the app on Sepolia. Held deliberately: discovery's entire purpose is mainnet, the sanitization (R7) is correctness not speculation, and re-opening spam handling at the chain-flip is costlier than building it correct once. The spam-pipeline should still be fixture/unit-testable without mainnet (see Open Questions).

- R14. Enumeration behaves correctly at mainnet scale: handles a wallet with dozens-to-hundreds of (often spam) tokens without breaking pagination, performance, or the spam-display safety in R6–R7.
- R15. `SUPPORTED_NETWORKS_V1` stays `[sepolia]`. This work makes discovery mainnet-capable; it does **not** flip the chain.

## Non-Goals (deferred, still gate the mainnet flip)

- N1. Irreversibility UX on the confirm step (warnings, burn-address display, typed confirmation).
- N2. E2E / real-browser coverage of the disposal flow (#1171).
- N3. Flipping `SUPPORTED_NETWORKS_V1` to mainnet.
- N4. Server-side proxy for the Alchemy key (decided: browser-direct, domain-restricted key — the wallet address already reaches Alchemy via RPC, so a proxy adds a wallet-data-processing surface without removing existing exposure).
- N5. `alchemy-sdk` dependency (decided: raw JSON-RPC via viem, minimal deps).

## Success Criteria

- [ ] On Sepolia with a configured key and a test wallet, discovery returns the wallet's actual ERC-20 holdings (not the hardcoded pair).
- [ ] A wallet with many tokens is fully paginated; zero-balance tokens are excluded.
- [ ] Suspected-spam tokens appear, badged, with sanitized name/symbol and no remote logos.
- [ ] With no key, discovery shows an explicit unavailable state — never the hardcoded list.
- [ ] An API failure shows an explicit "could not scan wallet" error, not an empty list.
- [ ] The corrected mainnet USDC address (and audited known-valuables) correctly keep blue-chips off burn candidates.
- [ ] All existing quality gates pass; `useTokenDiscovery` consumers are unaffected by the contract.

## Decisions (locked)

- **Provider:** Alchemy Token API (already in CSP allowlist + RPC config).
- **Architecture:** browser-direct, domain-restricted key. No server proxy (N4).
- **Client:** raw JSON-RPC via viem `request()`, no SDK (N5).
- **No-key:** explicit unavailable state, no hardcoded fallback (R9).
- **Spam:** show all, badge, sanitize display (R6–R7).
- **Chain scope:** mainnet-ready, Sepolia-gated (R14–R15).

## Open Questions (for planning)

- **Spam-classification source** (R6/R9b/R14 depend on this): Alchemy spam flags vs. heuristic spamScore vs. token-list cross-check. The behavior is specified but the trust signal is undecided — planning must pick the primary source before spam-handling can be enforced consistently.
- **Rate-limit quantification** (adversarial): the metadata concurrency cap (start ~8) must be validated against Alchemy's 500 CU/s free-tier limit for a worst-case large wallet (e.g. 300 tokens × 10 CU). Power users with the most junk are exactly who would hit throttling — the cap and any backoff/partial-result handling need real numbers, not an assumed ~8.
- **Error-shape compatibility** (R5/R11): confirm the new explicit-error surface fits the existing `discoveryErrors` shape without breaking the stable contract. Verified at review time that `useTokenDiscovery` delegates to `discoverUserTokens` and the error array exists — but the new error semantics must round-trip through it.
- **Consumer regression check** (R10): before removing `COMMON_TOKEN_ADDRESSES`, verify no consumer (`useTokenExists`, `useNonZeroTokens`, `useChainTokenDiscovery`, etc.) implicitly relies on the old bounded-list behavior, ordering, or presence semantics.
- API endpoint URLs: `https://eth-sepolia.g.alchemy.com/v2/<KEY>`, `https://eth-mainnet.g.alchemy.com/v2/<KEY>`. CSP `connect-src` `https://*.alchemy.com` confirmed to cover both at review time.

## Review notes (verified at document-review)

- `useTokenDiscovery` confirmed to delegate to `discoverUserTokens()` — the stable-contract claim (R5) is supported.
- The wrong mainnet USDC address (R12) confirmed present in both `lib/web3/token-discovery.ts` and `lib/web3/token-filtering.ts`.
- CSP `connect-src` confirmed to already include `https://*.alchemy.com` — no CSP change needed.
- `env.ts` confirmed not to define `NEXT_PUBLIC_ALCHEMY_API_KEY` yet — adding it is R1/config work (uses the existing `@t3-oss/env` schema + runtime map pattern).

## Next Steps

→ `/ce:plan` for structured implementation planning (the prior draft plan at this date can be regenerated cleanly from these requirements).
