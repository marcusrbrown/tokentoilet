#!/usr/bin/env tsx
/**
 * Comprehensive Web3Modal and Wagmi Integration Validation Script
 *
 * This script validates that all components work correctly with:
 * - Reown AppKit (formerly Web3Modal) integration
 * - Wagmi v2 hooks and provider system
 * - Design system components
 * - Provider chain: layout.tsx → providers.tsx → Web3Provider → ThemeSync
 *
 * Validation Areas:
 * 1. Provider chain integrity
 * 2. Web3 component files existence
 * 3. Hook integration patterns
 * 4. Design system component integration
 * 5. Reown AppKit configuration
 * 6. Test coverage completeness
 */

import fs from 'node:fs/promises'
import consola from 'consola'

interface ValidationResult {
  pass: boolean
  message: string
  details?: string[]
}

interface ValidationSummary {
  total: number
  passed: number
  failed: number
  results: ValidationResult[]
}

// Required Web3 components
const REQUIRED_WEB3_COMPONENTS = [
  'components/web3/web3-provider.tsx',
  'components/web3/wallet-button.tsx',
  'components/web3/wallet-dashboard.tsx',
  'components/web3/wallet-connection-modal.tsx',
  'components/web3/wallet-switcher.tsx',
  'components/web3/wallet-auto-connect.tsx',
  'components/theme-sync.tsx',
]

// Required Web3 hooks
const REQUIRED_WEB3_HOOKS = [
  'hooks/use-wallet.ts',
  'hooks/use-wallet-persistence.ts',
  'hooks/use-wallet-switcher.ts',
  'hooks/use-token-approval.ts',
  'hooks/use-token-balance.ts',
]

// Required provider chain files
const REQUIRED_PROVIDER_FILES = [
  'app/layout.tsx',
  'app/providers.tsx',
  'components/web3/web3-provider.tsx',
  'components/theme-sync.tsx',
]

// Web3 configuration files are not validated here as missing configs would cause build failures
// Reference list: lib/web3/config.ts, env.ts

// Design system UI components that should work with Web3
const WEB3_DESIGN_SYSTEM_COMPONENTS = [
  'components/ui/button.tsx',
  'components/ui/card.tsx',
  'components/ui/badge.tsx',
  'components/ui/modal.tsx',
  'components/ui/address-display.tsx',
  'components/ui/network-badge.tsx',
]

// Test files for Web3 components
const REQUIRED_WEB3_TESTS = [
  'hooks/use-wallet.test.ts',
  'hooks/use-wallet.metamask.test.ts',
  'hooks/use-wallet.walletconnect.test.ts',
  'hooks/use-wallet.coinbase.test.ts',
  'hooks/use-wallet.connection-errors.test.ts',
  'hooks/use-wallet.integration.test.ts',
  'hooks/use-wallet-persistence.test.ts',
  'hooks/use-token-approval.test.tsx',
  'components/web3/wallet-button.test.tsx',
  'components/web3/wallet-dashboard.test.tsx',
  'components/web3/wallet-connection-modal.test.tsx',
]

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function fileContains(filePath: string, searchString: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content.includes(searchString)
  } catch {
    return false
  }
}

async function validateWeb3Components(): Promise<ValidationResult> {
  const missingComponents: string[] = []

  for (const component of REQUIRED_WEB3_COMPONENTS) {
    const exists = await fileExists(component)
    if (!exists) {
      missingComponents.push(component)
    }
  }

  if (missingComponents.length > 0) {
    return {
      pass: false,
      message: `Missing ${missingComponents.length} required Web3 components`,
      details: missingComponents,
    }
  }

  return {
    pass: true,
    message: `All ${REQUIRED_WEB3_COMPONENTS.length} required Web3 components present`,
  }
}

async function validateWeb3Hooks(): Promise<ValidationResult> {
  const missingHooks: string[] = []

  for (const hook of REQUIRED_WEB3_HOOKS) {
    const exists = await fileExists(hook)
    if (!exists) {
      missingHooks.push(hook)
    }
  }

  if (missingHooks.length > 0) {
    return {
      pass: false,
      message: `Missing ${missingHooks.length} required Web3 hooks`,
      details: missingHooks,
    }
  }

  return {
    pass: true,
    message: `All ${REQUIRED_WEB3_HOOKS.length} required Web3 hooks present`,
  }
}

