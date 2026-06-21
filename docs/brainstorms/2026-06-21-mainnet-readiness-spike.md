---
date: 2026-06-21
topic: mainnet-readiness-spike
status: decision
---

# Token Toilet Mainnet Readiness Spike

> Decision doc, not an implementation plan. Answers: *should Token Toilet move from Sepolia to Ethereum mainnet (deferred item D1), and what must be true first?*

## Recommendation

**No-go for a normal mainnet launch.** Token discovery does not actually scan the user's wallet, so the product's core promise — find and dispose of unwanted junk tokens — does not work on mainnet. Flipping `SUPPORTED_NETWORKS_V1` to mainnet without fixing discovery turns a harmless testnet tool into an irreversible asset-destruction app that shows the wrong tokens.

Two honest paths forward:

1. **Fix discovery first, then reconsider** — replace hardcoded token-address discovery with real wallet enumeration (Alchemy/Moralis/Covalent-class token-balance API). This is the right product fix and the precondition for a real mainnet.
2. **Ship a manual-token "advanced burn" mainnet alpha** — no discovery at all: the user pastes a specific token contract address, the app fetches metadata/balance, simulates, and burns it behind strong irreversibility UX. This sidesteps the discovery gap honestly and could ship sooner, but it is a different (narrower) product.

What we must **not** ship: "mainnet known-token disposal" against the current hardcoded list. That is product-hostile (it can only surface tokens users want to keep) and liability bait.

## Why mainnet is not "config-shallow"

Technically, flipping chains is one line — `chains.ts` uses a `_V1` suffix convention and `FUTURE_NETWORKS = [mainnet, polygon, arbitrum]` is already scaffolded. But in product-risk terms it is the opposite of shallow: it changes the app from a harmless testnet toy into a tool that permanently destroys real value. The technical ease is a trap.

## The killer finding: discovery does not scan the wallet

`lib/web3/token-discovery.ts` does **not** enumerate the tokens a wallet actually holds. It iterates a hardcoded list — `COMMON_TOKEN_ADDRESSES[chainId]` (~10 well-known addresses per chain) — and calls `balanceOf` on each (`token-discovery.ts:292-316`).

- The product exists to dispose of **unwanted junk**: airdropped scam tokens, dead-DAO governance tokens, abandoned tokens.
- Those are exactly the tokens **not** in any curated list, so they are **invisible to discovery**.
- On Sepolia this is masked — nobody holds junk on a testnet, and the list is just 2 test tokens.
- On mainnet, the hardcoded list is blue-chips (USDC, DAI, USDT, WBTC, WETH, UNI, LINK, PEPE, SHIB, MATIC). `useUnwantedTokens` filters known valuables out of the burn candidates (`token-filtering.ts`), so the net result on mainnet is an app that finds essentially **nothing to dispose** — while claiming to clean up wallets.

This is product-blocking, not polish. Token-list discovery cannot be patched into wallet cleanup; it is the wrong mechanism.

### Correct fix class

**Wallet-level ERC-20 enumeration**, via an indexer/token-balance API (Alchemy `getTokenBalances`, Moralis, Covalent, Zerion-class). Tradeoffs:

- **Pros:** actually solves the problem; fast; handles long wallet history; pairs with metadata/spam heuristics.
- **Cons / mitigations:**
  - Cost & rate limits → cache, paginate, cap results.
  - API-key exposure → prefer a server/edge proxy with a hidden, domain-restricted, quota-limited key; assume any browser key is public.
  - **Privacy:** proxying wallet addresses means we now *process user wallet data* — this needs a privacy review and a documented posture (consistent with the opt-in-telemetry stance).
  - Spam-token flooding → advisory spam labels, never auto-select, expose "all discovered" with clear labels.

Transfer-log scanning (`eth_getLogs`) and token-list-driven discovery are both rejected: the former reinvents a poor indexer with mainnet range/history pain; the latter just recreates the current bug.

## Other gaps found (verified against code)

### Blockers / non-negotiable go-no-go gates

| # | Gap | Evidence |
|---|-----|----------|
| B1 | Discovery does not enumerate the wallet | `token-discovery.ts:86-131, 292-316` |
| B2 | No irreversibility UX on the confirm step — no "cannot be undone", no burn-address display, no typed confirmation | `disposal-flow.tsx` confirm step (`Confirm Burn` lists names/balances only) |
| B3 | No E2E / real-browser coverage of an irreversible financial action (unit tests only) | tracked in #1171 |
| B4 | Mainnet RPC not productionized — single Sepolia transport; public mainnet RPCs rate-limit hard, and simulation reliability depends on it | `config.ts:34-44` |
| B5 | **Wrong hardcoded mainnet USDC address** — code has `0xA0b86a33E6441E5d8CE6a65f7AEF4eDe18f23e94`; real mainnet USDC is `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`. A fabricated address that was never validated. | `token-discovery.ts:94`, `token-filtering.ts:303` |

