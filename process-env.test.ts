import {readdirSync, readFileSync, statSync} from 'node:fs'
import {join, relative} from 'node:path'

import {describe, expect, it} from 'vitest'

const sourceDirectories = ['app', 'components', 'hooks', 'lib']
const allowedFiles = new Set(['env.ts'])

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

describe('environment access conventions', () => {
  it('keeps process.env access centralized in env.ts', () => {
    const offenders = sourceDirectories
      .flatMap(sourceFiles)
      .filter(file => !allowedFiles.has(relative('.', file)))
      .filter(file => readFileSync(file, 'utf8').includes('process.env'))

    expect(offenders).toEqual([])
  })
})
