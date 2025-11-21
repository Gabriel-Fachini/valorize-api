import prisma from './database'
import type { Prisma } from '@prisma/client'

/**
 * Audit Actions enum
 * All possible actions that can be audited in the system
 */
export enum AuditAction {
  // General CRUD
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',

  // Company lifecycle
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',

  // Wallet operations
  WALLET_CREDIT = 'WALLET_CREDIT',
  WALLET_DEBIT = 'WALLET_DEBIT',
  WALLET_FREEZE = 'WALLET_FREEZE',
  WALLET_UNFREEZE = 'WALLET_UNFREEZE',

  // Contact management
  CONTACT_ADD = 'CONTACT_ADD',
  CONTACT_UPDATE = 'CONTACT_UPDATE',
  CONTACT_DELETE = 'CONTACT_DELETE',

  // Plan management
  PLAN_CHANGE = 'PLAN_CHANGE',

  // Financial management
  CHARGE_CREATE = 'CHARGE_CREATE',
  CHARGE_UPDATE = 'CHARGE_UPDATE',
  CHARGE_DELETE = 'CHARGE_DELETE',
  CHARGE_CANCEL = 'CHARGE_CANCEL',
  CHARGE_PAYMENT_REGISTER = 'CHARGE_PAYMENT_REGISTER',
  CHARGE_ATTACHMENT_UPLOAD = 'CHARGE_ATTACHMENT_UPLOAD',
  CHARGE_ATTACHMENT_DELETE = 'CHARGE_ATTACHMENT_DELETE',

  // Impersonation (future)
  IMPERSONATE = 'IMPERSONATE',
  IMPERSONATE_END = 'IMPERSONATE_END',
}

/**
 * Entity types that can be audited
 */
export enum AuditEntityType {
  COMPANY = 'Company',
  USER = 'User',
  WALLET = 'Wallet',
  COMPANY_WALLET = 'CompanyWallet',
  COMPANY_CONTACT = 'CompanyContact',
  COMPANY_PLAN = 'CompanyPlan',
  CHARGE = 'Charge',
  CHARGE_ATTACHMENT = 'ChargeAttachment',
  CHARGE_PAYMENT = 'ChargePayment',
}

/**
 * Audit log parameters
 */
export interface AuditLogParams {
  userId: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  companyId?: string
  changes?: Record<string, { before: any; after: any }>
  metadata?: Record<string, any>
}

/**
 * Audit Logger Service
 * Responsible for logging all actions performed in the system for audit purposes
 */
export const auditLogger = {
  /**
   * Log an action to the audit log
   *
   * @param params - Audit log parameters
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await auditLogger.log({
   *   userId: 'user-123',
   *   action: AuditAction.UPDATE,
   *   entityType: AuditEntityType.COMPANY,
   *   entityId: 'company-456',
   *   changes: {
   *     name: { before: 'Old Name', after: 'New Name' },
   *     domain: { before: 'old.com', after: 'new.com' }
   *   },
   *   metadata: {
   *     ip: '192.168.1.1',
   *     userAgent: 'Mozilla/5.0...',
   *     requestId: 'req-789'
   *   }
   * })
   * ```
   */
  async log(params: AuditLogParams): Promise<void> {
    const { userId, action, entityType, entityId, companyId, changes, metadata } = params

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          companyId,
          changes: changes as Prisma.InputJsonValue,
          metadata: metadata as Prisma.InputJsonValue,
        },
      })
    } catch (error) {
      // Log error but don't throw - audit logging should not break the main operation
      console.error('[AuditLogger] Failed to create audit log:', error)
    }
  },

  /**
   * Helper method to build changes object
   * Compares old and new values and creates a changelog
   *
   * @param oldData - Old data object
   * @param newData - New data object
   * @param fields - Fields to track (if not provided, all fields in newData are tracked)
   * @returns Changes object
   *
   * @example
   * ```typescript
   * const changes = auditLogger.buildChanges(
   *   { name: 'Old Name', domain: 'old.com', logoUrl: null },
   *   { name: 'New Name', domain: 'old.com', logoUrl: 'https://...' },
   *   ['name', 'domain', 'logoUrl']
   * )
   * // Result: { name: { before: 'Old Name', after: 'New Name' }, logoUrl: { before: null, after: 'https://...' } }
   * ```
   */
  buildChanges(
    oldData: Record<string, any>,
    newData: Record<string, any>,
    fields?: string[],
  ): Record<string, { before: any; after: any }> {
    const changes: Record<string, { before: any; after: any }> = {}
    const fieldsToCheck = fields || Object.keys(newData)

    for (const field of fieldsToCheck) {
      const oldValue = oldData[field]
      const newValue = newData[field]

      // Only track if value actually changed
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = {
          before: oldValue,
          after: newValue,
        }
      }
    }

    return changes
  },

  /**
   * Query audit logs for a specific entity
   *
   * @param entityType - Entity type to filter by
   * @param entityId - Entity ID to filter by
   * @param options - Query options (limit, offset)
   * @returns Promise<AuditLog[]>
   *
   * @example
   * ```typescript
   * const logs = await auditLogger.getEntityLogs(
   *   AuditEntityType.COMPANY,
   *   'company-123',
   *   { limit: 50, offset: 0 }
   * )
   * ```
   */
  async getEntityLogs(
    entityType: AuditEntityType,
    entityId: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const { limit = 50, offset = 0 } = options

    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })
  },

  /**
   * Query audit logs for a specific user
   *
   * @param userId - User ID to filter by
   * @param options - Query options (limit, offset)
   * @returns Promise<AuditLog[]>
   *
   * @example
   * ```typescript
   * const logs = await auditLogger.getUserLogs('user-123', { limit: 100 })
   * ```
   */
  async getUserLogs(
    userId: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const { limit = 50, offset = 0 } = options

    return prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })
  },
}
