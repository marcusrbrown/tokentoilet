'use client'

import {Button} from '@/components/ui/button'
import {Moon, Sun} from 'lucide-react'
import {useTheme} from 'next-themes'
import {useEffect, useState} from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const {theme, setTheme} = useTheme()

  // Prevents hydration mismatch: Next.js SSR requires mount detection before rendering theme UI
  useEffect(() => {
    // Defer the state update to avoid calling setState synchronously inside the effect,
    // which can cause cascading renders and performance issues.
    const id = setTimeout(() => {
      setMounted(true)
    }, 0)
    return () => clearTimeout(id)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      variant="secondary"
      size="icon"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