async function validateProviderChain(): Promise<ValidationResult> {
  const issues: string[] = []

  // Check all provider files exist
  for (const file of REQUIRED_PROVIDER_FILES) {
    const exists = await fileExists(file)
    if (!exists) {
      issues.push(`Missing provider file: ${file}`)
    }
  }

  // Verify provider chain integration patterns
  const layoutExists = await fileExists('app/layout.tsx')
  const providersExists = await fileExists('app/providers.tsx')

  if (layoutExists && providersExists) {
    // Check layout.tsx imports Providers
    const layoutImportsProviders = await fileContains('app/layout.tsx', 'Providers')
    if (!layoutImportsProviders) {
      issues.push('app/layout.tsx does not import Providers component')
    }

    // Check providers.tsx contains Web3Provider
    const providersHasWeb3 = await fileContains('app/providers.tsx', 'Web3Provider')
    if (!providersHasWeb3) {
      issues.push('app/providers.tsx does not integrate Web3Provider')
    }

    // Check providers.tsx contains NextThemesProvider
    const providersHasTheme = await fileContains('app/providers.tsx', 'ThemeProvider')
    if (!providersHasTheme) {
      issues.push('app/providers.tsx does not integrate NextThemesProvider')
    }
  }

  // Verify Web3Provider uses WagmiProvider
  const web3ProviderExists = await fileExists('components/web3/web3-provider.tsx')
  if (web3ProviderExists) {
    const hasWagmi = await fileContains('components/web3/web3-provider.tsx', 'WagmiProvider')
    if (!hasWagmi) {
      issues.push('components/web3/web3-provider.tsx does not use WagmiProvider')
    }

    const hasQuery = await fileContains('components/web3/web3-provider.tsx', 'QueryClientProvider')
    if (!hasQuery) {
      issues.push('components/web3/web3-provider.tsx does not use QueryClientProvider')
    }

    const hasThemeSync = await fileContains('components/web3/web3-provider.tsx', 'ThemeSync')
    if (!hasThemeSync) {
      issues.push('components/web3/web3-provider.tsx does not integrate ThemeSync')
    }
  }

  // Verify ThemeSync bridges next-themes and Reown AppKit
  const themeSyncExists = await fileExists('components/theme-sync.tsx')
  if (themeSyncExists) {
    const hasAppKitTheme = await fileContains('components/theme-sync.tsx', 'useAppKitTheme')
    if (!hasAppKitTheme) {
      issues.push('components/theme-sync.tsx does not use useAppKitTheme hook')
    }

    const hasNextThemes = await fileContains('components/theme-sync.tsx', 'useTheme')
    if (!hasNextThemes) {
      issues.push('components/theme-sync.tsx does not use next-themes useTheme hook')
    }
  }

  if (issues.length > 0) {
    return {
      pass: false,
      message: `Provider chain has ${issues.length} integration issues`,
      details: issues,
    }
  }

  return {
    pass: true,
    message: 'Provider chain integration verified: layout.tsx → providers.tsx → Web3Provider → ThemeSync',
  }
}

