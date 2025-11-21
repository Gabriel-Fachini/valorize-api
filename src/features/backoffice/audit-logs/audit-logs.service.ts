import prisma from '@/lib/database'
import { AuditAction, AuditEntityType } from '@/lib/audit-logger'
import type {
  AuditLogFilters,
  PaginationParams,
  SortingParams,
  PaginatedAuditLogs,
  AuditLogListItem,
} from './audit-logs.types'
import type { Prisma } from '@prisma/client'

/**
 * Backoffice Audit Logs Service
 * Business logic for audit log queries and visualization
 */
export const backofficeAuditLogsService = {
  /**
   * List all audit logs (global) with advanced filters
   */
  async listAllAuditLogs(
    filters: AuditLogFilters,
    pagination: PaginationParams,
    sorting: SortingParams,
  ): Promise<PaginatedAuditLogs> {
    const where = buildWhereClause(filters)
    const orderBy = buildOrderByClause(sorting)

    // Calculate offset
    const skip = (pagination.page - 1) * pagination.limit
    const take = pagination.limit

    // Execute query with count
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ])

    // Map to response format
    const data: AuditLogListItem[] = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      user: {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email,
      },
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      changes: log.changes as Record<string, { before: unknown; after: unknown }> | undefined,
      metadata: log.metadata as Record<string, unknown> | undefined,
      createdAt: log.createdAt,
      companyId: log.companyId || undefined,
    }))

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    }
  },

  /**
   * List audit logs for a specific company
   */
  async listCompanyAuditLogs(
    companyId: string,
    filters: Omit<AuditLogFilters, 'companyId'>,
    pagination: PaginationParams,
    sorting: SortingParams,
  ): Promise<PaginatedAuditLogs> {
    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    })

    if (!company) {
      throw new Error('Company not found')
    }

    // Add companyId to filters
    const fullFilters: AuditLogFilters = {
      ...filters,
      companyId,
    }

    return this.listAllAuditLogs(fullFilters, pagination, sorting)
  },

  /**
   * List all actions performed by a specific user (Super Admin)
   */
  async listUserAuditLogs(
    userId: string,
    filters: Omit<AuditLogFilters, 'userId'>,
    pagination: PaginationParams,
    sorting: SortingParams,
  ): Promise<PaginatedAuditLogs> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Add userId to filters
    const fullFilters: AuditLogFilters = {
      ...filters,
      userId,
    }

    return this.listAllAuditLogs(fullFilters, pagination, sorting)
  },
}

/**
 * Helper: Build Prisma where clause from filters
 */
function buildWhereClause(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {}

  // Filter by action
  if (filters.action) {
    where.action = filters.action
  }

  // Filter by entity type
  if (filters.entityType) {
    where.entityType = filters.entityType
  }

  // Filter by user ID
  if (filters.userId) {
    where.userId = filters.userId
  }

  // Filter by company ID
  if (filters.companyId) {
    where.companyId = filters.companyId
  }

  // Filter by date range
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}

    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }

    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  return where
}

/**
 * Helper: Build Prisma orderBy clause from sorting params
 */
function buildOrderByClause(
  sorting: SortingParams,
): Prisma.AuditLogOrderByWithRelationInput {
  return {
    createdAt: sorting.sortOrder,
  }
}
