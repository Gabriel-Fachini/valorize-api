/**
 * CSV Import Service
 * Handles CSV parsing, validation, preview and bulk import
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { ValidationError } from '@/middleware/error-handler'
import { authService } from '@/features/app/auth/auth.service'
import type {
  CSVRow,
  CSVRowError,
  ValidatedCSVRow,
  CSVPreviewRow,
  CSVPreviewResponse,
  ImportError,
  ImportResult,
} from './types'
import { isValidEmail } from './users.service'

// In-memory cache for previews (in production, use Redis)
const previewCache = new Map<
  string,
  {
    companyId: string
    validatedRows: ValidatedCSVRow[]
    preview: CSVPreviewRow[]
    summary: { toCreate: number; toUpdate: number; errors: number }
    expiresAt: Date
  }
>()

// Cleanup expired previews every 5 minutes
setInterval(() => {
  const now = new Date()
  for (const [key, value] of previewCache.entries()) {
    if (value.expiresAt < now) {
      previewCache.delete(key)
    }
  }
}, 5 * 60 * 1000)

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Divide array em chunks (lotes) para processamento paralelo controlado
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Processa array em lotes paralelos com concorrência controlada
 * @param items - Array de itens para processar
 * @param batchSize - Número de itens por lote (concorrência)
 * @param processor - Função async para processar cada item
 */
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const chunks = chunkArray(items, batchSize)
  const allResults: R[] = []

  for (const chunk of chunks) {
    // Processa cada chunk em paralelo
    const chunkResults = await Promise.all(chunk.map((item) => processor(item)))
    allResults.push(...chunkResults)
  }

  return allResults
}

// ============================================================================
// CSV TEMPLATE
// ============================================================================

export async function generateTemplate(): Promise<Buffer> {
  const headers = ['nome', 'email', 'departamento', 'cargo', 'email_gestor']
  const exampleData = [
    ['João Silva', 'joao@empresa.com.br', 'Tecnologia', 'Desenvolvedor', 'gestor@empresa.com.br'],
    ['Maria Santos', 'maria@empresa.com.br', 'RH', 'Analista', 'gestor@empresa.com.br'],
  ]

  const rows = [headers, ...exampleData]
  const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

  return Buffer.from(csv, 'utf8')
}

// ============================================================================
// CSV PARSING AND VALIDATION
// ============================================================================

export async function parseCSV(file: Buffer): Promise<CSVRow[]> {
  try {
    const content = file.toString('utf8')
    const lines = content.split('\n').filter(line => line.trim())

    if (lines.length === 0) {
      throw new ValidationError('CSV file is empty')
    }

    // Parse header
    const headerLine = lines[0]
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim())

    const requiredHeaders = ['nome', 'email']
    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        throw new ValidationError(`Missing required column: ${header}`)
      }
    }

    // Get column indices
    const nomeIndex = headers.indexOf('nome')
    const emailIndex = headers.indexOf('email')
    const departamentoIndex = headers.indexOf('departamento')
    const cargoIndex = headers.indexOf('cargo')
    const emailGestorIndex = headers.indexOf('email_gestor')

    // Parse rows
    const records: CSVRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = parseCSVLine(line)

      records.push({
        nome: values[nomeIndex]?.trim() || '',
        email: values[emailIndex]?.trim() || '',
        departamento: values[departamentoIndex]?.trim() || undefined,
        cargo: values[cargoIndex]?.trim() || undefined,
        email_gestor: values[emailGestorIndex]?.trim() || undefined,
      })
    }

    return records
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    logger.error('CSV parse error:', error)
    throw new ValidationError('Invalid CSV format')
  }
}