async function validateReownAppKitConfig(): Promise<ValidationResult> {
  const issues: string[] = []

  // Check config file exists
  const configExists = await fileExists('lib/web3/config.ts')
  if (!configExists) {
    return {
      pass: false,
      message: 'Missing lib/web3/config.ts configuration file',
    }
  }

  // Verify Reown AppKit integration
  const hasWagmiAdapter = await fileContains('lib/web3/config.ts', 'WagmiAdapter')
  if (!hasWagmiAdapter) {
    issues.push('lib/web3/config.ts does not use WagmiAdapter')
  }

  const hasCreateAppKit = await fileContains('lib/web3/config.ts', 'createAppKit')
  if (!hasCreateAppKit) {
    issues.push('lib/web3/config.ts does not call createAppKit')
  }

  const hasNetworks = await fileContains('lib/web3/config.ts', 'networks')
  if (!hasNetworks) {
    issues.push('lib/web3/config.ts missing networks configuration')
  }

  // Check for multi-chain support
  const hasMainnet = await fileContains('lib/web3/config.ts', 'mainnet')
  const hasPolygon = await fileContains('lib/web3/config.ts', 'polygon')
  const hasArbitrum = await fileContains('lib/web3/config.ts', 'arbitrum')

  if (!hasMainnet || !hasPolygon || !hasArbitrum) {
    issues.push('lib/web3/config.ts missing multi-chain support (Ethereum, Polygon, Arbitrum)')
  }

  // Check for violet theming
  const hasVioletTheme = await fileContains('lib/web3/config.ts', 'violet')
  if (!hasVioletTheme) {
    issues.push('lib/web3/config.ts missing violet design system theming')
  }

  if (issues.length > 0) {
    return {
      pass: false,
      message: `Reown AppKit configuration has ${issues.length} issues`,
      details: issues,
    }
  }

  return {
    pass: true,
    message: 'Reown AppKit configuration verified with WagmiAdapter, multi-chain support, and violet theming',
  }
}

async function validateWagmiIntegration(): Promise<ValidationResult> {
  const issues: string[] = []

  // Check useWallet hook uses wagmi hooks
  const useWalletExists = await fileExists('hooks/use-wallet.ts')
  if (useWalletExists) {
    const hasUseAccount = await fileContains('hooks/use-wallet.ts', 'useAccount')
    const hasUseChainId = await fileContains('hooks/use-wallet.ts', 'useChainId')
    const hasUseDisconnect = await fileContains('hooks/use-wallet.ts', 'useDisconnect')
    const hasUseSwitchChain = await fileContains('hooks/use-wallet.ts', 'useSwitchChain')
    const hasUseAppKit = await fileContains('hooks/use-wallet.ts', 'useAppKit')

    if (!hasUseAccount) issues.push('useWallet hook missing useAccount from wagmi')
    if (!hasUseChainId) issues.push('useWallet hook missing useChainId from wagmi')
    if (!hasUseDisconnect) issues.push('useWallet hook missing useDisconnect from wagmi')
    if (!hasUseSwitchChain) issues.push('useWallet hook missing useSwitchChain from wagmi')
    if (!hasUseAppKit) issues.push('useWallet hook missing useAppKit from @reown/appkit/react')
  } else {
    issues.push('hooks/use-wallet.ts does not exist')
  }

  // Check WalletButton uses useWallet hook (not direct wagmi)
  const walletButtonExists = await fileExists('components/web3/wallet-button.tsx')
  if (walletButtonExists) {
    const usesUseWallet = await fileContains('components/web3/wallet-button.tsx', 'useWallet')
    if (!usesUseWallet) {
      issues.push('WalletButton component does not use useWallet hook abstraction')
    }

    // Should NOT directly use wagmi hooks in component
    const usesWagmiDirect = await fileContains('components/web3/wallet-button.tsx', "from 'wagmi'")
    if (usesWagmiDirect) {
      issues.push('WalletButton component directly imports from wagmi (should use useWallet hook)')
    }
  }

  if (issues.length > 0) {
    return {
      pass: false,
      message: `Wagmi integration has ${issues.length} issues`,
      details: issues,
    }
  }

  return {
    pass: true,
    message: 'Wagmi integration verified: useWallet hook abstracts wagmi hooks, components use useWallet',
  }
}

