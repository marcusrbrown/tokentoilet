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

  images: {
    remotePatterns: [
      {protocol: 'https', hostname: 'assets.coingecko.com'},
      {protocol: 'https', hostname: 'raw.githubusercontent.com'},
      {protocol: 'https', hostname: 'ipfs.io'},
      {protocol: 'https', hostname: '*.ipfs.dweb.link'},
      {protocol: 'https', hostname: 'cloudflare-ipfs.com'},
    ],
  },

  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://*.alchemy.com https://*.infura.io https://api.coingecko.com https://*.reown.com wss://*.reown.com https://api.web3modal.org https://*.web3modal.com",
            "frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org",
            "worker-src 'self' blob:",
          ].join('; '),
        },
        {key: 'X-Content-Type-Options', value: 'nosniff'},
        {key: 'X-Frame-Options', value: 'DENY'},
        {key: 'X-XSS-Protection', value: '1; mode=block'},
        {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
      ],
    },
  ],

  turbopack: {
    resolveAlias: {
      pino: 'pino/browser',
      'thread-stream': path.join(workspaceRoot, 'config/stubs/empty-module.ts'),
      'sonic-boom': path.join(workspaceRoot, 'config/stubs/empty-module.ts'),
    },
  },

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
        pino: 'pino/browser',
        'thread-stream': path.join(workspaceRoot, 'config/stubs/empty-module.ts'),
        'sonic-boom': path.join(workspaceRoot, 'config/stubs/empty-module.ts'),
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
