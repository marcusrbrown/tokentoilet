# Token Toilet - Features Specification

> Comprehensive feature breakdown extracted from the Product Requirements Document

**Version:** 1.0  
**Date:** December 23, 2025  
**Source:** [PRD v2.0](./prd.md)  
**Status:** Active

---

## Table of Contents

- [Summary](#summary)
- [Feature Categories](#feature-categories)
  - [1. Wallet & Connection](#1-wallet--connection)
  - [2. Token Management](#2-token-management)
  - [3. Token Disposal (Toilet)](#3-token-disposal-toilet)
  - [4. Charity Integration (Sprinkler)](#4-charity-integration-sprinkler)
  - [5. Random Distribution (Fountain)](#5-random-distribution-fountain)
  - [6. NFT Receipts](#6-nft-receipts)
  - [7. User Experience & Animations](#7-user-experience--animations)
  - [8. Security & Safety](#8-security--safety)
  - [9. Infrastructure & Performance](#9-infrastructure--performance)
- [Feature Matrix](#feature-matrix)
- [Dependencies](#dependencies)
- [Future Features](#future-features)

---

## Summary

### Feature Count by Priority

| Priority | Count | Description |
|----------|-------|-------------|
| **Must Have** | 18 | Critical for MVP launch |
| **Should Have** | 12 | Important but not blocking |
| **Could Have** | 8 | Desirable enhancements |
| **Won't Have (MVP)** | 6 | Deferred to future phases |

### Feature Count by Category

| Category | Count | MVP Features |
|----------|-------|--------------|
| Wallet & Connection | 6 | 6 |
| Token Management | 7 | 6 |
| Token Disposal | 6 | 5 |
| Charity Integration | 5 | 4 |
| Random Distribution | 6 | 0 (Phase 2) |
| NFT Receipts | 5 | 4 |
| UX & Animations | 5 | 3 |
| Security & Safety | 6 | 6 |
| Infrastructure | 8 | 6 |

---

## Feature Categories

### 1. Wallet & Connection

#### F1.1 - Multi-Wallet Connection

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Medium  
**Personas:** Alice, Bob, Carol

**Description:**  
Secure wallet connection using Reown AppKit (formerly Web3Modal) supporting multiple wallet providers for seamless onboarding.

**Acceptance Criteria:**
- [ ] Support MetaMask browser extension and mobile
- [ ] Support WalletConnect v2 protocol
- [ ] Support Coinbase Wallet
- [ ] Connection completes in <2 seconds average
- [ ] Display connected wallet address with truncation
- [ ] Show wallet provider icon/name

**Technical Considerations:**
- Use Reown AppKit 1.7+ for unified wallet integration
- Implement wagmi hooks for state management
- Handle provider-specific quirks (MetaMask vs WalletConnect signing)

**Edge Cases:**
- User has multiple wallets installed
- Wallet is locked/disconnected mid-session
- Mobile deep-link connection failures

---

#### F1.2 - Session Persistence

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Low  
**Personas:** Alice, Bob, Carol

**Description:**  
Maintain wallet connection across page refreshes and browser sessions for seamless user experience.

**Acceptance Criteria:**
- [ ] Connection survives page refresh
- [ ] Reconnect automatically on return visit (within 24 hours)
- [ ] Clear session on explicit disconnect
- [ ] Handle expired sessions gracefully

**Technical Considerations:**
- Use wagmi's built-in persistence with localStorage
- Implement secure storage for session data
- Handle stale session cleanup

---

#### F1.3 - Multi-Chain Support

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** High  
**Personas:** Alice

**Description:**  
Support Ethereum, Polygon, and Arbitrum networks with seamless chain switching.

**Acceptance Criteria:**
- [ ] Support Ethereum Mainnet (chainId: 1)
- [ ] Support Polygon PoS (chainId: 137)
- [ ] Support Arbitrum One (chainId: 42161)
- [ ] Display current network with badge/indicator
- [ ] Auto-detect user's current network on connect

**Technical Considerations:**
- Configure chain-specific RPC endpoints (Alchemy/Infura)
- Handle chain-specific confirmation times
- Implement fallback RPC providers

---

#### F1.4 - Chain Switching

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Medium  
**Personas:** Alice

**Description:**  
Allow users to switch between supported networks with confirmation prompts.

**Acceptance Criteria:**
- [ ] One-click chain switching from UI
- [ ] Prompt user to add network if not configured
- [ ] Update token display after chain switch
- [ ] Handle switch failures with clear error messages
- [ ] Seamless switch with user confirmation

**Edge Cases:**
- Network not added to user's wallet
- Switch rejected by user
- RPC endpoint unavailable for target chain

---

#### F1.5 - Connection Error Handling

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Medium  
**Personas:** Bob, Carol

**Description:**  
Comprehensive error handling for wallet connection failures with clear messaging and recovery options.

**Acceptance Criteria:**
- [ ] Display user-friendly error messages for all failure modes
- [ ] Provide retry option for transient failures
- [ ] Link to help documentation for common issues
- [ ] Distinguish between user rejection and technical failure
- [ ] Log errors for debugging (non-PII)

**Error Categories:**
- User rejected connection
- Wallet not installed
- Network mismatch
- RPC connection failure
- Timeout errors

---

#### F1.6 - Wallet Disconnect

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Low  
**Personas:** Alice, Bob, Carol

**Description:**  
Clean disconnection flow that clears session data and resets application state.

**Acceptance Criteria:**
- [ ] One-click disconnect from any page
- [ ] Clear all session and cached data
- [ ] Reset UI to disconnected state
- [ ] Confirm disconnect for pending transactions (warning)

---

### 2. Token Management

#### F2.1 - Token Discovery

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** High  
**Personas:** Alice, Carol

**Description:**  
Automatically discover and display all ERC-20 and ERC-721 tokens in the connected wallet.

**Acceptance Criteria:**
- [ ] Discovery completes in <5 seconds for up to 100 tokens
- [ ] Support ERC-20 fungible tokens
- [ ] Support ERC-721 NFTs
- [ ] Display token name, symbol, and balance
- [ ] Show token icon/logo when available
- [ ] Handle wallets with up to 1,000 tokens

**Technical Considerations:**
- Use Alchemy/Infura token APIs for efficient discovery
- Implement pagination for large wallets
- Cache token metadata to reduce API calls
- Use Token Lists standard for known token metadata

**Edge Cases:**
- Non-standard token implementations
- Missing metadata (name, symbol, decimals)
- Tokens with zero balance
- Spam/scam tokens

---

#### F2.2 - Token Metadata Display

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Medium  
**Personas:** Alice, Bob, Carol

**Description:**  
Rich display of token information including name, symbol, balance, and visual icon.

**Acceptance Criteria:**
- [ ] Display token name and symbol
- [ ] Show balance with appropriate decimal formatting
- [ ] Display token icon/logo (fallback to generated icon)
- [ ] Show token type badge (ERC-20/ERC-721)
- [ ] Balance accuracy within 30 seconds of chain state

**Technical Considerations:**
- Integrate with CoinGecko for token icons
- Use Token Lists for verified token metadata
- Implement placeholder/skeleton loading states

---

#### F2.3 - Token Filtering

**Priority:** Must Have  
**Phase:** 2  
**Complexity:** Medium  
**Personas:** Alice

**Description:**  
Filter token list by chain, token type, and value to quickly find specific tokens.

**Acceptance Criteria:**
- [ ] Filter by blockchain network
- [ ] Filter by token type (ERC-20 vs ERC-721)
- [ ] Filter by value range (high, medium, low, zero)
- [ ] Combine multiple filters
- [ ] Show filter active indicator
- [ ] Clear all filters option

---

#### F2.4 - Token Sorting

**Priority:** Must Have  
**Phase:** 2  
**Complexity:** Low  
**Personas:** Alice

**Description:**  
Sort token list by various criteria for easier navigation.

**Acceptance Criteria:**
- [ ] Sort by balance (high to low, low to high)
- [ ] Sort alphabetically by name
- [ ] Sort by recent activity (if available)
- [ ] Persist sort preference in session
- [ ] Visual indicator of current sort

---

#### F2.5 - Batch Token Selection

**Priority:** Must Have  
**Phase:** 2  
**Complexity:** Medium  
**Personas:** Alice

**Description:**  
Select multiple tokens simultaneously for batch disposal operations.

**Acceptance Criteria:**
- [ ] Individual token selection via checkbox/click
- [ ] "Select All" option with current filters applied
- [ ] Show selection count
- [ ] Maximum 10 tokens per batch (gas optimization)
- [ ] Clear selection option
- [ ] Visual distinction for selected tokens

**Edge Cases:**
- Selecting more than batch limit
- Mixed token types in selection
- Selection across filter changes

---

#### F2.6 - Token Search

**Priority:** Should Have  
**Phase:** 2  
**Complexity:** Low  
**Personas:** Alice

**Description:**  
Search tokens by name or symbol for quick access.

**Acceptance Criteria:**
- [ ] Real-time search as user types
- [ ] Match on token name and symbol
- [ ] Case-insensitive search
- [ ] Show "no results" state
- [ ] Clear search input option

---

#### F2.7 - Token Detail View

**Priority:** Should Have  
**Phase:** 2  
**Complexity:** Medium  
**Personas:** Carol

**Description:**  
Detailed view of individual token with extended metadata and actions.

**Acceptance Criteria:**
- [ ] Full token name and symbol
- [ ] Contract address with copy and explorer link
- [ ] Complete balance with all decimals
- [ ] Token type and standard
- [ ] Quick action to select for disposal
- [ ] NFT: Display image/media if available

---

### 3. Token Disposal (Toilet)

#### F3.1 - Token Approval Workflow

**Priority:** Must Have  
**Phase:** 2  
**Complexity:** High  
**Personas:** Alice, Bob

**Description:**  
Secure approval flow for tokens before disposal with clear explanation of permissions.

**Acceptance Criteria:**
- [ ] Clear explanation of what approval means
- [ ] One-click approve for each token
- [ ] Show approval status (pending, approved, failed)
- [ ] Support unlimited approval (with warning) or exact amount
- [ ] Handle already-approved tokens gracefully
- [ ] Gas estimation for approval transaction

**Technical Considerations:**
- Use SafeERC20 patterns
- Check existing allowance before requesting
- Implement approval caching
- Handle non-standard approve implementations

**Edge Cases:**
- Token with non-standard approve function
- User rejects approval in wallet
- Approval transaction fails
- Token requires approve(0) before new approval

---

#### F3.2 - Single Token Disposal

**Priority:** Must Have  
**Phase:** 3  
**Complexity:** Medium  
**Personas:** Bob, Carol

**Description:**  
Dispose of a single token with confirmation and feedback.

**Acceptance Criteria:**
- [ ] Clear confirmation dialog before disposal
- [ ] Show token being disposed with amount
- [ ] Real-time transaction status updates
- [ ] Success confirmation with receipt link
- [ ] Gas estimation before confirmation

---

#### F3.3 - Batch Token Disposal

**Priority:** Must Have  
**Phase:** 3  
**Complexity:** High  
**Personas:** Alice

**Description:**  
Dispose of multiple tokens (up to 10) in a single transaction for gas efficiency.

**Acceptance Criteria:**
- [ ] Support up to 10 tokens per batch
- [ ] Show all tokens in confirmation summary
- [ ] Single transaction for all approvals (if using permit)
- [ ] Single transaction for batch disposal
- [ ] Individual status tracking within batch
- [ ] Partial success handling (some tokens fail)

**Technical Considerations:**
- Use multicall patterns for efficiency
- Implement proper error handling for partial failures
- Gas estimation for full batch

---

#### F3.4 - NFT Disposal

**Priority:** Must Have  
**Phase:** 3  
**Complexity:** Medium  
**Personas:** Carol

**Description:**  
Dispose of ERC-721 NFTs with proper transfer handling.

**Acceptance Criteria:**
- [ ] Support ERC-721 standard NFTs
- [ ] Show NFT image/preview in confirmation
- [ ] Handle setApprovalForAll pattern
- [ ] Success confirmation with disposed NFT details

**Edge Cases:**
- NFT with broken metadata
- NFT from non-standard contract
- NFT with transfer restrictions

---

#### F3.5 - Disposal Confirmation

**Priority:** Must Have  
**Phase:** 3  
**Complexity:** Low  
**Personas:** Alice, Bob, Carol

**Description:**  
Clear summary and confirmation before executing disposal transaction.

**Acceptance Criteria:**
- [ ] List all tokens being disposed
- [ ] Show total gas estimate
- [ ] Display charity receiving contribution
- [ ] Require explicit confirmation (button click)
- [ ] Option to cancel/go back
- [ ] Warning for high-value tokens (if detectable)

---

#### F3.6 - Transaction Status Tracking

**Priority:** Must Have  
**Phase:** 3  
**Complexity:** Medium  
**Personas:** Alice, Bob, Carol

**Description:**  
Real-time tracking of disposal transaction with status updates.

**Acceptance Criteria:**
- [ ] Show transaction hash with explorer link
- [ ] Display current status (pending, confirming, confirmed, failed)
- [ ] Wait for 2 confirmations before "complete"
- [ ] Update UI in real-time
- [ ] Handle stuck/dropped transactions
- [ ] Average transaction time <30 seconds

**Technical Considerations:**
- Use wagmi's useWaitForTransactionReceipt
- Implement transaction replacement detection
- Handle chain reorgs gracefully

---

### 4. Charity Integration (Sprinkler)

#### F4.1 - Charity Display

**Priority:** Must Have  
**Phase:** 4  
**Complexity:** Medium  
**Personas:** Bob

**Description:**  
Display charity information including name, description, logo, and category.

**Acceptance Criteria:**
- [ ] Show charity name prominently
- [ ] Display charity description/mission
- [ ] Show charity logo
- [ ] Display category/cause type
- [ ] Link to charity website
- [ ] Show verification badge

---

#### F4.2 - The Giving Block Integration

**Priority:** Must Have  
**Phase:** 4  
**Complexity:** High  
**Personas:** Bob

**Description:**  
Integration with The Giving Block API for donation processing and compliance.

**Acceptance Criteria:**
- [ ] Connect to The Giving Block API
- [ ] Fetch available charities
- [ ] Submit donations through their system
- [ ] Receive donation confirmation
- [ ] Meet platform compliance requirements

**Technical Considerations:**
- API key management (server-side only)
- Rate limiting compliance
- Error handling for API failures
- Webhook integration for donation confirmation

---

#### F4.3 - Donation Tracking

**Priority:** Must Have  
**Phase:** 4  
**Complexity:** Medium  
**Personas:** Bob

**Description:**  
Track donations on-chain with transparent history.

**Acceptance Criteria:**
- [ ] Record all donations on-chain
- [ ] Display user's donation history
- [ ] Show total donations to each charity
- [ ] Real-time verification via blockchain

---

#### F4.4 - Donation Reporting

**Priority:** Must Have  
**Phase:** 4  
**Complexity:** Medium  
**Personas:** Bob

**Description:**  
Transparent reporting of donation history and impact.

**Acceptance Criteria:**
- [ ] User can view their donation history
- [ ] Show donation amounts and dates
- [ ] Display receiving charity for each donation
- [ ] Export donation history (for tax purposes)

---

#### F4.5 - Multiple Charity Selection

**Priority:** Won't Have (MVP)  
**Phase:** Post-MVP  
**Complexity:** Medium  
**Personas:** Bob

**Description:**  
Allow users to select from multiple charities or split donations.

**Acceptance Criteria:**
- [ ] Browse available charities
- [ ] Filter charities by category
- [ ] Select preferred charity for disposal
- [ ] Split donations between multiple charities

---

### 5. Random Distribution (Fountain)

> **Note:** All Fountain features are Phase 2 (Post-MVP)

#### F5.1 - Stablecoin Contribution

**Priority:** Should Have  
**Phase:** Post-MVP  
**Complexity:** Medium  
**Personas:** Bob

**Description:**  
Accept USDC and DAI contributions for blind box participation.

**Acceptance Criteria:**
- [ ] Accept USDC contributions
- [ ] Accept DAI contributions
- [ ] Minimum contribution of $1 equivalent
- [ ] Clear contribution amount selection
- [ ] Display current exchange rate

---

#### F5.2 - Odds Display

**Priority:** Should Have  
**Phase:** Post-MVP  
**Complexity:** Low  
**Personas:** Bob

**Description:**  
Transparent display of reward odds before contribution.

**Acceptance Criteria:**
- [ ] Show probability for each reward tier
- [ ] Display available rewards in pool
- [ ] Update odds in real-time as pool changes
- [ ] Clear explanation of odds calculation

---

#### F5.3 - Verifiable Randomness

**Priority:** Should Have  
**Phase:** Post-MVP  
**Complexity:** High  
**Personas:** Bob

**Description:**  
Provably fair random distribution using Chainlink VRF.

**Acceptance Criteria:**
- [ ] Use Chainlink VRF for randomness
- [ ] Verifiable on-chain randomness proof
- [ ] Public audit trail of distributions
- [ ] No manipulation possible by operators

**Technical Considerations:**
- Chainlink VRF v2 integration
- Request/fulfill pattern handling
- Gas optimization for VRF callbacks

---

#### F5.4 - Reward Claiming

**Priority:** Should Have  
**Phase:** Post-MVP  
**Complexity:** Medium  
**Personas:** Bob

**Description:**  
Claim random token rewards after contribution.

**Acceptance Criteria:**
- [ ] Initiate claim after contribution confirmed
- [ ] Wait for VRF randomness (with loading state)
- [ ] Reveal reward with animation
- [ ] Transfer reward to user's wallet
- [ ] Show reward details and value

---

#### F5.5 - Anti-Gaming Measures

**Priority:** Should Have  
**Phase:** Post-MVP  
**Complexity:** High  
**Personas:** N/A (System)

**Description:**  
Prevent exploitation of the random distribution system.

**Acceptance Criteria:**
- [ ] Rate limiting per wallet address
- [ ] Cooldown period between claims
- [ ] Sybil resistance measures
- [ ] Monitoring for suspicious patterns

---

#### F5.6 - Reward Pool Management

**Priority:** Should Have  
**Phase:** Post-MVP  
**Complexity:** High  
**Personas:** N/A (Admin)

**Description:**  
Manage the pool of tokens available for distribution.

**Acceptance Criteria:**
- [ ] Add disposed tokens to reward pool
- [ ] Balance pool across token types
- [ ] Remove spam/scam tokens
- [ ] Monitor pool health metrics

---

### 6. NFT Receipts

#### F6.1 - Automatic Receipt Minting

**Priority:** Should Have  
**Phase:** 4  
**Complexity:** High  
**Personas:** Carol

**Description:**  
Automatically mint NFT receipt upon successful disposal.

**Acceptance Criteria:**
- [ ] Mint NFT for 100% of successful disposals
- [ ] Include transaction hash in metadata
- [ ] Mint on same chain as disposal
- [ ] Gas cost <$5 at 30 gwei on Ethereum
- [ ] ERC-721 compliant

**Technical Considerations:**
- Optimize contract for gas efficiency
- Batch minting if multiple disposals
- IPFS metadata storage via Pinata

---

#### F6.2 - Receipt Metadata

**Priority:** Should Have  
**Phase:** 4  
**Complexity:** Medium  
**Personas:** Carol

**Description:**  
Rich metadata for NFT receipts including disposal details.

**Acceptance Criteria:**
- [ ] Transaction hash reference
- [ ] List of disposed tokens (name, symbol, amount)
- [ ] Timestamp of disposal
- [ ] Charity impact information
- [ ] Chain ID and network name
- [ ] ERC-721 metadata standard compliant

---

#### F6.3 - Receipt Visual Design

**Priority:** Should Have  
**Phase:** 4  
**Complexity:** Medium  
**Personas:** Carol

**Description:**  
Unique, branded visual design for each receipt NFT.

**Acceptance Criteria:**
- [ ] Token Toilet branding elements
- [ ] Unique visual per disposal (generative)
- [ ] Display disposed token icons
- [ ] Show disposal date prominently
- [ ] Aesthetic suitable for collection display

---

#### F6.4 - Receipt Gallery

**Priority:** Should Have  
**Phase:** 4  
**Complexity:** Low  
**Personas:** Carol

**Description:**  
View all receipt NFTs owned by connected wallet.

**Acceptance Criteria:**
- [ ] Display all user's receipt NFTs
- [ ] Show receipt image preview
- [ ] Link to full receipt details
- [ ] Sort by date
- [ ] Pagination for many receipts

---

#### F6.5 - Receipt Sharing

**Priority:** Could Have  
**Phase:** Post-MVP  
**Complexity:** Low  
**Personas:** Carol

**Description:**  
Share receipt NFTs on social media.

**Acceptance Criteria:**
- [ ] Generate shareable image
- [ ] One-click share to Twitter/X
- [ ] Copy link to receipt
- [ ] OpenGraph metadata for link previews

---

### 7. User Experience & Animations

#### F7.1 - Flush Animation

**Priority:** Should Have  
**Phase:** 3  
**Complexity:** Medium  
**Personas:** Alice, Bob, Carol

**Description:**  
Engaging toilet flush animation on disposal confirmation.

**Acceptance Criteria:**
- [ ] Duration 2-3 seconds
- [ ] 60 fps animation performance
- [ ] Tokens visually spiral down drain
- [ ] Sound effects (optional, muted by default)
- [ ] Accessible alternative (reduced motion)

**Technical Considerations:**
- Use CSS animations or Framer Motion
- Respect prefers-reduced-motion
- Optimize for mobile performance

---

#### F7.2 - Success Celebration

**Priority:** Should Have  
**Phase:** 3  
**Complexity:** Low  
**Personas:** Alice, Bob, Carol

**Description:**  
Celebratory animation on successful disposal completion.

**Acceptance Criteria:**
- [ ] Duration 1-2 seconds
- [ ] Visual confetti or particles
- [ ] Clear success message
- [ ] Transition to receipt/summary view

---

#### F7.3 - Fountain Reveal Animation

**Priority:** Could Have  
**Phase:** Post-MVP  
**Complexity:** Medium  
**Personas:** Bob

**Description:**  
Dramatic reveal animation for blind box rewards.

**Acceptance Criteria:**
- [ ] Duration 3-5 seconds
- [ ] Build anticipation before reveal
- [ ] Highlight reward when revealed
- [ ] Different effects for rare vs common rewards

---

#### F7.4 - Loading States

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Low  
**Personas:** Alice, Bob, Carol

**Description:**  
Skeleton loading states for all async operations.

**Acceptance Criteria:**
- [ ] Skeleton loaders for token lists
- [ ] Spinner for transaction pending
- [ ] Progress indicators where applicable
- [ ] No layout shift on content load

---

#### F7.5 - Theme Support

**Priority:** Should Have  
**Phase:** 1  
**Complexity:** Low  
**Personas:** Alice, Bob, Carol

**Description:**  
Light and dark mode theme support.

**Acceptance Criteria:**
- [ ] System preference detection
- [ ] Manual toggle option
- [ ] Persist preference
- [ ] Smooth theme transition
- [ ] All components support both themes

---

### 8. Security & Safety

#### F8.1 - Input Validation

**Priority:** Must Have  
**Phase:** All  
**Complexity:** Medium  
**Personas:** N/A (System)

**Description:**  
Validate all user inputs using Zod schemas.

**Acceptance Criteria:**
- [ ] Validate token addresses
- [ ] Validate amounts and quantities
- [ ] Sanitize text inputs
- [ ] Reject malformed data early
- [ ] Clear validation error messages

---

#### F8.2 - Transaction Simulation

**Priority:** Must Have  
**Phase:** 2  
**Complexity:** High  
**Personas:** Alice

**Description:**  
Simulate transactions before submission to detect failures.

**Acceptance Criteria:**
- [ ] Simulate all transactions before sending
- [ ] Detect and warn about likely failures
- [ ] Show estimated gas cost
- [ ] Identify revert reasons when possible

**Technical Considerations:**
- Use viem's simulateContract
- Handle simulation failures gracefully
- Cache simulation results briefly

---

#### F8.3 - Gas Estimation

**Priority:** Must Have  
**Phase:** 2  
**Complexity:** Medium  
**Personas:** Alice, Bob, Carol

**Description:**  
Accurate gas estimation with safety buffer.

**Acceptance Criteria:**
- [ ] Estimate gas for all transactions
- [ ] Add 20% buffer for safety
- [ ] Display estimated cost in USD
- [ ] Warn for unusually high gas
- [ ] Update estimates on network conditions change

---

#### F8.4 - Stuck Transaction Handling

**Priority:** Must Have  
**Phase:** 3  
**Complexity:** High  
**Personas:** Alice

**Description:**  
Handle stuck or pending transactions with recovery options.

**Acceptance Criteria:**
- [ ] Detect stuck transactions (>5 minutes pending)
- [ ] Offer speed-up option (higher gas)
- [ ] Offer cancel option (0 value tx)
- [ ] Clear status display for pending transactions

---

#### F8.5 - Content Security Policy

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Medium  
**Personas:** N/A (System)

**Description:**  
Strict CSP headers to prevent XSS and injection attacks.

**Acceptance Criteria:**
- [ ] Implement strict CSP headers
- [ ] Whitelist only required external resources
- [ ] Block inline scripts where possible
- [ ] Report CSP violations (non-blocking)

---

#### F8.6 - Rate Limiting

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Medium  
**Personas:** N/A (System)

**Description:**  
Protect API endpoints from abuse.

**Acceptance Criteria:**
- [ ] Rate limit API routes
- [ ] Per-IP and per-wallet limits
- [ ] Graceful degradation on limit hit
- [ ] Clear error message for rate limited requests

---

### 9. Infrastructure & Performance

#### F9.1 - Page Load Performance

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Medium  
**Personas:** Alice, Bob, Carol

**Description:**  
Fast initial page load meeting Core Web Vitals.

**Acceptance Criteria:**
- [ ] Largest Contentful Paint (LCP) <2.5 seconds
- [ ] Time to Interactive <3 seconds
- [ ] Cumulative Layout Shift <0.1
- [ ] First Input Delay <100ms

**Technical Considerations:**
- Next.js App Router with streaming
- Dynamic imports for heavy components
- Image optimization
- Font optimization

---

#### F9.2 - Bundle Optimization

**Priority:** Should Have  
**Phase:** 1  
**Complexity:** Medium  
**Personas:** N/A (System)

**Description:**  
Optimized JavaScript bundle size.

**Acceptance Criteria:**
- [ ] Total JS bundle <500KB gzipped
- [ ] Code splitting by route
- [ ] Tree shaking effective
- [ ] No duplicate dependencies

---

#### F9.3 - RPC Provider Fallback

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Medium  
**Personas:** N/A (System)

**Description:**  
Fallback RPC providers for reliability.

**Acceptance Criteria:**
- [ ] Primary provider: Alchemy
- [ ] Fallback provider: Infura
- [ ] Automatic failover on errors
- [ ] Health check for providers

---

#### F9.4 - Error Monitoring

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Low  
**Personas:** N/A (System)

**Description:**  
Application error tracking and monitoring.

**Acceptance Criteria:**
- [ ] Capture frontend errors
- [ ] Capture API errors
- [ ] Include context (wallet, chain, action)
- [ ] Alert on error rate spike
- [ ] No PII in error logs

---

#### F9.5 - Analytics

**Priority:** Should Have  
**Phase:** 1  
**Complexity:** Low  
**Personas:** N/A (System)

**Description:**  
User behavior analytics for product insights.

**Acceptance Criteria:**
- [ ] Track page views
- [ ] Track key actions (connect, dispose, claim)
- [ ] Funnel analysis capability
- [ ] Privacy-respecting (no PII)

---

#### F9.6 - Accessibility Compliance

**Priority:** Must Have  
**Phase:** All  
**Complexity:** Medium  
**Personas:** All

**Description:**  
WCAG 2.1 Level AA compliance.

**Acceptance Criteria:**
- [ ] Full keyboard navigation
- [ ] Screen reader compatible
- [ ] Color contrast 4.5:1 minimum
- [ ] Focus indicators visible
- [ ] Alt text for images
- [ ] Accessible form labels

---

#### F9.7 - Browser Support

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Low  
**Personas:** Alice, Bob, Carol

**Description:**  
Support modern browsers across desktop and mobile.

**Acceptance Criteria:**
- [ ] Chrome 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+
- [ ] Mobile Safari and Chrome

---

#### F9.8 - Responsive Design

**Priority:** Must Have  
**Phase:** 1  
**Complexity:** Medium  
**Personas:** Alice, Bob, Carol

**Description:**  
Fully responsive design for all screen sizes.

**Acceptance Criteria:**
- [ ] Mobile-first approach
- [ ] Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- [ ] Touch-friendly interactions on mobile
- [ ] No horizontal scroll on any viewport

---

## Feature Matrix

### MVP Features by Phase

| Phase | Timeline | Must Have | Should Have | Total |
|-------|----------|-----------|-------------|-------|
| 1: Foundation | Weeks 1-2 | 8 | 3 | 11 |
| 2: Token Management | Weeks 3-4 | 6 | 2 | 8 |
| 3: Disposal & Animation | Weeks 5-6 | 5 | 2 | 7 |
| 4: Charity & NFT | Weeks 7-8 | 4 | 4 | 8 |
| **Total MVP** | **8 weeks** | **23** | **11** | **34** |

### Feature Priority Matrix

| ID | Feature | Priority | Phase | Complexity | Status |
|----|---------|----------|-------|------------|--------|
| F1.1 | Multi-Wallet Connection | Must Have | 1 | Medium | In Progress |
| F1.2 | Session Persistence | Must Have | 1 | Low | In Progress |
| F1.3 | Multi-Chain Support | Must Have | 1 | High | In Progress |
| F1.4 | Chain Switching | Must Have | 1 | Medium | Not Started |
| F1.5 | Connection Error Handling | Must Have | 1 | Medium | In Progress |
| F1.6 | Wallet Disconnect | Must Have | 1 | Low | Not Started |
| F2.1 | Token Discovery | Must Have | 1 | High | In Progress |
| F2.2 | Token Metadata Display | Must Have | 1 | Medium | Not Started |
| F2.3 | Token Filtering | Must Have | 2 | Medium | Not Started |
| F2.4 | Token Sorting | Must Have | 2 | Low | Not Started |
| F2.5 | Batch Token Selection | Must Have | 2 | Medium | Not Started |
| F2.6 | Token Search | Should Have | 2 | Low | Not Started |
| F2.7 | Token Detail View | Should Have | 2 | Medium | Not Started |
| F3.1 | Token Approval Workflow | Must Have | 2 | High | Not Started |
| F3.2 | Single Token Disposal | Must Have | 3 | Medium | Not Started |
| F3.3 | Batch Token Disposal | Must Have | 3 | High | Not Started |
| F3.4 | NFT Disposal | Must Have | 3 | Medium | Not Started |
| F3.5 | Disposal Confirmation | Must Have | 3 | Low | Not Started |
| F3.6 | Transaction Status Tracking | Must Have | 3 | Medium | Not Started |
| F4.1 | Charity Display | Must Have | 4 | Medium | Not Started |
| F4.2 | The Giving Block Integration | Must Have | 4 | High | Not Started |
| F4.3 | Donation Tracking | Must Have | 4 | Medium | Not Started |
| F4.4 | Donation Reporting | Must Have | 4 | Medium | Not Started |
| F4.5 | Multiple Charity Selection | Won't Have | Post-MVP | Medium | Not Started |
| F5.1 | Stablecoin Contribution | Should Have | Post-MVP | Medium | Not Started |
| F5.2 | Odds Display | Should Have | Post-MVP | Low | Not Started |
| F5.3 | Verifiable Randomness | Should Have | Post-MVP | High | Not Started |
| F5.4 | Reward Claiming | Should Have | Post-MVP | Medium | Not Started |
| F5.5 | Anti-Gaming Measures | Should Have | Post-MVP | High | Not Started |
| F5.6 | Reward Pool Management | Should Have | Post-MVP | High | Not Started |
| F6.1 | Automatic Receipt Minting | Should Have | 4 | High | Not Started |
| F6.2 | Receipt Metadata | Should Have | 4 | Medium | Not Started |
| F6.3 | Receipt Visual Design | Should Have | 4 | Medium | Not Started |
| F6.4 | Receipt Gallery | Should Have | 4 | Low | Not Started |
| F6.5 | Receipt Sharing | Could Have | Post-MVP | Low | Not Started |
| F7.1 | Flush Animation | Should Have | 3 | Medium | Not Started |
| F7.2 | Success Celebration | Should Have | 3 | Low | Not Started |
| F7.3 | Fountain Reveal Animation | Could Have | Post-MVP | Medium | Not Started |
| F7.4 | Loading States | Must Have | 1 | Low | In Progress |
| F7.5 | Theme Support | Should Have | 1 | Low | Completed |
| F8.1 | Input Validation | Must Have | All | Medium | In Progress |
| F8.2 | Transaction Simulation | Must Have | 2 | High | Not Started |
| F8.3 | Gas Estimation | Must Have | 2 | Medium | Not Started |
| F8.4 | Stuck Transaction Handling | Must Have | 3 | High | Not Started |
| F8.5 | Content Security Policy | Must Have | 1 | Medium | Not Started |
| F8.6 | Rate Limiting | Must Have | 1 | Medium | Not Started |
| F9.1 | Page Load Performance | Must Have | 1 | Medium | In Progress |
| F9.2 | Bundle Optimization | Should Have | 1 | Medium | Not Started |
| F9.3 | RPC Provider Fallback | Must Have | 1 | Medium | Not Started |
| F9.4 | Error Monitoring | Must Have | 1 | Low | Not Started |
| F9.5 | Analytics | Should Have | 1 | Low | Not Started |
| F9.6 | Accessibility Compliance | Must Have | All | Medium | In Progress |
| F9.7 | Browser Support | Must Have | 1 | Low | Completed |
| F9.8 | Responsive Design | Must Have | 1 | Medium | In Progress |

---

## Dependencies

### Feature Dependencies

```
F1.1 (Wallet Connection)
├── F1.2 (Session Persistence)
├── F1.3 (Multi-Chain Support)
│   └── F1.4 (Chain Switching)
├── F1.5 (Error Handling)
└── F1.6 (Disconnect)

F2.1 (Token Discovery) ─── requires ─── F1.1
├── F2.2 (Metadata Display)
├── F2.3 (Filtering)
├── F2.4 (Sorting)
├── F2.5 (Batch Selection)
└── F2.6 (Search)

F3.1 (Approval) ─── requires ─── F2.5
├── F3.2 (Single Disposal)
├── F3.3 (Batch Disposal)
└── F3.4 (NFT Disposal)

F3.2/F3.3/F3.4 ─── enables ─── F4.x (Charity Integration)
                           └── F6.x (NFT Receipts)

F5.x (Fountain) ─── requires ─── F3.x (Disposal system operational)
```

### Third-Party Dependencies

| Feature | External Dependency | Risk Level |
|---------|---------------------|------------|
| F1.1-F1.6 | Reown AppKit | Low |
| F2.1-F2.2 | Alchemy/Infura APIs | Low |
| F2.2 | CoinGecko API | Low |
| F4.2 | The Giving Block API | Medium |
| F5.3 | Chainlink VRF | Low |
| F6.1-F6.3 | IPFS/Pinata | Low |

---

## Future Features

### Phase 2 (Post-MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| Solana Support | SPL token disposal | High |
| ERC-1155 Support | Multi-token standard | Medium |
| Multiple Charities | User-selected allocation | High |
| Donation Allocation Sliders | Custom split percentages | Medium |
| LLM Token Insights | AI-powered token history | Medium |

### Phase 3

| Feature | Description | Priority |
|---------|-------------|----------|
| Mobile App | Native iOS/Android | High |
| DAO Governance | Community decisions | Medium |
| Dynamic NFTs | Evolving receipt NFTs | Low |
| Cross-chain Bridging | Unified multi-chain experience | Medium |

---

## Next Steps

After reviewing this features specification:

1. **Generate Technical Guidelines**: Run `/prd/to-rules` to create implementation rules
2. **Create Implementation RFCs**: Run `/prd/to-rfcs` to break down features into detailed RFCs
3. **Update Development Plan**: Align `docs/plan.md` with feature priorities

---

*Document generated from PRD v2.0 - December 23, 2025*
