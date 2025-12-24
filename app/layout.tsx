import type {Metadata} from 'next/types'

import {ErrorBoundary} from '@/components/error-boundary'

import {Inter} from 'next/font/google'
import {Providers} from './providers'
import './globals.css'

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
  title: 'Token Toilet - A Hygienic Solution for Fecal Tokens',
  description: 'Dispose of unwanted tokens while contributing to charitable causes',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full antialiased`}>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