### Serious, acceptable with caveats

- **Direct `transfer()` to dead address, no contract/recovery** — simpler than a contract (no custody, approval, or audit risk), but makes irreversibility UX non-negotiable. Say "send to burn address", not vague "dispose".
- **Sequential per-token execution** — fine and arguably safer than batching (each token gets a separate wallet review). UX must make clear each token is a separate irreversible transaction.
- **"Verified"/risk labels go live on mainnet** — the verification path is inert on Sepolia (no Sepolia token list) but active on mainnet (Uniswap/Aave/1inch lists for chainId 1). "Verified" must mean *identity confidence* ("appears on a trusted token list"), never *safe to burn*. Risk labels must not imply a burn recommendation.

### Polish / later

- No app-specific receipt — the tx hash + explorer link is enough for v1. Do not add a contract just to manufacture a receipt.

## Go / No-Go checklist

No-go unless all are green.

### Discovery
- [ ] Discovery enumerates actual ERC-20 balances for the connected wallet on mainnet
- [ ] Hardcoded address lists are not the discovery source
- [ ] Result set includes obscure/junk tokens from real test wallets
- [ ] Known valuable tokens are not shown as recommended burn candidates by default
- [ ] Zero-balance tokens excluded from candidates
- [ ] Discovery failure is explicit ("Could not scan wallet"), not an ambiguous empty state

### Safety UX
- [ ] Confirm screen states: "This permanently transfers tokens to `0x000000000000000000000000000000000000dEaD`. This cannot be undone."
- [ ] Burn address displayed in full, with copy button (not truncation-only)
- [ ] Per-token contract address shown, not just symbol/name
- [ ] Estimated value (or "value unknown") shown per token
- [ ] Explicit acknowledgement of irreversible burn required
- [ ] Typed confirmation (e.g. `BURN`) for high-value or unknown-value tokens

### Transaction correctness
- [ ] `useSimulateContract` preflight remains mandatory; no blind write path
- [ ] Simulation failures skip/stop safely (already implemented + regression-tested)
- [ ] Chain ID pinned to mainnet during simulation and write
- [ ] Wallet prompt matches the displayed token / address / burn destination
- [ ] Results include tx hash + explorer link per token

### Labels / risk model
- [ ] "Verified" means "identity on a trusted token list", not "safe"
- [ ] Risk labels cannot imply a burn recommendation
- [ ] Hardcoded known-token / security addresses audited against canonical sources (see B5)
- [ ] Unknown tokens treated as unknown, not safe or junk by default
- [ ] Spam heuristics advisory only; the user makes the final selection

### Infrastructure
- [ ] Paid/reliable mainnet RPC configured
- [ ] Indexer / token-balance API rate limits understood
- [ ] API-key exposure model decided (browser-restricted key or server proxy)
- [ ] If server proxy: privacy posture documented (wallet addresses hit our backend)
- [ ] Graceful degraded state for provider / rate-limit failure

### Tests
- [ ] E2E: select -> confirm -> dispose -> result
- [ ] E2E: simulation failure
- [ ] E2E: wrong-network guard
- [ ] E2E: irreversible warning / typed confirmation
- [ ] Unit: discovery source behavior + categorization of valuable / unknown / spam tokens

## Minimum irreversibility UX (mainnet bar)

1. **Explicit warning block** — "You are about to permanently transfer these tokens to a burn address. This cannot be undone. Token Toilet cannot recover burned tokens."
2. **Full burn address** — `0x000000000000000000000000000000000000dEaD`, copyable, not hidden behind truncation.
3. **Per-token details** — name, symbol, balance, contract address, chain, estimated USD value or "value unknown".
4. **Typed confirmation for risky cases** — for any token with known/estimated value above a low threshold, or unknown value, require typing `BURN`; for batches, something like `BURN 3 TOKENS`.
5. **Clear wallet handoff** — auto-triggering each transaction after "Confirm Burn" is acceptable only if the confirm step is brutally explicit and the wallet still prompts per transaction.

## Decision

Pick one before any mainnet implementation work:

- **A — Fix discovery, then real mainnet.** Replace hardcoded discovery with wallet enumeration (Alchemy-class), build the irreversibility UX, productionize RPC, add E2E, fix B5. Then flip the chain. This is the "make it genuinely useful" path.
- **B — Manual-token advanced-burn mainnet alpha.** Ship a narrow mode: paste a token address, simulate, burn behind scary UX, no discovery claims. Faster to "real", honest about scope. Still requires irreversibility UX, mainnet RPC, conservative labels, and E2E for the burn path.
- **C — Stay on Sepolia.** Keep it an honest testnet tool with excellent docs/tests and no mainnet roadmap theater. Zero blast radius.

Recommended order: do not pursue mainnet until at minimum discovery (A) or the explicit manual-mode scope (B) is decided. Everything else is lipstick on a footgun.
