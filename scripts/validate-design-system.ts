#!/usr/bin/env tsx

import {readdir, stat} from 'node:fs/promises'
import {join} from 'node:path'
import {consola} from 'consola'

interface ValidationResult {
  passed: boolean
  message: string
  details?: string[]
}

interface ComponentValidation {
  component: string
  hasImplementation: boolean
  hasTest: boolean
  hasStory: boolean
  errors: string[]
}

const DESIGN_SYSTEM_PATHS = {
  components: 'components/ui',
  tokens: 'lib/design-tokens',
  docs: 'docs/design-system',
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

async function getComponentFiles(directory: string): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(directory, {withFileTypes: true})

  for (const entry of entries) {
    if (
      entry.isFile() &&
      entry.name.endsWith('.tsx') &&
      !entry.name.includes('.test.') &&
      !entry.name.includes('.stories.')
    ) {
      files.push(entry.name.replace('.tsx', ''))
    }
  }

  return files
}

async function validateComponentCompleteness(): Promise<ValidationResult> {
  const componentsPath = join(process.cwd(), DESIGN_SYSTEM_PATHS.components)
  const components = await getComponentFiles(componentsPath)
  const validations: ComponentValidation[] = []

  for (const component of components) {
    const basePath = join(componentsPath, component)
    const hasImplementation = await fileExists(`${basePath}.tsx`)
    const hasTest = await fileExists(`${basePath}.test.tsx`)
    const hasStory = await fileExists(`${basePath}.stories.tsx`)

    const errors: string[] = []
    if (!hasTest) {
      errors.push(`Missing test file: ${component}.test.tsx`)
    }
    if (!hasStory) {
      errors.push(`Missing story file: ${component}.stories.tsx`)
    }

    validations.push({
      component,
      hasImplementation,
      hasTest,
      hasStory,
      errors,
    })
  }

  const incompleteComponents = validations.filter(v => v.errors.length > 0)
  const passed = incompleteComponents.length === 0

  return {
    passed,
    message: passed
      ? `✓ All ${components.length} components have required files (implementation, test, story)`
      : `✗ ${incompleteComponents.length} of ${components.length} components are missing required files`,
    details: incompleteComponents.flatMap(v => v.errors),
  }
}

async function validateDesignTokens(): Promise<ValidationResult> {
  const tokensPath = join(process.cwd(), DESIGN_SYSTEM_PATHS.tokens)
  const requiredTokenFiles = ['colors.ts', 'spacing.ts', 'typography.ts', 'shadows.ts', 'animations.ts', 'index.ts']

  const missingFiles: string[] = []
  for (const file of requiredTokenFiles) {
    const filePath = join(tokensPath, file)
    if (!(await fileExists(filePath))) {
      missingFiles.push(file)
    }
  }

  const passed = missingFiles.length === 0

  return {
    passed,
    message: passed
      ? `✓ All ${requiredTokenFiles.length} design token files present`
      : `✗ ${missingFiles.length} design token files missing`,
    details: missingFiles.map(f => `Missing token file: ${f}`),
  }
}

async function validateDocumentation(): Promise<ValidationResult> {
  const docsPath = join(process.cwd(), DESIGN_SYSTEM_PATHS.docs)
  const requiredDocs = [
    'getting-started.md',
    'components.md',
    'design-tokens.md',
    'accessibility.md',
    'migration-guide.md',
  ]

  const missingDocs: string[] = []
  for (const doc of requiredDocs) {
    const docPath = join(docsPath, doc)
    if (!(await fileExists(docPath))) {
      missingDocs.push(doc)
    }
  }

  const passed = missingDocs.length === 0

  return {
    passed,
    message: passed
      ? `✓ All ${requiredDocs.length} required documentation files present`
      : `✗ ${missingDocs.length} documentation files missing`,
    details: missingDocs.map(d => `Missing documentation: ${d}`),
  }
}

async function validateStorybookConfiguration(): Promise<ValidationResult> {
  const storybookPath = join(process.cwd(), '.storybook')
  const requiredFiles = [
    {name: 'main', extensions: ['.ts', '.js']},
    {name: 'preview', extensions: ['.ts', '.tsx', '.js']},
  ]

  const missingFiles: string[] = []
  for (const file of requiredFiles) {
    let found = false
    for (const ext of file.extensions) {
      const filePath = join(storybookPath, `${file.name}${ext}`)
      if (await fileExists(filePath)) {
        found = true
        break
      }
    }
    if (!found) {
      missingFiles.push(`${file.name}.{${file.extensions.join(',')}}`)
    }
  }

  const passed = missingFiles.length === 0

  return {
    passed,
    message: passed
      ? '✓ Storybook configuration complete'
      : `✗ ${missingFiles.length} Storybook configuration files missing`,
    details: missingFiles.map(f => `Missing Storybook file: ${f}`),
  }
}

async function runValidation(): Promise<void> {
  consola.box('Design System Validation')
  consola.info('Validating Token Toilet Design System...\n')

  const validations = [
    {name: 'Component Completeness', fn: validateComponentCompleteness},
    {name: 'Design Tokens', fn: validateDesignTokens},
    {name: 'Documentation', fn: validateDocumentation},
    {name: 'Storybook Configuration', fn: validateStorybookConfiguration},
  ]

  const results: {name: string; result: ValidationResult}[] = []
  let allPassed = true

  for (const validation of validations) {
    consola.start(validation.name)
    const result = await validation.fn()
    results.push({name: validation.name, result})

    if (result.passed) {
      consola.success(result.message)
    } else {
      consola.error(result.message)
      allPassed = false

      if (result.details && result.details.length > 0) {
        for (const detail of result.details) {
          consola.warn(`  ${detail}`)
        }
      }
    }
    consola.log('')
  }

  // Summary
  consola.box('Validation Summary')
  const passedCount = results.filter(r => r.result.passed).length
  const totalCount = results.length

  if (allPassed) {
    consola.success(`✓ All ${totalCount} validation checks passed`)
    consola.info('\nDesign system is properly configured and complete.')
    process.exit(0)
  } else {
    consola.error(`✗ ${totalCount - passedCount} of ${totalCount} validation checks failed`)
    consola.info('\nPlease address the issues above before proceeding.')
    process.exit(1)
  }
}

// Run validation
runValidation().catch(error => {
  consola.error('Validation script failed:', error)
  process.exit(1)
})
