import type {NextConfig} from 'next'
import type {Configuration} from 'webpack'
import path from 'node:path'
import url from 'node:url'
import createBundleAnalyzer from '@next/bundle-analyzer'
import {PHASE_PRODUCTION_BUILD} from 'next/constants.js'
import {env} from 'std-env'
import {buildEnv} from './config/build-env'

const workspaceRoot = path.dirname(url.fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: buildEnv.NEXT_BUILD_ENV_SOURCEMAPS,

  // @link https://nextjs.org/docs/pages/api-reference/next-config-js/httpAgentOptions
  httpAgentOptions: {
    // ⚠️ keepAlive might introduce memory-leaks for long-running servers (ie: on docker)
    keepAlive: true,
  },

  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: (buildEnv.NEXT_BUILD_ENV_CI ? 3600 : 25) * 1000,
  },

  // Standalone build
  // @link https://nextjs.org/docs/advanced-features/output-file-tracing#automatically-copying-traced-files-experimental
  ...(buildEnv.NEXT_BUILD_ENV_OUTPUT === 'standalone' ? {output: 'standalone', outputFileTracing: true} : {}),

  experimental: {
    // @link https://nextjs.org/docs/advanced-features/output-file-tracing#caveats
    ...(buildEnv.NEXT_BUILD_ENV_OUTPUT === 'standalone' ? {outputFileTracingRoot: workspaceRoot} : {}),

    serverSourceMaps: buildEnv.NEXT_BUILD_ENV_SOURCEMAPS,

    // Prefer loading of ES Modules over CommonJS
    esmExternals: true,
  },

  typescript: {
    ignoreBuildErrors: !buildEnv.NEXT_BUILD_ENV_TYPECHECK,
    tsconfigPath: buildEnv.NEXT_BUILD_ENV_TSCONFIG,
  },

  webpack: (config: Configuration) => {
    // Ignore react-native async-storage import from MetaMask SDK (web-only app)
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      }
    }
    return config
  },
}

/**
 * Bundle analyzer configuration for webpack bundle size analysis.
 * Enable with NEXT_BUILD_ENV_ANALYZE=true to generate analysis reports.
 * Reports are output to .next/analyze/ directory (client.html, nodejs.html, edge.html).
 *
 * @see https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer
 */
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: buildEnv.NEXT_BUILD_ENV_ANALYZE,
  openAnalyzer: false,
})

export default async (phase: string) => {
  env.NEXT_BUILD_ENV_PHASE = phase

  if (phase === PHASE_PRODUCTION_BUILD) {
    // Load the env module to ensure it's validated. We have to use tsx because Next.js doesn't support ESM in next.config.ts
    const {tsImport} = await import('tsx/esm/api')
    await tsImport('./env.ts', import.meta.url)
  }

  return withBundleAnalyzer(nextConfig)
}
