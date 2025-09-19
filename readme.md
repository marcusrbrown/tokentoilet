# Token Toilet 🚽

> A Web3 solution for cleaning up your digital wallet

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)

## Overview

Token Toilet is a modern DeFi application that helps crypto enthusiasts clean up their digital wallets while contributing to charitable causes. It provides a fun, interactive way to dispose of unwanted tokens while potentially helping others.

### Key Features

- 🚽 **Token Disposal**: Safely dispose of any ERC-20 or ERC-721 tokens
- 🎲 **Random Token Fountain**: Receive random tokens for your charitable contributions
- 💧 **Charity Integration**: All proceeds are automatically donated to verified charitable causes
- 🧾 **On-chain Proof of Disposal**: Get NFT receipts for your contributions

## Why Token Toilet?

In the evolving Web3 landscape, wallets often accumulate:

- Abandoned governance tokens from defunct DAOs
- Airdropped tokens with no clear utility
- NFTs from discontinued projects
- Tokens from failed or compromised protocols

Instead of letting these tokens gather dust or sending them to a burn address, Token Toilet creates value by:

1. Providing a verifiable disposal mechanism
2. Converting "waste" into charitable contributions
3. Creating a fun, gamified experience for the community

## Getting Started

### For Users

Token Toilet is currently in development. Stay tuned for the public release!

### For Developers

Ready to contribute? Check out our comprehensive development guides:

- **[Development Setup Guide](docs/development/setup.md)** - Complete environment setup and workflow
- **[Contributing Guidelines](CONTRIBUTING.md)** - Coding standards and contribution process
- **[Architecture Guide](docs/development/architecture.md)** - System architecture and design patterns
- **[Design System](docs/design-system/getting-started.md)** - UI components and design tokens

#### Quick Development Setup

```bash
# Clone the repository
git clone https://github.com/marcusrbrown/tokentoilet.git
cd tokentoilet

# Install dependencies
pnpm bootstrap

# Set up environment
cp .env.example .env.local
# Edit .env.local with your WalletConnect Project ID

# Start development server
pnpm dev
```

### Prerequisites

- Node.js 18.17+
- pnpm (package manager)
- Web3 wallet (MetaMask, WalletConnect, or Coinbase Wallet)
- WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)

## Technical Stack

- **Frontend**: Next.js 15 with App Router and TypeScript
- **Web3**: Wagmi v2 + Reown AppKit for wallet connections
- **Styling**: Tailwind CSS v4 with glass morphism design system
- **Testing**: Vitest with comprehensive Web3 component mocking
- **Networks**: Ethereum, Polygon, and Arbitrum support

## Roadmap

- [x] Project setup & UI framework
- [ ] Smart contract development
- [ ] Token disposal mechanism
- [ ] Random token distribution system
- [ ] Charity integration
- [ ] NFT proof of disposal
- [ ] Multi-chain support

## Contributing

We welcome contributions from the community! Whether you're interested in:

- 🐛 **Bug fixes and improvements**
- ✨ **New features and enhancements**
- 📚 **Documentation improvements**
- 🧪 **Testing and quality assurance**
- 🎨 **Design and user experience**

Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started. For major changes, please open an issue first to discuss your ideas with the community.

### Development Resources

- [Development Setup Guide](docs/development/setup.md) - Environment setup and workflow
- [Architecture Guide](docs/development/architecture.md) - System design and patterns
- [Design System](docs/design-system/getting-started.md) - UI components and theming
- [Environment Setup](docs/development/environment-setup.md) - Configuration and variables

## Security

For security concerns, please email [security@tokentoilet.com](mailto:security@tokentoilet.com)

## License

MIT License - see the [LICENSE](LICENSE) file for details

## Connect With Us

- Website: [tokentoilet.com](https://tokentoilet.com)
<!-- - Discord: [Join our community](https://discord.gg/tokentoilet) -->
