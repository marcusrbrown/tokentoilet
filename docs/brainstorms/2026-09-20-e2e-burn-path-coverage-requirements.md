---
date: 2026-09-20
topic: e2e-burn-path-coverage
---

# E2E Burn Path Coverage

## Summary

Stand up a Playwright suite that verifies how the irreversible token burn flow *constructs* its transactions. A hand-written EIP-1193 wallet injected into the browser drives the app's own connector path, and every outbound transaction is intercepted and decoded before it leaves the page — asserting recipient, amount, token, chain, and ordering. The suite verifies construction only. It does not prove a burn settles correctly, and a green check does not indicate mainnet readiness.

---

## Problem Frame

Token Toilet permanently destroys assets. Disposal calls ERC-20 `transfer()` directly to `0x000000000000000000000000000000000000dEaD` — no approval step, no custody contract, no recovery path. A defect that sends the wrong amount, targets the wrong token, or fires on the wrong chain is unrecoverable for the user.

Every test proving that flow correct today runs in jsdom against mocked wagmi hooks. Mocked hooks cannot prove what calldata viem actually produced, because the mock replaces the code that produces it. The suite asserts that the app called a function we stubbed — a tautology dressed as coverage.

The mainnet readiness spike (`docs/brainstorms/2026-06-21-mainnet-readiness-spike.md`) named this blocker B3 and made it a go/no-go gate. Two related signals show the gap is real rather than theoretical:

- `components/web3/__tests__/token-workflows.e2e.test.tsx` is named as an E2E test but is a jsdom test with mocked hooks.
- Five scenarios in `hooks/use-wallet.integration.test.ts` are skipped with the explanation that jsdom cannot update hook state through `renderHook` after mock changes.

The confirmation gates added for B2 — acknowledgement, typed `BURN`, disabled-until-valid — raise the stakes rather than lowering them. They are safety controls, and they too are currently proven only against mocks. Verified against the repository: there is no Playwright or Cypress dependency, no `playwright.config.*`, no `test:e2e` script, and no browser job in `.github/workflows/ci.yaml`.

Who this protects, stated plainly: on Sepolia nobody is losing real value, so the immediate beneficiary is the maintainer and any future contributor who needs to change the disposal flow without reasoning about unrecoverable defects by hand. End-user protection is contingent on a mainnet decision that has not been made. This work exists to make that decision available rather than to respond to present user harm.

---

## Key Flows

- F1. Burn a batch of tokens
  - **Trigger:** A connected wallet on Sepolia with discoverable token balances opens `/flush`.
  - **Steps:** Select tokens from the list → advance to confirm → read the warning and destination → acknowledge → type the required confirmation → confirm the burn → each token is signed and submitted in turn → results render.
  - **Outcome:** One transaction per selected token, each transferring that token's full balance to the burn address on Sepolia, submitted sequentially, with per-token outcomes shown.
  - **Covered by:** R6, R7, R8, R9, R11, R16

- F2. A token fails mid-batch
  - **Trigger:** During F1, one token's simulation or signature fails.
  - **Steps:** The failing token is recorded as failed → the batch advances to the next token → remaining tokens complete normally → results distinguish succeeded from failed.
  - **Outcome:** One failure does not abort the batch and does not cause a token to be skipped silently or burned twice.
  - **Covered by:** R10, R13

---

## Requirements

**Harness**

- R1. Browser tests run in Playwright against Chromium, separate from the Vitest suite, invoked by a dedicated script. This requires adding `@playwright/test`, a `playwright.config.ts`, the test script, and a CI step that installs Chromium — none of which exist in the repository today.
- R2. A hand-written EIP-1193 provider is injected before application code runs and announced over EIP-6963, so the app exercises its own wallet-discovery and connector code path with a synthetic provider. The provider keeps a persistent `eip6963:requestProvider` listener that re-announces on demand; announcing only once does not survive AppKit's discovery lifecycle. Signing is backed by a viem local account whose key is generated at test startup or supplied as a masked CI secret, never committed to the repository. The key is never funded and never used outside the harness.
- R3. The provider returns its account from `eth_accounts` unconditionally, which causes wagmi's silent reconnect to connect without any modal interaction. This is a deliberate divergence from real wallet behavior, where a site must first be authorized — the burn-path tests assert post-connection behavior, so the authorization handshake is out of their scope.
- R4. The provider records every JSON-RPC request it receives and exposes them to tests for assertion.
- R5. Token discovery is stubbed at the network boundary so runs do not depend on Alchemy availability or live wallet balances. The seam is `lib/web3/token-discovery.ts` with `lib/web3/alchemy-endpoints.ts`, which construct their own viem client for enumeration. `lib/web3/config.ts` serves the wagmi/AppKit wallet path and does not affect discovery.

