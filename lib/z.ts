import {consola} from 'consola'
import {colors} from 'consola/utils'
import {isTest, process} from 'std-env'
import {z} from 'zod'

export const truthyStringValues = ['1', 'true', 'yes', 'on', 'enabled'] as const

interface Dict<T> {
  [key: string]: T | undefined
}

/**
 * A truthy string ('1', 'true', 'yes', 'on', 'enabled') converted to a boolean
 */
export const zTruthyStringToBoolean = (defaultValue = false) =>
  z
    .string()
    .default(defaultValue.toString())
    .transform(value =>
      value === undefined ? defaultValue : truthyStringValues.includes(value as (typeof truthyStringValues)[number]),
    )

/**
 * Display parsing errors and either exit the process or throw an error
 */
export const zExitOrThrow = (safeParseError: z.ZodSafeParseError<Dict<string>>): never => {
  if (!isTest) {
    consola.fatal('Invalid env:', Object.keys(safeParseError.error.flatten().fieldErrors).join(', '))
    consola.error(JSON.stringify(safeParseError.error.format(), null, 2))
    process?.exit?.(1)
  }
  throw new Error(`Invalid env: ${JSON.stringify(safeParseError.error.format(), null, 2)}`)
}

/**
 * Print the validated env to the console
 */
export const zPrintEnv = (
  section: 'Build env' | 'Runtime env',
  safeParseSuccess: z.ZodSafeParseSuccess<Dict<string>>,
) => {
  if (!isTest) {
    consola.box({
      title: `${colors.bold(section)} (validated)`,
      message: Object.entries(safeParseSuccess.data)
        .map(([key, value]) => `${colors.green(key)}=${colors.yellow(value ?? '')}`)
        .join('\n'),
    })
  }
}