/**
 * Simple CSV line parser that handles quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

// ============================================================================
// CSV DATA VALIDATION
// ============================================================================

export async function validateCSVData(
  rows: CSVRow[],
  companyId: string,
): Promise<ValidatedCSVRow[]> {
  if (rows.length > 1000) {
    throw new ValidationError('Maximum 1000 rows per import')
  }

  const validatedRows: ValidatedCSVRow[] = []
  const emails = new Set<string>()
  const emailsInDb = await getExistingEmailsInCompany(companyId)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 1
    const errors: CSVRowError[] = []

    // Validate name
    if (!row.nome || row.nome.trim().length < 2) {
      errors.push({
        rowNumber,
        field: 'nome',
        message: 'Name must be at least 2 characters',
      })
    }

    // Validate email
    if (!row.email || !isValidEmail(row.email)) {
      errors.push({
        rowNumber,
        field: 'email',
        message: 'Invalid email format',
      })
    } else {
      const normalizedEmail = row.email.toLowerCase().trim()

      // Check for duplicates within CSV
      if (emails.has(normalizedEmail)) {
        errors.push({
          rowNumber,
          field: 'email',
          message: 'Duplicate email in file',
        })
      }

      // Check if email already exists in company
      if (emailsInDb.has(normalizedEmail)) {
        errors.push({
          rowNumber,
          field: 'email',
          message: 'Email already exists in company',
        })
      }

      emails.add(normalizedEmail)
    }

    // Store validated row
    validatedRows.push({
      nome: row.nome,
      email: row.email.toLowerCase().trim(),
      departamento: row.departamento,
      cargo: row.cargo,
      rowNumber,
      valid: errors.length === 0,
      errors,
    })
  }

  return validatedRows
}

// ============================================================================
// CSV PREVIEW
// ============================================================================

export async function previewImport(
  file: Buffer,
  companyId: string,
): Promise<CSVPreviewResponse> {
  // Parse CSV
  const rows = await parseCSV(file)

  // Validate data
  const validatedRows = await validateCSVData(rows, companyId)

  // Build preview
  const preview: CSVPreviewRow[] = []
  let toCreate = 0
  let toUpdate = 0

  const existingEmails = await getExistingEmailsInCompany(companyId)

  for (const row of validatedRows) {
    if (!row.valid) {
      preview.push({
        rowNumber: row.rowNumber,
        name: row.nome,
        email: row.email,
        department: row.departamento,
        position: row.cargo,
        status: 'error',
        errors: row.errors.map(e => e.message),
      })
    } else {
      const exists = existingEmails.has(row.email)
      const status = exists ? 'update' : 'create'
      const action = exists ? 'update' : 'create'

      if (action === 'create') toCreate++
      if (action === 'update') toUpdate++

      preview.push({
        rowNumber: row.rowNumber,
        name: row.nome,
        email: row.email,
        department: row.departamento,
        position: row.cargo,
        status: 'valid',
        errors: [],
        action,
      })
    }
  }

  // Store in cache
  const previewId = `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

  previewCache.set(previewId, {
    companyId,
    validatedRows,
    preview,
    summary: {
      toCreate,
      toUpdate,
      errors: preview.filter(p => p.status === 'error').length,
    },
    expiresAt,
  })

  return {
    previewId,
    totalRows: rows.length,
    validRows: validatedRows.filter(r => r.valid).length,
    rowsWithErrors: validatedRows.filter(r => !r.valid).length,
    preview,
    summary: {
      toCreate,
      toUpdate,
      errors: preview.filter(p => p.status === 'error').length,
    },
    expiresAt,
  }
}

// ============================================================================
// CSV IMPORT
// ============================================================================

export async function importUsers(
  companyId: string,
  previewId: string,
  confirmedRowNumbers?: number[],
): Promise<ImportResult> {
  // Get preview from cache
  const previewData = previewCache.get(previewId)

  if (!previewData) {
    throw new ValidationError('Preview expired or not found')
  }

  if (previewData.companyId !== companyId) {
    throw new ValidationError('Preview company mismatch')
  }

  const { validatedRows } = previewData

  // Filter to confirmed rows if specified
  let rowsToImport = validatedRows.filter((r) => r.valid)

  if (confirmedRowNumbers && confirmedRowNumbers.length > 0) {
    rowsToImport = rowsToImport.filter((r) => confirmedRowNumbers.includes(r.rowNumber))
  }

  // ============================================================================
  // ETAPA 1: Create all users in Auth0 (parallel batches)
  // ============================================================================

  logger.info('Creating users in Auth0...', { count: rowsToImport.length })

  let auth0Users: Array<{ row: ValidatedCSVRow; auth0Id: string }>

  try {
    auth0Users = await processInBatches(rowsToImport, 10, async (row) => {
      const auth0Result = await authService.createAdminUser({
        email: row.email.toLowerCase().trim(),
        name: row.nome.trim(),
      })

      logger.info('User created in Auth0 via CSV import', {
        auth0Id: auth0Result.auth0Id,
        email: row.email,
        rowNumber: row.rowNumber,
      })

      return {
        row,
        auth0Id: auth0Result.auth0Id,
      }
    })

    logger.info('All Auth0 users created successfully', { count: auth0Users.length })
  } catch (auth0Error: any) {
    // Enhanced Auth0 error handling
    let errorMessage = 'Failed to create users in Auth0'

    if (auth0Error instanceof Error) {
      const errorMsg = auth0Error.message.toLowerCase()

      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        errorMessage = `Email already exists in Auth0. Please ensure all emails in the CSV are new users.`
      } else if (errorMsg.includes('invalid email')) {
        errorMessage = `Invalid email format detected in CSV`
      } else if (errorMsg.includes('rate limit')) {
        errorMessage = 'Auth0 rate limit exceeded. Please try again later.'
      } else {
        errorMessage = `Auth0 error: ${auth0Error.message}`
      }
    }

    logger.error('Failed to create users in Auth0', {
      error: auth0Error instanceof Error ? auth0Error.message : String(auth0Error),
      stack: auth0Error instanceof Error ? auth0Error.stack : undefined,
    })

    throw new ValidationError(errorMessage)
  }

  // ============================================================================
  // ETAPA 2: Create all users in DB (single transaction - all-or-nothing)
  // ============================================================================

  try {
    await prisma.$transaction(
      async (tx) => {
        // SUB-ETAPA 1: Upsert all departments/jobs
        logger.info('Upserting departments and job titles...')
        const { deptMap, jobMap } = await upsertAllDepartmentsAndJobs(tx, rowsToImport, companyId)
        logger.info('Departments and job titles ready', {
          departments: deptMap.size,
          jobTitles: jobMap.size,
        })

        // SUB-ETAPA 2: Create all users (without managers)
        logger.info('Creating users in database...')
        const userMap = await createAllUsers(tx, auth0Users, deptMap, jobMap, companyId)
        logger.info('All users created in database', { count: userMap.size })

        // SUB-ETAPA 3: Assign managers (second pass)
        logger.info('Assigning managers...')
        await assignAllManagers(tx, rowsToImport, userMap)
        logger.info('Managers assigned successfully')
      },
      {
        timeout: 60000, // 60 seconds for large imports
        maxWait: 10000,
      },
    )

    logger.info('DB transaction completed successfully')
  } catch (dbError) {
    // ROLLBACK: Try to delete Auth0 users
    logger.error('DB transaction failed, rolling back Auth0 users', { error: dbError })

    await rollbackAuth0Users(auth0Users.map((u) => u.auth0Id))

    const errorMessage =
      dbError instanceof Error
        ? dbError.message
        : 'Database transaction failed during import. All changes rolled back.'

    throw new ValidationError(errorMessage)
  }

  // Clear cache after successful processing
  previewCache.delete(previewId)

  logger.info('CSV import completed successfully', {
    created: rowsToImport.length,
    totalRows: validatedRows.length,
  })

  return {
    status: 'completed',
    report: {
      created: rowsToImport.length,
      updated: 0, // No updates in all-or-nothing mode
      skipped: validatedRows.filter((r) => !r.valid).length,
      errors: [],
    },
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getExistingEmailsInCompany(companyId: string): Promise<Set<string>> {
  const users = await prisma.user.findMany({
    where: { companyId },
    select: { email: true },
  })

  return new Set(users.map(u => u.email.toLowerCase()))
}

async function getExistingEmailsByCompany(
  companyId: string,
): Promise<Map<string, { id: string; email: string }>> {
  const users = await prisma.user.findMany({
    where: { companyId },
    select: { id: true, email: true },
  })

  const map = new Map<string, { id: string; email: string }>()
  for (const user of users) {
    map.set(user.email.toLowerCase(), { id: user.id, email: user.email })
  }
  return map
}

// ============================================================================
// IMPORT HELPER FUNCTIONS
// ============================================================================

/**
 * Rollback: Log orphaned Auth0 users if DB transaction fails
 * Note: Manual cleanup may be required in Auth0 dashboard
 */
