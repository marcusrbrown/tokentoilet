import type {StorybookConfig} from '@storybook/nextjs'
import * as path from 'node:path'

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|mjs|ts|tsx)', '../app/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-links'],
  framework: {
    name: '@storybook/nextjs',
    options: {
      image: {
        loading: 'eager',
      },
      nextConfigPath: path.resolve(process.cwd(), 'next.config.js'),
    },
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop => (prop.parent ? !prop.parent.fileName.includes('node_modules') : true),
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
}

export default config
