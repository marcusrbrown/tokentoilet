import {expect, test} from '@playwright/test'
import {parseUnits} from 'viem'
import {installNetworkStubs} from './fixtures/network-stubs'
import {
  CONSTRUCTION_TOKEN_ALPHA,
  CONSTRUCTION_TOKEN_BETA,
  CONSTRUCTION_TOKEN_FIXTURES,
  CONSTRUCTION_TOKEN_GAMMA,
  DISPOSABLE_TOKEN,
  SIX_DECIMAL_TOKEN,
} from './fixtures/tokens'
import {getRecordedRequests, installSyntheticWallet} from './fixtures/wallet-provider'
import {decodeAllBurnTransfers} from './helpers/decode-transaction'
import {
  acknowledgeAndTypeConfirmation,
  confirmBurn,
  continueToConfirm,
  disconnectWallet,
  selectToken,
} from './helpers/interaction'

test.describe('mid-batch failure', () => {
  test('the second of three tokens fails; the first and third still burn, and results distinguish success from failure', async ({
    page,
  }) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {
      tokens: CONSTRUCTION_TOKEN_FIXTURES,
      simulateFailures: [CONSTRUCTION_TOKEN_BETA.address],
    })
    await page.goto('/flush')

    for (const token of CONSTRUCTION_TOKEN_FIXTURES) {
      await selectToken(page, token)
    }
    await continueToConfirm(page)
    await acknowledgeAndTypeConfirmation(page, CONSTRUCTION_TOKEN_FIXTURES.length)
    await confirmBurn(page)

    await expect(page.getByRole('heading', {name: 'Results'})).toBeVisible({timeout: 15_000})
    await expect(page.getByText(/Flushed 2 tokens/)).toBeVisible()
    await expect(page.getByText(/1 failed/)).toBeVisible()

    const requests = await getRecordedRequests(page)
    const transfers = decodeAllBurnTransfers(requests)

    expect(transfers).toHaveLength(2)
    expect(transfers.map(t => t.contract.toLowerCase())).toEqual([
      CONSTRUCTION_TOKEN_ALPHA.address.toLowerCase(),
      CONSTRUCTION_TOKEN_GAMMA.address.toLowerCase(),
    ])
  })

  test('a rejected signature is recorded as failed rather than left stuck', async ({page}) => {
    await installSyntheticWallet(page, {rejectSendTransactionTo: [DISPOSABLE_TOKEN.address]})
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN]})
    await page.goto('/flush')

    await selectToken(page, DISPOSABLE_TOKEN)
    await continueToConfirm(page)
    await acknowledgeAndTypeConfirmation(page, 1)
    await confirmBurn(page)

    await expect(page.getByRole('heading', {name: 'Results'})).toBeVisible({timeout: 15_000})
    await expect(page.getByText(/Flushed 0 tokens/)).toBeVisible()
    await expect(page.getByText(/1 failed/)).toBeVisible()
    await expect(page.getByText(/rejected/i).first()).toBeVisible()
  })
})

test.describe('in-progress states', () => {
  test('per-token simulating and awaiting-approval states are observable', async ({page}) => {
    await installSyntheticWallet(page, {delays: {eth_sendTransaction: 500}})
    await installNetworkStubs(page, {tokens: [DISPOSABLE_TOKEN], delays: {eth_call: 500}})
    await page.goto('/flush')

    await selectToken(page, DISPOSABLE_TOKEN)
    await continueToConfirm(page)
    await acknowledgeAndTypeConfirmation(page, 1)
    await confirmBurn(page)

    await expect(page.getByText('Checking transfer safety...')).toBeVisible()
    await expect(page.getByText('Waiting for wallet confirmation...')).toBeVisible()
  })
})

test.describe('displayed versus signed', () => {
  test('the displayed amount, reconciled through fixture decimals, equals the signed raw value', async ({page}) => {
    await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: [SIX_DECIMAL_TOKEN]})
    await page.goto('/flush')

    await selectToken(page, SIX_DECIMAL_TOKEN)
    await continueToConfirm(page)

    const amountText = await page
      .getByText(new RegExp(String.raw`^[0-9.]+\s+${SIX_DECIMAL_TOKEN.symbol}$`))
      .textContent()
    const displayedAmount = amountText?.split(/\s+/)[0]
    if (displayedAmount === undefined) {
      throw new Error('Could not read the displayed token amount from the confirm step')
    }

    const contractAddressText = await page.getByText(new RegExp(SIX_DECIMAL_TOKEN.address, 'i')).textContent()
    const destinationText = await page.getByText(/0x000000000000000000000000000000000000dEaD/i).textContent()

    await acknowledgeAndTypeConfirmation(page, 1)
    await confirmBurn(page)
    await expect(page.getByRole('heading', {name: 'Results'})).toBeVisible({timeout: 15_000})

    const requests = await getRecordedRequests(page)
    const transfers = decodeAllBurnTransfers(requests)
    expect(transfers).toHaveLength(1)
    const [transfer] = transfers

    // This proves the app did not corrupt the amount between display and
    // signature, and did not confuse this token's balance for another's. It
    // does not independently verify decimal handling against an external
    // source — the fixture is still the source of truth for `decimals`.
    expect(transfer.amount).toBe(parseUnits(displayedAmount, SIX_DECIMAL_TOKEN.decimals))
    expect(contractAddressText?.trim().toLowerCase()).toBe(transfer.contract.toLowerCase())
    expect(destinationText?.trim().toLowerCase()).toBe(transfer.recipient.toLowerCase())
  })
})

test.describe('mid-batch disconnect', () => {
  test('halts the batch: remaining tokens are neither attempted nor marked failed after a mid-batch disconnect', async ({
    page,
  }) => {
    const wallet = await installSyntheticWallet(page)
    await installNetworkStubs(page, {tokens: CONSTRUCTION_TOKEN_FIXTURES, delays: {eth_call: 1000}})
    await page.goto('/flush')

    for (const token of CONSTRUCTION_TOKEN_FIXTURES) {
      await selectToken(page, token)
    }
    await continueToConfirm(page)
    await acknowledgeAndTypeConfirmation(page, CONSTRUCTION_TOKEN_FIXTURES.length)
    await confirmBurn(page)

    await expect(page.getByRole('heading', {name: 'Disposing 2 of 3...'})).toBeVisible({timeout: 15_000})
    await disconnectWallet(page, wallet.address)

    // The flush page unmounts DisposalFlow entirely once disconnected (see
    // app/flush/page.tsx), returning to the pre-connect prompt rather than
    // cascading through the remaining tokens as independent failures. The
    // halt-banner rendering itself is covered directly in
    // components/web3/disposal-flow.test.tsx, which mounts DisposalFlow
    // without the page-level connect guard.
    await expect(page.getByRole('heading', {name: 'Connect your wallet'})).toBeVisible({timeout: 15_000})

    const requests = await getRecordedRequests(page)
    const transfers = decodeAllBurnTransfers(requests)

    expect(transfers).toHaveLength(1)
    expect(transfers[0].contract.toLowerCase()).toBe(CONSTRUCTION_TOKEN_ALPHA.address.toLowerCase())
    expect(transfers.some(t => t.contract.toLowerCase() === CONSTRUCTION_TOKEN_BETA.address.toLowerCase())).toBe(false)
    expect(transfers.some(t => t.contract.toLowerCase() === CONSTRUCTION_TOKEN_GAMMA.address.toLowerCase())).toBe(false)
  })
})