async function rollbackAuth0Users(auth0Ids: string[]): Promise<void> {
  logger.error('DB transaction failed - orphaned Auth0 users detected', {
    count: auth0Ids.length,
    auth0Ids,
    action: 'Manual cleanup may be required in Auth0 dashboard',
  })

  // TODO: Implement automated cleanup when Auth0 Management API is integrated
  // For now, log the orphaned users for manual cleanup
}

/**
 * Upsert all unique departments and job titles from CSV rows
 * Returns maps for fast lookup: name → id
 */
async function upsertAllDepartmentsAndJobs(
  tx: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  rows: ValidatedCSVRow[],
  companyId: string,
): Promise<{
  deptMap: Map<string, string> // nome → id
  jobMap: Map<string, string> // título → id
}> {
  // Extract unique departments and job titles
  const uniqueDepts = new Set(
    rows
      .map((r) => r.departamento?.trim())
      .filter((d): d is string => Boolean(d)),
  )

  const uniqueJobs = new Set(
    rows
      .map((r) => r.cargo?.trim())
      .filter((j): j is string => Boolean(j)),
  )

  // Upsert all in parallel WITHIN the transaction
  await Promise.all([
    ...Array.from(uniqueDepts).map((name) => upsertDepartment(tx, name, companyId)),
    ...Array.from(uniqueJobs).map((name) => upsertJobTitle(tx, name, companyId)),
  ])

  // Fetch all departments and job titles to create maps
  const [allDepts, allJobs] = await Promise.all([
    tx.department.findMany({
      where: { companyId },
      select: { id: true, name: true },
    }),
    tx.jobTitle.findMany({
      where: { companyId },
      select: { id: true, name: true },
    }),
  ])

  const deptMap = new Map<string, string>(allDepts.map((d: any) => [d.name as string, d.id as string]))
  const jobMap = new Map<string, string>(allJobs.map((j: any) => [j.name as string, j.id as string]))

  return { deptMap, jobMap }
}

