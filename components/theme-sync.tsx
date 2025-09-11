'use client'

import {useAppKitTheme} from '@reown/appkit/react'
import {useTheme} from 'next-themes'
import {useEffect} from 'react'

/**
 * ThemeSync component handles synchronization between next-themes and Reown AppKit theming.
 * This ensures the AppKit modal matches the application's current theme mode.
 */
export function ThemeSync() {
  const {theme, systemTheme} = useTheme()
  const {setThemeMode, setThemeVariables} = useAppKitTheme()

  useEffect(() => {
    // Determine the effective theme (resolve 'system' to actual preference)
    const effectiveTheme = theme === 'system' ? systemTheme : theme

    // Sync AppKit theme mode with next-themes
    if (effectiveTheme === 'dark' || effectiveTheme === 'light') {
      setThemeMode(effectiveTheme)
    }

    // Apply violet design system variables
    setThemeVariables({
      '--w3m-font-family': 'Inter, sans-serif',
      '--w3m-accent': 'rgb(124 58 237)', // violet-600 from design system
      '--w3m-border-radius-master': '8px',
    })
  }, [theme, systemTheme, setThemeMode, setThemeVariables])

  // This component doesn't render anything, it only handles theme synchronization
  return null
}
