import type {Preview} from '@storybook/react'
import {ThemeProvider} from 'next-themes'
import React from 'react'
import './storybook.css'

const preview: Preview = {
  parameters: {
    // Next.js App Router support
    nextjs: {
      appDirectory: true,
    },
    // Actions configuration
    actions: {argTypesRegex: '^on[A-Z].*'},
    // Controls configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Layout configuration
    layout: 'centered',
    // Backgrounds configuration for light/dark theme testing
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'violet-light',
          value: '#f5f3ff',
        },
        {
          name: 'violet-dark',
          value: '#2d1b69',
        },
      ],
    },
    // Viewport configuration for responsive design testing
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
    },
  },
  // Global decorators
  decorators: [
    // Theme provider decorator for dark/light mode support
    (StoryComponent, context) => {
      const theme = (context.globals.theme as string) || 'light'

      return React.createElement(
        ThemeProvider,
        {
          attribute: 'class',
          defaultTheme: 'light',
          enableSystem: false,
          forcedTheme: theme,
        },
        React.createElement(
          'div',
          {
            className: `min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 dark:from-slate-900 dark:to-violet-900 p-4`,
            'data-theme': theme,
          },
          React.createElement(StoryComponent),
        ),
      )
    },
    // Web3 mock decorator for Web3 components
    (StoryComponent, context) => {
      // Mock Web3 context for stories that need it
      const web3Params = context.parameters?.web3 as Record<string, unknown> | undefined
      const mockWeb3Context = {
        isConnected: Boolean(web3Params?.isConnected) || false,
        address: (web3Params?.address as string) || '0x1234567890123456789012345678901234567890',
        chainId: (web3Params?.chainId as number) || 1,
        isConnecting: Boolean(web3Params?.isConnecting) || false,
        error: (web3Params?.error as string) || null,
      }

      return React.createElement(
        'div',
        {'data-web3-mock': JSON.stringify(mockWeb3Context)},
        React.createElement(StoryComponent),
      )
    },
  ],
  // Global types for toolbar controls
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          {value: 'light', icon: 'sun', title: 'Light'},
          {value: 'dark', icon: 'moon', title: 'Dark'},
        ],
        dynamicTitle: true,
      },
    },
    web3State: {
      description: 'Mock Web3 connection state',
      defaultValue: 'disconnected',
      toolbar: {
        title: 'Web3 State',
        icon: 'link',
        items: [
          {value: 'disconnected', title: 'Disconnected'},
          {value: 'connected', title: 'Connected'},
          {value: 'connecting', title: 'Connecting'},
          {value: 'error', title: 'Error'},
        ],
        dynamicTitle: true,
      },
    },
  },
}

export default preview
