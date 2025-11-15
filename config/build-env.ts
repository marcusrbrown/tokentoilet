import {env, isCI, isProduction} from 'std-env'
import {z} from 'zod'
import {validateBuildEnv} from '../lib/env'
import {zTruthyStringToBoolean} from '../lib/z'

const schema = {
  /**
   * The path to the tsconfig.json file
   */
  NEXT_BUILD_ENV_TSCONFIG: z
    .string()
    .endsWith('.json')
    .default('tsconfig.json')
    .describe('The path to the tsconfig.json file'),

  /**
   * Generate source maps
   */
  NEXT_BUILD_ENV_SOURCEMAPS: zTruthyStringToBoolean(isProduction).describe('Generate source maps'),

  /**
   * Perform type checking as a build step
   */
  NEXT_BUILD_ENV_TYPECHECK: zTruthyStringToBoolean(!isCI).describe('Perform type checking as a build step'),

  /**
   * Enable the Content Security Policy
   */
  NEXT_BUILD_ENV_CSP: zTruthyStringToBoolean(true).describe('Enable the Content Security Policy'),

  /**
   * The build environment is CI
   */
  NEXT_BUILD_ENV_CI: zTruthyStringToBoolean(isCI).describe('The build environment is CI'),

  /**
   * Specify the output mode
   */
  NEXT_BUILD_ENV_OUTPUT: z.enum(['classic', 'standalone']).default('classic').describe('Specify the output mode'),

  /**
   * The build ID
   */
  NEXT_BUILD_ENV_BUILD_ID: z
    .string()
    .default(isProduction ? new Date().toISOString().replaceAll(':', '_') : '')
    .describe('The build ID'),

  /**
   * The build phase
   */
  NEXT_BUILD_ENV_PHASE: z
    .string()
    .default(env.NEXT_BUILD_ENV_PHASE ?? '')
    .describe('The build phase'),

  /**
   * Enable bundle analysis for webpack bundle size inspection
   */
  NEXT_BUILD_ENV_ANALYZE: zTruthyStringToBoolean(false).describe('Enable bundle analysis'),

  /**
   * Disable telemetry
   */
  NEXT_TELEMETRY_DISABLED: zTruthyStringToBoolean(isCI).describe('Disable Next.js telemetry'),
} satisfies Record<`NEXT_BUILD_ENV_${string}` | 'NEXT_TELEMETRY_DISABLED', z.ZodType>

export const buildEnvSchema = z.object(schema)

export const buildEnv = validateBuildEnv(buildEnvSchema)
