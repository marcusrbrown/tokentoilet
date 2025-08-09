'use client'

import {Web3Provider} from '@/components/web3/web3-provider'
import {ThemeProvider as NextThemesProvider} from 'next-themes'
import {type ReactNode} from 'react'

export function Providers({children}: {children: ReactNode}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={true}>
      <Web3Provider>{children}</Web3Provider>
    </NextThemesProvider>
  )
}
