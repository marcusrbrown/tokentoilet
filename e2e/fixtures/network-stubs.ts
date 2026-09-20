import type {Page, Route} from '@playwright/test'
import type {Address} from 'viem'
import type {TokenFixture} from './tokens'

export type DiscoveryFailureMode = 'http-401' | 'http-403' | 'json-rpc-32600'
export type ReceiptStatus = 'success' | 'reverted'

export interface NetworkStubOptions {
  readonly tokens?: readonly TokenFixture[]
  readonly discoveryFailure?: DiscoveryFailureMode
  readonly receiptStatus?: ReceiptStatus
}

export interface NetworkStubHandle {
  setDiscoveryFailure: (mode: DiscoveryFailureMode | undefined) => void
  setReceiptStatus: (status: ReceiptStatus) => void
}

interface JsonRpcRequestBody {
  readonly jsonrpc: string
  readonly id: number | string
  readonly method: string
  readonly params: unknown[]
}

const ERC20_TRANSFER_SELECTOR = '0xa9059cbb'
const ERC20_TRANSFER_SUCCESS_RESULT = `0x${'0'.repeat(63)}1`
const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'
const RECEIPT_BLOCK_HASH = `0x${'a'.repeat(64)}`

/**
 * Alchemy's real auth-failure message bodies, per `ALCHEMY_AUTH_MESSAGES` in
 * `lib/web3/alchemy-token-api.ts`. Using an invented message would test a
 * shape the app never actually receives.
 */
const ALCHEMY_INVALID_KEY_MESSAGE = 'Invalid access key'

function jsonRpcResult(id: JsonRpcRequestBody['id'], result: unknown): {jsonrpc: '2.0'; id: unknown; result: unknown} {
  return {jsonrpc: '2.0', id, result}
}

function jsonRpcErrorBody(
  id: JsonRpcRequestBody['id'],
  code: number,
  message: string,
): {jsonrpc: '2.0'; id: unknown; error: {code: number; message: string}} {
  return {jsonrpc: '2.0', id, error: {code, message}}
}

function parseJsonRpcBody(route: Route): JsonRpcRequestBody | undefined {
  const request = route.request()
  if (request.method() !== 'POST') return undefined

  const postData = request.postData()
  if (postData === null || postData === '') return undefined

  try {
    const parsed: unknown = JSON.parse(postData)
    if (typeof parsed === 'object' && parsed !== null && 'method' in parsed && typeof parsed.method === 'string') {
      return parsed as JsonRpcRequestBody
    }
  } catch {
    return undefined
  }

  return undefined
}

function buildTokenBalancesResult(tokens: readonly TokenFixture[]): {
  tokenBalances: {contractAddress: Address; tokenBalance: string}[]
} {
  return {
    tokenBalances: tokens.map(token => ({
      contractAddress: token.address,
      tokenBalance: `0x${token.balance.toString(16)}`,
    })),
  }
}

function buildTokenMetadataResult(
  address: string,
  tokens: readonly TokenFixture[],
): {name: string | null; symbol: string | null; decimals: number | null; logo: string | null} {
  const token = tokens.find(candidate => candidate.address.toLowerCase() === address.toLowerCase())
  if (!token) {
    return {name: null, symbol: null, decimals: null, logo: null}
  }
  return {name: token.name, symbol: token.symbol, decimals: token.decimals, logo: null}
}

function buildReceiptResult(hash: string, status: ReceiptStatus): Record<string, unknown> {
  return {
    transactionHash: hash,
    transactionIndex: '0x0',
    blockHash: RECEIPT_BLOCK_HASH,
    blockNumber: '0x1',
    from: ZERO_ADDRESS,
    to: ZERO_ADDRESS,
    cumulativeGasUsed: '0x5208',
    gasUsed: '0x5208',
    contractAddress: null,
    logs: [],
    logsBloom: `0x${'0'.repeat(512)}`,
    status: status === 'success' ? '0x1' : '0x0',
    type: '0x2',
    effectiveGasPrice: '0x3b9aca00',
  }
}

async function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({status, contentType: 'application/json', body: JSON.stringify(body)})
}

