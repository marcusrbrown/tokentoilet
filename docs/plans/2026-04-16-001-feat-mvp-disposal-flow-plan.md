---
title: "feat: Wire MVP disposal flow (Sepolia ERC-20 to burn address)"
type: feat
status: completed
date: 2026-04-16
origin: docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md
deepened: 2026-04-16
---

# Wire MVP Disposal Flow

## Overview

Wire existing wallet, token discovery, and transaction queue components into a working disposal flow. Users will be able to connect wallet → discover ERC-20 tokens → select unwanted tokens → confirm → transfer to burn address → see results.

**Note:** ERC-20 `transfer()` does not require prior approval when called by the token owner. The approval step is removed from v1.0 scope.

This is integration work, not net-new development. The infrastructure exists; we're composing it into a product flow.

## Problem Frame

Token Toilet has solid frontend infrastructure (wallet connection, token discovery, approval flow, transaction queue) but no actual disposal flow. The app is currently a landing page. We need to ship a working product that proves the core value prop: clean your wallet by flushing unwanted tokens.

(see origin: docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md)

## Requirements Trace

- R1. User can connect wallet and see ERC-20 balances on Sepolia
- R2. User can select one or more ERC-20 tokens for disposal (batch up to 10)
- ~~R3. User can approve selected tokens for transfer~~ *(Removed: ERC-20 `transfer()` doesn't require approval when called by owner)*
- R4. User can execute disposal, transferring tokens to burn address `0x000000000000000000000000000000000000dEaD`
- R5. User sees real-time transaction status with explorer link
- R6. User sees success confirmation with summary of disposed tokens
- R7. App deploys to Vercel (replace CI echo placeholders)
- R8. Sepolia testnet is the only supported network for v1.0
- R9. All existing quality gates pass

## Scope Boundaries

- **Sepolia only**: No multi-chain, no chain switching UX
- **ERC-20 only**: No ERC-721/1155 support
- **Burn address**: Direct transfer, no smart contract
- **No charity**: The Giving Block integration deferred
- **No NFT receipts**: Proof of disposal deferred

## Context & Research

### Relevant Code and Patterns

**Wallet & Connection:**
- `hooks/use-wallet.ts` — `useWallet` hook with address, isConnected, chainId, chain validation
- `components/web3/wallet-button.tsx` — WalletButton component

**Token Discovery & Filtering:**
- `hooks/use-token-discovery.ts` — `useTokenDiscovery`, `useUnwantedTokens`
- `hooks/use-token-filtering.ts` — `useTokenFiltering` with UNWANTED/SPAM/DUST categories
- `lib/web3/token-filtering.ts` — `CategorizedToken` interface, `TokenCategory` enum

**Token Selection & Approval:**
- `components/web3/token-list.tsx` — `TokenList` with selection support via `selectedTokens` prop
- `components/web3/token-selection.tsx` — manages `selectedAddresses` array
- `hooks/use-token-approval.ts` — `useTokenApproval` with `useWriteContract`, gas estimation, transaction queue integration
- `components/web3/token-approval.tsx` — approval UI with status badges

**Transaction Tracking:**
- `hooks/use-transaction-queue.ts` — `useTransactionQueue` with `addTransaction`
- `lib/web3/transaction-queue.ts` — `TransactionQueue` class with persistence
- `components/web3/transaction-queue.tsx` — queue UI with status filtering
- `components/web3/transaction-status.tsx` — individual transaction status card

**UI Components:**
- `components/ui/modal.tsx` — confirmation dialogs with glass morphism
- `app/page.tsx` — current landing page (to be preserved, disposal flow on separate route)

### Institutional Learnings

None yet (no `docs/solutions/` directory exists).

### External References

- Sepolia testnet chainId: 11155111
- Burn address: `0x000000000000000000000000000000000000dEaD`
- ERC-20 transfer ABI: `transfer(address to, uint256 amount)`

## Key Technical Decisions

- **Separate route, not replace landing**: Create `/flush` route for disposal flow. Keep landing page for marketing/onboarding.
- **Burn address, no contract**: Transfer directly to `0x...dEaD`. No deployment, no audit, no gas optimization needed. Proves the flow works.
- **Batch as sequential transfers**: For v1.0, approve and transfer tokens sequentially (not multicall). Rationale: (1) Simpler to implement — each transfer is a standalone `writeContract` call; (2) Easier to debug — failures are isolated to specific tokens; (3) Better UX — each transaction is independently trackable in the queue with its own status badge and explorer link; (4) Multicall requires a deployed contract and adds audit scope. Deferred to v1.1 when gas optimization matters.
- **Sepolia-only validation**: Add network guard component that prompts switch if on wrong chain.
- **Reuse existing components**: TokenList, TokenApproval, TransactionQueue components need minimal modification — mostly composition.

## Open Questions

### Resolved During Planning

- **Q: New page or modal flow?** → New `/flush` route. Landing page stays for SEO/marketing.
- **Q: Batch disposal approach?** → Sequential transfers for v1.0. Multicall optimization deferred.
- **Q: Is approval needed before transfer?** → No. ERC-20 `transfer()` is called by the token owner directly; no approval step needed. This simplifies the flow to 3 steps: select → confirm → dispose.

### Deferred to Implementation

- **Q: Exact gas buffer for transfers?** → Will tune based on Sepolia testing.
- **Q: Token list pagination threshold?** → Will observe performance with real wallet data.

## Implementation Units

- [ ] **Unit 1: Add Sepolia chain configuration**

**Goal:** Configure Sepolia as the only supported network for v1.0

**Requirements:** R8

**Dependencies:** None

**Files:**
- Modify: `lib/web3/chains.ts` (or equivalent chain config)
- Modify: `hooks/use-wallet.ts` — update `SUPPORTED_CHAINS` to Sepolia only
- Test: `hooks/use-wallet.test.ts`

**Approach:**
- Add Sepolia (chainId: 11155111) to chain configuration
- Remove mainnet chains from v1.0 supported list (can keep in code, just not in SUPPORTED_CHAINS)
- Update any hardcoded chain references
- **Type safety note:** `SupportedChainId` is derived from `SUPPORTED_CHAIN_IDS`. Changing to Sepolia-only will change this type. Update consuming code (`TransactionQueue`, `token-filtering.ts`, `NetworkSwitcher`) to use the new type or a generic `number` for chainId where appropriate.

**Patterns to follow:**
- Existing chain config pattern in `lib/web3/chains.ts`

**Test scenarios:**
- `useWallet` returns Sepolia as supported chain
- `isSupportedChain(11155111)` returns true
- `isSupportedChain(1)` returns false for v1.0

**Verification:**
- `pnpm test hooks/use-wallet` passes
- `pnpm type-check` passes

---

- [ ] **Unit 2: Create useTokenDisposal hook**

**Goal:** Hook for transferring ERC-20 tokens to burn address

**Requirements:** R4, R5

**Dependencies:** Unit 1

**Files:**
- Create: `hooks/use-token-disposal.ts`
- Test: `hooks/use-token-disposal.test.ts`

**Approach:**
- Mirror `useTokenApproval` pattern exactly:
  - `useWriteContract` from wagmi with `erc20Abi`
  - `functionName: 'transfer'`, `args: [BURN_ADDRESS, token.balance]`
  - `mutation.onSuccess` adds to transaction queue via `addTransaction({ type: 'disposal', ... })`
  - `mutation.onError` sets error state and shows toast
- Accept `CategorizedToken` and execute ERC-20 `transfer(burnAddress, amount)`
- Queue monitors via `waitForTransactionReceipt` with `receipt.status === 'success'` check
- Return: `dispose()`, `isPending`, `isSuccess`, `error`, `txHash`

**Patterns to follow:**
- `hooks/use-token-approval.ts` lines 150-189 — exact `useWriteContract` + `addTransaction` pattern
- `lib/web3/transaction-queue.ts` — `waitForTransactionReceipt` status checking

**Test scenarios:**
- `dispose()` calls writeContract with `{ address: token.address, abi: erc20Abi, functionName: 'transfer', args: [BURN_ADDRESS, amount] }`
- Transaction added to queue on success with `type: 'disposal'`
- Error state set on failure, toast shown
- isPending true while transaction in flight
- Receipt status checked for final confirmation

**Verification:**
- Hook tests pass with mocked wagmi hooks
- Type-check passes

---

- [ ] **Unit 3: Create NetworkGuard component**

**Goal:** Component that validates network and prompts chain switch

**Requirements:** R8

**Dependencies:** Unit 1

**Files:**
- Create: `components/web3/network-guard.tsx`
- Test: `components/web3/network-guard.test.tsx`

**Approach:**
- Wrap children, render only if on Sepolia
- If wrong network: show message + "Switch to Sepolia" button
- Use `useWallet().switchToChain()` for switching

**Patterns to follow:**
- Existing guard patterns in codebase
- `components/web3/wallet-button.tsx` for styling

**Test scenarios:**
- Children render when on Sepolia
- Warning + switch button when on wrong chain
- Switch button calls switchToChain

**Verification:**
- Component tests pass
- Visual inspection in Storybook (if time permits)

---

- [ ] **Unit 4: Create DisposalFlow component**

**Goal:** Multi-step disposal flow orchestrating select → confirm → dispose → results

**Requirements:** R1, R2, R4, R5, R6

**Dependencies:** Unit 2, Unit 3

**Files:**
- Create: `components/web3/disposal-flow.tsx`
- Test: `components/web3/disposal-flow.test.tsx`

**Approach:**
- Step state machine: `'select' | 'confirm' | 'dispose' | 'results'`
- Step 1 (select): TokenList with selection, "Continue" button when 1-10 tokens selected
- Step 2 (confirm): **Pre-disposal confirmation** — show summary of tokens to be burned with "Confirm Burn" button. This is the user's last chance to cancel before irreversible action.
- Step 3 (dispose): Execute transfers sequentially, show progress (N/M complete, with per-token status)
- Step 4 (results): Summary of disposed tokens, transaction links, "Flush More" button. Mixed results shown clearly: "Flushed 4 tokens. 1 failed: [token name]"

**Note:** Approval step removed — ERC-20 `transfer()` doesn't require prior approval when called by owner.

**Patterns to follow:**
- `components/web3/token-list.tsx` — selection pattern
- `components/web3/transaction-queue.tsx` — status display
- `components/ui/modal.tsx` — confirmation dialog styling

**Test scenarios:**
- Step transitions on user actions
- Token selection limited to 10
- Confirm step blocks disposal until explicit "Confirm Burn" click
- Dispose step executes transfers sequentially with progress indicator
- Results step shows summary with mixed success/failure handling

**Verification:**
- Component tests pass
- Manual testing in browser with connected wallet

---

- [ ] **Unit 5: Create /flush route and page**

**Goal:** Add disposal page route with NetworkGuard and DisposalFlow

**Requirements:** R1-R6

**Dependencies:** Unit 3, Unit 4

**Files:**
- Create: `app/flush/page.tsx`
- Modify: `app/page.tsx` — update "Start Flushing" button to link to `/flush`

**Approach:**
- Page wraps DisposalFlow in NetworkGuard
- Include WalletButton in header for connection
- Redirect to landing if not connected (or show connect prompt)

**Patterns to follow:**
- `app/page.tsx` — page structure, styling

**Test scenarios:**
- Page renders DisposalFlow when connected on Sepolia
- NetworkGuard activates when on wrong chain
- Link from landing page works

**Verification:**
- `pnpm build` succeeds
- Manual navigation test

---

- [ ] **Unit 6: Wire Vercel deployment**

**Goal:** Replace CI echo placeholders with real Vercel deployment

**Requirements:** R7

**Dependencies:** Units 1-5 (functional app required)

**Files:**
- Modify: `.github/workflows/ci.yaml` — deployment step
- Create: `vercel.json` (if needed for config)

**Approach:**
- Use **Vercel GitHub integration** (not CLI) — auto-deploys on push, no VERCEL_TOKEN secret required
- GitHub environments already configured with staging/production URLs in ci.yaml
- Deploy preview on PR, production on main merge
- Set required env vars in Vercel dashboard: `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`, RPC URLs

**Patterns to follow:**
- Standard Vercel + Next.js deployment patterns

**Test scenarios:**
- PR creates preview deployment
- Main branch deploys to production URL

**Verification:**
- CI workflow succeeds
- Live URL accessible and functional

---

- [ ] **Unit 7: Validate quality gates**

**Goal:** Ensure all existing checks pass with new code

**Requirements:** R9

**Dependencies:** Units 1-6

**Files:**
- No new files — validation only

**Approach:**
- Run full validation: `pnpm validate`
- Fix any lint, type, or test failures
- Verify build succeeds

**Test scenarios:**
- `pnpm lint` — 0 errors
- `pnpm type-check` — passes
- `pnpm test` — all tests pass
- `pnpm build` — succeeds

**Verification:**
- CI pipeline green on PR

## System-Wide Impact

- **Interaction graph:** DisposalFlow composes TokenList, TokenApproval, useTokenDisposal, TransactionQueue. No new callbacks into existing systems.
- **Error propagation:** Transfer failures surface via toast + error state. Transaction queue shows failed status with red styling. Individual failures don't halt other transactions — each is monitored independently by the queue.
- **State lifecycle risks:** Sequential transfers mean partial success is possible. Mitigations:
  - Each transaction tracked independently in queue with its own status badge
  - User sees real-time progress: 3/5 complete, 1 failed, 1 pending
  - Failed transactions shown in red with retry guidance (wallet-level errors get recovery buttons via `wallet-error-recovery.tsx`)
  - Confirm step shows mixed results: "Flushed 4 tokens. 1 failed: [token name]"
  - No rollback needed — burns are independent, partial success is acceptable
- **API surface parity:** No API changes. All client-side.
- **Integration coverage:** Manual E2E testing on Sepolia validates full flow.

## Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| RPC rate limits on Sepolia | Medium | Token discovery fails | Use existing 30s staleTime cache in `useReadContract`; batch metadata reads via `discoverUserTokens` |
| Wallet provider quirks on Sepolia | Low | Chain switch fails | Test with MetaMask (primary), Coinbase Wallet (secondary); use existing `wallet-error-detector.ts` classification |
| Gas estimation inaccuracy | Low | Transaction fails | Existing 1.5x buffer in `use-token-approval.ts` line 220; can tune if Sepolia differs significantly |
| User abandons mid-batch | Medium | Partial burn state | Acceptable — burns are independent; confirm step shows partial success clearly |

## Documentation / Operational Notes

- Update README with Sepolia testnet instructions
- Add "How to test" section for contributors
- No monitoring needed for testnet MVP

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-16-mvp-rebaseline-requirements.md](../brainstorms/2026-04-16-mvp-rebaseline-requirements.md)
- Related code: `hooks/use-token-approval.ts`, `hooks/use-wallet.ts`
- Burn address: `0x000000000000000000000000000000000000dEaD`
- Sepolia chainId: `11155111`
