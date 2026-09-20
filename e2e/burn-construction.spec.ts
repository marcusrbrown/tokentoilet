import type {Page} from '@playwright/test'
import type {Address} from 'viem'
import {expect, test} from '@playwright/test'

import {installNetworkStubs} from './fixtures/network-stubs'
import {
  CONSTRUCTION_TOKEN_ALPHA,
  CONSTRUCTION_TOKEN_BETA,
  CONSTRUCTION_TOKEN_FIXTURES,
  CONSTRUCTION_TOKEN_GAMMA,
  createBatchFixtures,
  DISPOSABLE_TOKEN,
  SPOOFED_BURNABLE_TOKEN,
  type TokenFixture,
} from './fixtures/tokens'
import {getRecordedRequests, installSyntheticWallet, SEPOLIA_CHAIN_ID_HEX} from './fixtures/wallet-provider'
import {decodeAllBurnTransfers} from './helpers/decode-transaction'
import {
  acknowledgeAndTypeConfirmation,
  confirmBurn,
  continueToConfirm,
  deselectToken,
  selectToken,
  selectTokenLabel,
} from './helpers/interaction'

// Stated literally, not imported from the app: importing BURN_ADDRESS would
// move both sides of the assertion together and let a mutated constant pass.
const EXPECTED_BURN_RECIPIENT: Address = '0x000000000000000000000000000000000000dEaD'
const REAL_MAINNET_USDC: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

async function burnTokens(page: Page, tokens: readonly TokenFixture[]): Promise<void> {
  for (const token of tokens) {
    await selectToken(page, token)
  }
  await continueToConfirm(page)
  await acknowledgeAndTypeConfirmation(page, tokens.length)
  await confirmBurn(page)
  await expect(page.getByRole('heading', {name: 'Results'})).toBeVisible({timeout: 15_000})
}

