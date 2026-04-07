/**
 * Database Test Helpers
 *
 * Provides utilities for test database isolation and cleanup.
 *
 * Important:
 * The application uses a shared Prisma singleton, so route/service tests
 * cannot rely on interactive transaction rollback for isolation.
 * The helpers below use deterministic cleanup instead.
 *
 * Because cleanup truncates public tables, tests using this helper are not
 * safe to run in parallel across files against the same database. Use a
 * serialized Vitest run for DB-backed suites until the project adopts
 * per-worker schemas/databases.
 */

import { connectDB, disconnectDB, prisma } from '@lib/database'

interface PublicTable {
  tablename: string
}

/**
 * Ensure Prisma is connected before using database-backed tests.
 */
export async function ensureDatabaseConnection(): Promise<void> {
  await connectDB()
}

/**
 * Disconnect Prisma after database-backed tests.
 */
export async function disconnectTestDatabase(): Promise<void> {
  await disconnectDB()
}

/**
 * Execute a test function with cleanup before and after the test body.
 *
 * This is slower than a true transaction rollback, but it works correctly
 * with the current Prisma singleton architecture used by the app.
 * Run suites that use this helper with `vitest --no-file-parallelism`.
 *
 * @example
 * it('should update wallet', async () => {
 *   await withDatabaseIsolation(async () => {
 *     const wallet = await WalletFactory.create()
 *     await walletService.credit(wallet.id, 100)
 *     expect(wallet.balance).toBe(100)
 *     // Database is cleaned after the test
 *   })
 * })
 */
export async function withDatabaseIsolation<T>(
  testFn: () => Promise<T>,
): Promise<T> {
  await ensureDatabaseConnection()
  await cleanDatabase()

  try {
    return await testFn()
  } finally {
    await cleanDatabase()
  }
}

/**
 * Backwards-compatible alias for the old helper name.
 */
export async function withTransaction<T>(
  testFn: () => Promise<T>,
): Promise<T> {
  return withDatabaseIsolation(testFn)
}

/**
 * Clean all application tables in the test database.
 */
export async function cleanDatabase(): Promise<void> {
  await ensureDatabaseConnection()

  const tables = await prisma.$queryRaw<PublicTable[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
  `

  if (tables.length === 0) {
    return
  }

  const tableList = tables
    .map(({ tablename }) => `"public"."${tablename}"`)
    .join(', ')

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`,
  )
}

/**
 * Truncate a specific table
 *
 * @param tableName - Name of the table to truncate
 * @example
 * await truncateTable('users')
 */
export async function truncateTable(tableName: string) {
  await ensureDatabaseConnection()
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE`)
}

/**
 * Get current row count for a table
 *
 * Useful for asserting data was created/deleted
 *
 * @example
 * const count = await getTableCount('users')
 * expect(count).toBe(1)
 */
export async function getTableCount(tableName: string): Promise<number> {
  await ensureDatabaseConnection()
  const result = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM "${tableName}"`,
  )
  return Number(result[0].count)
}

/**
 * Check if a record exists by ID
 *
 * @param tableName - Table name
 * @param id - Record ID
 */
export async function recordExists(
  tableName: string,
  id: string,
): Promise<boolean> {
  await ensureDatabaseConnection()
  const result = await prisma.$queryRawUnsafe<[{ exists: boolean }]>(
    `SELECT EXISTS(SELECT 1 FROM "${tableName}" WHERE id = $1) as exists`,
    id,
  )
  return result[0].exists
}

/**
 * Get the time since database server started
 *
 * Useful for testing time-based features
 *
 * @example
 * const time = await getDatabaseNow()
 * // Use this instead of new Date() for consistency
 */
export async function getDatabaseNow(): Promise<Date> {
  await ensureDatabaseConnection()
  const result = await prisma.$queryRawUnsafe<[{ now: Date }]>(
    'SELECT NOW() as now',
  )
  return result[0].now
}
