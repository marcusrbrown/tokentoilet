import {expect, test} from '@playwright/test'
import {
  createEphemeralAddress,
  getRecordedRequests,
  guardZeroBalance,
  installSyntheticWallet,
  invokeProviderRequest,
  timeProviderRequest,
} from './wallet-provider'

test.describe('synthetic wallet provider', () => {
  test('app auto-connects and displays the account with no modal interaction', async ({page}) => {
    const wallet = await installSyntheticWallet(page)
    await page.goto('/')

    const expectedAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    await expect(page.getByRole('button', {name: expectedAddress})).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    const requests = await getRecordedRequests(page)
    expect(requests.some(request => request.method === 'eth_accounts')).toBe(true)
  })

  test('app reports Sepolia', async ({page}) => {
    await installSyntheticWallet(page)
    await page.goto('/')

    await expect(page.getByText('Sepolia', {exact: true})).toBeVisible()
  })

  test('a configured delay observably slows a request', async ({page}) => {
    await installSyntheticWallet(page, {delays: {eth_chainId: 300}})
    await page.goto('/')

    const elapsed = await timeProviderRequest(page, 'eth_chainId')
    expect(elapsed).toBeGreaterThanOrEqual(300)
  })

  test('an unhandled RPC method rejects instead of returning undefined', async ({page}) => {
    await installSyntheticWallet(page)
    await page.goto('/')

    await expect(invokeProviderRequest(page, 'personal_sign', ['0xdeadbeef'])).rejects.toThrow(/Unsupported RPC method/)
  })

  test('eth_sendTransaction records the request and returns a stub hash without broadcasting', async ({page}) => {
    await installSyntheticWallet(page)
    await page.goto('/')

    const hash = await invokeProviderRequest(page, 'eth_sendTransaction', [
      {to: '0x0000000000000000000000000000000000dEaD'},
    ])
    expect(hash).toMatch(/^0x[0-9a-f]{64}$/)

    const requests = await getRecordedRequests(page)
    expect(requests.some(request => request.method === 'eth_sendTransaction')).toBe(true)
  })
})

test.describe('createEphemeralAddress', () => {
  test('derives a different address on every call — no key is persisted between runs', () => {
    const first = createEphemeralAddress()
    const second = createEphemeralAddress()
    expect(first).not.toBe(second)
    expect(first).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })
})

test.describe('guardZeroBalance', () => {
  test('resolves zero status when the balance is confirmed zero', async () => {
    const address = createEphemeralAddress()
    const result = await guardZeroBalance(address, async () => 0n)
    expect(result).toEqual({status: 'zero'})
  })

  test('aborts with a clear message when the balance is nonzero', async () => {
    const address = createEphemeralAddress()
    await expect(guardZeroBalance(address, async () => 1n)).rejects.toThrow(/nonzero Sepolia balance/)
  })

  test('reports unverifiable rather than silently passing when the balance cannot be fetched', async () => {
    const address = createEphemeralAddress()
    const result = await guardZeroBalance(address, async () => {
      throw new Error('network unreachable')
    })
    expect(result).toEqual({status: 'unverifiable', reason: 'network unreachable'})
  })
})
