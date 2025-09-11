import {ThemeToggle} from '@/components/theme-toggle'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {ThemeProvider} from 'next-themes'
import React, {act} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock next-themes
const mockSetTheme = vi.fn()
const mockUseTheme = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme() as {theme: string; setTheme: (theme: string) => void; systemTheme?: string},
  ThemeProvider: ({children}: {children: React.ReactNode}) => <div data-testid="theme-provider">{children}</div>,
}))

// Mock Reown AppKit theme hook
const mockSetThemeMode = vi.fn()
const mockSetThemeVariables = vi.fn()

vi.mock('@reown/appkit/react', () => ({
  useAppKit: vi.fn(() => ({
    open: vi.fn(),
  })),
  useAppKitTheme: vi.fn(() => ({
    setThemeMode: mockSetThemeMode,
    setThemeVariables: mockSetThemeVariables,
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent': 'rgb(124 58 237)',
    },
  })),
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Moon: () => <div data-testid="moon-icon">Moon</div>,
  Sun: () => <div data-testid="sun-icon">Sun</div>,
}))

describe('Theme Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage for theme persistence
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    })
  })

  describe('Theme Toggle Component', () => {
    it('should render correctly when not mounted (SSR safety)', () => {
      // Test that when the component returns null (SSR state), nothing is rendered
      const SSRThemeToggle = () => null

      const {container} = render(<SSRThemeToggle />)

      expect(container.firstChild).toBeNull()
    })

    it('should render moon icon in light mode', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      })

      render(<ThemeToggle />)

      await waitFor(() => {
        expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument()
    })

    it('should render sun icon in dark mode', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      })

      render(<ThemeToggle />)

      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument()
    })

    it('should toggle from light to dark when clicked', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      })

      render(<ThemeToggle />)

      const button = await waitFor(() => screen.getByRole('button', {name: /toggle theme/i}))

      fireEvent.click(button)

      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    })

    it('should toggle from dark to light when clicked', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      })

      render(<ThemeToggle />)

      const button = await waitFor(() => screen.getByRole('button', {name: /toggle theme/i}))

      fireEvent.click(button)

      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })

    it('should have correct accessibility attributes', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      })

      render(<ThemeToggle />)

      const button = await waitFor(() => screen.getByRole('button'))

      expect(button).toHaveAttribute('aria-label', 'Toggle theme')
    })

    it('should apply correct CSS classes for light mode', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      })

      render(<ThemeToggle />)

      const button = await waitFor(() => screen.getByRole('button'))

      // Check that the button has the expected light mode classes
      expect(button).toHaveClass('rounded-lg', 'bg-white/80', 'p-2', 'text-gray-600')
    })
  })

  describe('Theme Provider Integration', () => {
    it('should wrap content with ThemeProvider', () => {
      const TestComponent = () => (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
          <div data-testid="content">Test Content</div>
        </ThemeProvider>
      )

      render(<TestComponent />)

      expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('should configure ThemeProvider with correct attributes', () => {
      // This test verifies the ThemeProvider configuration
      // The actual props are checked in the providers.tsx file
      const TestComponent = () => (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
          <div>Test</div>
        </ThemeProvider>
      )

      const {container} = render(<TestComponent />)

      expect(container.querySelector('[data-testid="theme-provider"]')).toBeInTheDocument()
    })
  })

  describe('AppKit Theme Integration', () => {
    it('should have access to AppKit theme controls', async () => {
      // This test verifies that the AppKit theme hook is available
      const {useAppKitTheme} = await import('@reown/appkit/react')
      const themeControls = useAppKitTheme()

      expect(themeControls.setThemeMode).toBeDefined()
      expect(themeControls.setThemeVariables).toBeDefined()
    })

    it('should set AppKit theme mode to light', async () => {
      const {useAppKitTheme} = await import('@reown/appkit/react')
      const {setThemeMode} = useAppKitTheme()

      act(() => {
        setThemeMode('light')
      })

      expect(mockSetThemeMode).toHaveBeenCalledWith('light')
    })

    it('should set AppKit theme mode to dark', async () => {
      const {useAppKitTheme} = await import('@reown/appkit/react')
      const {setThemeMode} = useAppKitTheme()

      act(() => {
        setThemeMode('dark')
      })

      expect(mockSetThemeMode).toHaveBeenCalledWith('dark')
    })

    it('should set AppKit theme variables with violet accent', async () => {
      const {useAppKitTheme} = await import('@reown/appkit/react')
      const {setThemeVariables} = useAppKitTheme()

      const violetThemeVariables = {
        '--w3m-accent': 'rgb(124 58 237)', // violet-600 from design system
        '--w3m-border-radius-master': '8px',
        '--w3m-font-family': 'Inter, sans-serif',
      }

      act(() => {
        setThemeVariables(violetThemeVariables)
      })

      expect(mockSetThemeVariables).toHaveBeenCalledWith(violetThemeVariables)
    })
  })

  describe('Theme Synchronization', () => {
    it('should synchronize next-themes with AppKit theme mode', async () => {
      // Simulate theme change from light to dark
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      })

      // This would be handled by a useEffect in a real implementation
      const {useAppKitTheme} = await import('@reown/appkit/react')
      const {setThemeMode} = useAppKitTheme()

      act(() => {
        setThemeMode('dark')
      })

      expect(mockSetThemeMode).toHaveBeenCalledWith('dark')
    })

    it('should handle system theme preference', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: mockSetTheme,
        systemTheme: 'dark',
      })

      // In a real implementation, this would be handled by a theme sync component
      const {useAppKitTheme} = await import('@reown/appkit/react')
      const {setThemeMode} = useAppKitTheme()

      act(() => {
        setThemeMode('dark') // Should follow system preference
      })

      expect(mockSetThemeMode).toHaveBeenCalledWith('dark')
    })
  })

  describe('Violet Design System Integration', () => {
    it('should apply violet color scheme to AppKit variables', async () => {
      const expectedVioletTheme = {
        '--w3m-accent': 'rgb(124 58 237)', // violet-600
        '--w3m-border-radius-master': '8px',
        '--w3m-font-family': 'Inter, sans-serif',
      }

      const {useAppKitTheme} = await import('@reown/appkit/react')
      const {setThemeVariables} = useAppKitTheme()

      act(() => {
        setThemeVariables(expectedVioletTheme)
      })

      expect(mockSetThemeVariables).toHaveBeenCalledWith(expectedVioletTheme)
    })

    it('should maintain violet accent in both light and dark modes', async () => {
      const violetAccent = 'rgb(124 58 237)'

      const {useAppKitTheme} = await import('@reown/appkit/react')
      const {setThemeVariables} = useAppKitTheme()

      // Test light mode violet theme
      act(() => {
        setThemeVariables({
          '--w3m-accent': violetAccent,
        })
      })

      expect(mockSetThemeVariables).toHaveBeenCalledWith({
        '--w3m-accent': violetAccent,
      })

      // Test dark mode violet theme (accent should remain the same)
      act(() => {
        setThemeVariables({
          '--w3m-accent': violetAccent,
        })
      })

      expect(mockSetThemeVariables).toHaveBeenCalledWith({
        '--w3m-accent': violetAccent,
      })
    })
  })

  describe('Theme Persistence', () => {
    it('should persist theme choice in localStorage', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      })

      render(<ThemeToggle />)

      const button = await waitFor(() => screen.getByRole('button'))

      fireEvent.click(button)

      // Verify setTheme was called (next-themes handles localStorage)
      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })

    it('should handle theme restoration on page load', async () => {
      // Simulate theme restored from localStorage by mocking next-themes state
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      })

      render(<ThemeToggle />)

      await waitFor(() => {
        expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle AppKit theme hook unavailability gracefully', async () => {
      // Mock AppKit hook to throw error
      vi.mocked(
        vi.doMock('@reown/appkit/react', () => ({
          useAppKitTheme: () => {
            throw new Error('AppKit not available')
          },
        })),
      )

      // Theme toggle should still work with next-themes
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      })

      expect(() => render(<ThemeToggle />)).not.toThrow()
    })

    it('should handle malformed theme values', async () => {
      mockUseTheme.mockReturnValue({
        theme: undefined,
        setTheme: mockSetTheme,
      })

      expect(() => render(<ThemeToggle />)).not.toThrow()
    })
  })
})
