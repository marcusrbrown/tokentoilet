# Token Toilet RFCs

This document serves as the master index for all Token Toilet implementation RFCs (Request for Comments). Each RFC breaks down a major feature area from the [PRD](../docs/prd.md) into actionable technical specifications.

## RFC Summary Table

| RFC | Title | Priority | Complexity | Phase | Status | Dependencies |
|-----|-------|----------|------------|-------|--------|--------------|
| [RFC-001](./RFC-001-Project-Foundation.md) | Project Foundation & Design System | Must Have | Medium | 1 | Pending | None |
| [RFC-002](./RFC-002-Wallet-Connection.md) | Wallet Connection & Multi-Chain | Must Have | High | 1 | Pending | RFC-001 |
| [RFC-003](./RFC-003-Token-Discovery.md) | Token Discovery & Display | Must Have | High | 2 | Pending | RFC-001, RFC-002 |
| [RFC-004](./RFC-004-Token-Management.md) | Token Management UI | Must Have | Medium | 2 | Pending | RFC-003 |
| [RFC-005](./RFC-005-Token-Selection-Approval.md) | Token Selection & Approval | Must Have | High | 2 | Pending | RFC-003, RFC-004 |
| [RFC-006](./RFC-006-Transaction-Infrastructure.md) | Transaction Infrastructure | Must Have | High | 2 | Pending | RFC-002 |
| [RFC-007](./RFC-007-Token-Disposal.md) | Token Disposal Flow | Must Have | High | 3 | Pending | RFC-005, RFC-006 |
| [RFC-008](./RFC-008-Animations.md) | Animations & UX Polish | Should Have | Medium | 3 | Pending | RFC-007 |
| [RFC-009](./RFC-009-Charity-Integration.md) | Charity Integration | Must Have | Medium | 4 | Pending | RFC-007 |
| [RFC-010](./RFC-010-NFT-Receipts.md) | NFT Receipt System | Should Have | High | 4 | Pending | RFC-007, RFC-009 |

## Dependency Graph

