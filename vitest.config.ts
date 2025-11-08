import {resolve} from 'node:path'
import {isCI} from 'std-env'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Mitigate CI EPIPE errors by using forks pool which is more stable
    pool: 'forks',
    // Reduce workers in CI to prevent resource exhaustion and EPIPE errors
    maxWorkers: isCI ? 3 : undefined,
    // Increase timeout for CI environment (worker pool communication can be slower)
    testTimeout: isCI ? 30000 : 10000,
    // Increase hook timeout for CI
    hookTimeout: isCI ? 15000 : 10000,
    // Pass Node.js arguments to worker processes for better memory management
    execArgv: isCI ? ['--max-old-space-size=4096'] : [],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/coverage/**',
        '**/*.config.{ts,js}',
        '**/vitest.setup.ts',
        '**/env.ts',
      ],
      thresholds: {
        lines: 59.5,
        functions: 55,
        branches: 60,
        statements: 59,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
