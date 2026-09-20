# E2E suite

Playwright specs that drive the real app UI against a local dev server.

## What this proves

These tests construct and submit transactions through the actual wallet connection and token approval/burn UI flows, using a synthetic wallet provider and stubbed network responses. They verify that the app builds the correct calldata and reaches the expected UI states.

## What this does not prove

These tests do not verify on-chain settlement. No transaction is broadcast to a real network, and no real funds move. Confirming that a transaction actually settles on-chain is out of scope for this suite.

## Running

```bash
pnpm test:e2e
```

The Playwright config starts `pnpm dev` automatically and reuses an already-running dev server outside CI. This suite is excluded from `pnpm test` (Vitest) and is not collected by it.
