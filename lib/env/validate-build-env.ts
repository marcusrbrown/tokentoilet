import type {z} from 'zod'
import {env} from 'std-env'
import {zExitOrThrow, zPrintEnv} from '../z'

export function validateBuildEnv<T extends z.ZodType>(
  schema: T,
  options: {env?: Record<string, string | undefined>} = {},
): z.infer<T> {
  const result = schema.safeParse(options.env ?? env)
  if (result.success) {
    // zPrintEnv expects a parsed env shaped as a string-keyed record; the safeParse
    // result may have a more specific output type, so cast through unknown to the
    // expected Record<string, string> shape for printing.
    zPrintEnv('Build env', result as z.ZodSafeParseSuccess<Record<string, string>>)
    return result.data
  }
  zExitOrThrow(result as z.ZodSafeParseError<Record<string, string>>)

  // zExitOrThrow is expected to terminate execution (throw or exit).
  // Make the unreachable path explicit for TypeScript by throwing.
  throw new Error('validateBuildEnv: unreachable - zExitOrThrow did not exit')
}
