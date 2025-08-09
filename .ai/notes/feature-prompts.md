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