**Burn path verification**

- R6. For each burn, the test decodes the intercepted transaction with viem's ABI utilities and asserts the function is ERC-20 `transfer`, the recipient is the burn address, the amount equals the token's full selected balance, and the target contract is the intended token.
- R7. Tests assert the chain ID on every outbound transaction is Sepolia.
- R8. Tests assert one transaction per selected token, that transactions are submitted sequentially rather than concurrently, and that no unselected token appears in the intercepted set.
- R9. Tests assert each confirmation gate blocks independently: the burn cannot proceed without acknowledgement, cannot proceed without exact-match typed confirmation where required, and the confirm control stays disabled until every gate passes.
- R10. When a token's simulation or write fails, tests assert the batch advances, the remaining tokens still burn, and the results distinguish succeeded from failed tokens.
- R11. Tests assert the confirm step's safety content, not only its gating: the permanence warning is present, the burn destination is rendered in full rather than truncated, and each token shows its contract address and either an estimated value or an explicit unknown-value label.
- R12. Tests assert that selection and confirmation key off contract address and chain rather than symbol or name. A fixture supplies a token whose metadata impersonates a well-known asset, proving a user cannot be misled into burning the wrong contract.
- R13. Tests assert the in-progress batch states: per-token status while simulating and while awaiting wallet approval, and the transition from one token to the next.
- R14. Tests assert the confirm step's accessibility: the warning region is exposed to assistive technology, the acknowledgement control has an accessible name, and the typed-confirmation input is reachable and named.
- R15. Tests assert the escape paths: cancelling from confirm returns to selection, and the results-screen reset returns the flow to a usable selection state.
- R16. Tests assert that what the wallet is asked to sign matches what the confirm screen displayed — same token contract, same amount, same destination. The provider captures the request it was handed and the assertion compares it against the rendered confirmation, so a page-versus-wallet divergence fails.

**CI**

- R17. The suite runs on every pull request as a required check, on Chromium only, with a single worker and one retry.
- R18. Job duration is measured after the first runs, and trigger scope or parallelism is tuned from that measurement rather than in advance.

---

## Acceptance Examples

- AE1. **Covers R6, R7, R8.** Given three tokens selected with balances of 100, 250, and 7 units, when the burn is confirmed, then exactly three transactions are intercepted, each an ERC-20 `transfer` to the burn address on chain 11155111, carrying amounts 100, 250, and 7 against their respective token contracts, submitted one after another.
- AE2. **Covers R9.** Given a selected token with unknown value, when acknowledgement is checked but the typed confirmation field is empty or contains `burn` in lowercase, then the confirm control remains disabled and no transaction is intercepted.
- AE3. **Covers R10.** Given three selected tokens where the second fails simulation, when the burn is confirmed, then transactions are intercepted for the first and third only, and the results screen reports one failure and two successes.
- AE4. **Covers R8.** Given ten tokens selected but one deselected before confirming, when the burn is confirmed, then nine transactions are intercepted and none targets the deselected token's contract.

---

## Success Criteria

- A defect that changes the burn recipient, the transferred amount, the target token, or the chain fails CI before it reaches a user.
- A reviewer can point to a specific automated assertion behind each claim in the spike's Transaction-correctness checklist, rather than to a mocked hook.
- A planner can build the harness from this document without deciding what the suite is responsible for proving.

---

## Known coverage limits

A passing run does not rule out these defect classes. Each requires settlement-level verification, which is the named follow-up to this work:

- Fee-on-transfer and rebasing tokens, where the amount received differs from the amount sent.
- ERC-20 implementations that return `false` on failure instead of reverting, which a construction check cannot distinguish from success.
- Balance or state drift between simulation and broadcast.
- Reverts that only manifest on-chain.
- Nonce and ordering behavior under real mempool conditions.

Real-wallet behavior is a separate gap: the injected provider proves the app's connector and discovery code path works against a synthetic wallet, not that MetaMask, WalletConnect, or any specific wallet behaves correctly.

Value-dependent behavior is inert and therefore uncovered. `categorizeToken` is called with `undefined` metadata at its only production call site, so `estimatedValueUSD` is never populated and `TokenValueClass` is always `UNKNOWN`. Every token demands typed confirmation, per-token value always renders "Value unknown", and the value threshold in `requiresTypedConfirmation` never executes. R9's gate coverage reflects what production actually does rather than what the threshold logic suggests.

---

## Scope Boundaries

