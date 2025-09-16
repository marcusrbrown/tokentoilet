import {env} from 'std-env'

// Although used by many tools, production phases are internal and not documented in nextjs.
// So we're left with one option, specifying via an env variable (not a build-env cause they validate at build time)
// and we want to keep something that works at build (ie docker) and runtime.
// @see confirmed by Lee Robinson - https://github.com/vercel/next.js/issues/37269#issuecomment-1608579557
export const isProductionPhaseBuild = env.NEXTJS_PRODUCTION_PHASE === 'build'