test.describe('burn transaction construction', () => {
  test('three tokens with distinct balances produce three correctly-decoded transfers, submitted in discovery order', async ({
    page,
  }) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: CONSTRUCTION_TOKEN_FIXTURES})
    await page.goto('/flush')

    // Select out of discovery order to prove submission order comes from
    // discovery/selection state, not the order the rows were clicked in.
    await burnTokens(page, [CONSTRUCTION_TOKEN_GAMMA, CONSTRUCTION_TOKEN_ALPHA, CONSTRUCTION_TOKEN_BETA])

    const requests = await getRecordedRequests(page)
    const transfers = decodeAllBurnTransfers(requests)

    expect(transfers).toHaveLength(CONSTRUCTION_TOKEN_FIXTURES.length)
    CONSTRUCTION_TOKEN_FIXTURES.forEach((token, index) => {
      const transfer = transfers[index]
      expect(transfer.contract.toLowerCase()).toBe(token.address.toLowerCase())
      expect(transfer.recipient.toLowerCase()).toBe(EXPECTED_BURN_RECIPIENT.toLowerCase())
      expect(transfer.amount).toBe(token.balance)
    })

    // Every outbound transaction happens on the wallet's only configured
    // chain (Sepolia): the provider only ever reported Sepolia, and no chain
    // switch was ever requested or possible.
    const chainIdRequests = requests.filter(r => r.method === 'eth_chainId')
    expect(chainIdRequests.length).toBeGreaterThan(0)
    expect(chainIdRequests.every(r => r.result === SEPOLIA_CHAIN_ID_HEX)).toBe(true)
    expect(
      requests.some(r => r.method === 'wallet_switchEthereumChain' || r.method === 'wallet_addEthereumChain'),
    ).toBe(false)
  })

  test('a single-token burn produces exactly one transaction', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    await burnTokens(page, [DISPOSABLE_TOKEN])

    const requests = await getRecordedRequests(page)
    const transfers = decodeAllBurnTransfers(requests)

    expect(transfers).toHaveLength(1)
    expect(transfers[0].contract.toLowerCase()).toBe(DISPOSABLE_TOKEN.address.toLowerCase())
    expect(transfers[0].amount).toBe(DISPOSABLE_TOKEN.balance)
  })

  test('a token deselected before confirming produces no transaction for it', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: CONSTRUCTION_TOKEN_FIXTURES})
    await page.goto('/flush')

    await selectToken(page, CONSTRUCTION_TOKEN_ALPHA)
    await selectToken(page, CONSTRUCTION_TOKEN_BETA)
    await deselectToken(page, CONSTRUCTION_TOKEN_BETA)

    await continueToConfirm(page)
    await acknowledgeAndTypeConfirmation(page, 1)
    await confirmBurn(page)
    await expect(page.getByRole('heading', {name: 'Results'})).toBeVisible({timeout: 15_000})

    const requests = await getRecordedRequests(page)
    const transfers = decodeAllBurnTransfers(requests)

    expect(transfers).toHaveLength(1)
    expect(transfers[0].contract.toLowerCase()).toBe(CONSTRUCTION_TOKEN_ALPHA.address.toLowerCase())
    expect(transfers.some(t => t.contract.toLowerCase() === CONSTRUCTION_TOKEN_BETA.address.toLowerCase())).toBe(false)
  })

  test('a spoofed-metadata token burns its own contract, not the token it impersonates', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [SPOOFED_BURNABLE_TOKEN]})
    await page.goto('/flush')

    // Selection is scoped by contract address in the accessible name, not
    // symbol alone — the impersonated real USDC is never present to select.
    await burnTokens(page, [SPOOFED_BURNABLE_TOKEN])

    const requests = await getRecordedRequests(page)
    const transfers = decodeAllBurnTransfers(requests)

    expect(transfers).toHaveLength(1)
    expect(transfers[0].contract.toLowerCase()).toBe(SPOOFED_BURNABLE_TOKEN.address.toLowerCase())
    expect(transfers[0].contract.toLowerCase()).not.toBe(REAL_MAINNET_USDC.toLowerCase())
  })
})

test.describe('selection limits', () => {
  test('zero tokens selected leaves the advance control disabled', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    const continueButton = page.getByRole('button', {name: 'Continue'})
    await expect(continueButton).toBeDisabled()

    const requests = await getRecordedRequests(page)
    expect(requests.some(r => r.method === 'eth_sendTransaction')).toBe(false)
  })

  test('exceeding the batch cap surfaces the limit message and blocks advancing', async ({page}) => {
    const tokens = createBatchFixtures(11)
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens})
    await page.goto('/flush')

    for (const token of tokens) {
      await selectToken(page, token)
    }

    await expect(page.getByText('Maximum 10 tokens')).toBeVisible()
    const continueButton = page.getByRole('button', {name: 'Continue'})
    await expect(continueButton).toBeDisabled()

    const requests = await getRecordedRequests(page)
    expect(requests.some(r => r.method === 'eth_sendTransaction')).toBe(false)
  })
})

test.describe('pointer hit-testing', () => {
  test('the selection control is reachable by real pointer hit testing, not just dispatched events', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    const selectButton = page.getByRole('button', {name: selectTokenLabel(DISPOSABLE_TOKEN)})
    await expect(selectButton).toBeVisible()

    // `dispatchEvent('click')` (used everywhere else in this suite, because a
    // real `.click()` hangs against this app) bypasses the browser's hit-testing
    // pipeline entirely — it can prove a handler fires but never that a user's
    // pointer can actually reach the control through whatever else is painted
    // at that coordinate. `elementFromPoint` performs real hit testing and is
    // the only way to catch a sibling overlay silently stealing the click.
    const resolvesToSelectButton = await selectButton.evaluate(el => {
      const rect = el.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      return hit?.closest('button') === el
    })

    expect(resolvesToSelectButton).toBe(true)
  })
})