async function validateDesignSystemIntegration(): Promise<ValidationResult> {
  const issues: string[] = []

  // Check WalletButton uses design system components
  const walletButtonExists = await fileExists('components/web3/wallet-button.tsx')
  if (walletButtonExists) {
    const usesButton = await fileContains('components/web3/wallet-button.tsx', '@/components/ui/button')
    const usesBadge = await fileContains('components/web3/wallet-button.tsx', '@/components/ui/badge')
    const usesCard = await fileContains('components/web3/wallet-button.tsx', '@/components/ui/card')

    if (!usesButton) issues.push('WalletButton does not use design system Button component')
    if (!usesBadge) issues.push('WalletButton does not use design system Badge component')
    if (!usesCard) issues.push('WalletButton does not use design system Card component')
  }

  // Check all Web3 design system components exist
  for (const component of WEB3_DESIGN_SYSTEM_COMPONENTS) {
    const exists = await fileExists(component)
    if (!exists) {
      issues.push(`Missing Web3-compatible design system component: ${component}`)
    }
  }

  // Verify Button has Web3 variants
  const buttonExists = await fileExists('components/ui/button.tsx')
  if (buttonExists) {
    const hasWeb3Connected = await fileContains('components/ui/button.tsx', 'web3Connected')
    const hasWeb3Pending = await fileContains('components/ui/button.tsx', 'web3Pending')
    const hasWeb3Error = await fileContains('components/ui/button.tsx', 'web3Error')

    if (!hasWeb3Connected || !hasWeb3Pending || !hasWeb3Error) {
      issues.push('Button component missing Web3 variant styles (web3Connected, web3Pending, web3Error)')
    }
  }

  // Verify Badge has connected variant
  const badgeExists = await fileExists('components/ui/badge.tsx')
  if (badgeExists) {
    const hasConnected = await fileContains('components/ui/badge.tsx', 'connected')
    if (!hasConnected) {
      issues.push('Badge component missing connected variant for network status')
    }
  }

  if (issues.length > 0) {
    return {
      pass: false,
      message: `Design system Web3 integration has ${issues.length} issues`,
      details: issues,
    }
  }

  return {
    pass: true,
    message: 'Design system components integrated with Web3: Button variants, Badge variants, Card usage verified',
  }
}

async function validateTestCoverage(): Promise<ValidationResult> {
  const missingTests: string[] = []

  for (const test of REQUIRED_WEB3_TESTS) {
    const exists = await fileExists(test)
    if (!exists) {
      missingTests.push(test)
    }
  }

  if (missingTests.length > 0) {
    return {
      pass: false,
      message: `Missing ${missingTests.length} required Web3 test files`,
      details: missingTests,
    }
  }

  return {
    pass: true,
    message: `All ${REQUIRED_WEB3_TESTS.length} required Web3 test files present`,
  }
}

async function runValidation(): Promise<ValidationSummary> {
  const results: ValidationResult[] = []

  consola.box('Web3Modal & Wagmi Integration Validation')
  consola.info('Validating Token Toilet Web3 integration...\n')

  // Run all validation checks
  consola.start('Checking Web3 components...')
  results.push(await validateWeb3Components())

  consola.start('Checking Web3 hooks...')
  results.push(await validateWeb3Hooks())

  consola.start('Validating provider chain...')
  results.push(await validateProviderChain())

  consola.start('Validating Reown AppKit configuration...')
  results.push(await validateReownAppKitConfig())

  consola.start('Validating wagmi integration...')
  results.push(await validateWagmiIntegration())

  consola.start('Validating design system integration...')
  results.push(await validateDesignSystemIntegration())

  consola.start('Checking test coverage...')
  results.push(await validateTestCoverage())

  // Display results
  for (const result of results) {
    if (result.pass) {
      consola.success(result.message)
    } else {
      consola.error(result.message)
      if (result.details && result.details.length > 0) {
        for (const detail of result.details) {
          consola.log(`  - ${detail}`)
        }
      }
    }
  }

  // Calculate summary
  const passed = results.filter(r => r.pass).length
  const failed = results.filter(r => !r.pass).length

  consola.box('Validation Summary')
  consola.info(`Total checks: ${results.length}`)
  consola.success(`Passed: ${passed}`)
  if (failed > 0) {
    consola.error(`Failed: ${failed}`)
  }

  return {
    total: results.length,
    passed,
    failed,
    results,
  }
}

// Run validation
runValidation()
  .then(summary => {
    if (summary.failed > 0) {
      consola.error('\n❌ Validation failed - please fix the issues above')
      process.exit(1)
    } else {
      consola.success('\n✅ All Web3Modal and wagmi integration checks passed!')
      process.exit(0)
    }
  })
  .catch(error => {
    consola.error('Validation error:', error)
    process.exit(1)
  })
