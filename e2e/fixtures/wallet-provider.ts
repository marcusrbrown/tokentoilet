import type {Page} from '@playwright/test'
import type {Address} from 'viem'
import {Buffer} from 'node:buffer'
import {randomUUID} from 'node:crypto'
import {createPublicClient, http} from 'viem'
import {generatePrivateKey, privateKeyToAccount} from 'viem/accounts'
import {sepolia} from 'viem/chains'

export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'

const WALLET_NAME = 'Token Toilet E2E Wallet'
const WALLET_RDNS = 'dev.tokentoilet.e2e-wallet'
const WALLET_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="6" fill="#7c3aed"/></svg>'
const WALLET_ICON_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(WALLET_ICON_SVG).toString('base64')}`

export interface RecordedRequest {
  readonly method: string
  readonly params: unknown
  readonly timestamp: number
  readonly result?: unknown
}

export interface WalletProviderOptions {
  readonly delays?: Readonly<Record<string, number>>
  /** Contract addresses whose `eth_sendTransaction` is rejected, as by a declined wallet signature. */
  readonly rejectSendTransactionTo?: readonly Address[]
}

export type BalanceGuardResult = {readonly status: 'zero'} | {readonly status: 'unverifiable'; readonly reason: string}

export interface SyntheticWallet {
  readonly address: Address
  readonly balanceGuard: BalanceGuardResult
}

interface BrowserWalletProvider {
  request: (args: {method: string; params?: unknown}) => Promise<unknown>
  on: () => void
  removeListener: () => void
}

interface E2EWalletWindow extends Window {
  __e2eWalletRequestLog?: RecordedRequest[]
  __e2eWalletDelays?: Record<string, number>
  __e2eWalletProvider?: BrowserWalletProvider
}

interface BrowserWalletConfig {
  readonly address: string
  readonly chainIdHex: string
  readonly delays: Record<string, number>
  readonly rejectSendTransactionTo: string[]
  readonly uuid: string
  readonly icon: string
  readonly rdns: string
  readonly name: string
}

/**
 * Generates a fresh Sepolia account in memory and returns only its address.
 * The private key never leaves this function: it is used once to derive the
 * address and then goes out of scope. There is no parameter or environment
 * variable that accepts a supplied key, and the key is never logged, stored,
 * or passed into the browser context.
 */
export function createEphemeralAddress(): Address {
  const privateKey = generatePrivateKey()
  return privateKeyToAccount(privateKey).address
}

async function fetchSepoliaBalance(address: Address): Promise<bigint> {
  const client = createPublicClient({chain: sepolia, transport: http()})
  return client.getBalance({address})
}

/**
 * Verifies the derived account holds no Sepolia balance before the run
 * proceeds. Fails closed: an affirmatively nonzero balance throws and aborts
 * the run. When the balance cannot be determined (no RPC reachable from the
 * test environment, rate limiting, etc.) the guard returns an `unverifiable`
 * result rather than silently treating the account as safe — callers must
 * surface that result.
 */
export async function guardZeroBalance(
  address: Address,
  fetchBalance: (address: Address) => Promise<bigint> = fetchSepoliaBalance,
): Promise<BalanceGuardResult> {
  let balance: bigint
  try {
    balance = await fetchBalance(address)
  } catch (error) {
    return {
      status: 'unverifiable',
      reason: error instanceof Error ? error.message : String(error),
    }
  }

  if (balance !== 0n) {
    throw new Error(
      `Synthetic wallet ${address} has a nonzero Sepolia balance (${balance.toString()} wei). Refusing to run — a funded ephemeral account means something is wrong.`,
    )
  }

  return {status: 'zero'}
}

/**
 * Runs inside the browser via `page.addInitScript`. Must be self-contained:
 * no closures over module state, only the serialized `config` argument.
 */
function browserInit(config: BrowserWalletConfig): void {
  const w = window as E2EWalletWindow
  w.__e2eWalletRequestLog = []
  w.__e2eWalletDelays = {...config.delays}

  // Nested deliberately: only this function's own source is sent to the
  // browser via addInitScript, so helpers must live inside it.
  // eslint-disable-next-line @typescript-eslint/promise-function-async, unicorn/consistent-function-scoping
  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // eslint-disable-next-line unicorn/consistent-function-scoping
  function randomHash(): string {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return `0x${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`
  }

  async function request(args: {method: string; params?: unknown}): Promise<unknown> {
    const log = w.__e2eWalletRequestLog
    const entry: {method: string; params: unknown; timestamp: number; result?: unknown} = {
      method: args.method,
      params: args.params ?? null,
      timestamp: Date.now(),
    }
    if (log) {
      log.push(entry)
    }

    const delays = w.__e2eWalletDelays
    const delay = delays ? delays[args.method] : undefined
    if (typeof delay === 'number' && delay > 0) {
      await sleep(delay)
    }

    switch (args.method) {
      case 'eth_accounts':
      case 'eth_requestAccounts': {
        const result = [config.address]
        entry.result = result
        return result
      }
      case 'eth_chainId': {
        entry.result = config.chainIdHex
        return config.chainIdHex
      }
      case 'eth_sendTransaction': {
        const params = args.params as {to?: string}[] | undefined
        const target = params?.[0]?.to
        const shouldReject =
          typeof target === 'string' &&
          config.rejectSendTransactionTo.some(address => address.toLowerCase() === target.toLowerCase())
        if (shouldReject) {
          const error = new Error('User rejected the transaction') as Error & {code: number}
          error.code = 4001
          throw error
        }
        const result = randomHash()
        entry.result = result
        return result
      }
      default: {
        const error = new Error(`Unsupported RPC method: ${args.method}`) as Error & {code: number}
        error.code = 4200
        throw error
      }
    }
  }

  const provider = {
    request,
    on(): void {},
    removeListener(): void {},
  }

  w.__e2eWalletProvider = provider

  const info = {
    uuid: config.uuid,
    name: config.name,
    icon: config.icon,
    rdns: config.rdns,
  }

  function announce(): void {
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {detail: Object.freeze({info, provider})}))
  }

  // Announce-once is never discovered by wagmi/AppKit even when delayed — the
  // listener below is mandatory, not an optimization.
  window.addEventListener('eip6963:requestProvider', announce)
  announce()
}

/**
 * Installs the synthetic EIP-6963 wallet into the page before any app script
 * runs. Generates a fresh ephemeral account, runs the zero-balance guard, and
 * registers the in-browser provider. Call before `page.goto`.
 */
export async function installSyntheticWallet(
  page: Page,
  options: WalletProviderOptions = {},
): Promise<SyntheticWallet> {
  const address = createEphemeralAddress()
  const balanceGuard = await guardZeroBalance(address)

  if (balanceGuard.status === 'unverifiable') {
    console.warn(
      `[e2e wallet] Could not verify the Sepolia balance for ${address}: ${balanceGuard.reason}. ` +
        'Proceeding without the zero-balance guarantee for this run.',
    )
  }

  await page.addInitScript(browserInit, {
    address,
    chainIdHex: SEPOLIA_CHAIN_ID_HEX,
    delays: {...options.delays},
    rejectSendTransactionTo: [...(options.rejectSendTransactionTo ?? [])],
    uuid: randomUUID(),
    icon: WALLET_ICON_DATA_URI,
    rdns: WALLET_RDNS,
    name: WALLET_NAME,
  })

  return {address, balanceGuard}
}

export async function getRecordedRequests(page: Page): Promise<RecordedRequest[]> {
  return page.evaluate(() => (window as E2EWalletWindow).__e2eWalletRequestLog ?? [])
}

/**
 * Invokes the installed provider's `request` directly, bypassing the
 * EIP-6963 handshake. Useful for asserting on provider behavior (delays,
 * rejections) without driving the app UI.
 */
export async function invokeProviderRequest(page: Page, method: string, params?: unknown): Promise<unknown> {
  return page.evaluate(
    async ({method, params}: {method: string; params?: unknown}) => {
      const provider = (window as E2EWalletWindow).__e2eWalletProvider
      if (!provider) {
        throw new Error('Synthetic wallet provider is not installed on this page')
      }
      return provider.request({method, params})
    },
    {method, params},
  )
}

/** Times a provider request from inside the browser to avoid IPC-round-trip noise. */
export async function timeProviderRequest(page: Page, method: string, params?: unknown): Promise<number> {
  return page.evaluate(
    async ({method, params}: {method: string; params?: unknown}) => {
      const provider = (window as E2EWalletWindow).__e2eWalletProvider
      if (!provider) {
        throw new Error('Synthetic wallet provider is not installed on this page')
      }
      const start = performance.now()
      await provider.request({method, params})
      return performance.now() - start
    },
    {method, params},
  )
}
