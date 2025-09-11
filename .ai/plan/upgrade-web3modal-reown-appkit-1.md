---
goal: Upgrade Web3Modal to Reown AppKit with Multi-Chain Support
version: 1.0
date_created: 2025-08-08
last_updated: 2025-09-10
owner: marcusrbrown
status: 'In Progress'
tags: ['upgrade', 'web3', 'multi-chain', 'migration', 'walletconnect']
---

# Upgrade Web3Modal to Reown AppKit with Multi-Chain Support

![Status: In Progress](https://img.shields.io/badge/status-In%20Progress-yellow)

This implementation plan outlines the migration from deprecated `@web3modal/wagmi` v5.1.11 to the latest Reown AppKit (formerly Web3Modal v3) with multi-chain support for Ethereum mainnet, Polygon, and Arbitrum. The upgrade includes WalletConnect v2 protocol support, wagmi v2 integration, enhanced TypeScript support, custom theming, and improved error handling.

## 1. Requirements & Constraints

- **REQ-001**: Replace deprecated `@web3modal/wagmi` with `@reown/appkit` and `@reown/appkit-adapter-wagmi`
- **REQ-002**: Configure WalletConnect v2 protocol support with existing project ID
- **REQ-003**: Set up multi-chain support for Ethereum mainnet, Polygon, and Arbitrum
- **REQ-004**: Maintain compatibility with wagmi v2.14.11 for React hooks (useAccount, useConnect, etc.)
- **REQ-005**: Implement proper TypeScript support with type safety
- **REQ-006**: Add custom theming to match the project's violet design system
- **REQ-007**: Handle wallet connection persistence across page reloads
- **REQ-008**: Include proper error handling and network validation
- **REQ-009**: Preserve existing provider architecture and component structure
- **REQ-010**: Maintain backward compatibility with existing wallet button functionality

- **SEC-001**: Ensure secure WalletConnect project ID handling through environment variables
- **SEC-002**: Validate network switching to prevent malicious chain attacks

- **CON-001**: Must not break existing Next.js 15.4.5 App Router functionality
- **CON-002**: Must maintain compatibility with TanStack Query v5.66.0
- **CON-003**: Must preserve existing theme toggle functionality with next-themes v0.4.4
- **CON-004**: Migration must be atomic - no partial states during upgrade

- **GUD-001**: Follow Reown AppKit best practices for React implementation
- **GUD-002**: Use the WagmiAdapter pattern for optimal performance
- **GUD-003**: Implement proper error boundaries around Web3 operations

- **PAT-001**: Maintain existing provider chain pattern: layout.tsx → providers.tsx → Web3Provider
- **PAT-002**: Continue using custom useWallet hook abstraction for wallet operations
- **PAT-003**: Keep address formatting pattern: `${address.slice(0, 6)}...${address.slice(-4)}`

## 2. Implementation Steps

### Implementation Phase 1: Package Migration and Configuration

- GOAL-001: Replace deprecated packages and update configuration structure for Reown AppKit

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Remove deprecated `@web3modal/wagmi` v5.1.11 from package.json | ✅ | 2025-08-09 |
| TASK-002 | Install `@reown/appkit` v1.7.18 and `@reown/appkit-adapter-wagmi` v1.7.18 | ✅ | 2025-08-09 |
| TASK-003 | Update `lib/web3/config.ts` to use WagmiAdapter pattern with Reown AppKit | ✅ | 2025-08-09 |
| TASK-004 | Add Polygon (id: 137) and Arbitrum (id: 42161) chain configurations | ✅ | 2025-08-09 |
| TASK-005 | Configure metadata object with TokenToilet project information | ✅ | 2025-08-09 |
| TASK-006 | Update theme variables to match violet design system (--w3m-accent: rgb(124 58 237)) | ✅ | 2025-08-09 |

### Implementation Phase 2: Provider and Component Updates

- GOAL-002: Update Web3Provider component and React integration to use Reown AppKit

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007 | Replace `createWeb3Modal` import with `createAppKit` in `components/web3/web3-provider.tsx` | ✅ | 2025-08-09 |
| TASK-008 | Update Web3Provider to use WagmiAdapter configuration instead of direct wagmiConfig | ✅ | 2025-08-09 |
| TASK-009 | Update `hooks/use-wallet.ts` to use `useAppKit` instead of `useWeb3Modal` | ✅ | 2025-08-09 |
| TASK-010 | Verify wallet button functionality with new AppKit modal integration | ✅ | 2025-08-09 |
| TASK-011 | Test wallet connection persistence across page reloads | ✅ | 2025-08-09 |

### Implementation Phase 3: Multi-Chain Support and Network Validation

- GOAL-003: Implement multi-chain support with proper network switching and validation

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-012 | Add Polygon mainnet configuration with RPC endpoint | ✅ | 2025-09-10 |
| TASK-013 | Add Arbitrum One configuration with RPC endpoint | ✅ | 2025-09-10 |
| TASK-014 | Implement network validation in useWallet hook | ✅ | 2025-09-10 |
| TASK-015 | Add error handling for unsupported networks | ✅ | 2025-09-10 |
| TASK-016 | Test network switching between Ethereum, Polygon, and Arbitrum | ✅ | 2025-09-10 |

### Implementation Phase 4: Testing and Validation

- GOAL-004: Comprehensive testing of all wallet functionality and edge cases

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-017 | Test wallet connection flow with MetaMask | ✅ | 2025-09-10 |
| TASK-018 | Test wallet connection flow with WalletConnect | ✅ | 2025-09-10 |
| TASK-019 | Test wallet connection flow with Coinbase Wallet | | |
| TASK-020 | Verify error handling for connection failures | | |
| TASK-021 | Test theme integration in both light and dark modes | | |
| TASK-022 | Validate TypeScript types and fix any compilation errors | | |

## 3. Alternatives

- **ALT-001**: Continue using deprecated `@web3modal/wagmi` - Not recommended due to lack of maintenance and security updates
- **ALT-002**: Switch to RainbowKit - Rejected due to different API structure requiring more extensive refactoring
- **ALT-003**: Build custom wallet connection modal - Rejected due to increased maintenance burden and security considerations
- **ALT-004**: Use ConnectKit - Rejected due to less comprehensive wallet support compared to Reown AppKit

## 4. Dependencies

- **DEP-001**: `@reown/appkit` v1.7.18 - Core AppKit library for wallet connection UI
- **DEP-002**: `@reown/appkit-adapter-wagmi` v1.7.18 - Wagmi integration adapter for React hooks
- **DEP-003**: `wagmi` v2.14.11 - Ethereum React hooks library (existing)
- **DEP-004**: `viem` v2.23.0 - TypeScript interface for Ethereum (existing)
- **DEP-005**: `@tanstack/react-query` v5.66.0 - Async state management (existing)
- **DEP-006**: Valid WalletConnect Project ID from cloud.walletconnect.com
- **DEP-007**: RPC endpoints for Polygon and Arbitrum networks

## 5. Files

- **FILE-001**: `package.json` - Update dependencies to remove @web3modal/wagmi and add @reown packages
- **FILE-002**: `lib/web3/config.ts` - Restructure configuration for WagmiAdapter pattern and add new chains
- **FILE-003**: `components/web3/web3-provider.tsx` - Update provider component to use createAppKit
- **FILE-004**: `hooks/use-wallet.ts` - Update hook to use useAppKit instead of useWeb3Modal
- **FILE-005**: `components/web3/wallet-button.tsx` - Verify continued compatibility (minimal changes expected)
- **FILE-006**: `app/providers.tsx` - Verify provider chain still works correctly
- **FILE-007**: `app/layout.tsx` - Ensure proper provider wrapping is maintained

## 6. Testing

- **TEST-001**: Unit tests for useWallet hook with mock AppKit instance
- **TEST-002**: Integration tests for wallet connection flow across all supported chains
- **TEST-003**: E2E tests for wallet persistence across page reloads and browser sessions
- **TEST-004**: Error handling tests for network switching failures and connection timeouts
- **TEST-005**: Visual regression tests for wallet modal theming in light/dark modes
- **TEST-006**: TypeScript compilation tests to ensure no type errors
- **TEST-007**: Performance tests to verify no regression in connection speed

## 7. Risks & Assumptions

- **RISK-001**: Breaking changes in Reown AppKit API could require additional refactoring - Mitigation: Use latest stable version and follow migration guides
- **RISK-002**: WalletConnect Project ID rate limiting during development - Mitigation: Monitor usage and implement proper caching
- **RISK-003**: RPC endpoint failures for new chains could break network switching - Mitigation: Implement fallback RPC providers
- **RISK-004**: Theme customization might not match existing design system exactly - Mitigation: Test extensively and adjust CSS variables as needed

- **ASSUMPTION-001**: Current WalletConnect Project ID is valid and has sufficient quota for multi-chain usage
- **ASSUMPTION-002**: Wagmi v2.14.11 is fully compatible with @reown/appkit-adapter-wagmi v1.7.18
- **ASSUMPTION-003**: Existing environment variable setup will continue to work with new packages
- **ASSUMPTION-004**: TanStack Query configuration is compatible with new WagmiAdapter pattern
- **ASSUMPTION-005**: Next.js App Router pattern will continue to work with Reown AppKit providers

## 8. Related Specifications / Further Reading

- [Reown AppKit Documentation](https://docs.reown.com/appkit)
- [Migration Guide: Web3Modal v5 to Reown AppKit](https://docs.reown.com/appkit/upgrade/to-reown-appkit-web)
- [WagmiAdapter Configuration Reference](https://docs.reown.com/appkit/react/adapters/wagmi)
- [Wagmi v2 Documentation](https://wagmi.sh)
- [WalletConnect v2 Protocol Documentation](https://docs.walletconnect.com/)
- [Polygon Network Integration Guide](https://docs.polygon.technology/)
- [Arbitrum Network Integration Guide](https://docs.arbitrum.io/)