async function respondToDiscoveryFailure(route: Route, id: JsonRpcRequestBody['id'], mode: DiscoveryFailureMode) {
  if (mode === 'http-401' || mode === 'http-403') {
    // No `.error.code`/`.error.message` in this body: viem's http transport
    // only treats a non-2xx response as a JSON-RPC error when the body has
    // that shape. Anything else on a non-2xx status throws `HttpRequestError`
    // with `.status` set, which is the wire shape `isAlchemyAuthError` checks
    // first.
    await fulfillJson(route, mode === 'http-401' ? 401 : 403, {message: 'Unauthorized'})
    return
  }
  // JSON-RPC -32600 error body over HTTP 200 — the shape viem surfaces with
  // no `.status`, per `isAlchemyAuthError` in lib/web3/alchemy-token-api.ts.
  await fulfillJson(route, 200, jsonRpcErrorBody(id, -32600, ALCHEMY_INVALID_KEY_MESSAGE))
}

/**
 * Installs a catch-all route that intercepts every request, parses any
 * JSON-RPC POST body, and dispatches on `body.method` rather than the
 * request host. Discovery (Alchemy) and receipts (the wagmi Sepolia
 * transport) resolve to different hosts depending on env configuration —
 * matching on method keeps the stub correct across that difference.
 *
 * Any JSON-RPC method this stub does not recognize fails closed with a
 * synthetic error instead of reaching a live network, so the suite never
 * depends on Alchemy or a live chain being reachable.
 */
export async function installNetworkStubs(page: Page, options: NetworkStubOptions = {}): Promise<NetworkStubHandle> {
  const tokens = options.tokens ?? []
  let discoveryFailure = options.discoveryFailure
  let receiptStatus: ReceiptStatus = options.receiptStatus ?? 'success'

  await page.route('**/*', async route => {
    let body: JsonRpcRequestBody | undefined
    try {
      body = parseJsonRpcBody(route)
    } catch (error) {
      console.error('[e2e network-stubs] failed to parse request body:', error)
      await route.continue()
      return
    }

    if (!body) {
      // Not a JSON-RPC POST. Let same-origin dev-server traffic (pages, HMR,
      // static chunks) through; abort everything else so the suite never
      // idles on unrelated third-party calls (wallet SDK telemetry, relay
      // origin checks) that this sandbox may not be able to reach quickly.
      const requestUrl = new URL(route.request().url())
      if (requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1') {
        await route.continue()
      } else {
        await route.abort('blockedbyclient')
      }
      return
    }

    try {
      await dispatch(route, body)
    } catch (error) {
      console.error(`[e2e network-stubs] handler for '${body.method}' threw:`, error)
      await route.abort('failed')
    }
  })

  async function dispatch(route: Route, body: JsonRpcRequestBody): Promise<void> {
    switch (body.method) {
      case 'alchemy_getTokenBalances': {
        if (discoveryFailure) {
          await respondToDiscoveryFailure(route, body.id, discoveryFailure)
          return
        }
        await fulfillJson(route, 200, jsonRpcResult(body.id, buildTokenBalancesResult(tokens)))
        return
      }
      case 'alchemy_getTokenMetadata': {
        const address = body.params[0]
        const result =
          typeof address === 'string'
            ? buildTokenMetadataResult(address, tokens)
            : {name: null, symbol: null, decimals: null, logo: null}
        await fulfillJson(route, 200, jsonRpcResult(body.id, result))
        return
      }
      case 'eth_call': {
        const callParams = body.params[0] as {data?: string} | undefined
        if (typeof callParams?.data === 'string' && callParams.data.startsWith(ERC20_TRANSFER_SELECTOR)) {
          await fulfillJson(route, 200, jsonRpcResult(body.id, ERC20_TRANSFER_SUCCESS_RESULT))
          return
        }
        await fulfillJson(route, 200, jsonRpcErrorBody(body.id, -32601, `E2E stub: unhandled eth_call data`))
        return
      }
      case 'eth_getTransactionReceipt': {
        const hash = body.params[0]
        if (typeof hash !== 'string') {
          await fulfillJson(route, 200, jsonRpcErrorBody(body.id, -32602, 'E2E stub: missing transaction hash'))
          return
        }
        await fulfillJson(route, 200, jsonRpcResult(body.id, buildReceiptResult(hash, receiptStatus)))
        return
      }
      case 'eth_chainId': {
        await fulfillJson(route, 200, jsonRpcResult(body.id, '0xaa36a7'))
        return
      }
      default: {
        await fulfillJson(
          route,
          200,
          jsonRpcErrorBody(body.id, -32601, `E2E stub: unhandled JSON-RPC method '${body.method}'`),
        )
      }
    }
  }

  return {
    setDiscoveryFailure(mode) {
      discoveryFailure = mode
    },
    setReceiptStatus(status) {
      receiptStatus = status
    },
  }
}
