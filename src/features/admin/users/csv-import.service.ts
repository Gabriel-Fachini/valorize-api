/**
 * CSV Import Service
 * Handles CSV parsing, validation, preview and bulk import
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { ValidationError } from '@/middleware/error-handler'
import { authService } from '@/features/auth/auth.service'
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
// CSV TEMPLATE
// ============================================================================

export async function generateTemplate(): Promise<Buffer> {
  const headers = ['nome', 'email', 'departamento', 'cargo']
  const exampleData = [
    ['João Silva', 'joao@empresa.com.br', 'Tecnologia', 'Desenvolvedor'],
    ['Maria Santos', 'maria@empresa.com.br', 'RH', 'Analista'],
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
  let rowsToImport = validatedRows.filter(r => r.valid)

  if (confirmedRowNumbers && confirmedRowNumbers.length > 0) {
    rowsToImport = rowsToImport.filter(r => confirmedRowNumbers.includes(r.rowNumber))
  }

  const errors: ImportError[] = []
  let created = 0
  let updated = 0

  // Get existing emails for update detection
  const existingEmails = await getExistingEmailsByCompany(companyId)

  try {
    // Process in transaction
    await prisma.$transaction(async tx => {
      for (const row of rowsToImport) {
        try {
          const existingUser = existingEmails.get(row.email)

          // Resolve department if provided
          let departmentId: string | null = null
          if (row.departamento) {
            departmentId = await resolveDepartment(tx, row.departamento, companyId)
          }

          // Resolve job title if provided
          let jobTitleId: string | null = null
          if (row.cargo) {
            jobTitleId = await resolveJobTitle(tx, row.cargo, companyId)
          }

          if (existingUser) {
            // Update existing user
            await tx.user.update({
              where: { id: existingUser.id },
              data: {
                name: row.nome.trim(),
                departmentId,
                jobTitleId,
              },
            })
            updated++
          } else {
            // Create new user in Auth0 first
            let auth0Id: string
            let ticketUrl: string | undefined

            try {
              const auth0Result = await authService.createAdminUser({
                email: row.email.toLowerCase().trim(),
                name: row.nome.trim(),
              })
              auth0Id = auth0Result.auth0Id
              ticketUrl = auth0Result.ticketUrl

              logger.info('User created in Auth0 via CSV import', {
                auth0Id,
                email: row.email,
              })
            } catch (auth0Error) {
              logger.error('Failed to create user in Auth0 during CSV import', {
                email: row.email,
                error: auth0Error instanceof Error ? auth0Error.message : String(auth0Error),
              })
              throw new Error(
                `Failed to create user in Auth0: ${auth0Error instanceof Error ? auth0Error.message : 'Unknown error'}`,
              )
            }

            // Create in local database
            await tx.user.create({
              data: {
                auth0Id,
                email: row.email.toLowerCase().trim(),
                name: row.nome.trim(),
                companyId,
                departmentId,
                jobTitleId,
                isActive: true,
              },
            })
            created++

            logger.info('User created from CSV import', {
              userId: auth0Id,
              email: row.email,
              ticketUrl,
            })
          }
        } catch (error) {
          logger.error(`Error importing row ${row.rowNumber}:`, error)
          errors.push({
            rowNumber: row.rowNumber,
            email: row.email,
            reason: error instanceof Error ? error.message : 'Failed to import user',
          })
        }
      }
    })
  } catch (error) {
    logger.error('CSV import transaction error:', error)
    throw new ValidationError('Failed to complete import')
  }

  // Clear cache
  previewCache.delete(previewId)

  logger.info(`CSV import completed: ${created} created, ${updated} updated, ${errors.length} errors`)

  return {
    status: 'completed',
    report: {
      created,
      updated,
      skipped: validatedRows.filter(r => !r.valid).length,
      errors,
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

async function resolveDepartment(
  tx: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  departmentName: string,
  companyId: string,
): Promise<string | null> {
  // Try to find by name
  const dept = await tx.department.findFirst({
    where: {
      companyId,
      name: {
        contains: departmentName,
        mode: 'insensitive',
      },
    },
  })

  return dept?.id ?? null
}

async function resolveJobTitle(
  tx: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  jobTitleName: string,
  companyId: string,
): Promise<string | null> {
  // Try to find by name
  const jobTitle = await tx.jobTitle.findFirst({
    where: {
      companyId,
      name: {
        contains: jobTitleName,
        mode: 'insensitive',
      },
    },
  })

  return jobTitle?.id ?? null
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
