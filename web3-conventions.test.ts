import {readdirSync, readFileSync, statSync} from 'node:fs'
import {join} from 'node:path'

import {describe, expect, it} from 'vitest'

const hookPattern =
  /\b(?:useAccount|useChainId|useDisconnect|useSwitchChain|useConnect|useConnections|useSwitchAccount|useAppKit)\s*\(/u

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap(entry => {
    const path = join(directory, entry)
    const stat = statSync(path)

    if (stat.isDirectory()) {
      return sourceFiles(path)
    }

    if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry) || /\.stories\.tsx?$/.test(entry)) {
      return []
    }

    return [path]
  })
}

describe('Web3 integration conventions', () => {
  it('keeps direct Wagmi and AppKit hook usage out of components', () => {
    const offenders = sourceFiles('components').filter(file => hookPattern.test(readFileSync(file, 'utf8')))

    expect(offenders).toEqual([])
  })
})
