import type {Address} from 'viem'
import type {RecordedRequest} from '../fixtures/wallet-provider'
import {decodeFunctionData, erc20Abi} from 'viem'

interface SentTransactionParams {
  readonly from?: Address
  readonly to?: Address
  readonly data?: `0x${string}`
}

export interface DecodedBurnTransfer {
  readonly contract: Address
  readonly recipient: Address
  readonly amount: bigint
}

function firstParam(request: RecordedRequest): SentTransactionParams {
  const params = request.params
  if (!Array.isArray(params) || params.length === 0) {
    throw new Error(`eth_sendTransaction recorded with unexpected params: ${JSON.stringify(params)}`)
  }
  return params[0] as SentTransactionParams
}

/** Decodes a recorded `eth_sendTransaction` request as an ERC-20 `transfer` call. */
export function decodeBurnTransfer(request: RecordedRequest): DecodedBurnTransfer {
  if (request.method !== 'eth_sendTransaction') {
    throw new Error(`Expected an eth_sendTransaction request, got '${request.method}'`)
  }

  const {to, data} = firstParam(request)
  if (to === undefined) {
    throw new Error('eth_sendTransaction request has no `to` field')
  }
  if (data === undefined) {
    throw new Error('eth_sendTransaction request has no calldata')
  }

  const decoded = decodeFunctionData({abi: erc20Abi, data})
  if (decoded.functionName !== 'transfer') {
    throw new Error(`Expected an ERC-20 transfer call, got '${decoded.functionName}'`)
  }

  const [recipient, amount] = decoded.args
  return {contract: to, recipient, amount}
}

/** Decodes every recorded `eth_sendTransaction` request, in recording order. */
export function decodeAllBurnTransfers(requests: readonly RecordedRequest[]): DecodedBurnTransfer[] {
  return requests.filter(request => request.method === 'eth_sendTransaction').map(decodeBurnTransfer)
}
