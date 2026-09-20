import type {Page} from '@playwright/test'
import {expect, test} from '@playwright/test'
import {installNetworkStubs} from './fixtures/network-stubs'
import {CONSTRUCTION_TOKEN_ALPHA, CONSTRUCTION_TOKEN_BETA, DISPOSABLE_TOKEN} from './fixtures/tokens'
import {getRecordedRequests, installSyntheticWallet} from './fixtures/wallet-provider'
import {
  acknowledgeAndTypeConfirmation,
  burnPhrase,
  confirmBurn,
  continueToConfirm,
  dispatchClick,
  dispatchFill,
  selectToken,
} from './helpers/interaction'

const FULL_BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD'
const ACKNOWLEDGEMENT_LABEL = 'I acknowledge that these tokens will be permanently burned and cannot be recovered.'

async function noTransactionWasSent(page: Page): Promise<boolean> {
  const requests = await getRecordedRequests(page)
  return !requests.some(request => request.method === 'eth_sendTransaction')
}

async function assertGateBlocks(page: Page): Promise<void> {
  const confirmButton = page.getByRole('button', {name: 'Confirm Burn'})
  await expect(confirmButton).toBeDisabled()
  await confirmButton.dispatchEvent('click')
  expect(await noTransactionWasSent(page)).toBe(true)
}

test.describe('confirmation gates', () => {
  test('confirm is disabled until the acknowledgement is checked', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    await selectToken(page, DISPOSABLE_TOKEN)
    await continueToConfirm(page)

    await assertGateBlocks(page)
  })

  test('confirm is disabled until typed confirmation matches — required for every token', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    await selectToken(page, DISPOSABLE_TOKEN)
    await continueToConfirm(page)
    await dispatchClick(page.getByLabel(ACKNOWLEDGEMENT_LABEL))

    await assertGateBlocks(page)
  })

  test('lowercase and padded phrases both fail exact-match', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    await selectToken(page, DISPOSABLE_TOKEN)
    await continueToConfirm(page)
    await dispatchClick(page.getByLabel(ACKNOWLEDGEMENT_LABEL))

    const input = page.getByLabel('Type BURN to continue')
    const confirmButton = page.getByRole('button', {name: 'Confirm Burn'})

    await dispatchFill(input, 'burn')
    await expect(confirmButton).toBeDisabled()

    await dispatchFill(input, ' BURN ')
    await expect(confirmButton).toBeDisabled()

    await assertGateBlocks(page)
  })

  test('changing selection count after typing invalidates the previously correct phrase', async ({page}) => {
    const tokens = [CONSTRUCTION_TOKEN_ALPHA, CONSTRUCTION_TOKEN_BETA]
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens})
    await page.goto('/flush')

    await selectToken(page, CONSTRUCTION_TOKEN_ALPHA)
    await continueToConfirm(page)
    await acknowledgeAndTypeConfirmation(page, 1)
    await expect(page.getByRole('button', {name: 'Confirm Burn'})).toBeEnabled()

    await dispatchClick(page.getByRole('button', {name: 'Cancel'}))
    await selectToken(page, CONSTRUCTION_TOKEN_BETA)
    await continueToConfirm(page)

    // Re-type the phrase that was correct for one token; two are selected now.
    await dispatchClick(page.getByLabel(ACKNOWLEDGEMENT_LABEL))
    await dispatchFill(page.getByLabel(`Type ${burnPhrase(2)} to continue`), 'BURN')

    await assertGateBlocks(page)
  })

  test('all gates satisfied enables confirm and submits', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    await selectToken(page, DISPOSABLE_TOKEN)
    await continueToConfirm(page)
    await acknowledgeAndTypeConfirmation(page, 1)
    await confirmBurn(page)

    await expect(page.getByRole('heading', {name: /disposing/i})).toBeVisible()
  })
})

test.describe('confirm-step safety content', () => {
  test('shows the permanence warning, full burn address, contract address, and unknown value', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    await selectToken(page, DISPOSABLE_TOKEN)
    await continueToConfirm(page)

    const warning = page.getByRole('alert', {name: 'This action is permanent'})
    await expect(warning).toBeVisible()
    await expect(warning).toContainText('cannot be undone')

    await expect(page.getByText(FULL_BURN_ADDRESS)).toBeVisible()
    await expect(page.getByText(new RegExp(DISPOSABLE_TOKEN.address, 'i'))).toBeVisible()
    await expect(page.getByText('Value unknown')).toBeVisible()
  })

  test('the acknowledgement checkbox and typed-confirmation input have accessible names', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    await selectToken(page, DISPOSABLE_TOKEN)
    await continueToConfirm(page)

    await expect(page.getByRole('checkbox', {name: ACKNOWLEDGEMENT_LABEL})).toBeVisible()
    await expect(page.getByRole('textbox', {name: 'Type BURN to continue'})).toBeVisible()
  })
})

test.describe('escape paths', () => {
  test('cancelling from confirm returns to selection with gate state cleared', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    await selectToken(page, DISPOSABLE_TOKEN)
    await continueToConfirm(page)
    await acknowledgeAndTypeConfirmation(page, 1)
    await expect(page.getByRole('button', {name: 'Confirm Burn'})).toBeEnabled()

    await dispatchClick(page.getByRole('button', {name: 'Cancel'}))
    await expect(page.getByRole('heading', {name: 'Select Tokens for Disposal'})).toBeVisible()

    await continueToConfirm(page)
    await assertGateBlocks(page)
  })

  test('the results reset returns the flow to a usable selection state', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    await selectToken(page, DISPOSABLE_TOKEN)
    await continueToConfirm(page)
    await acknowledgeAndTypeConfirmation(page, 1)
    await confirmBurn(page)

    await expect(page.getByRole('heading', {name: 'Results'})).toBeVisible({timeout: 15_000})
    await dispatchClick(page.getByRole('button', {name: 'Flush More'}))

    await expect(page.getByRole('heading', {name: 'Select Tokens for Disposal'})).toBeVisible()
    await expect(page.getByRole('button', {name: 'Continue'})).toBeDisabled()
  })
})
