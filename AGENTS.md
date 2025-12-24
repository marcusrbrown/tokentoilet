# AGENTS.md - AI Coding Agent Instructions

## Commands
```bash
pnpm bootstrap        # Install dependencies (preferred over pnpm install)
pnpm dev              # Dev server
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm fix              # Auto-fix lint issues
pnpm test             # Run all tests
pnpm test -- path/to/file.test.ts  # Run single test file
pnpm type-check       # TypeScript check
pnpm validate         # Full validation: lint + types + test + build
```

## Code Style
- **Package manager**: pnpm (enforced)
- **Imports**: Use `@/*` path alias. Use `useWallet` hook, not direct wagmi/AppKit hooks
- **Types**: Strict mode. Never use `as any`, `@ts-ignore`, or `@ts-expect-error`
- **Components**: Web3 components require `'use client'`. Use design system from `@/components/ui/*`
- **Styling**: Tailwind v4 CSS-first (no tailwind.config.ts). Use CSS custom properties in `@theme` blocks
- **Tests**: Co-located as `*.test.ts(x)`. Mock wagmi/AppKit hooks. Use computed property names for hook mocks
- **Error handling**: Web3 ops use try/catch with console.error, never throw on connect/disconnect

## Key Patterns
- Address display: `` `${addr.slice(0,6)}...${addr.slice(-4)}` ``
- Functional state updates in useEffect: `setX(prev => ...)` not `setX(x + 1)`
- Capture refs at effect execution time for cleanup

## Reference
See `llms.txt` for full documentation links. Primary: `.github/copilot-instructions.md`
