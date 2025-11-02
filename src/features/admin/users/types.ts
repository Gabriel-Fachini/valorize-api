/**
 * TypeScript interfaces for Admin Users CRUD
 */

export interface UserListItem {
  id: string
  name: string
  email: string
  department?: {
    id: string
    name: string
  }
  position?: {
    id: string
    name: string
  }
  avatar?: string
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface UserStatistics {
  complimentsSent: number
  complimentsReceived: number
  totalCoins: number
  redeemptions: number
}

export interface UserDetailResponse extends UserListItem {
  statistics: UserStatistics
  updatedAt: Date
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  pageCount: number
  currentPage: number
}

// CSV Import related types
export interface CSVRow {
  nome: string
  email: string
  departamento?: string
  cargo?: string
}

export interface CSVRowError {
  rowNumber: number
  field: string
  message: string
}

export interface ValidatedCSVRow extends CSVRow {
  rowNumber: number
  valid: boolean
  errors: CSVRowError[]
  departmentId?: string
  jobTitleId?: string
}

export interface CSVPreviewRow {
  rowNumber: number
  name: string
  email: string
  department?: string
  position?: string
  status: 'valid' | 'error' | 'duplicate' | 'exists'
  errors: string[]
  action?: 'create' | 'update' | 'skip'
}

export interface CSVPreviewResponse {
  previewId: string
  totalRows: number
  validRows: number
  rowsWithErrors: number
  preview: CSVPreviewRow[]
  summary: {
    toCreate: number
    toUpdate: number
    errors: number
  }
  expiresAt: Date
}

export interface ImportError {
  rowNumber?: number
  email?: string
  reason: string
}

export interface ImportResult {
  jobId?: string
  status: 'completed' | 'processing'
  report: {
    created: number
    updated: number
    skipped: number
    errors: ImportError[]
  }
}

// Request/Response DTOs
export interface CreateUserInput {
  name: string
  email: string
  departmentId?: string
  jobTitleId?: string
}

export interface UpdateUserInput {
  name?: string
  email?: string
  departmentId?: string | null
  jobTitleId?: string | null
  isActive?: boolean
}

export interface ListUsersFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive'
  departmentId?: string
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLogin'
  sortOrder?: 'asc' | 'desc'
}

export interface BulkActionsInput {
  userIds: string[]
  action: 'activate' | 'deactivate' | 'export'
}

export interface BulkActionsResponse {
  updated?: number
  file?: Buffer
}

export interface CSVValidationResult {
  valid: boolean
  totalRows: number
  validRows: number
  errors: CSVRowError[]
  parsedRows: ValidatedCSVRow[]
}

// CSV Import data stored in memory/cache
export interface CSVPreviewCache {
  previewId: string
  companyId: string
  validatedRows: ValidatedCSVRow[]
  preview: CSVPreviewRow[]
  summary: {
    toCreate: number
    toUpdate: number
    errors: number
  }
  expiresAt: Date
}
