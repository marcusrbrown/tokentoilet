---
date: 2026-04-16
topic: mvp-rebaseline
---

# Token Toilet MVP Rebaseline

## Problem Frame

The original PRD scoped an 8-week, 4-phase MVP with multi-chain support, charity integration, NFT receipts, and a blind-box Fountain mechanism. Reality check: no smart contracts exist, the app is a landing page with disconnected components, and deployment is fake (CI echo placeholders).

The frontend infrastructure is solid (wallet connection, token discovery, approval flow, transaction queue), but none of it is wired into an actual disposal flow. We need to ship a working product before expanding scope.

## Requirements

### Core Flow (Must Have)

- R1. User can connect wallet and see their ERC-20 token balances on Sepolia
- R2. User can select one or more ERC-20 tokens for disposal (batch up to 10)
- R3. User can approve selected tokens for transfer (existing approval UI)
- R4. User can execute disposal, transferring tokens to burn address `0x000000000000000000000000000000000000dEaD`
- R5. User sees real-time transaction status with explorer link
- R6. User sees success confirmation with summary of disposed tokens

### Infrastructure (Must Have)

- R7. App deploys to Vercel (replace CI echo placeholders with real deployment)
- R8. Sepolia testnet is the only supported network for v1.0
- R9. All existing quality gates pass (lint, type-check, test, build)

### Deferred to v1.1+

- D1. Ethereum mainnet deployment (after testnet validation)
- D2. Multi-chain support (Polygon, Arbitrum)
- D3. ERC-721 NFT disposal
- D4. The Giving Block charity integration
- D5. NFT proof of disposal receipts
- D6. Fountain/blind-box mechanism
- D7. TokenToilet smart contract (tokens currently burn, not pool)

## Success Criteria

- [ ] User can complete full disposal flow: connect → discover → select → approve → dispose → confirm
- [ ] Disposed tokens appear at burn address on Sepolia block explorer
- [ ] App is live on Vercel with working URL
- [ ] Zero high/critical security vulnerabilities in `pnpm audit`
- [ ] All CI checks pass on main branch

## Scope Boundaries

- **Single chain only**: Sepolia testnet. No chain switching, no multi-chain.
- **ERC-20 only**: No ERC-721/1155 support in v1.0.
- **Burn, not pool**: Tokens transfer to dead address, not a contract.
- **No charity**: The Giving Block integration deferred.
- **No receipts**: NFT proof of disposal deferred.
- **No Fountain**: Blind-box mechanism deferred entirely.

## Key Decisions

- **Burn address over contract**: Simplest possible disposal. No contract deployment, audit, or gas optimization needed. Proves the flow works before adding complexity.
- **Sepolia first**: Real testnet validation before mainnet. Catches issues without risking user funds.
- **Wire existing components**: Token discovery, approval flow, and transaction queue already exist. The work is integration, not net-new development.

## Dependencies / Assumptions

- Existing `useWallet` hook and wallet connection work correctly (validated by tests)
- Token discovery via Alchemy/Infura APIs works on Sepolia
- Vercel deployment is straightforward (Next.js 16 supported)

## Outstanding Questions

### Deferred to Planning

- [Affects R4][Technical] What's the optimal batching strategy for multi-token disposal? Single multicall vs sequential transfers?
- [Affects R7][Technical] What Vercel configuration is needed? Environment variables, build settings?
- [Affects R1][Needs research] Does Alchemy token API work identically on Sepolia vs mainnet?

## Next Steps

→ `/ce:plan` for structured implementation planning
