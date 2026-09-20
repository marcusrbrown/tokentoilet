---
date: 2026-09-20
topic: batch-interruption
---

# Batch Interruption Accounting

## Summary

When a disposal batch is interrupted, the user keeps a record of what happened. A page-owned batch session survives the wallet and network guards, preserves per-token status, stops issuing further requests, and never resumes on its own.

---

## Problem Frame

Disposal processes tokens sequentially, one wallet signature each. If the wallet disconnects or the chain changes mid-batch, `app/flush/page.tsx` and `components/web3/network-guard.tsx` each swap `DisposalFlow` out for a prompt. Stopping further submissions is right. Erasing the account of the ones already made is not.

A user who signed two of five burns lands on "Connect your wallet" with no record that three did not happen, and no confirmation of the two that did. The tokens were destroyed irreversibly, and the interface shows nothing.

Two adjacent inaccuracies compound it:

- The unattempted count is computed as `selectedTokens.length - results.length` (`components/web3/disposal-flow.tsx`). That cannot establish "not attempted" — an executor may have issued a wallet request without reporting a terminal result, so a token in flight is indistinguishable from one never started.
- The results screen reads "Flushed" for any token where `isSuccess` is true. `isSuccess` means `writeContract` returned a hash — submitted, not confirmed on-chain. `hooks/use-token-disposal.ts` is accurate internally, toasting "disposal submitted", but the results screen overstates it.

The batch list is also unstable: `selectedTokens` is recomputed from live discovery, so token identity and counts can shift with wallet context rather than staying fixed at the moment the user confirmed.

This was found while building E2E coverage. A first attempt fixed it inside `DisposalFlow`, which is the wrong layer — the component is unmounted before it can report anything.

---

## Requirements

**Session ownership**

- R1. The batch session is owned above both the connection and network guards, so it survives the unmount of `DisposalFlow`.
- R2. On confirmation, the session snapshots the token list, the initiating account, and the chain. Later discovery results do not change what the batch is.

**Status accounting**

- R3. Each token in the session carries one of: confirmed, submitted, failed, unresolved, not started.
- R4. A token whose wallet request was issued but never resolved is recorded as unresolved, never as not started.
- R5. "Confirmed" requires an on-chain receipt. Submission alone is reported as submitted.
- R6. Language reflects the distinction — a submitted token is not described as flushed.

**Interruption behavior**

- R7. On disconnect or a chain change, the session stops issuing further requests.
- R8. The interruption summary stays visible alongside reconnect or switch-network controls, rather than being replaced by a generic prompt.
- R9. The batch never resumes automatically on reconnect. The user decides.

---

## Success Criteria

- A user interrupted mid-batch can tell which tokens were destroyed, which are pending, and which never started.
- No interface text claims a burn completed when only a submission occurred.
- Reconnecting does not silently continue destroying tokens.

---

## Scope Boundaries

- Resuming an interrupted batch. Stopping safely and reporting honestly comes first.
- Recovering or reversing a submitted burn. Not possible.
- Changing the sequential one-signature-per-token model.
- The existing transaction queue, which already persists submitted hashes independently and is not the gap here.

---

## Key Decisions

- Own the session at the page, not in `DisposalFlow`: the component is unmounted by the guards in the same render pass the condition trips, so nothing it holds can survive the interruption.
- Snapshot at confirmation rather than tracking live selection: the user agreed to burn a specific set, and that set must not drift with discovery.
- Never auto-resume: silently continuing an irreversible operation after a connection event the user may not have intended is worse than making them restart.

---

## Dependencies / Assumptions

- The transaction queue (`lib/web3/transaction-queue.ts`) already persists submitted hashes and can supply confirmation state; the session consumes it rather than replacing it.
- No contract or chain changes are needed. This is entirely client-side state ownership and presentation.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R1][Technical] Where the session lives — page state, context, or a store — and whether it needs to survive a reload.
- [Affects R4][Technical] How an unresolved wallet request is detected, given the provider may never settle the promise.
- [Affects R5][Technical] Whether the results screen subscribes to the transaction queue for confirmation, or polls independently.

---

## Sources / Research

- `components/web3/disposal-flow.tsx` — the sequential executor, the unattempted-count arithmetic, and the "Flushed" label.
- `hooks/use-token-disposal.ts` — where submission and confirmation already diverge correctly.
- `app/flush/page.tsx` and `components/web3/network-guard.tsx` — the two guards that unmount the flow.
- `lib/web3/transaction-queue.ts` — independent persistence of submitted hashes.
- `docs/plans/2026-09-20-001-feat-e2e-burn-path-coverage-plan.md` — Unit 5, withdrawn, records the failed first attempt and why the layer was wrong.
