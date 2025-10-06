import {createEnv} from '@t3-oss/env-nextjs'
import {vercel} from '@t3-oss/env-nextjs/presets-zod'
import {PHASE_PRODUCTION_BUILD} from 'next/constants.js'
import {isCI, isTest} from 'std-env'
import {z} from 'zod'

const isPhaseProductionBuild = process.env.NEXT_BUILD_ENV_PHASE === PHASE_PRODUCTION_BUILD
const skipValidation =
  isPhaseProductionBuild ||
  isCI ||
  isTest ||
  (typeof process.env.SKIP_ENV_VALIDATION === 'string' && process.env.SKIP_ENV_VALIDATION.length > 0)

// Custom validation schemas for Web3 endpoints
const rpcUrlSchema = z
  .url('Must be a valid URL')
  .refine(url => url.startsWith('https://'), 'RPC endpoints must use HTTPS in production')

const walletConnectProjectIdSchema = z
  .string()
  .min(32, 'WalletConnect Project ID must be at least 32 characters')
  .regex(/^[a-f0-9]+$/, 'WalletConnect Project ID must be a valid hex string')

export const schemas = {
  // @keep-sorted
  client: {
    NEXT_PUBLIC_APP_URL: z.url('Must be a valid URL'),
    NEXT_PUBLIC_ARBITRUM_RPC_URL: rpcUrlSchema.optional(),
    NEXT_PUBLIC_ENABLE_ANALYTICS: z
      .string()
      .transform(val => val === 'true')
      .pipe(z.boolean())
      .default(true),
    NEXT_PUBLIC_ENABLE_TESTNETS: z
      .string()
      .transform(val => val === 'true')
      .pipe(z.boolean())
      .default(false),
    NEXT_PUBLIC_ETHEREUM_RPC_URL: rpcUrlSchema.optional(),
    NEXT_PUBLIC_POLYGON_RPC_URL: rpcUrlSchema.optional(),
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: walletConnectProjectIdSchema,
  },
  // @keep-sorted
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
}

export const env = createEnv({
  ...schemas,

  experimental__runtimeEnv: {
    // App URLs and Public Config
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,

    // Optional RPC endpoint overrides
    NEXT_PUBLIC_ETHEREUM_RPC_URL: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
    NEXT_PUBLIC_POLYGON_RPC_URL: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
    NEXT_PUBLIC_ARBITRUM_RPC_URL: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,

    // Feature flags
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_ENABLE_TESTNETS: process.env.NEXT_PUBLIC_ENABLE_TESTNETS,
  },

  skipValidation,
  extends: [vercel()],
})
