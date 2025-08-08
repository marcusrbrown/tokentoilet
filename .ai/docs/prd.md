# Token Toilet - Product Requirements Document

> A Web3 solution for cleaning up your digital wallet while supporting charitable causes

**Version:** 1.0  
**Date:** May 3, 2025  
**Author:** Product Development Team

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [Target Audience](#2-target-audience)
3. [Core Features & Functionality](#3-core-features--functionality)
4. [Technical Architecture](#4-technical-architecture)
5. [User Interface & Experience](#5-user-interface--experience)
6. [Data Model](#6-data-model)
7. [Development Phases](#7-development-phases)
8. [Security Considerations](#8-security-considerations)
9. [Future Enhancements](#9-future-enhancements)
10. [Technical Challenges & Mitigations](#10-technical-challenges--mitigations)
11. [Business Considerations](#11-business-considerations)

---

## 1. Product Overview

### 1.1 Vision

Token Toilet is a revival of a Web3 concept that provides crypto enthusiasts with a fun, interactive way to dispose of unwanted tokens while contributing to charitable causes. By combining gamification elements with charitable giving, Token Toilet creates value from otherwise abandoned or unwanted digital assets.

### 1.2 Objectives

1. Create a secure platform for users to dispose of unwanted tokens (ERC-20, ERC-721, etc.)
2. Implement a gamified "blind box" mechanism that incentivizes user participation
3. Facilitate charitable donations from user contributions
4. Support multiple blockchain networks to maximize accessibility
5. Provide a seamless, engaging user experience with modern blockchain standards
6. Generate verifiable on-chain receipts of contribution

### 1.3 Key Value Propositions

- **For Token Donors:** A fun, animated way to clean up wallets while potentially helping charitable causes
- **For Blind Box Players:** An entertaining chance to receive random tokens with potential value
- **For Charities:** A novel source of crypto donations without technical barriers
- **For the Ecosystem:** Reduction of abandoned tokens and increased token utility

---

## 2. Target Audience

### 2.1 Primary User Segments

1. **Crypto Enthusiasts**
   - Web3 participants with multiple tokens/NFTs
   - Individuals who have accumulated unwanted or low-value tokens
   - Users interested in cleaning up their digital wallets

2. **Charitable Givers**
   - Crypto holders who want to contribute to causes
   - Users interested in tax-efficient giving through crypto
   - Impact-driven community members

3. **Blockchain Gamers**
   - Users who enjoy gamified crypto experiences
   - Players attracted to chance-based rewards
   - NFT collectors seeking new assets

### 2.2 User Personas

**Alice - The Wallet Cleaner**
- Has been in crypto since 2017
- Accumulated dozens of tokens from airdrops, failed projects, and experiments
- Wants to clean up her wallet but doesn't want to just burn tokens
- Values efficiency and straightforward UX

**Bob - The Charitable Gamer**
- Regularly donates to causes
- Enjoys gamified experiences in crypto
- Willing to participate for entertainment value with the upside of potentially valuable returns
- Values transparency in charitable giving

**Carol - The NFT Enthusiast**
- Collects NFTs across multiple chains
- Has unwanted NFTs from discontinued projects
- Interested in obtaining proof of contribution NFTs
- Values unique digital assets and project storytelling

---

## 3. Core Features & Functionality

### 3.1 Token Disposal ("Toilet")

**Description:** A mechanism for users to safely dispose of any unwanted tokens or NFTs.

**Acceptance Criteria:**
- Support for ERC-20, ERC-721, and other common token standards
- Multi-chain compatibility (Ethereum, Polygon, Solana initially)
- Wallet connection with support for major providers (MetaMask, WalletConnect, etc.)
- Visual confirmation of disposal with engaging animation
- Transaction status monitoring with clear feedback
- On-chain record of disposal for verification

### 3.2 Random Token Distribution ("Fountain")

**Description:** A system that provides users with random tokens in exchange for a contribution.

**Acceptance Criteria:**
- Accept stablecoin contributions (DAI, USDC, etc.)
- Blind box mechanism for random token distribution
- Transparent odds and potential rewards display
- Engaging animation for the reveal process
- Transaction status monitoring with clear feedback
- Prevention of gaming or exploitation of the system

### 3.3 Charity Integration ("Sprinkler")

**Description:** A system to manage and distribute charitable donations from user contributions.

**Acceptance Criteria:**
- Integration with reputable crypto donation platforms (e.g., The Giving Block, Every.org)
- Supported charities list with descriptions
- Transparent tracking of donation amounts
- Option for users to allocate donation percentages (optional for MVP)
- Compliance with relevant donation regulations
- On-chain verification of donations

### 3.4 NFT Proof of Disposal

**Description:** NFT receipts that serve as proof of contribution and disposal.

**Acceptance Criteria:**
- Automatic NFT minting upon successful donation/disposal
- Metadata including transaction details, tokens disposed, and charitable impact
- Visual design reflecting the Token Toilet theme
- Potential utility within the Token Toilet ecosystem
- Multi-chain support for NFT minting

### 3.5 Wallet Integration

**Description:** Secure connection to users' blockchain wallets.

**Acceptance Criteria:**
- Support for multiple wallet providers (MetaMask, WalletConnect, etc.)
- Multi-chain wallet support
- Clear display of connected wallet status
- Token discovery and balance checking
- Transaction signing and confirmation flows
- Proper error handling for connection issues

### 3.6 Token Discovery and Selection

**Description:** Interface for users to browse and select tokens in their wallet.

**Acceptance Criteria:**
- Automatic discovery of tokens across supported chains
- Visual display of token metadata (name, symbol, balance)
- Filtering and sorting options
- Selection mechanism for disposal
- Balance verification before transaction
- Support for batch selection of multiple tokens

---

## 4. Technical Architecture

### 4.1 Technology Stack

- **Frontend:**
  - Next.js 14 with TypeScript
  - Tailwind CSS for styling
  - ethers.js/web3.js for blockchain interaction
  - Web3Modal/WalletConnect for wallet connections

- **Smart Contracts:**
  - Solidity for Ethereum/EVM chains
  - Rust for Solana programs
  - OpenZeppelin libraries for standard implementations

- **Backend/Services:**
  - Serverless functions for API endpoints
  - IPFS for decentralized storage
  - The Graph for indexing (optional for MVP)

- **DevOps:**
  - GitHub Actions for CI/CD
  - Vercel for hosting
  - Hardhat/Foundry for contract development

### 4.2 Smart Contract Architecture

#### 4.2.1 TokenToilet.sol

**Purpose:** Accepts and processes token disposals.

**Key Functions:**
- `flushToken(address tokenAddress, uint256 amount)`: Process ERC-20 token disposal
- `flushNFT(address nftAddress, uint256 tokenId)`: Process NFT disposal
- `batchFlush(address[] tokenAddresses, uint256[] amounts)`: Process multiple tokens
- `getTokensInToilet()`: Return current tokens available in the pool

#### 4.2.2 TokenFountain.sol

**Purpose:** Manages the random token distribution mechanism.

**Key Functions:**
- `contributeToBlinBox(uint256 amount)`: Accept stablecoin contribution
- `claimRandomToken()`: Distribute random token from pool
- `getOdds()`: Return current distribution probabilities
- `getAvailableRewards()`: Return tokens available for distribution

#### 4.2.3 CharitySprinkler.sol

**Purpose:** Manages charitable donation distribution.

**Key Functions:**
- `registerCharity(address charityAddress)`: Add supported charity
- `distributeToCharity(address charityAddress, uint256 amount)`: Send funds to charity
- `getSupportedCharities()`: Return list of supported charities
- `getDonationHistory()`: Return historical donations

#### 4.2.4 ProofOfDisposal.sol

**Purpose:** Manages the NFT receipt system.

**Key Functions:**
- `mintReceiptNFT(address user, address[] tokens, uint256[] amounts)`: Create disposal receipt
- `tokenURI(uint256 tokenId)`: Return metadata for a receipt NFT
- `getUserReceipts(address user)`: Return all receipts for a user

### 4.3 System Architecture Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  User Wallets   │◄────────┤  Token Toilet   │◄────────┤  Charity Orgs   │
│  (MetaMask,     │         │  Web Interface  │         │  (The Giving    │
│   WalletConnect)│         │  (Next.js)      │         │   Block, etc.)  │
│                 │         │                 │         │                 │
└────────┬────────┘         └────────┬────────┘         └────────▲────────┘
         │                           │                           │
         │                           ▼                           │
         │                  ┌─────────────────┐                 │
         │                  │                 │                 │
         └────────────────► │  Smart         │─────────────────┘
                           │  Contracts      │
                           │                 │
                           └────────┬────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │                 │
                           │  Blockchain     │
                           │  Networks       │
                           │  (ETH, Polygon, │
                           │   Solana)       │
                           │                 │
                           └─────────────────┘
```

### 4.4 Integration Points

1. **Blockchain RPC Providers**
   - Infura/Alchemy for Ethereum and Polygon
   - RPC endpoints for Solana

2. **Wallet Providers**
   - Web3Modal/WalletConnect for multi-wallet support
   - Chain-specific wallet adapters

3. **Charity Platforms**
   - The Giving Block API for charity integration
   - Every.org API as alternative

4. **Token Metadata Services**
   - Token Lists for supported tokens
   - NFT metadata standards

5. **Historical Data (Optional for MVP)**
   - Etherscan API for token history
   - Similar explorers for other chains

---

## 5. User Interface & Experience

### 5.1 Design Principles

- **Playful but Professional:** Casino-inspired elements with clean, modern UI
- **Intuitive Flows:** Clear user journeys with minimal steps
- **Responsive Design:** Full functionality across devices
- **Animated Feedback:** Engaging animations for key actions
- **Transparent Information:** Clear display of all relevant data

### 5.2 Key User Flows

#### 5.2.1 Token Disposal Flow

1. Connect wallet
2. Browse and select tokens for disposal
3. Approve token spending (if required)
4. Confirm disposal
5. Watch toilet flush animation
6. Receive NFT receipt

#### 5.2.2 Blind Box Flow

1. Connect wallet
2. Select stablecoin and amount
3. View potential rewards and odds
4. Confirm contribution
5. Watch fountain animation
6. Reveal and receive random token
7. View charity impact

#### 5.2.3 Charity Selection Flow (Future Enhancement)

1. Connect wallet
2. View charity options
3. Adjust allocation sliders
4. Confirm preferences
5. View impact dashboard

### 5.3 UI Components

1. **Wallet Connection Module**
   - Chain selector
   - Wallet options
   - Connection status

2. **Token Discovery Panel**
   - Token list with icons and balances
   - Search and filter controls
   - Selection mechanism

3. **Toilet Visualization**
   - Token queue display
   - Flush mechanism
   - Animation area

4. **Fountain Visualization**
   - Contribution input
   - Odds display
   - Animation area
   - Reward reveal

5. **Transaction Status Monitor**
   - Progress indicators
   - Success/failure messages
   - Transaction links

6. **Charity Dashboard**
   - Organization list
   - Impact metrics
   - Allocation controls (future)

### 5.4 Animation Concepts

1. **Toilet Flush Animation**
   - Selected tokens spiral down a drain
   - Water swirl effect
   - Satisfying "flush" sound
   - Completion confirmation

2. **Fountain Animation**
   - Water bubbling effect
   - Token rising from fountain
   - Reveal effect with sparkles
   - Success celebration

---

## 6. Data Model

### 6.1 Token Metadata

```typescript
interface TokenMetadata {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
  type: 'ERC20' | 'ERC721' | 'ERC1155' | 'SPL' | 'other';
}
```

### 6.2 Transaction Records

```typescript
interface TransactionRecord {
  txHash: string;
  chainId: number;
  user: string;
  actionType: 'disposal' | 'contribution' | 'claim';
  tokens: {
    address: string;
    amount: string;
    tokenId?: string;
  }[];
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}
```

### 6.3 NFT Receipt Metadata

```typescript
interface ReceiptMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    txHash: string;
    chainId: number;
    disposedTokens: {
      name: string;
      symbol: string;
      amount: string;
    }[];
    timestamp: number;
    charityImpact?: {
      organization: string;
      amount: string;
    };
  };
}
```

### 6.4 Charity Data

```typescript
interface CharityData {
  id: string;
  name: string;
  description: string;
  logoURI: string;
  address: string;
  category: string[];
  totalDonations: string;
  website: string;
}
```

---

## 7. Development Phases

### 7.1 Phase 1: Setup and Wallet Integration (Weeks 1-2)

**Objectives:**
- Establish Next.js project with TypeScript and Tailwind
- Implement wallet connection interface
- Set up multi-chain integration foundation

**Deliverables:**
- Working project skeleton
- Wallet connection with chain selection
- Basic token discovery functionality

**Acceptance Testing:**
- Successful wallet connection on multiple chains
- Proper handling of connection errors
- Accurate token balance display

### 7.2 Phase 2: Core Token Management (Weeks 3-4)

**Objectives:**
- Develop token discovery and listing interface
- Implement token approval workflow
- Create basic transaction handling

**Deliverables:**
- Token selection interface
- Approval mechanism for ERC standards
- Transaction status monitoring

**Acceptance Testing:**
- Accurate token discovery across chains
- Successful token approvals
- Proper error handling for transactions

### 7.3 Phase 3: Toilet & Fountain Mechanics (Weeks 5-6)

**Objectives:**
- Implement token disposal smart contracts
- Develop random token distribution logic
- Create basic animations

**Deliverables:**
- Working TokenToilet contract
- Working TokenFountain contract
- Basic animation implementations

**Acceptance Testing:**
- Successful token disposal across chains
- Working blind box mechanism
- Proper animation triggers

### 7.4 Phase 4: Charity & Polish (Weeks 7-8)

**Objectives:**
- Integrate charity donation functionality
- Implement NFT receipt generation
- Polish UI and test thoroughly

**Deliverables:**
- Charity integration
- NFT receipt contract and minting
- Complete user flows with animations

**Acceptance Testing:**
- Successful charity donations
- Proper NFT receipt generation
- Smooth end-to-end user experience

### 7.5 MVP Feature Table

| Feature | Priority | Phase | Complexity | Status |
|---------|----------|-------|------------|--------|
| Wallet Connection | High | 1 | Medium | Not Started |
| Token Discovery | High | 1 | Medium | Not Started |
| Token Disposal | High | 2 | High | Not Started |
| Transaction Monitoring | High | 2 | Medium | Not Started |
| Basic Animations | Medium | 3 | Medium | Not Started |
| Blind Box Mechanism | High | 3 | High | Not Started |
| Charity Integration | High | 4 | Medium | Not Started |
| NFT Receipts | Medium | 4 | Medium | Not Started |
| Multi-chain Support | Medium | Various | High | Not Started |

---

## 8. Security Considerations

### 8.1 Smart Contract Security

1. **Auditing Requirements**
   - Code review by security professionals
   - Automated testing for common vulnerabilities
   - Consider formal verification for critical functions

2. **Access Controls**
   - Clear role-based permissions
   - Time-locked administration functions
   - Emergency pause mechanisms

3. **Token Handling**
   - Safe transfer patterns for all token standards
   - Protection against malicious token contracts
   - Proper decimal handling for different tokens

### 8.2 Frontend Security

1. **Connection Security**
   - Secure wallet connection practices
   - Clear transaction signing requests
   - Protection against phishing attempts

2. **Data Validation**
   - Input validation for all user inputs
   - Proper handling of unexpected data formats
   - Protection against XSS and injection attacks

### 8.3 Transaction Safety

1. **Gas Management**
   - Accurate gas estimation
   - Gas optimization for operations
   - Protection against gas-based attacks

2. **Transaction Monitoring**
   - Clear transaction status updates
   - Handling for dropped/stuck transactions
   - Recovery mechanisms for failed transactions

### 8.4 Third-Party Integrations

1. **API Security**
   - Secure API key management
   - Rate limiting and monitoring
   - Fallback mechanisms for API failures

2. **Dependency Management**
   - Regular updates of dependencies
   - Monitoring for security vulnerabilities
   - Minimal third-party dependencies

---

## 9. Future Enhancements

### 9.1 Post-MVP Features

1. **LLM-based Token History**
   - Integration with blockchain explorers (Etherscan, etc.)
   - Historical data retrieval for tokens
   - AI-powered insights about tokens being disposed

2. **Customizable Donation Allocation**
   - Slider interface for donation distribution
   - Multiple charity support
   - Personalized impact dashboard

3. **Token Swapping Integration**
   - Automatic conversion of valuable tokens to stablecoins
   - Integration with DEXs for optimal rates
   - Opt-out donation mode

4. **Ad Network Integration**
   - Optional ad viewing for value reclamation
   - Partnership with crypto ad networks
   - Transparent revenue sharing

5. **Enhanced Gamification**
   - Loyalty program for regular users
   - Seasonal events and special rewards
   - Leaderboards and achievements

### 9.2 Expansion Opportunities

1. **Additional Blockchain Support**
   - Support for more EVM-compatible chains
   - Integration with additional L2 networks
   - Cross-chain functionality

2. **Enhanced NFT Capabilities**
   - Dynamic NFT receipts that evolve with usage
   - NFT collections with utility within platform
   - Collaborative NFT campaigns with charities

3. **Community Governance**
   - DAO structure for platform decisions
   - Community voting on charity selections
   - Token holder benefits

4. **Mobile Application**
   - Native mobile experience
   - Push notifications for transactions
   - Mobile-specific features

---

## 10. Technical Challenges & Mitigations

### 10.1 Multi-chain Integration

**Challenge:** Supporting different blockchain architectures with varying token standards.

**Mitigation:**
- Implement chain-specific adapters
- Use abstraction layers for common functionality
- Prioritize chains for phased implementation
- Utilize established libraries for cross-chain support

### 10.2 Random Distribution Fairness

**Challenge:** Ensuring fair and transparent random token distribution.

**Mitigation:**
- Use verifiable random functions where available
- Implement transparent odds calculation
- Balance reward pools regularly
- Audit the randomness mechanism

### 10.3 Gas Optimization

**Challenge:** High gas costs on Ethereum for token operations.

**Mitigation:**
- Batch operations where possible
- Prioritize L2 solutions for frequent operations
- Implement gas estimation and warnings
- Consider gas subsidies for certain actions

### 10.4 Handling Various Token Types

**Challenge:** Supporting diverse token standards across chains.

**Mitigation:**
- Create modular handling for different standards
- Comprehensive testing with various token implementations
- Fallback mechanisms for non-standard tokens
- Clear communication about supported standards

---

## 11. Business Considerations

### 11.1 Monetization Potential

1. **Service Fees**
   - Small percentage on blind box contributions
   - Optional premium features
   - Priority processing fees

2. **NFT Sales**
   - Limited edition artistic receipts
   - Collaborative collections with artists
   - NFT utility extensions

3. **Partnership Opportunities**
   - Integration with projects seeking token utility
   - Charity partnership promotions
   - Cross-promotion with compatible services

### 11.2 Legal Considerations

1. **Charitable Donation Compliance**
   - Proper reporting and documentation
   - Collaboration with compliant platforms
   - Tax receipt generation

2. **Gambling Regulations**
   - Ensuring blind box mechanics aren