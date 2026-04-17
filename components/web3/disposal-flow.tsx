'use client'

import type {Address} from 'viem'
import {AlertCircle, CheckCircle, Clock} from 'lucide-react'
import React, {useEffect, useRef, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {useTokenDiscovery} from '@/hooks/use-token-discovery'
import {useTokenDisposal} from '@/hooks/use-token-disposal'
import {useUnwantedTokens} from '@/hooks/use-token-filtering'
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

export function DisposalFlow() {
  const [step, setStep] = useState<Step>('select')
  const [selectedAddresses, setSelectedAddresses] = useState<Address[]>([])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<DisposalResult[]>([])
  const hasTriggeredRef = useRef(false)

  const {tokens: discoveredTokens} = useTokenDiscovery({enabled: true})
  const {tokens: unwantedTokens} = useUnwantedTokens(discoveredTokens)

  const selectedTokens = unwantedTokens.filter(t => selectedAddresses.includes(t.address))

  // Hook for the current token being disposed
  const currentToken = selectedTokens[currentIndex] as CategorizedToken | undefined
  // We must pass a dummy token if undefined to satisfy hook rules (can't conditionally call hooks)
  const dummyToken = unwantedTokens[0] ?? {
    address: '0x0',
    chainId: 1,
    symbol: '',
    name: '',
    decimals: 18,
    balance: BigInt(0),
    formattedBalance: '0',
    category: 'unwanted',
  }
  const disposalToken = currentToken === undefined ? dummyToken : currentToken

  const {dispose, isPending, isSuccess, error} = useTokenDisposal(disposalToken)

  const handleSelectionChange = (addresses: Address[]) => {
    setSelectedAddresses(addresses)
  }

  const startDisposal = () => {
    setCurrentIndex(0)
    setResults([])
    setStep('dispose')
    hasTriggeredRef.current = false
  }

  useEffect(() => {
    if (step === 'dispose' && currentToken !== undefined) {
      if (!isPending && !isSuccess && !error && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        dispose()
      } else if ((isSuccess || error != null) && hasTriggeredRef.current) {
        // Record result
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setResults(prev => [
          ...prev,
          {
            address: currentToken.address,
            success: !error,
            name: currentToken.name,
            symbol: currentToken.symbol,
            error: error?.message,
          },
        ])

        // Move to next
        if (currentIndex < selectedTokens.length - 1) {
          hasTriggeredRef.current = false
          // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
          setCurrentIndex(prev => prev + 1)
        } else {
          // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
          setStep('results')
        }
      }
    }
  }, [step, currentIndex, currentToken, isPending, isSuccess, error, dispose, selectedTokens.length])

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
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">
            Disposing {currentIndex + 1} of {selectedTokens.length}...
          </h2>
          <p className="text-gray-500 text-sm mt-1">Please confirm the transactions in your wallet.</p>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            {isPending && <Clock className="h-5 w-5 text-yellow-500 animate-spin" />}
            {!isPending && !error && <Clock className="h-5 w-5 text-gray-400" />}
            {error != null && <AlertCircle className="h-5 w-5 text-red-500" />}
            <span className="font-medium">{currentToken?.name}</span>
          </div>
          {error != null && <p className="text-sm text-red-500 ml-8">{error.message}</p>}
        </Card>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Transaction Status</h3>
          <TransactionQueue />
        </div>
      </div>
    )
  }

  // Results Step
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
