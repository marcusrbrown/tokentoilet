#!/usr/bin/env tsx
/**
 * Fails if any module under app/, components/, hooks/, or lib/ imports from e2e/.
 * The e2e suite is a separate test harness and must never be reachable from application code.
 */

import type {Dirent} from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import consola from 'consola'

const APP_SOURCE_DIRS = ['app', 'components', 'hooks', 'lib']
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])
const IMPORT_SPECIFIER_PATTERN = /(?:\bimport\s|\bfrom\s|\brequire\()\s*['"]([^'"]+)['"]/g

interface Violation {
  file: string
  specifier: string
}

async function collectSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  let entries: Dirent[]
  try {
    entries = await fs.readdir(dir, {withFileTypes: true})
  } catch {
    return files
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(entryPath)))
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(entryPath)
    }
  }

  return files
}

function referencesE2eDir(specifier: string): boolean {
  return specifier === 'e2e' || specifier.startsWith('e2e/') || /(?:^|\/)e2e\//.test(specifier)
}

async function findViolations(): Promise<Violation[]> {
  const violations: Violation[] = []

  for (const dir of APP_SOURCE_DIRS) {
    const files = await collectSourceFiles(dir)

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')

      for (const match of content.matchAll(IMPORT_SPECIFIER_PATTERN)) {
        const specifier = match[1]
        if (specifier && referencesE2eDir(specifier)) {
          violations.push({file, specifier})
        }
      }
    }
  }

  return violations
}

async function main(): Promise<void> {
  consola.start('Checking that application code does not import from e2e/...')

  const violations = await findViolations()

  if (violations.length > 0) {
    consola.error(`Found ${violations.length} import(s) of e2e/ from application code:`)
    for (const violation of violations) {
      consola.log(`  - ${violation.file}: '${violation.specifier}'`)
    }
    process.exit(1)
  }

  consola.success('No application code imports from e2e/')
}

main().catch(error => {
  consola.error('Boundary check failed:', error)
  process.exit(1)
})
