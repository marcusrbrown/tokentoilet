import {Droplets, Flame, Wallet} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {ThemeToggle} from '@/components/theme-toggle'
import {WalletButton} from '@/components/web3/wallet-button'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navbar/Wallet Area */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 px-6 py-4 backdrop-blur-md dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-8 w-8 text-violet-600" />
            <span className="text-xl font-bold">Token Toilet</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      </nav>

      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started by editing&nbsp;
          <code className="font-mono font-bold">app/page.tsx</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By <Image src="/vercel.svg" alt="Vercel Logo" className="dark:invert" width={100} height={24} priority />
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="animate-pulse-slow absolute -left-4 top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"></div>
          <div className="animate-pulse-slow absolute right-20 top-40 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center">
          <h1 className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
            Flush Away Your
            <br />
            Unwanted Tokens
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            A revolutionary DeFi protocol that helps you dispose of unwanted tokens while contributing to charitable
            causes. Clean up your wallet with purpose.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button className="group relative overflow-hidden rounded-lg bg-violet-600 px-8 py-3 text-lg font-semibold text-white transition-all hover:bg-violet-700">
              <span className="relative z-10">Start Flushing</span>
              <div className="absolute inset-0 -translate-y-full bg-gradient-to-b from-violet-400 to-violet-600 transition-transform duration-300 group-hover:translate-y-0"></div>
            </button>
            <button className="rounded-lg border border-gray-300 bg-white/80 px-8 py-3 text-lg font-semibold text-gray-700 backdrop-blur-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl bg-white/80 p-6 backdrop-blur-sm transition-all hover:scale-105 dark:bg-gray-800/80">
              <div className="mb-4 rounded-lg bg-violet-100 p-3 dark:bg-violet-900/30">
                <Droplets className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Easy Disposal</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Simple one-click process to dispose of any ERC20 tokens
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl bg-white/80 p-6 backdrop-blur-sm transition-all hover:scale-105 dark:bg-gray-800/80">
              <div className="mb-4 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Charitable Impact</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your disposals contribute to meaningful charitable causes
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl bg-white/80 p-6 backdrop-blur-sm transition-all hover:scale-105 dark:bg-gray-800/80">
              <div className="mb-4 rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                <Flame className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Gas Efficient</h3>
              <p className="text-gray-600 dark:text-gray-400">Optimized contracts for minimal gas consumption</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 rounded-2xl bg-white/80 p-8 backdrop-blur-sm dark:bg-gray-800/80 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">$1.2M+</div>
              <div className="mt-2 text-gray-600 dark:text-gray-400">Total Value Flushed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">12,345</div>
              <div className="mt-2 text-gray-600 dark:text-gray-400">Successful Flushes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">$50K+</div>
              <div className="mt-2 text-gray-600 dark:text-gray-400">Donated to Charity</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 py-12 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Droplets className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-semibold">© 2025 Token Toilet</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">
                About
              </Link>
              <Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">
                Terms
              </Link>
              <Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">
                Privacy
              </Link>
              <Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">
                Docs
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
