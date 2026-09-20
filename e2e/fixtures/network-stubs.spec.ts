import type {Page} from '@playwright/test'
import {expect, test} from '@playwright/test'
import {acknowledgeAndTypeConfirmation, confirmBurn, continueToConfirm, selectToken} from '../helpers/interaction'
import {installNetworkStubs} from './network-stubs'
import {
  ALL_TOKEN_FIXTURES,
  DISPOSABLE_TOKEN,
  HIGH_VALUE_TOKEN,
  LOW_VALUE_TOKEN,
  SIX_DECIMAL_TOKEN,
  SPOOFED_USDC_TOKEN,
  type TokenFixture,
} from './tokens'
import {installSyntheticWallet} from './wallet-provider'

async function selectAndConfirmBurn(page: Page, token: TokenFixture): Promise<void> {
  // Playwright's real `.click()` hangs against this app's rendered page:
  // reproduced at blank coordinates with no element present while JS stayed
  // responsive, i.e. Chromium's input-ACK pipeline against this page, not a
  // CSS transition on the element. dispatchEvent fires the click directly,
  // bypassing that pipeline.
  await selectToken(page, token)
  await continueToConfirm(page)
  await acknowledgeAndTypeConfirmation(page, 1)
  await confirmBurn(page)
}

test.describe('network stubs — token discovery', () => {
  test('fixture tokens appear in the selection list', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: ALL_TOKEN_FIXTURES})
    await page.goto('/flush')

    for (const token of [SIX_DECIMAL_TOKEN, SPOOFED_USDC_TOKEN, HIGH_VALUE_TOKEN, LOW_VALUE_TOKEN, DISPOSABLE_TOKEN]) {
      await expect(page.getByText(token.symbol, {exact: true}).first()).toBeVisible()
    }
  })

  test('zero discovered tokens renders the empty state', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: []})
    await page.goto('/flush')

    await expect(page.getByText('No disposable tokens found in this wallet')).toBeVisible()
  })
})

test.describe('network stubs — discovery failure shapes', () => {
  test('a bare HTTP 401 surfaces the discovery-unavailable state', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: ALL_TOKEN_FIXTURES, discoveryFailure: 'http-401'})
    await page.goto('/flush')

    await expect(page.getByText('Token discovery unavailable')).toBeVisible()
  })

  test('a bare HTTP 403 surfaces the discovery-unavailable state', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: ALL_TOKEN_FIXTURES, discoveryFailure: 'http-403'})
    await page.goto('/flush')

    await expect(page.getByText('Token discovery unavailable')).toBeVisible()
  })

  test('a JSON-RPC -32600 error body surfaces the discovery-unavailable state, not an ambiguous empty list', async ({
    page,
  }) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: ALL_TOKEN_FIXTURES, discoveryFailure: 'json-rpc-32600'})
    await page.goto('/flush')

    await expect(page.getByText('Token discovery unavailable')).toBeVisible()
    await expect(page.getByText('No disposable tokens found in this wallet')).toHaveCount(0)
  })
})

test.describe('network stubs — disposal end to end', () => {
  test('a submitted transaction reaches a settled confirmed state in the transaction queue', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN], receiptStatus: 'success'})
    await page.goto('/flush')

    await selectAndConfirmBurn(page, DISPOSABLE_TOKEN)

    await expect(page.getByText('confirmed', {exact: true}).first()).toBeVisible({timeout: 15_000})
  })

  test('a reverted receipt marks the transaction failed, not confirmed', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN], receiptStatus: 'reverted'})
    await page.goto('/flush')

    await selectAndConfirmBurn(page, DISPOSABLE_TOKEN)

    await expect(page.getByText('failed', {exact: true}).first()).toBeVisible({timeout: 15_000})
    await expect(page.getByText('confirmed', {exact: true})).toHaveCount(0)
  })
})
