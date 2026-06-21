---
title: Research a provider's real error shapes, not just the transport surface you assumed
date: 2026-06-21
category: workflow-issues
module: tooling
problem_type: best_practice
component: development_workflow
severity: high
applies_when:
  - investigating a third-party API failure, auth bug, or edge case
  - a provider may encode the same failure in more than one wire format
  - transport-layer (HTTP) and RPC-layer errors are both possible
  - a narrow docs question risks missing the dominant real-world case
  - classifier logic depends on error type plus a message fallback
related_components:
  - tooling
tags:
  - research-scoping
  - provider-errors
  - viem
  - alchemy
  - auth-failure
  - error-classification
  - rpc-error
---

# Research a provider's real error shapes, not just the transport surface you assumed

## Context

A fix to detect an invalid Alchemy API key shipped with a green local review and passing tests — then an independent review caught that it only handled one of two real failure shapes. The fix was built from a research question that was shaped like the assumption rather than the reality: it asked *"how does viem surface an HTTP 401/403?"* instead of *"what does Alchemy actually return for an invalid key, in every form, and how does viem surface each one?"* The narrow question produced a fix that looked complete but missed the dominant production case.

## Guidance

When you research how to handle an external provider's error or edge case, frame the question around **what the provider actually emits**, not around **how the client library surfaces the one shape you already pictured**.

1. **Ask the provider-shaped question.** "What does this provider return for this failure, in all its forms?" — bare HTTP status, JSON-RPC error body, rate-limit envelope, partial success. Enumerate the forms before writing detection logic.
2. **Map each provider shape to how your client library surfaces it.** The same logical failure can arrive as different error classes (a transport error vs a protocol error) with different accessible fields. Detection that keys off one field (e.g. `.status`) silently misses the shapes that lack it.
3. **Centralize the classifier and test every shape.** One function, one place, with a test per wire format — including the message-string fallback for when structured fields shift.
4. **Treat "retryable vs fatal" as an explicit decision per shape**, not an inference from the single shape you happened to handle. Misclassifying a fatal auth error as retryable produces a silent retry loop.
5. **Read the provider's error reference, not just the client library's docs.** The client library documents *its* error classes; the provider documents *which* of those it actually triggers and with what codes/messages.

## Why This Matters

A happy-path-shaped research question yields happy-path-shaped coverage. The fix passes local review and tests because the tests are built from the same narrow assumption — so the blind spot survives all the way to production, where the unhandled shape is often the *common* one. Here, the missed shape included the origin-not-allowlisted case, which is exactly what a domain-restricted browser key hits in the field. Asking the provider-shaped question up front is far cheaper than discovering the gap after shipping.

## When to Apply

- Investigating a third-party API failure, auth bug, or rate-limit handling
- The provider may encode one failure in multiple wire formats (HTTP status vs RPC body)
- Detection/classification logic branches on error type or status
- A misclassification would change retry behavior or a user-facing state
- Writing tests for provider error handling (cover every shape, not just one)

## Examples

### The research question, before and after

- **Before (assumption-shaped):** "How does viem surface an HTTP 401/403?"
  → produced a fix that only checked `error instanceof HttpRequestError && (error.status === 401 || error.status === 403)`.
- **After (provider-shaped):** "What does Alchemy return for an invalid / unauthorized / origin-blocked key, in every form, and how does viem surface each?"
  → revealed that Alchemy mostly returns a **JSON-RPC error body** (`code: -32600`, messages `Must be authenticated!` / `Invalid access key` / `Origin not on whitelist.`), which viem's `http()` transport surfaces as an `InvalidRequestRpcError` (an `RpcError`) with **no `.status`** — the case the first fix missed entirely.

### The two shapes, and the classifier that covers both

Alchemy auth failures arrive as either a bare HTTP status or a JSON-RPC error body:

| Failure | HTTP | JSON-RPC code | viem error class |
|---|---|---|---|
| invalid / missing key | 401 | -32600 | `InvalidRequestRpcError` (no `.status`) or `HttpRequestError` (has `.status`) |
| origin not allowlisted | 403 | -32600 | same |

A classifier must walk both paths (verified against Alchemy's error reference and viem source — viem's `http()` transport returns the parsed JSON-RPC error when the body carries `error.code` + `error.message`, otherwise throws `HttpRequestError`):

```ts
import {BaseError, HttpRequestError, InvalidRequestRpcError, RpcError} from 'viem'

const ALCHEMY_AUTH_MESSAGES = ['Must be authenticated!', 'Invalid access key', 'Origin not on whitelist.'] as const

export function isAlchemyAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  // Path 1: bare HTTP status → HttpRequestError carries .status
  if (error instanceof HttpRequestError) return error.status === 401 || error.status === 403
  // Path 2: JSON-RPC error body → RpcError reached via the BaseError cause chain
  const base = error instanceof BaseError ? error : undefined
  const rpcLike = base?.walk(err => err instanceof InvalidRequestRpcError || err instanceof RpcError)
  if (rpcLike instanceof InvalidRequestRpcError) return true
  if (rpcLike instanceof RpcError) {
    if (rpcLike.code === -32600) return true
    return ALCHEMY_AUTH_MESSAGES.some(m => rpcLike.message.includes(m))
  }
  // Last-resort message fallback (provider strings can shift transport behavior)
  return ALCHEMY_AUTH_MESSAGES.some(m => error.message.includes(m))
}
```

## Related

- `lib/web3/alchemy-token-api.ts` — the `isAlchemyAuthError` classifier and its tests (`alchemy-token-api.test.ts`).
- `lib/web3/token-discovery.ts` — the catch site that maps an Alchemy auth error to the non-retryable "discovery unavailable" state.
- `docs/solutions/workflow-issues/library-changes-need-consumer-verification-2026-06-21.md` — companion learning; both were surfaced by an independent review catching what local verification missed, but that one is about consumer-contract drift, this one about provider error-shape research.
- Alchemy error reference: https://www.alchemy.com/docs/reference/error-reference