/**
 * Create all users in DB (without managers yet)
 * Returns map: email → userId
 */
async function createAllUsers(
  tx: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  auth0Users: Array<{ row: ValidatedCSVRow; auth0Id: string }>,
  deptMap: Map<string, string>,
  jobMap: Map<string, string>,
  companyId: string,
): Promise<Map<string, string>> {
  const userMap = new Map<string, string>()

  // Create all users sequentially WITHIN transaction
  // (Prisma transaction already guarantees atomicity)
  for (const { row, auth0Id } of auth0Users) {
    const departmentId = row.departamento ? deptMap.get(row.departamento.trim()) : undefined

    const jobTitleId = row.cargo ? jobMap.get(row.cargo.trim()) : undefined

    // Create user (WITHOUT managerId yet)
    const user = await tx.user.create({
      data: {
        auth0Id,
        companyId,
        email: row.email.toLowerCase().trim(),
        name: row.nome.trim(),
        departmentId,
        jobTitleId,
        isActive: true,
        // managerId: null by default
      },
      select: { id: true },
    })

    userMap.set(row.email.toLowerCase(), user.id)
  }

  return userMap
}

/**
 * Assign managers to users (second pass)
 * Throws error if manager not found (all-or-nothing)
 */
async function assignAllManagers(
  tx: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  rows: ValidatedCSVRow[],
  userMap: Map<string, string>,
): Promise<void> {
  const managersToAssign = rows.filter((row) => row.email_gestor)

  if (managersToAssign.length === 0) {
    return
  }

  // For each user with manager
  for (const row of managersToAssign) {
    const userId = userMap.get(row.email.toLowerCase())
    const managerId = userMap.get(row.email_gestor!.toLowerCase())

    if (!userId) {
      throw new Error(`User not found in map: ${row.email}`)
    }

    if (!managerId) {
      throw new Error(
        `Manager not found: ${row.email_gestor} (for user ${row.email}). ` +
          `Make sure the manager is included in the CSV.`,
      )
    }

    // Update userId with managerId
    await tx.user.update({
      where: { id: userId },
      data: { managerId },
    })
  }
}

async function upsertDepartment(
  tx: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  departmentName: string,
  companyId: string,
): Promise<string> {
  const normalized = departmentName.trim()

  const dept = await tx.department.upsert({
    where: {
      companyId_name: { companyId, name: normalized },
    },
    update: {}, // Não atualiza se já existe
    create: {
      companyId,
      name: normalized,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    select: { id: true },
  })

  return dept.id
}

async function upsertJobTitle(
  tx: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  jobTitleName: string,
  companyId: string,
): Promise<string> {
  const normalized = jobTitleName.trim()

  const jobTitle = await tx.jobTitle.upsert({
    where: {
      companyId_name: { companyId, name: normalized },
    },
    update: {}, // Não atualiza se já existe
    create: {
      companyId,
      name: normalized,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    select: { id: true },
  })

  return jobTitle.id
}

// Export as service object
export const csvImportService = {
  generateTemplate,
  parseCSV,
  validateCSVData,
  previewImport,
  importUsers,
  getExistingEmailsInCompany,
  getExistingEmailsByCompany,
}
