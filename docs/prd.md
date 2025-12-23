# Token Toilet - Product Requirements Document

> A Web3 solution for cleaning up your digital wallet while supporting charitable causes

**Version:** 2.0  
**Date:** December 22, 2025  
**Author:** Product Development Team  
**Status:** Draft - Pending Review

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Audience](#2-target-audience)
3. [Success Metrics](#3-success-metrics)
4. [Core Features & Functionality](#4-core-features--functionality)
5. [Technical Architecture](#5-technical-architecture)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Interface & Experience](#7-user-interface--experience)
8. [Data Model](#8-data-model)
9. [Development Phases](#9-development-phases)
10. [Security Considerations](#10-security-considerations)
11. [Business Considerations](#11-business-considerations)
12. [Technical Challenges & Mitigations](#12-technical-challenges--mitigations)
13. [Future Enhancements](#13-future-enhancements)
14. [Appendix](#14-appendix)

---

## 1. Product Overview

### 1.1 Vision

Token Toilet is a Web3 platform that provides crypto enthusiasts with a fun, interactive way to dispose of unwanted tokens while contributing to charitable causes. By combining gamification elements with charitable giving, Token Toilet creates value from otherwise abandoned or unwanted digital assets.

### 1.2 Problem Statement

Crypto wallets accumulate digital clutter over time:
- Abandoned governance tokens from defunct DAOs
- Airdropped tokens with no clear utility
- NFTs from discontinued projects
- Tokens from failed or compromised protocols

Currently, users either ignore these tokens (cluttering their wallet) or send them to burn addresses (creating no value). Token Toilet transforms this "waste" into charitable impact.

### 1.3 Objectives

| # | Objective | Success Indicator |
|---|-----------|-------------------|
| 1 | Create a secure platform for disposing of unwanted tokens | Zero security incidents in first 6 months |
| 2 | Implement a gamified "blind box" mechanism | >30% repeat usage rate |
| 3 | Facilitate charitable donations | $10K+ in donations within first quarter |
| 4 | Support multiple blockchain networks | 3 chains at launch (Ethereum, Polygon, Arbitrum) |
| 5 | Provide seamless user experience | <3 clicks to complete disposal |
| 6 | Generate verifiable on-chain receipts | 100% of disposals have NFT receipts |

### 1.4 Key Value Propositions

| Stakeholder | Value |
|-------------|-------|
| **Token Donors** | Clean up wallet + support charity + fun experience |
| **Blind Box Players** | Entertainment + potential valuable returns |
| **Charities** | Novel crypto donation source without technical barriers |
| **Ecosystem** | Reduced token abandonment + increased utility |

### 1.5 Scope

#### In Scope (MVP)
- ERC-20 and ERC-721 token disposal
- Ethereum, Polygon, and Arbitrum support
- MetaMask, WalletConnect, and Coinbase Wallet integration
- Basic blind box contribution mechanism
- Single charity integration (The Giving Block)
- NFT proof of disposal
- Core animations (flush, reveal)

#### Out of Scope (MVP)
- Solana/SPL token support (Phase 2)
- ERC-1155 support (Phase 2)
- Multiple charity selection (Phase 2)
- Custom donation allocation sliders (Phase 2)
- Mobile native application (Phase 3)
- DAO governance (Phase 3)

---

## 2. Target Audience

### 2.1 Primary User Segments

| Segment | Description | Size Estimate |
|---------|-------------|---------------|
| **Crypto Enthusiasts** | Web3 participants with cluttered wallets | Large (primary) |
| **Charitable Givers** | Crypto holders wanting tax-efficient giving | Medium |
| **Blockchain Gamers** | Users enjoying gamified crypto experiences | Medium |

### 2.2 User Personas

#### Alice - The Wallet Cleaner
- **Background:** In crypto since 2017, DeFi power user
- **Pain Point:** Dozens of worthless tokens cluttering her wallet
- **Goal:** Clean wallet efficiently while doing something positive
- **Technical Comfort:** High - uses multiple wallets, understands approvals
- **Success Criteria:** Complete disposal in <2 minutes

#### Bob - The Charitable Gamer
- **Background:** Regular donor, enjoys gamification
- **Pain Point:** Wants fun ways to contribute to causes
- **Goal:** Entertainment with charitable upside
- **Technical Comfort:** Medium - familiar with MetaMask
- **Success Criteria:** Engaging experience with clear impact visibility

#### Carol - The NFT Enthusiast
- **Background:** Collects NFTs, values provenance
- **Pain Point:** Unwanted NFTs from discontinued projects
- **Goal:** Dispose of NFTs and receive proof of contribution
- **Technical Comfort:** Medium-High - understands NFT standards
- **Success Criteria:** Unique, collectible receipt NFT

---

## 3. Success Metrics

### 3.1 Key Performance Indicators (KPIs)

| Category | Metric | Target | Measurement |
|----------|--------|--------|-------------|
| **Acquisition** | Monthly Active Users | 1,000+ by month 3 | Analytics |
| **Engagement** | Tokens Disposed per Session | 5+ average | On-chain data |
| **Retention** | 30-Day Return Rate | >25% | Analytics |
| **Impact** | Total Charitable Donations | $10K+ by month 3 | On-chain data |
| **Technical** | Transaction Success Rate | >98% | Monitoring |
| **Technical** | Average Transaction Time | <30 seconds | Monitoring |
| **UX** | Task Completion Rate | >90% | Analytics |

### 3.2 North Star Metric

**Total Charitable Value Generated** = Sum of all donations + estimated value of disposed tokens redirected to charity

---

## 4. Core Features & Functionality

### 4.1 Wallet Integration

**Description:** Secure connection to users' blockchain wallets using Reown AppKit.

**Priority:** Must Have

**Acceptance Criteria:**
| # | Criterion | Measurable Target |
|---|-----------|-------------------|
| 1 | Support wallet providers | MetaMask, WalletConnect, Coinbase Wallet |
| 2 | Connection time | <2 seconds average |
| 3 | Session persistence | Survive page refresh |
| 4 | Network support | Ethereum, Polygon, Arbitrum |
| 5 | Chain switching | Seamless with user confirmation |
| 6 | Error recovery | Clear messaging + retry option for all failure modes |

**User Stories:**
- As a user, I can connect my wallet with one click so that I can access my tokens
- As a user, I can switch networks so that I can dispose of tokens across chains
- As a user, I see clear error messages when connection fails so that I can resolve issues

### 4.2 Token Discovery and Selection

**Description:** Interface for users to browse and select tokens in their wallet.

**Priority:** Must Have

**Acceptance Criteria:**
| # | Criterion | Measurable Target |
|---|-----------|-------------------|
| 1 | Discovery time | <5 seconds for wallets with up to 100 tokens |
| 2 | Token metadata | Display name, symbol, balance, icon |
| 3 | Filtering | By chain, by value, by type (ERC-20/721) |
| 4 | Sorting | By balance, name, recent activity |
| 5 | Batch selection | Select multiple tokens simultaneously |
| 6 | Balance accuracy | Real-time within 30 seconds |

**User Stories:**
- As a user, I can see all my tokens across supported chains so that I can decide what to dispose
- As a user, I can filter and sort tokens so that I can find specific items quickly
- As a user, I can select multiple tokens at once so that I can dispose efficiently

### 4.3 Token Disposal ("Toilet")

**Description:** Mechanism for users to safely dispose of unwanted tokens or NFTs.

**Priority:** Must Have

**Acceptance Criteria:**
| # | Criterion | Measurable Target |
|---|-----------|-------------------|
| 1 | Token standards | ERC-20, ERC-721 |
| 2 | Approval workflow | Clear explanation, one-click approve |
| 3 | Batch disposal | Up to 10 tokens per transaction |
| 4 | Transaction feedback | Real-time status updates |
| 5 | Confirmation | Clear summary before execution |
| 6 | Animation | Engaging flush animation (<3 seconds) |
| 7 | Receipt | NFT minted upon completion |

**User Stories:**
- As a user, I can approve and dispose of tokens in a simple flow so that cleanup is frictionless
- As a user, I see an engaging flush animation so that the experience is memorable
- As a user, I receive confirmation and receipt so that I have proof of disposal

### 4.4 Random Token Distribution ("Fountain")

**Description:** System providing users with random tokens in exchange for stablecoin contribution.

**Priority:** Should Have (MVP Phase 2)

**Acceptance Criteria:**
| # | Criterion | Measurable Target |
|---|-----------|-------------------|
| 1 | Accepted contributions | USDC, DAI |
| 2 | Minimum contribution | $1 equivalent |
| 3 | Odds display | Transparent before contribution |
| 4 | Randomness | Verifiable on-chain (Chainlink VRF) |
| 5 | Animation | Engaging reveal (<5 seconds) |
| 6 | Anti-gaming | Rate limiting, Sybil resistance |

### 4.5 Charity Integration ("Sprinkler")

**Description:** System to manage and distribute charitable donations.

**Priority:** Must Have

**Acceptance Criteria:**
| # | Criterion | Measurable Target |
|---|-----------|-------------------|
| 1 | Integration partner | The Giving Block API |
| 2 | Charity display | Name, description, logo, category |
| 3 | Donation tracking | Real-time on-chain verification |
| 4 | Reporting | Transparent donation history |
| 5 | Compliance | Meets donation platform requirements |

### 4.6 NFT Proof of Disposal

**Description:** NFT receipts as proof of contribution and disposal.

**Priority:** Should Have

**Acceptance Criteria:**
| # | Criterion | Measurable Target |
|---|-----------|-------------------|
| 1 | Automatic minting | 100% of successful disposals |
| 2 | Metadata | Transaction hash, tokens disposed, timestamp, charity impact |
| 3 | Visual design | Token Toilet branding, unique per disposal |
| 4 | Standard | ERC-721 compliant |
| 5 | Gas efficiency | <$5 mint cost on Ethereum at 30 gwei |

---

## 5. Technical Architecture

### 5.1 Technology Stack

**Frontend:**
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | App Router, SSR, API routes |
| React | 19.x | UI framework |
| TypeScript | 5.9+ | Type safety |
| Tailwind CSS | 4.x | Styling with glass morphism design system |
| Wagmi | 2.x | React hooks for Ethereum |
| Reown AppKit | 1.7+ | Wallet connection (formerly Web3Modal) |
| Viem | 2.x | TypeScript Ethereum library |
| TanStack Query | 5.x | Server state management |

**Smart Contracts:**
| Technology | Purpose |
|------------|---------|
| Solidity | 0.8.20+ | EVM contract development |
| OpenZeppelin | 5.x | Secure contract primitives |
| Hardhat/Foundry | Development and testing |
| Chainlink VRF | Verifiable randomness |

**Infrastructure:**
| Technology | Purpose |
|------------|---------|
| Vercel | Frontend hosting |
| IPFS | Decentralized NFT metadata storage |
| Alchemy/Infura | RPC providers |
| GitHub Actions | CI/CD |

### 5.2 Smart Contract Architecture

#### 5.2.1 TokenToilet.sol

**Purpose:** Accepts and processes token disposals.

```solidity
interface ITokenToilet {
    function flushToken(address token, uint256 amount) external;
    function flushNFT(address nft, uint256 tokenId) external;
    function batchFlush(address[] calldata tokens, uint256[] calldata amounts) external;
    function getTokensInToilet() external view returns (TokenInfo[] memory);
    
    event TokenFlushed(address indexed user, address indexed token, uint256 amount);
    event NFTFlushed(address indexed user, address indexed nft, uint256 tokenId);
}
```

#### 5.2.2 TokenFountain.sol

**Purpose:** Manages random token distribution.

```solidity
interface ITokenFountain {
    function contribute(uint256 amount) external;
    function claimRandomToken() external;
    function getOdds() external view returns (uint256[] memory);
    function getAvailableRewards() external view returns (TokenInfo[] memory);
    
    event Contribution(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, address indexed token, uint256 amount);
}
```

#### 5.2.3 CharitySprinkler.sol

**Purpose:** Manages charitable donation distribution.

```solidity
interface ICharitySprinkler {
    function registerCharity(address charity, string calldata name) external;
    function distributeToCharity(address charity, uint256 amount) external;
    function getSupportedCharities() external view returns (CharityInfo[] memory);
    function getDonationHistory(address charity) external view returns (Donation[] memory);
    
    event CharityRegistered(address indexed charity, string name);
    event DonationMade(address indexed charity, uint256 amount);
}
```

#### 5.2.4 ProofOfDisposal.sol

**Purpose:** ERC-721 NFT receipt system.

```solidity
interface IProofOfDisposal {
    function mintReceipt(address user, DisposalInfo calldata info) external returns (uint256);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function getUserReceipts(address user) external view returns (uint256[] memory);
    
    event ReceiptMinted(address indexed user, uint256 indexed tokenId);
}
```

### 5.3 System Architecture Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  User Wallets   │◄────────┤  Token Toilet   │────────►│  Charity Orgs   │
│  (MetaMask,     │         │  Web Interface  │         │  (The Giving    │
│   WalletConnect,│         │  (Next.js 16)   │         │   Block)        │
│   Coinbase)     │         │                 │         │                 │
└────────┬────────┘         └────────┬────────┘         └─────────────────┘
         │                           │
         │  Reown AppKit             │  Wagmi + Viem
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │                 │
            │  Smart          │
            │  Contracts      │
            │  (Solidity)     │
            │                 │
            └────────┬────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │Ethereum │  │ Polygon │  │Arbitrum │
   │ Mainnet │  │  PoS    │  │   One   │
   └─────────┘  └─────────┘  └─────────┘
```

### 5.4 Integration Points

| Integration | Provider | Purpose |
|-------------|----------|---------|
| Wallet Connection | Reown AppKit | Multi-wallet, multi-chain support |
| RPC Providers | Alchemy, Infura | Blockchain queries |
| Charity Platform | The Giving Block | Donation processing |
| Token Metadata | Token Lists, CoinGecko | Token information |
| NFT Storage | IPFS via Pinata | Receipt metadata |
| Randomness | Chainlink VRF | Fair distribution |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Target | Priority |
|--------|--------|----------|
| Initial Page Load (LCP) | <2.5 seconds | Must Have |
| Time to Interactive | <3 seconds | Must Have |
| Token Discovery | <5 seconds (100 tokens) | Must Have |
| Transaction Submission | <2 seconds | Must Have |
| Animation Frame Rate | 60 fps | Should Have |
| Bundle Size (JS) | <500KB gzipped | Should Have |

### 6.2 Scalability

| Metric | Target |
|--------|--------|
| Concurrent Users | 1,000+ |
| Tokens per Wallet | Support up to 1,000 |
| Transactions per Hour | 10,000+ |

### 6.3 Availability

| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| Recovery Time | <1 hour |
| Data Durability | On-chain (100%) |

### 6.4 Accessibility

| Requirement | Standard |
|-------------|----------|
| WCAG Compliance | Level AA |
| Keyboard Navigation | Full support |
| Screen Reader | Compatible |
| Color Contrast | 4.5:1 minimum |

### 6.5 Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## 7. User Interface & Experience

### 7.1 Design System

Token Toilet uses an established design system with:

| Element | Specification |
|---------|---------------|
| **Primary Color** | Violet palette (violet-50 to violet-900) |
| **Style** | Glass morphism with backdrop blur |
| **Typography** | Inter font family |
| **Theme Support** | Light and dark modes |
| **Component Library** | 14+ production-ready components |

### 7.2 Key User Flows

#### 7.2.1 Token Disposal Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Connect │───►│  Select  │───►│  Review  │───►│  Approve │───►│  Flush   │
│  Wallet  │    │  Tokens  │    │  Summary │    │  Tokens  │    │  & NFT   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
  <2 sec          Browse/         Confirm        One-click       Animation
  connect         filter          selection       approve         + receipt
```

#### 7.2.2 Blind Box Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Connect │───►│  Choose  │───►│  View    │───►│ Contribute│───►│  Reveal  │
│  Wallet  │    │  Amount  │    │  Odds    │    │  & Wait  │    │  Reward  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 7.3 UI Components

Leverage existing component library:

| Component | Usage |
|-----------|-------|
| `<Button>` | Primary actions with violet theme |
| `<Card>` | Token cards, summary cards |
| `<AddressDisplay>` | Wallet address with copy/link |
| `<NetworkBadge>` | Current chain indicator |
| `<TokenList>` | Selectable token grid |
| `<TransactionStatus>` | Progress and confirmation |
| `<Modal>` | Confirmation dialogs |
| `<Toast>` | Success/error notifications |

### 7.4 Animation Specifications

| Animation | Duration | Trigger |
|-----------|----------|---------|
| Toilet Flush | 2-3 seconds | On disposal confirmation |
| Token Spiral | Part of flush | Tokens entering drain |
| Fountain Reveal | 3-5 seconds | On reward claim |
| Success Celebration | 1-2 seconds | On completion |

---

## 8. Data Model

### 8.1 Token Metadata

```typescript
interface TokenMetadata {
  address: `0x${string}`;
  chainId: 1 | 137 | 42161; // Ethereum, Polygon, Arbitrum
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  balance: bigint;
  type: 'ERC20' | 'ERC721';
}
```

### 8.2 Transaction Records

```typescript
interface TransactionRecord {
  txHash: `0x${string}`;
  chainId: number;
  user: `0x${string}`;
  actionType: 'disposal' | 'contribution' | 'claim';
  tokens: Array<{
    address: `0x${string}`;
    amount: bigint;
    tokenId?: bigint;
  }>;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  receiptTokenId?: bigint;
}
```

### 8.3 NFT Receipt Metadata

```typescript
interface ReceiptMetadata {
  name: string;
  description: string;
  image: string; // IPFS URI
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    txHash: string;
    chainId: number;
    disposedTokens: Array<{
      name: string;
      symbol: string;
      amount: string;
    }>;
    timestamp: number;
    charityImpact?: {
      organization: string;
      amount: string;
    };
  };
}
```

### 8.4 Charity Data

```typescript
interface CharityData {
  id: string;
  name: string;
  description: string;
  logoURI: string;
  walletAddress: `0x${string}`;
  categories: string[];
  totalDonations: bigint;
  website: string;
  verified: boolean;
}
```

---

## 9. Development Phases

### 9.1 Phase 1: Foundation (Weeks 1-2)

**Objectives:**
- Establish project infrastructure
- Implement wallet connection
- Set up multi-chain foundation

**Deliverables:**
| Deliverable | Acceptance Criteria |
|-------------|---------------------|
| Wallet Connection | Connect/disconnect on 3 chains |
| Chain Switching | Seamless network change |
| Token Discovery | Display tokens with metadata |
| Error Handling | Clear messages for all failure modes |

**Exit Criteria:**
- [ ] Wallet connects on Ethereum, Polygon, Arbitrum
- [ ] Token balances display accurately
- [ ] All tests passing

### 9.2 Phase 2: Core Token Management (Weeks 3-4)

**Objectives:**
- Develop token selection interface
- Implement approval workflow
- Create transaction handling

**Deliverables:**
| Deliverable | Acceptance Criteria |
|-------------|---------------------|
| Token Selection UI | Multi-select with filtering |
| Approval Flow | One-click approve pattern |
| Transaction Monitor | Real-time status updates |
| Disposal Contract | TokenToilet.sol deployed to testnet |

**Exit Criteria:**
- [ ] Users can select and approve tokens
- [ ] Transactions complete successfully
- [ ] Contract passes security review

### 9.3 Phase 3: Toilet & Animations (Weeks 5-6)

**Objectives:**
- Implement disposal mechanism
- Create engaging animations
- Deploy to testnet

**Deliverables:**
| Deliverable | Acceptance Criteria |
|-------------|---------------------|
| Disposal Flow | End-to-end token disposal |
| Flush Animation | 60fps, <3 seconds |
| Testnet Deployment | All contracts on Sepolia/Mumbai |
| Integration Testing | Full flow tested |

**Exit Criteria:**
- [ ] Complete disposal flow functional
- [ ] Animations perform at 60fps
- [ ] Testnet deployment successful

### 9.4 Phase 4: Charity & NFT Receipts (Weeks 7-8)

**Objectives:**
- Integrate charity donations
- Implement NFT receipt minting
- Polish and launch prep

**Deliverables:**
| Deliverable | Acceptance Criteria |
|-------------|---------------------|
| Charity Integration | The Giving Block connected |
| NFT Receipts | Mint on disposal |
| UI Polish | Design system compliance |
| Documentation | User and developer guides |

**Exit Criteria:**
- [ ] Charity donations functional
- [ ] NFT receipts mint correctly
- [ ] Ready for security audit

### 9.5 MVP Feature Matrix

| Feature | Priority | Phase | Status |
|---------|----------|-------|--------|
| Wallet Connection | Must Have | 1 | In Progress |
| Token Discovery | Must Have | 1 | In Progress |
| Token Selection | Must Have | 2 | Not Started |
| Token Approval | Must Have | 2 | Not Started |
| Token Disposal | Must Have | 3 | Not Started |
| Flush Animation | Should Have | 3 | Not Started |
| Charity Integration | Must Have | 4 | Not Started |
| NFT Receipts | Should Have | 4 | Not Started |
| Blind Box | Should Have | Post-MVP | Not Started |

---

## 10. Security Considerations

### 10.1 Smart Contract Security

| Requirement | Implementation |
|-------------|----------------|
| **Auditing** | Professional audit before mainnet |
| **Access Control** | OpenZeppelin AccessControl |
| **Pausability** | Emergency pause mechanism |
| **Reentrancy Protection** | ReentrancyGuard on all external calls |
| **Safe Transfers** | SafeERC20 for all token operations |

### 10.2 Frontend Security

| Requirement | Implementation |
|-------------|----------------|
| **Input Validation** | Zod schemas for all inputs |
| **Transaction Simulation** | Simulate before submission |
| **Phishing Protection** | Domain verification |
| **CSP Headers** | Strict Content Security Policy |

### 10.3 Transaction Safety

| Requirement | Implementation |
|-------------|----------------|
| **Gas Estimation** | Accurate with 20% buffer |
| **Stuck Transaction Handling** | Speed-up/cancel options |
| **Confirmation Thresholds** | Wait for 2 confirmations |

### 10.4 Third-Party Security

| Requirement | Implementation |
|-------------|----------------|
| **API Keys** | Environment variables, server-side only |
| **Rate Limiting** | Protect against abuse |
| **Dependency Scanning** | Automated with Dependabot |

---

## 11. Business Considerations

### 11.1 Monetization Strategy

| Revenue Stream | Model | Target |
|----------------|-------|--------|
| Blind Box Fees | 5% of contribution | $500/month by month 6 |
| Premium NFT Receipts | One-time purchase | $100/month by month 6 |
| Partnership Fees | Revenue share | $200/month by month 6 |

### 11.2 Legal Considerations

#### 11.2.1 Charitable Donation Compliance

| Requirement | Approach |
|-------------|----------|
| Tax Documentation | Partner with compliant platform (The Giving Block) |
| Reporting | Automated donation receipts |
| Verification | Only registered 501(c)(3) organizations |

#### 11.2.2 Gambling Regulations

| Risk | Mitigation |
|------|------------|
| Blind box as gambling | No monetary entry requirement for disposal |
| Variable returns | Transparent odds disclosure |
| Age verification | Wallet-based (inherent to Web3) |
| Jurisdiction restrictions | Geo-blocking where required |

**Legal Review Required:** Consult with legal counsel before launch to ensure compliance with:
- US state gambling laws
- EU gaming regulations
- Crypto-specific regulations by jurisdiction

### 11.3 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Smart contract exploit | Low | Critical | Audit, bug bounty |
| Regulatory action | Medium | High | Legal review, compliance |
| Low adoption | Medium | Medium | Marketing, partnerships |
| Gas cost barriers | Medium | Medium | L2 priority, gas subsidies |

---

## 12. Technical Challenges & Mitigations

### 12.1 Multi-chain Integration

**Challenge:** Different chains have varying confirmation times, gas models, and RPC reliability.

**Mitigation:**
- Chain-specific adapters with unified interface
- Fallback RPC providers
- Chain-appropriate confirmation thresholds
- Clear UX for chain-specific behaviors

### 12.2 Random Distribution Fairness

**Challenge:** Ensuring provably fair randomness on-chain.

**Mitigation:**
- Chainlink VRF for verifiable randomness
- Transparent odds calculation
- Public audit of distribution history
- Anti-manipulation safeguards (cooldowns, limits)

### 12.3 Gas Optimization

**Challenge:** High gas costs on Ethereum mainnet.

**Mitigation:**
- Batch operations where possible
- Prioritize L2s (Polygon, Arbitrum) for high-frequency actions
- Accurate gas estimation with user warnings
- Consider gas subsidies for small disposals

### 12.4 Token Standard Variations

**Challenge:** Non-standard token implementations.

**Mitigation:**
- Try/catch with fallback patterns
- Token whitelist for known-good contracts
- Clear error messages for unsupported tokens
- Manual override option with warnings

---

## 13. Future Enhancements

### 13.1 Phase 2 Features (Post-MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| Solana Support | SPL token disposal | High |
| Multiple Charities | User-selected allocation | High |
| ERC-1155 Support | Multi-token standard | Medium |
| LLM Token Insights | AI-powered token history | Medium |

### 13.2 Phase 3 Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Mobile App | Native iOS/Android | High |
| DAO Governance | Community decisions | Medium |
| Dynamic NFTs | Evolving receipts | Low |
| Cross-chain Bridging | Unified multi-chain experience | Medium |

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|------------|
| Disposal | Transferring tokens to the TokenToilet contract |
| Flush | The animated disposal action |
| Fountain | The blind box contribution system |
| Sprinkler | The charity distribution system |
| Receipt NFT | ERC-721 proof of disposal |

### 14.2 References

- [Reown AppKit Documentation](https://docs.reown.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [The Giving Block API](https://thegivingblock.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

### 14.3 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 3, 2025 | Product Team | Initial draft |
| 2.0 | Dec 22, 2025 | Product Team | Updated tech stack, added NFRs, aligned with implementation |

---

*Document Status: Draft - Pending Stakeholder Review*
