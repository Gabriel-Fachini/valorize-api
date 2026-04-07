/* eslint-disable no-console */
/**
 * Global Test Setup
 * Runs once before all tests
 *
 * Responsibilities:
 * - Load test environment variables (.env.test)
 * - Configure logger to silent mode during tests
 * - Prepare safe defaults for Supabase-based auth tests
 * - Avoid accidental live integration usage by default
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { beforeAll, afterAll } from 'vitest'
import { disconnectDB } from '@/lib/database'

/**
 * Load .env.test configuration
 * This should run first before anything else
 * Use override: true to ensure test variables take precedence
 */
const envPath = resolve(__dirname, '../../.env.test')
const result = config({ path: envPath, override: true })

if (result.error && !process.env.DATABASE_URL) {
  console.warn(`⚠️  Could not load .env.test from ${envPath}`)
  console.warn('Make sure the file exists or DATABASE_URL is set')
}

process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'ERROR'
process.env.SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET ?? process.env.JWT_SECRET ?? 'test-supabase-jwt-secret'
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:8000'
process.env.ENABLE_SUPABASE_INTEGRATION_TESTS =
  process.env.ENABLE_SUPABASE_INTEGRATION_TESTS ?? 'false'

/**
 * Verify test environment is configured correctly
 */
function verifyTestEnvironment() {
  const requiredVars = [
    'DATABASE_URL',
    'NODE_ENV',
    'SUPABASE_URL',
    'SUPABASE_JWT_SECRET',
  ]
  const missing = requiredVars.filter(v => !process.env[v])

  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`)
  }

  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  NODE_ENV is not set to "test"')
  }

  if (!process.env.DATABASE_URL?.includes('test')) {
    console.warn('⚠️  DATABASE_URL does not contain "test" - are you using the test database?')
  }

  if (process.env.ENABLE_SUPABASE_INTEGRATION_TESTS === 'true') {
    const requiredSupabaseVars = [
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]
    const missingSupabaseVars = requiredSupabaseVars.filter(v => !process.env[v])

    if (missingSupabaseVars.length > 0) {
      console.warn(
        `⚠️  Supabase integration tests enabled but variables are missing: ${missingSupabaseVars.join(', ')}`,
      )
    }
  }
}

/**
 * Configure logger to silent mode during tests
 * This prevents test output from being polluted with logs
 */
function configureTestLogger() {
  const oldWarn = console.warn
  const oldError = console.error

  globalThis.console = {
    ...globalThis.console,
    log: () => {},
    info: () => {},
    debug: () => {},
    warn: oldWarn,
    error: oldError,
  } as typeof console
}

/**
 * Global test hooks
 */
beforeAll(() => {
  verifyTestEnvironment()
  configureTestLogger()

  console.warn('🧪 Test environment initialized')
  console.warn(`📦 DATABASE_URL: ${process.env.DATABASE_URL}`)
  console.warn(`🔒 NODE_ENV: ${process.env.NODE_ENV}`)
  console.warn(`🔐 SUPABASE_URL: ${process.env.SUPABASE_URL}`)
  console.warn(
    `🧷 SUPABASE integration tests: ${process.env.ENABLE_SUPABASE_INTEGRATION_TESTS}`,
  )
})

afterAll(async () => {
  await disconnectDB().catch(() => undefined)
  console.warn('✅ Test suite completed')
})

/**
 * Global error handling for unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
