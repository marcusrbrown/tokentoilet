'use client'

import type {ReactNode} from 'react'
import {ThemeProvider as NextThemesProvider} from 'next-themes'
import {AppToaster} from '@/components/ui/toast'
import {Web3Provider} from '@/components/web3/web3-provider'

export function Providers({children}: {children: ReactNode}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={true}>
      <Web3Provider>
        {children}
        <AppToaster />
      </Web3Provider>
    </NextThemesProvider>
  )
}
