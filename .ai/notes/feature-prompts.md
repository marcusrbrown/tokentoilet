# Feature Prompts

This document collects prompts that can be used with AI assistants to generate implementation plans using the [/create-implementation-plan](https://github.com/PlagueHO/awesome-copilot/blob/9fe63b3aed16abc391fe7d2b957e0d4bf3517ce8/prompts/create-implementation-plan.prompt.md) prompt in Copilot Chat.

## 🚽 Core Token Disposal Interface

```markdown
Create the main token disposal interface for Token Toilet. Build a React component that allows users to select and dispose of ERC-20 tokens from their wallet. Use the existing useWallet hook and design tokens system (violetPalette, glassMorphism) for consistent styling. Include token balance display, disposal amount selection, and transaction status feedback. Follow the Web3 error handling patterns and use semantic colors from the design system for transaction states.
```

## 🎨 Gamified Token Fountain Component

```markdown
Implement the "Random Token Fountain" feature using the established design patterns. Create an animated component that shows users receiving random tokens after disposal, leveraging the glassMorphism and web3Animations from the design tokens. Integrate with the Web3Provider chain and include proper loading states, transaction confirmations, and NFT receipt generation. Use the violet gradient system and ensure dark mode compatibility.
```

## 🔗 Smart Contract Integration Layer

```markdown
Set up the smart contract development environment and create the TokenToilet contract integration. Follow the Wagmi v2 patterns for contract interactions, implement the disposal and fountain mechanisms, and create typed contract hooks. Include multi-chain support (mainnet/sepolia) using the existing chain configuration. Add comprehensive error handling following the project's "no throw on disconnect" pattern and integrate with the TanStack Query setup.
```

### Smart Contract Integration

```markdown
Implement the TokenToilet contract interaction layer following the established Wagmi patterns. Create custom hooks for token disposal operations in `/hooks/use-token-disposal.ts`, add contract configuration to config.ts, and build UI components in web3 that handle token approval flows, batch operations, and transaction status tracking. Follow the existing error handling patterns and maintain consistency with the current wallet integration.
```

## Token Discovery & Management System

```markdown
Build a comprehensive token discovery system that leverages the existing Web3 architecture. Create `/components/web3/token-browser.tsx` for displaying user tokens, `/hooks/use-token-balance.ts` for fetching balances, and `/lib/web3/token-utils.ts` for token metadata handling. Implement the violet/gradient design system and ensure proper loading states, error boundaries, and wallet connection dependencies match the current patterns.
```

## Charitable Integration & NFT Receipts

```markdown
Develop the charity integration system with NFT proof-of-disposal functionality. Create `/components/web3/charity-selector.tsx`, `/hooks/use-charity-donation.ts`, and NFT minting components that follow the established Wagmi patterns. Integrate with the existing Web3Provider setup, maintain the glass morphism UI design, and implement proper transaction tracking that builds on the current wallet button and error handling conventions.
```

## Advanced Web3 Transaction Management System

"Implement a comprehensive transaction history and management system that leverages the existing `useWallet` hook architecture. Create components for tracking token disposal transactions across all supported chains (Ethereum, Polygon, Arbitrum), with real-time status updates using Wagmi's transaction watching capabilities. Include transaction receipts, failure recovery mechanisms, and a unified transaction list component that follows the established glass morphism design patterns using the CSS custom properties already defined in globals.css. Ensure full test coverage following the established wallet-specific testing patterns in `/hooks/use-wallet.*.test.ts`."

## Multi-Chain Token Discovery and Validation Engine

"Build an intelligent token discovery system that integrates with the existing multi-chain Web3 configuration to automatically detect and validate tokens across Ethereum, Polygon, and Arbitrum networks. Implement token metadata fetching, balance checking, and spam token filtering using the established error handling patterns from `useWallet`. Create a token selection interface using the violet-branded design system with real-time network switching capabilities. Include comprehensive Vitest test suites that mock different token contract scenarios and network states, following the established mocking patterns for Web3 functionality."

## Charitable Impact Visualization Dashboard

"Develop an interactive dashboard that visualizes the charitable impact of token disposal activities, leveraging the existing glass morphism design system and Web3 state management. Create animated components that show real-time charitable contributions, token disposal statistics, and community impact metrics. Implement the dashboard using the established CSS custom properties for consistent theming, Web3 animations from globals.css, and the `useWallet` hook for connecting user activity to impact metrics. Include responsive design patterns that work across all supported wallet types and ensure proper dark/light mode support using the existing theme system."

## Multi-Chain Token Discovery & Metadata Enhancement

"Implement a token discovery system that leverages the existing multi-chain configuration (Ethereum, Polygon, Arbitrum) to automatically detect and categorize user's token holdings across networks. Build on the current `useWallet` hook patterns and Web3 state management to create a unified token inventory component that respects the glass morphism design system. Integrate with the existing Wagmi/TanStack Query architecture to cache token metadata and implement the violet-themed loading states for cross-chain queries. Follow the established testing patterns with comprehensive mocking for different network states and token contract interactions."

## Glass Morphism Transaction Flow Components

"Design and implement a complete transaction flow system using the established glass morphism design tokens (`.glass-container`, `.glass-card`, `.glass-button`) and CSS custom properties for Web3 operations. Create reusable transaction components that integrate with the current `useWallet` error handling patterns and support the three-chain configuration. Build transaction status indicators using the defined Web3 state colors (`--color-web3-pending`, `--color-web3-confirmed`, etc.) while maintaining the Tailwind v4 CSS-first approach with zero `@apply` directives. Include comprehensive Vitest test coverage for transaction state management and error scenarios."

## Charitable Organization Integration Hub

"Develop a charity selection and verification system that extends the current Web3 provider architecture to include nonprofit organization smart contract integration. Build upon the existing Reown AppKit wallet connection flows to enable multi-signature charity wallet verification and donation tracking across the supported blockchain networks. Implement the component following the established patterns with client-side rendering, proper error boundaries, and the violet brand theming. Create a comprehensive testing suite that mocks charity contract interactions and validates cross-chain donation flows using the existing Web3 testing infrastructure and mocking patterns."

## Token Selection Interface with Multi-Chain Validation

"Implement a comprehensive token selection component that leverages the existing `useWallet` hook's network validation patterns, integrates with the glass morphism design system using the established CSS custom properties (`--color-web3-*`, `--color-glass-*`), and follows the project's Web3 error handling conventions with graceful fallbacks. The component should support ERC-20 token discovery across all supported chains (Ethereum, Polygon, Arbitrum) using the existing `WagmiAdapter` configuration, display token balances with the established address formatting pattern, and include comprehensive Vitest tests with the project's Web3 mocking patterns for wagmi hooks and Reown AppKit integration."

## Charitable Disposal Transaction Flow

"Create a complete transaction flow component that implements the core token disposal functionality using the project's established Web3 patterns, integrating with the existing `ThemeSync` component for consistent theming across wallet states, and utilizing the comprehensive error classification system from `NetworkValidationError` types. The implementation should follow the project's testing conventions with co-located test files, mock all Web3 operations using the established `vi.mock('wagmi')` patterns, include transaction status tracking with the semantic Web3 state colors defined in the CSS custom properties, and provide real-time feedback using the glass morphism UI components while maintaining the violet branding throughout the user journey."

## NFT Receipt Generation System

"Develop an on-chain proof-of-disposal system that generates NFT receipts for charitable contributions, leveraging the project's multi-chain support configuration and following the established Wagmi v2 patterns for contract interactions. The system should integrate with the existing Web3 provider chain (`Web3Provider` → `ThemeSync`), utilize the project's custom RPC endpoints defined in the `WagmiAdapter` transports, implement comprehensive error handling following the "no throw on disconnect" pattern, and include extensive testing coverage using the project's Vitest setup with jsdom environment. The NFT metadata should reflect the violet brand palette and glass morphism design tokens, with components that gracefully handle network switching via the `handleUnsupportedNetwork` pattern."
---

## 🚀 Implementation Prompts

Here are 3 unique, project-specific prompts for extending Token Toilet using these instructions:

### Prompt 1: Token Discovery Dashboard Component
Create a new dashboard component at `components/web3/token-discovery-dashboard.tsx` that displays discovered tokens across all supported chains (Ethereum, Polygon, Arbitrum) for the connected wallet. Use the existing `useTokenDiscovery` hook from use-token-discovery.ts for data fetching, implement the glass morphism design aesthetic with violet accent colors, include filtering capabilities for zero-balance tokens, and follow the established patterns for Web3 components (use 'use client' directive, comprehensive error handling with console.error logging, proper address formatting with the standard slice pattern). Ensure the component includes co-located tests with proper Web3 mocking (vi.mock for wagmi hooks, useAppKit, and useTokenDiscovery), uses functional state updates in useEffect hooks, and integrates with the design system Card and Badge components for consistent styling.

### Prompt 2: Transaction Queue Status Component
Implement a real-time transaction queue status component at `components/web3/transaction-queue-status.tsx` that shows pending, confirmed, and failed transactions using the existing `useTransactionQueue` hook from use-transaction-queue.ts. Display transactions in a compact list with connection status badges, implement auto-refresh on transaction state changes, and include a clear queue action with confirmation dialog. Follow React Hooks best practices by capturing ref values at effect execution time for any cleanup functions, use functional setState updates when deriving from previous state, and implement proper error boundaries with graceful fallbacks. Create comprehensive tests with computed property names for hook mocks to avoid ESLint warnings, mock the localStorage-backed transaction queue, and test all transaction states (pending, confirmed, failed). Style using the violet color scheme with CSS custom properties and glass-container utility class for the backdrop-filter aesthetic.

### Prompt 3: Multi-Chain Token Approval Flow
Build a comprehensive token approval flow component at `components/web3/token-approval-flow.tsx` that guides users through the ERC-20 approval process with network validation and auto-switching support. Leverage the `useTokenApproval` hook from use-token-approval.ts for approval state tracking and gas estimation, integrate with `useWallet` for network info and connection status, and implement infinite approval toggle with security warnings. Display real-time gas estimates in the native network token, show current allowance vs required amount comparison, and implement proper loading states during approval transactions. Follow the established Web3 error handling pattern (no throws on disconnect/connection errors, structured NetworkValidationError types), separate component exports from variant utilities to maintain Fast Refresh compliance, and create variant files following the badge-variants.ts pattern. Write comprehensive Vitest tests with proper wagmi mocks (useReadContract for allowance, useWriteContract for approval, useEstimateGas for gas calculation), test all approval states including edge cases like insufficient gas, and verify the component renders correctly in connected, connecting, and error wallet states.