```
                                    ┌─────────────────┐
                                    │    RFC-001      │
                                    │   Foundation    │
                                    └────────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                              ▼              ▼              │
                    ┌─────────────────┐ ┌─────────────────┐ │
                    │    RFC-002      │ │    RFC-003      │◄┘
                    │ Wallet Connect  │ │ Token Discovery │
                    └────────┬────────┘ └────────┬────────┘
                             │                   │
                             │         ┌─────────┴─────────┐
                             │         │                   │
                             ▼         ▼                   ▼
                    ┌─────────────────┐ ┌─────────────────┐
                    │    RFC-006      │ │    RFC-004      │
                    │  Transactions   │ │  Token Mgmt UI  │
                    └────────┬────────┘ └────────┬────────┘
                             │                   │
                             │         ┌─────────┘
                             │         │
                             │         ▼
                             │ ┌─────────────────┐
                             │ │    RFC-005      │
                             │ │Selection/Approve│
                             │ └────────┬────────┘
                             │          │
                             └────┬─────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    RFC-007      │
                         │ Token Disposal  │
                         └────────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
          ┌─────────────────┐ ┌─────────────────┐
          │    RFC-008      │ │    RFC-009      │
          │   Animations    │ │    Charity      │
          └─────────────────┘ └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │    RFC-010      │
                              │  NFT Receipts   │
                              └─────────────────┘
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
Core infrastructure and wallet connectivity.

| RFC | Focus | Key Deliverables |
|-----|-------|------------------|
| RFC-001 | Design System | Design tokens, base components, accessibility |
| RFC-002 | Wallet Connection | MetaMask, WalletConnect, Coinbase Wallet, chain switching |

**Phase 1 Exit Criteria:**
- [ ] Design system components pass accessibility audit
- [ ] Wallet connection works with 3+ wallet types
- [ ] Chain switching functional on mainnet + testnets
- [ ] All tests passing, Storybook documented

### Phase 2: Token Discovery & Selection (Weeks 3-4)
Token fetching, display, and selection workflows.

| RFC | Focus | Key Deliverables |
|-----|-------|------------------|
| RFC-003 | Token Discovery | Alchemy API integration, token metadata, caching |
| RFC-004 | Token Management | Filtering, sorting, search, token detail view |
| RFC-005 | Selection & Approval | Batch selection (max 10), ERC-20 approval flow |
| RFC-006 | Transactions | Transaction queue, status tracking, error handling |

**Phase 2 Exit Criteria:**
- [ ] Tokens load within 3 seconds
- [ ] Filtering/sorting works correctly
- [ ] Batch selection UI functional
- [ ] Token approvals execute successfully
- [ ] Transaction queue manages concurrent transactions

### Phase 3: Core Disposal Flow (Weeks 5-6)
The main token disposal functionality.

| RFC | Focus | Key Deliverables |
|-----|-------|------------------|
| RFC-007 | Token Disposal | Disposal confirmation, batch processing, smart contract interface |
| RFC-008 | Animations | Flush animation, success celebration, micro-interactions |

**Phase 3 Exit Criteria:**
- [ ] Token disposal executes successfully on testnet
- [ ] Flush animation runs at 60fps
- [ ] Reduced motion alternatives work
- [ ] Error states handled gracefully

### Phase 4: Charity & Receipts (Weeks 7-8)
Charity integration and commemorative NFTs.

| RFC | Focus | Key Deliverables |
|-----|-------|------------------|
| RFC-009 | Charity Integration | The Giving Block API, donation tracking, webhooks |
| RFC-010 | NFT Receipts | ERC-721 minting, IPFS metadata, generative images |

**Phase 4 Exit Criteria:**
- [ ] Charity selection functional
- [ ] Donations tracked and reported
- [ ] NFT receipts mint successfully (<$5 gas)
- [ ] Receipt gallery displays all user receipts

## How to Use These RFCs

### For Implementation

Use the `/prd/implement` command to implement a specific RFC:

```
/prd/implement RFC-003
```

This will:
1. Read the RFC specification
2. Analyze existing codebase for related code
3. Create implementation plan with todos
4. Execute the implementation following the RFC spec

### RFC Structure

Each RFC contains:

1. **Summary**: High-level overview of the feature
2. **Features Addressed**: Mapping to PRD feature IDs (F1.1, F2.1, etc.)
3. **Dependencies**: Which RFCs must be completed first
4. **Technical Specification**: Detailed implementation with code examples
5. **File Structure**: Where code should be placed
6. **Acceptance Criteria**: Checkboxes for completion verification
7. **Testing Strategy**: Unit, integration, and E2E test requirements
8. **Success Metrics**: Measurable targets for the feature

### Updating RFC Status

When an RFC is implemented, update its status in this table:
- `Pending` → `In Progress` → `Completed`

## Feature ID Reference

Features from the [PRD FEATURES.md](../docs/FEATURES.md) are addressed across RFCs:

| Feature ID | Feature Name | RFC |
|------------|--------------|-----|
| F1.1-F1.4 | Wallet Connection | RFC-002 |
| F2.1-F2.4 | Token Discovery | RFC-003 |
| F3.1-F3.4 | Token Selection | RFC-004, RFC-005 |
| F4.1-F4.4 | Charity Integration | RFC-009 |
| F5.1-F5.4 | Token Disposal | RFC-007 |
| F6.1-F6.4 | NFT Receipts | RFC-010 |
| F7.1-F7.2 | Animations | RFC-008 |

## Technical Stack Reference

All RFCs assume the following stack (from [RULES.md](../docs/RULES.md)):

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5.9+ |
| Styling | Tailwind 4, CVA |
| Web3 | Wagmi 2, Reown AppKit 1.7+ |
| Data | TanStack Query 5 |
| Testing | Vitest, Testing Library, Playwright |
| Documentation | Storybook |

## Key Conventions

From [RULES.md](../docs/RULES.md):

- **Named exports only** - No default exports
- **`useWallet` abstraction** - Never import wagmi directly in components
- **`'use client'` directive** - Required for all Web3 components
- **Design system components** - Use `Card`, `Button`, `Badge`, etc. (no raw HTML)
- **Zod validation** - All external data validated with Zod schemas

## Related Documents

- [PRD](../docs/prd.md) - Product Requirements Document
- [FEATURES.md](../docs/FEATURES.md) - Feature specifications with acceptance criteria
- [RULES.md](../docs/RULES.md) - Development conventions and patterns
- [plan.md](../docs/plan.md) - Development timeline
