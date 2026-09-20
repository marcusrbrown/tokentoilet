'use client'

import type {Address} from 'viem'
import {AlertCircle, Check, CheckCircle, Clock, Copy} from 'lucide-react'
import {useEffect, useMemo, useRef, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {useTokenDiscovery} from '@/hooks/use-token-discovery'
import {BURN_ADDRESS, useTokenDisposal} from '@/hooks/use-token-disposal'
import {useUnwantedTokens} from '@/hooks/use-token-filtering'
import {DEFAULT_SUPPORTED_NETWORK_V1} from '@/lib/web3/chains'
import {TokenValueClass, type CategorizedToken} from '@/lib/web3/token-filtering'
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

const TYPED_CONFIRMATION_THRESHOLD_USD = 10

function requiresTypedConfirmation(token: CategorizedToken): boolean {
  return (
    token.estimatedValueUSD === undefined ||
    token.estimatedValueUSD >= TYPED_CONFIRMATION_THRESHOLD_USD ||
    token.valueClass === TokenValueClass.MEDIUM_VALUE ||
    token.valueClass === TokenValueClass.HIGH_VALUE
  )
}

function BurnConfirmation({
  tokens,
  onCancel,
  onConfirm,
}: {
  tokens: CategorizedToken[]
  onCancel: () => void
  onConfirm: () => void
}) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [typedConfirmation, setTypedConfirmation] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const requiresTyped = tokens.some(requiresTypedConfirmation)
  const expectedConfirmation = tokens.length === 1 ? 'BURN' : `BURN ${tokens.length} TOKENS`
  const isConfirmationValid = !requiresTyped || typedConfirmation === expectedConfirmation
  const canConfirm = acknowledged && isConfirmationValid

  const copyBurnAddress = () => {
    // Unavailable outside secure contexts; the address stays selectable either way.
    if (navigator.clipboard === undefined) {
      console.error('Failed to copy burn address: clipboard unavailable')
      return
    }

    navigator.clipboard
      .writeText(BURN_ADDRESS)
      .then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch(error => {
        console.error('Failed to copy burn address:', error)
      })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Confirm Disposal</h2>
        <p className="mt-1 text-sm text-foreground/70">Review the destination and every token before continuing.</p>
      </div>

      <section
        aria-labelledby="irreversible-burn-warning"
        role="alert"
        className="rounded-xl border border-error/30 bg-error/10 p-5"
      >
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
          <div className="space-y-2">
            <h3 id="irreversible-burn-warning" className="font-semibold text-foreground">
              This action is permanent
            </h3>
            <p className="text-sm leading-6 text-foreground/80">
              You are about to permanently transfer these tokens to a burn address. This cannot be undone. Token Toilet
              cannot recover burned tokens.
            </p>
          </div>
        </div>
      </section>

      <Card variant="solid" className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Destination burn address</p>
          <div className="mt-2 flex items-start gap-3 rounded-lg border border-border bg-background p-3">
            <code className="min-w-0 flex-1 break-all text-xs leading-5 text-foreground">{BURN_ADDRESS}</code>
            <Button
              variant="outline"
              size="sm"
              aria-label={isCopied ? 'Burn address copied' : 'Copy burn address'}
              onClick={copyBurnAddress}
              leftIcon={isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {isCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
        <p className="text-sm leading-6 text-foreground/70">
          Each token is a separate irreversible transaction. Your wallet will ask for approval once per token.
        </p>
      </Card>

      <section aria-labelledby="tokens-to-burn-heading" className="space-y-3">
        <div>
          <h3 id="tokens-to-burn-heading" className="font-semibold">
            Tokens to burn
          </h3>
          <p className="text-sm text-foreground/70">
            Check the contract address, balance, and estimated value for each token.
          </p>
        </div>
        <div className="space-y-3">
          {tokens.map(token => (
            <Card key={token.address} variant="web3" className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{token.name}</p>
                  <p className="text-sm text-foreground/65">{token.symbol}</p>
                </div>
                <p className="text-right font-mono text-sm">
                  {token.formattedBalance} {token.symbol}
                </p>
              </div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-foreground/60">Estimated value</dt>
                  <dd className="font-medium">
                    {token.estimatedValueUSD === undefined ? 'Value unknown' : `$${token.estimatedValueUSD.toFixed(2)}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground/60">Chain</dt>
                  <dd className="font-medium">
                    {token.chainId === DEFAULT_SUPPORTED_NETWORK_V1.id
                      ? DEFAULT_SUPPORTED_NETWORK_V1.name
                      : `Chain ${token.chainId}`}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-foreground/60">Contract address</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-foreground/80">{token.address}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      </section>

      <div className="rounded-lg border border-border bg-background p-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6" htmlFor="acknowledge-burn">
          <input
            id="acknowledge-burn"
            type="checkbox"
            checked={acknowledged}
            onChange={event => setAcknowledged(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-violet-600 focus:ring-2 focus:ring-violet-600 focus:ring-offset-2"
          />
          <span>I acknowledge that these tokens will be permanently burned and cannot be recovered.</span>
        </label>
      </div>

      {requiresTyped && (
        <Input
          label={`Type ${expectedConfirmation} to continue`}
          value={typedConfirmation}
          onChange={event => setTypedConfirmation(event.target.value)}
          placeholder={expectedConfirmation}
          autoComplete="off"
          spellCheck={false}
          helperText={`Required because at least one token has an unknown value or an estimated value of $${TYPED_CONFIRMATION_THRESHOLD_USD} or more.`}
        />
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" disabled={!canConfirm} onClick={onConfirm}>
          Confirm Burn
        </Button>
      </div>
    </div>
  )
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
  onGlobalFailure,
}: {
  token: CategorizedToken
  onComplete: (result: DisposalResult) => void
  onGlobalFailure: (message: string) => void
}) {
  const {dispose, isPending, isSuccess, isSimulating, canDispose, isSimulationEnabled, isGlobalFailure, error} =
    useTokenDisposal(token)
  const hasTriggeredRef = useRef(false)
  const hasReportedRef = useRef(false)

  useEffect(() => {
    if (hasTriggeredRef.current || hasReportedRef.current) return
    if (error != null || isSuccess || isPending || isSimulating) return
    // Normal path: simulation produced a safe request (canDispose).
    // Guard/invalid path: simulation disabled — call dispose() once to hit the hook's guards.
    if (canDispose || !isSimulationEnabled) {
      hasTriggeredRef.current = true
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()
    }
  }, [canDispose, dispose, error, isPending, isSimulating, isSuccess, isSimulationEnabled])

  useEffect(() => {
    // Report any terminal outcome (success or error), even when no write was
    // triggered — a failed preflight is a terminal result that must advance the
    // batch, otherwise a reverting token deadlocks the disposal flow. A global
    // failure (disconnect, unsupported network) halts the batch instead, since
    // it applies to every remaining token and not just this one.
    if (!hasReportedRef.current && (isSuccess || error != null)) {
      hasReportedRef.current = true
      if (error != null && isGlobalFailure) {
        onGlobalFailure(error.message)
        return
      }
      onComplete({
        address: token.address,
        success: isSuccess && error == null,
        name: token.name,
        symbol: token.symbol,
        error: error?.message,
      })
    }
  }, [isSuccess, error, isGlobalFailure, token.address, token.name, token.symbol, onComplete, onGlobalFailure])

  const status =
    error == null ? (isSuccess ? 'success' : isPending ? 'writing' : isSimulating ? 'simulating' : 'queued') : 'failed'

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        {status === 'simulating' && <Clock className="h-5 w-5 text-blue-500 animate-spin" />}
        {status === 'writing' && <Clock className="h-5 w-5 text-yellow-500 animate-spin" />}
        {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
        {status === 'failed' && <AlertCircle className="h-5 w-5 text-red-500" />}
        {status === 'queued' && <Clock className="h-5 w-5 text-gray-400" />}
        <span className="font-medium">{token.name}</span>
      </div>
      {status === 'simulating' && <p className="text-sm text-blue-500 ml-8">Checking transfer safety...</p>}
      {status === 'writing' && <p className="text-sm text-yellow-500 ml-8">Waiting for wallet confirmation...</p>}
      {error != null && <p className="text-sm text-red-500 ml-8">{error.message}</p>}
    </Card>
  )
}

export function DisposalFlow() {
  const [step, setStep] = useState<Step>('select')
  const [selectedAddresses, setSelectedAddresses] = useState<Address[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<DisposalResult[]>([])
  const [haltReason, setHaltReason] = useState<string | null>(null)

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
        address: '0x0000000000000000000000000000000000000000',
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
    setHaltReason(null)
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

  const handleGlobalFailure = (message: string) => {
    setHaltReason(message)
    setStep('results')
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
    return <BurnConfirmation tokens={selectedTokens} onCancel={() => setStep('select')} onConfirm={startDisposal} />
  }

  if (step === 'dispose') {
    const tokenToDispose = currentToken ?? dummyToken

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">
            Disposing {currentIndex + 1} of {selectedTokens.length}...
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Each token is checked before your wallet is prompted. Failed checks will be skipped.
          </p>
        </div>

        <DisposalExecutor
          key={tokenToDispose.address}
          token={tokenToDispose}
          onComplete={handleDisposalComplete}
          onGlobalFailure={handleGlobalFailure}
        />

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Transaction Status</h3>
          <TransactionQueue />
        </div>
      </div>
    )
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.length - successCount
  const unattemptedCount = selectedTokens.length - results.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Results</h2>
        <p className="text-gray-700">
          Flushed {successCount} tokens.
          {failCount > 0 && <span className="text-red-500 ml-1">{failCount} failed.</span>}
        </p>
      </div>

      {haltReason !== null && (
        <section role="alert" className="rounded-xl border border-error/30 bg-error/10 p-4">
          <p className="font-semibold text-foreground">Disposal halted: {haltReason}</p>
          {unattemptedCount > 0 && (
            <p className="mt-1 text-sm text-foreground/80">
              {unattemptedCount} token{unattemptedCount === 1 ? '' : 's'} not attempted.
            </p>
          )}
        </section>
      )}

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
            setHaltReason(null)
            setStep('select')
          }}
        >
          Flush More
        </Button>
      </div>
    </div>
  )
}
