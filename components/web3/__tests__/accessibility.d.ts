// Type declarations for vitest-axe matchers
// This ensures TypeScript recognizes toHaveNoViolations matcher

import type {AxeMatchers} from 'vitest-axe/matchers'

import 'vitest'

declare module 'vitest' {
  export interface Assertion<T = unknown> extends AxeMatchers {}
  export interface AsymmetricMatchersContaining<T = unknown> extends AxeMatchers {}
}
