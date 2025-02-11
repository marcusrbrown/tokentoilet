'use client'

import {ThemeProvider as NextThemesProvider} from 'next-themes'
import {type ReactNode} from 'react'

export function Providers({children}: {children: ReactNode}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={true}>
      {children}
    </NextThemesProvider>
  )
}
