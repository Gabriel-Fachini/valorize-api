import { AuditAction, AuditEntityType } from '@/lib/audit-logger'

/**
 * Filters for querying audit logs
 */
export interface AuditLogFilters {
  action?: AuditAction
  entityType?: AuditEntityType
  userId?: string
  companyId?: string
  startDate?: Date
  endDate?: Date
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * Sorting parameters
 */
export interface SortingParams {
  sortOrder: 'asc' | 'desc'
}

/**
 * User information in audit log response
 */
export interface AuditLogUser {
  id: string
  name: string
  email: string
}

/**
 * Individual audit log item for list responses
 */
export interface AuditLogListItem {
  id: string
  userId: string
  user: AuditLogUser
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, { before: unknown; after: unknown }>
  metadata?: Record<string, unknown>
  createdAt: Date
  companyId?: string
}

/**
 * Detailed audit log response
 */
export interface AuditLogResponse {
  id: string
  userId: string
  user: AuditLogUser
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, { before: unknown; after: unknown }>
  metadata?: Record<string, unknown>
  createdAt: Date
  companyId?: string
}

/**
 * Paginated result wrapper
 */
export interface PaginatedAuditLogs {
  data: AuditLogListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
