import type {StorybookConfig} from '@storybook/nextjs'
import * as path from 'node:path'

const modulePath = path.dirname(new URL(import.meta.url).pathname)

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../app/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../lib/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {
      image: {
        loading: 'eager',
      },
      nextConfigPath: path.resolve(process.cwd(), 'next.config.ts'),
    },
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      // Enhanced prop filtering for design system components
      propFilter: prop => {
        if (!prop.parent) return true
        // Include design token and utility types
        if (prop.parent.fileName.includes('lib/design-tokens')) return true
        if (prop.parent.fileName.includes('lib/utils')) return true
        // Exclude node_modules except for specific design system packages
        return !prop.parent.fileName.includes('node_modules')
      },
      // Improve TypeScript compilation performance
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
      // Better handling of variant types from cva
      shouldRemoveUndefinedFromOptional: true,
    },
  },
  staticDirs: ['../public'],
  // Enable Next.js features
  features: {
    experimentalRSC: true,
  },
  docs: {
    defaultName: 'Documentation',
  },
  core: {
    disableTelemetry: true,
  },
  // Enhanced webpack configuration for design token support
  webpackFinal: async config => {
    // Ensure proper path resolution for design tokens and utilities
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(modulePath, '../'),
        '@/components': path.resolve(modulePath, '../components'),
        '@/lib': path.resolve(modulePath, '../lib'),
        '@/hooks': path.resolve(modulePath, '../hooks'),
        '@/app': path.resolve(modulePath, '../app'),
      }

      // Ensure TypeScript and design token files are processed correctly
      config.resolve.extensions = [...(config.resolve.extensions || []), '.ts', '.tsx', '.js', '.jsx']
    }

    // Ensure CSS modules and PostCSS are handled correctly for TailwindCSS v4
    // TailwindCSS v4 uses PostCSS automatically via @tailwindcss/postcss
    // Storybook with Next.js framework already handles CSS processing correctly

    return config
  },
}

export default config
