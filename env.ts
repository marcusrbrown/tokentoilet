import {createEnv} from '@t3-oss/env-nextjs'
import {vercel} from '@t3-oss/env-nextjs/presets-zod'
import {PHASE_PRODUCTION_BUILD} from 'next/constants.js'
import {isCI, isTest, env as stdEnv} from 'std-env'

const isPhaseProductionBuild = stdEnv.NEXT_BUILD_ENV_PHASE === PHASE_PRODUCTION_BUILD
const skipValidation =
  isPhaseProductionBuild ||
  isCI ||
  isTest ||
  (typeof stdEnv.SKIP_ENV_VALIDATION === 'string' && stdEnv.SKIP_ENV_VALIDATION.length > 0)

export const schemas = {
  // @keep-sorted
  server: {},
  // @keep-sorted
  client: {
    // NEXT_PUBLIC_APP_URL: z.string().url(),
  },
}

export const env = createEnv({
  ...schemas,

  experimental__runtimeEnv: {
    // App URLs and Public Config
    // NEXT_PUBLIC_APP_URL: stdEnv.NEXT_PUBLIC_APP_URL,
  },

  skipValidation,
  extends: [vercel()],
})
