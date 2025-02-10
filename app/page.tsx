import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      {/* Hero Section */}
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          The Token Toilet
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          A hygienic solution for fecal tokens
        </p>

        {/* Toilet Illustration */}
        <div className="relative mx-auto mb-8 h-64 w-64">
          <Image
            src="/toilet.svg"
            alt="Token Toilet Illustration"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Main CTA */}
        <div className="mb-8 space-y-4">
          <p className="text-lg text-gray-700">
            Pesky airdrops taking over your wallet? Is that DAO token balance still triggering your PTSD?
            We have the solution!
          </p>
          <button
            className="rounded-lg bg-yellow-400 px-8 py-3 text-lg font-semibold text-gray-900 shadow-sm hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Dump Some Tokens
          </button>
        </div>

        {/* Info Link */}
        <Link
          href="#info"
          className="inline-block text-sm font-medium text-gray-600 underline hover:text-gray-900"
        >
          Wait, what?
        </Link>
      </div>

      {/* Plumbing Illustration */}
      <div className="mt-12 w-full max-w-4xl">
        <div className="relative h-32">
          <Image
            src="/plumbing.svg"
            alt="Token Plumbing System"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </main>
  )
}
