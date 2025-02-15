import './globals.css'
import {Inter} from 'next/font/google'
import {type Metadata} from 'next/types'
import {Providers} from './providers'

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
      <body className={`${inter.className} min-h-full bg-sky-100 text-gray-900 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