- On-chain settlement. No local chain, no receipts, no `Transfer` event assertions, no post-burn balance verification. This is the named follow-up gate for the defect classes above, not an open-ended deferral.
- Real wallet software. No MetaMask, no Synpress, no browser extension automation. Synpress documents MetaMask headless as broken on GitHub Actions, which makes it unsuitable as the foundation for a required check.
- WalletConnect relay behavior, deep-link pairing, and QR flows.
- Live Sepolia transactions from CI.
- Cross-browser coverage, sharding, and hardware wallet support.
- Visual regression testing.
- Disposition of the existing skipped and misnamed tests. That work consumes this harness but serves issue #1171 rather than burn safety, and is specified in `docs/brainstorms/2026-09-20-wallet-test-disposition-requirements.md`.

---

## Key Decisions

- Interception over settlement: decoding the transaction before submission verifies construction, which is the largest currently-unproven class of burn defect. Deferring settlement keeps Foundry out of CI and the first increment shippable, at the cost of the defect classes named under Known coverage limits.
- A hand-written provider over an off-the-shelf package: roughly a hundred lines, fully owned, with recording designed in rather than worked around. It also keeps a young third-party dependency out of the path that signs burn transactions.
- Inject a wallet rather than use wagmi's `mock` connector: the mock connector bypasses wallet discovery and the real connector path, so it would validate a code path production never takes. wagmi's own documentation scopes it to mocking functionality, not simulating a wallet.
- Bypass the AppKit modal in burn-path tests: AppKit's UI is LitElement web components whose internals shift between versions. Verified by spike — the bypass is total. Injecting the provider and navigating is sufficient; no modal DOM is touched, so version drift cannot break the destructive-flow suite. The modal remains available as a fallback and does list the injected provider as an installed connector.
- Gate every pull request from the start: the burn path is the one flow whose regression is unrecoverable for users. Cost is controlled by keeping the suite small and measured rather than by reducing when it runs. The gate establishes transaction-construction coverage only — it does not substitute for settlement or real-wallet validation, and must not be read as a mainnet-readiness signal.

---

## Dependencies / Assumptions

- The burn confirmation gates from PR #1505 are on `main` before the gate assertions in R9 can be written.
- Sepolia remains the only supported chain (`lib/web3/chains.ts`), so the suite has one chain to cover.
- The Alchemy endpoint is derived from an environment variable in `lib/web3/alchemy-endpoints.ts`, which is the seam R4 relies on.
- CI supplies the harness RPC and Alchemy values as masked secrets scoped to non-production endpoints, kept separate from any production credentials.
- Playwright is absent from the repository today, so no existing browser-test configuration constrains the design.
- Discovery requirements are settled by spike (`spike/eip6963-appkit-discovery`): `rdns` is the only `info` field wagmi enforces, and `eth_accounts` plus `eth_chainId` is the minimum RPC surface for the no-modal connect path. Full EIP-6963 conformance — UUIDv4, RFC-2397 data-URI icon, valid reverse-DNS — costs nothing and is used regardless, since wagmi's leniency is not a contract.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R1][Technical] Whether the suite runs against a production build or the dev server, traded off against job duration. The spike used the dev server successfully.
- [Affects R5][Technical] Whether discovery is stubbed via Playwright route interception or by pointing the Alchemy endpoint at a local fixture server.
- [Affects R12][Technical] How the spoofed-metadata fixture is sourced — a fabricated token in the discovery stub, or a real Sepolia impersonator contract.
- [Affects R13][Technical] Whether per-token in-progress states are observable deterministically, or need the provider to hold a request open to create the window.

---

## Sources / Research

- `docs/brainstorms/2026-06-21-mainnet-readiness-spike.md` — defines blocker B3 and the Transaction-correctness and Tests checklists this suite must satisfy.
- `docs/brainstorms/2026-09-20-wallet-test-disposition-requirements.md` — the companion doc covering issue #1171, which consumes this harness.
- `hooks/use-token-disposal.ts` — simulation-then-write path and burn address constant the assertions target.
- `components/web3/disposal-flow.tsx` — the four-step state machine and the confirmation gates R9 covers.
- `spike/eip6963-appkit-discovery` — throwaway branch proving discovery and no-modal connect against the real app, with a probe matrix establishing the minimum metadata and RPC surface.
- `lib/web3/token-discovery.ts` and `lib/web3/alchemy-endpoints.ts` — the enumeration path and endpoint seam R4 depends on. Discovery builds its own viem client here rather than reusing the wagmi config.
- Playwright CI guidance recommends a single worker, installing only the browser under test, and sharding only once a suite grows: https://playwright.dev/docs/ci
- Synpress documents MetaMask headless incompatibility on CI including GitHub Actions: https://docs.synpress.io/docs/known-issues
- wagmi scopes its `mock` connector to mocking functionality rather than wallet simulation: https://wagmi.sh/core/api/connectors/mock
- Reown's AppKit repository uses Playwright for its own E2E suite and publishes `@reown/appkit-testing`: https://github.com/reown-com/appkit
