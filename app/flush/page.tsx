'use client'

import {Droplets} from 'lucide-react'
import Link from 'next/link'
import {ThemeToggle} from '@/components/theme-toggle'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {DisposalFlow} from '@/components/web3/disposal-flow'
import {NetworkGuard} from '@/components/web3/network-guard'
import {WalletButton} from '@/components/web3/wallet-button'
import {useWallet} from '@/hooks/use-wallet'

export default function FlushPage() {
  const {isConnected, connect} = useWallet()

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="fixed top-0 z-50 w-full px-6 py-4">
        <Card variant="default" className="mx-auto max-w-7xl" padding="sm">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Droplets className="h-8 w-8 text-violet-600" />
              <span className="text-xl font-bold">Token Toilet</span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <WalletButton />
            </div>
          </div>
        </Card>
      </nav>

      <section className="relative pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-6">
          {isConnected ? (
            <NetworkGuard>
              <DisposalFlow />
            </NetworkGuard>
          ) : (
            <Card variant="default" padding="xl" className="text-center">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Connect your wallet</h2>
              <p className="mb-8 text-gray-600 dark:text-gray-400">
                You need to connect your wallet to start flushing unwanted tokens.
              </p>
              <Button
                size="lg"
                onClick={() => {
                  connect().catch((error: unknown) => {
                    console.error('Failed to connect:', error)
                  })
                }}
                className="w-full sm:w-auto"
              >
                Connect Wallet
              </Button>
            </Card>
          )}
        </div>
      </section>
    </main>
  )
}
