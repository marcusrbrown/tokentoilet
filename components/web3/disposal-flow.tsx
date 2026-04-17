'use client'

import type {Address} from 'viem'
import {AlertCircle, CheckCircle, Clock} from 'lucide-react'
import {useEffect, useMemo, useRef, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {useTokenDiscovery} from '@/hooks/use-token-discovery'
import {useTokenDisposal} from '@/hooks/use-token-disposal'
import {useUnwantedTokens} from '@/hooks/use-token-filtering'
import {DEFAULT_SUPPORTED_NETWORK_V1} from '@/lib/web3/chains'
import type {CategorizedToken} from '@/lib/web3/token-filtering'
import {TokenList} from './token-list'
import {TransactionQueue} from './transaction-queue'

type Step = 'select' | 'confirm' | 'dispose' | 'results'
interface DisposalResult {
  address: Address
  success: boolean
  name: string
  symbol: string
  error?: string
}

/**
 * Keyed child component that owns its own useTokenDisposal instance.
 * When the parent changes the key (token address), React remounts this
 * component with fresh hook state, avoiding stale isSuccess/error from
 * the previous token's transaction.
 */
function DisposalExecutor({
  token,
  onComplete,
}: {
  token: CategorizedToken
  onComplete: (result: DisposalResult) => void
}) {
  const {dispose, isPending, isSuccess, error} = useTokenDisposal(token)
  const hasTriggeredRef = useRef(false)
  const hasReportedRef = useRef(false)

  useEffect(() => {
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()
    }
  }, [dispose])

  useEffect(() => {
    if (hasTriggeredRef.current && !hasReportedRef.current && (isSuccess || error != null)) {
      hasReportedRef.current = true
      onComplete({
        address: token.address,
        success: isSuccess && error == null,
        name: token.name,
        symbol: token.symbol,
        error: error?.message,
      })
    }
  }, [isSuccess, error, token.address, token.name, token.symbol, onComplete])

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        {isPending && <Clock className="h-5 w-5 text-yellow-500 animate-spin" />}
        {isSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
        {error != null && <AlertCircle className="h-5 w-5 text-red-500" />}
        {!isPending && !isSuccess && error == null && <Clock className="h-5 w-5 text-gray-400" />}
        <span className="font-medium">{token.name}</span>
      </div>
      {error != null && <p className="text-sm text-red-500 ml-8">{error.message}</p>}
    </Card>
  )
}

export function DisposalFlow() {
  const [step, setStep] = useState<Step>('select')
  const [selectedAddresses, setSelectedAddresses] = useState<Address[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<DisposalResult[]>([])

  const {tokens: discoveredTokens} = useTokenDiscovery({enabled: true})
  const {tokens: unwantedTokens} = useUnwantedTokens(discoveredTokens)

  const selectedTokens = useMemo(
    () => unwantedTokens.filter(t => selectedAddresses.includes(t.address)),
    [unwantedTokens, selectedAddresses],
  )

  const currentToken = selectedTokens[currentIndex] as CategorizedToken | undefined

  const dummyToken: CategorizedToken = useMemo(
    () =>
      unwantedTokens[0] ?? {
        address: '0x0000000000000000000000000000000000000000' as Address,
        chainId: DEFAULT_SUPPORTED_NETWORK_V1.id,
        symbol: '',
        name: '',
        decimals: 18,
        balance: BigInt(0),
        formattedBalance: '0',
        category: 'unwanted' as const,
      },
    [unwantedTokens],
  )

  const handleSelectionChange = (addresses: Address[]) => {
    setSelectedAddresses(addresses)
  }

  const startDisposal = () => {
    setCurrentIndex(0)
    setResults([])
    setStep('dispose')
  }

  const handleDisposalComplete = (result: DisposalResult) => {
    setResults(prev => [...prev, result])

    if (currentIndex < selectedTokens.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setStep('results')
    }
  }

  if (step === 'select') {
    const isOverLimit = selectedAddresses.length > 10
    const isValid = selectedAddresses.length > 0 && !isOverLimit

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Select Tokens for Disposal</h2>
        <TokenList selectedTokens={selectedAddresses} onTokenSelectionChange={handleSelectionChange} />
        <div className="flex items-center justify-between">
          <div className="text-sm">{isOverLimit && <span className="text-red-500">Maximum 10 tokens</span>}</div>
          <Button disabled={!isValid} onClick={() => setStep('confirm')}>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Confirm Disposal</h2>
        <Card variant="web3" className="p-4">
          <h3 className="font-semibold mb-4">Tokens to be burned:</h3>
          <ul className="space-y-3">
            {selectedTokens.map(token => (
              <li key={token.address} className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-medium">{token.name}</span>
                <span className="text-gray-600">
                  {token.formattedBalance} {token.symbol}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={() => setStep('select')}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={startDisposal}>
            Confirm Burn
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'dispose') {
    const tokenToDispose = currentToken ?? dummyToken

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">
            Disposing {currentIndex + 1} of {selectedTokens.length}...
          </h2>
          <p className="text-gray-500 text-sm mt-1">Please confirm the transactions in your wallet.</p>
        </div>

        <DisposalExecutor key={tokenToDispose.address} token={tokenToDispose} onComplete={handleDisposalComplete} />

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Transaction Status</h3>
          <TransactionQueue />
        </div>
      </div>
    )
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.length - successCount

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Results</h2>
        <p className="text-gray-700">
          Flushed {successCount} tokens.
          {failCount > 0 && <span className="text-red-500 ml-1">{failCount} failed.</span>}
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {results.map(result => (
            <li key={result.address} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.name} ({result.symbol})
                </span>
              </div>
              {!result.success && result.error != null && result.error !== '' && (
                <span className="text-xs text-red-500 max-w-xs truncate" title={result.error}>
                  {result.error}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Transaction Links</h3>
        <TransactionQueue />
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={() => {
            setSelectedAddresses([])
            setStep('select')
          }}
        >
          Flush More
        </Button>
      </div>
    </div>
  )
}
