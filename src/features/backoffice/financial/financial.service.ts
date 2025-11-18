import { FinancialModel } from './financial.model'
import { auditLogger, AuditAction, AuditEntityType } from '@/lib/audit-logger'
import { supabaseStorageService } from '@/lib/storage/supabase-storage.service'
import { logger } from '@/lib/logger'
import prisma from '@/lib/database'
import { Decimal } from '@prisma/client/runtime/library'
import type {
  ListChargesQuery,
  ListChargesResponse,
  ChargeDetailsResponse,
  ChargeResponse,
  CreateChargeRequest,
  UpdateChargeRequest,
  RegisterPaymentRequest,
  PaymentResponse,
  AttachmentResponse,
  DeleteResponse,
  ChargeNotFoundError,
  InvalidChargeStatusError,
  InvalidPaymentAmountError,
  AttachmentNotFoundError,
} from './financial.types'

/**
 * Financial Service
 * Business logic for financial management (Super Admins only)
 */
export const financialService = {
  /**
   * List charges with filters, pagination, and sorting
   */
  async listCharges(query: ListChargesQuery, performedBy: string): Promise<ListChargesResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy,
        sortOrder,
        ...filters
      } = query

      const pagination = { page, limit, sortBy, sortOrder }

      // Get charges
      const { charges, total } = await FinancialModel.findCharges(filters, pagination)

      // Get aggregations
      const aggregations = await FinancialModel.calculateAggregations(filters)

      return {
        success: true,
        data: charges,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        aggregations,
      }
    } catch (error) {
      logger.error('Error listing charges', { error, query, performedBy })
      throw error
    }
  },

  /**
   * Get charge details by ID
   */
  async getChargeDetails(chargeId: string, performedBy: string): Promise<ChargeDetailsResponse> {
    try {
      const charge = await FinancialModel.findChargeById(chargeId)

      if (!charge) {
        throw new Error(`Charge with ID ${chargeId} not found`)
      }

      // Calculate balance and payment status
      const { balance, totalPaid, isPaid } = await FinancialModel.calculateChargeBalance(chargeId)

      const chargeDetails = {
        ...charge,
        balance,
        totalPaid,
        isPaid,
      }

      return {
        success: true,
        data: chargeDetails,
      }
    } catch (error) {
      logger.error('Error getting charge details', { error, chargeId, performedBy })
      throw error
    }
  },

  /**
   * Create a new charge
   */
  async createCharge(data: CreateChargeRequest, performedBy: string): Promise<ChargeResponse> {
    try {
      // Validate company exists and is active
      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
      })

      if (!company) {
        throw new Error(`Company with ID ${data.companyId} not found`)
      }

      if (!company.isActive) {
        throw new Error(`Company ${company.name} is not active`)
      }

      // Create charge
      const charge = await FinancialModel.createCharge(data, performedBy)

      // Log audit
      await auditLogger.log({
        userId: performedBy,
        action: AuditAction.CHARGE_CREATE,
        entityType: AuditEntityType.CHARGE,
        entityId: charge.id,
        companyId: data.companyId,
        metadata: {
          amount: charge.amount.toString(),
          dueDate: charge.dueDate.toISOString(),
          description: charge.description,
        },
      })

      logger.info('Charge created successfully', {
        chargeId: charge.id,
        companyId: data.companyId,
        amount: charge.amount.toString(),
        performedBy,
      })

      return {
        success: true,
        data: charge,
      }
    } catch (error) {
      logger.error('Error creating charge', { error, data, performedBy })
      throw error
    }
  },

  /**
   * Update a charge
   */
  async updateCharge(
    chargeId: string,
    data: UpdateChargeRequest,
    performedBy: string
  ): Promise<ChargeResponse> {
    try {
      // Get existing charge
      const existingCharge = await FinancialModel.findChargeById(chargeId)

      if (!existingCharge) {
        throw new Error(`Charge with ID ${chargeId} not found`)
      }

      // Don't allow updating paid or canceled charges
      if (existingCharge.status === 'PAID') {
        throw new Error('Cannot update a paid charge')
      }

      if (existingCharge.status === 'CANCELED') {
        throw new Error('Cannot update a canceled charge')
      }

      // Update charge
      const updatedCharge = await FinancialModel.updateCharge(chargeId, data)

      // Build changes object for audit log
      const changes = auditLogger.buildChanges(
        existingCharge,
        updatedCharge,
        ['amount', 'description', 'dueDate', 'paymentMethod', 'notes']
      )

      // Log audit
      await auditLogger.log({
        userId: performedBy,
        action: AuditAction.CHARGE_UPDATE,
        entityType: AuditEntityType.CHARGE,
        entityId: chargeId,
        companyId: existingCharge.companyId,
        changes,
      })

      logger.info('Charge updated successfully', {
        chargeId,
        performedBy,
      })

      return {
        success: true,
        data: updatedCharge,
      }
    } catch (error) {
      logger.error('Error updating charge', { error, chargeId, data, performedBy })
      throw error
    }
  },

  /**
   * Delete a charge (only if status is PENDING or CANCELED)
   */
  async deleteCharge(chargeId: string, performedBy: string): Promise<DeleteResponse> {
    try {
      // Get existing charge
      const existingCharge = await FinancialModel.findChargeById(chargeId)

      if (!existingCharge) {
        throw new Error(`Charge with ID ${chargeId} not found`)
      }

      // Only allow deleting PENDING or CANCELED charges
      if (existingCharge.status !== 'PENDING' && existingCharge.status !== 'CANCELED') {
        throw new Error(`Cannot delete charge with status ${existingCharge.status}. Only PENDING or CANCELED charges can be deleted.`)
      }

      // Check if charge has any payments
      if (existingCharge.payments.length > 0) {
        throw new Error('Cannot delete charge that has payments registered')
      }

      // Delete charge (will cascade delete attachments due to onDelete: Cascade)
      await FinancialModel.deleteCharge(chargeId)

      // Delete attachments from Supabase storage
      if (existingCharge.attachments.length > 0) {
        for (const attachment of existingCharge.attachments) {
          try {
            const path = supabaseStorageService.extractPathFromUrl(attachment.fileUrl)
            await supabaseStorageService.deletePrizeImage(path) // Reusing the generic delete method
          } catch (error) {
            logger.warn('Failed to delete attachment from storage', { error, attachmentId: attachment.id })
          }
        }
      }

      // Log audit
      await auditLogger.log({
        userId: performedBy,
        action: AuditAction.CHARGE_DELETE,
        entityType: AuditEntityType.CHARGE,
        entityId: chargeId,
        companyId: existingCharge.companyId,
        metadata: {
          amount: existingCharge.amount.toString(),
          description: existingCharge.description,
        },
      })

      logger.info('Charge deleted successfully', {
        chargeId,
        performedBy,
      })

      return {
        success: true,
        message: 'Charge deleted successfully',
      }
    } catch (error) {
      logger.error('Error deleting charge', { error, chargeId, performedBy })
      throw error
    }
  },

  /**
   * Cancel a charge
   */
  async cancelCharge(chargeId: string, performedBy: string): Promise<ChargeResponse> {
    try {
      // Get existing charge
      const existingCharge = await FinancialModel.findChargeById(chargeId)

      if (!existingCharge) {
        throw new Error(`Charge with ID ${chargeId} not found`)
      }

      // Only allow canceling PENDING or OVERDUE charges
      if (existingCharge.status !== 'PENDING' && existingCharge.status !== 'OVERDUE') {
        throw new Error(`Cannot cancel charge with status ${existingCharge.status}. Only PENDING or OVERDUE charges can be canceled.`)
      }

      // Check if charge has any payments
      if (existingCharge.payments.length > 0) {
        throw new Error('Cannot cancel charge that has payments registered. Delete payments first or mark as PAID.')
      }

      // Cancel charge
      const canceledCharge = await FinancialModel.cancelCharge(chargeId)

      // Log audit
      await auditLogger.log({
        userId: performedBy,
        action: AuditAction.CHARGE_CANCEL,
        entityType: AuditEntityType.CHARGE,
        entityId: chargeId,
        companyId: existingCharge.companyId,
        changes: {
          status: {
            before: existingCharge.status,
            after: 'CANCELED',
          },
        },
      })

      logger.info('Charge canceled successfully', {
        chargeId,
        performedBy,
      })

      return {
        success: true,
        data: canceledCharge,
      }
    } catch (error) {
      logger.error('Error canceling charge', { error, chargeId, performedBy })
      throw error
    }
  },

  /**
   * Register a payment for a charge
   */
  async registerPayment(
    chargeId: string,
    data: RegisterPaymentRequest,
    performedBy: string
  ): Promise<PaymentResponse> {
    try {
      // Get existing charge
      const existingCharge = await FinancialModel.findChargeById(chargeId)

      if (!existingCharge) {
        throw new Error(`Charge with ID ${chargeId} not found`)
      }

      // Don't allow payments on canceled charges
      if (existingCharge.status === 'CANCELED') {
        throw new Error('Cannot register payment for a canceled charge')
      }

      // Calculate current balance
      const { balance } = await FinancialModel.calculateChargeBalance(chargeId)

      // Validate payment amount
      if (data.amount <= 0) {
        throw new Error('Payment amount must be greater than zero')
      }

      // Warning if payment exceeds remaining balance
      if (new Decimal(data.amount).greaterThan(balance)) {
        logger.warn('Payment amount exceeds remaining balance', {
          chargeId,
          paymentAmount: data.amount,
          remainingBalance: balance.toString(),
        })
      }

      // Register payment
      const payment = await FinancialModel.registerPayment(chargeId, data, performedBy)

      // Update charge status based on new total paid
      await FinancialModel.updateChargeStatus(chargeId)

      // Log audit
      await auditLogger.log({
        userId: performedBy,
        action: AuditAction.CHARGE_PAYMENT_REGISTER,
        entityType: AuditEntityType.CHARGE_PAYMENT,
        entityId: payment.id,
        companyId: existingCharge.companyId,
        metadata: {
          chargeId,
          amount: payment.amount.toString(),
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt.toISOString(),
        },
      })

      logger.info('Payment registered successfully', {
        paymentId: payment.id,
        chargeId,
        amount: payment.amount.toString(),
        performedBy,
      })

      return {
        success: true,
        data: payment,
      }
    } catch (error) {
      logger.error('Error registering payment', { error, chargeId, data, performedBy })
      throw error
    }
  },

  /**
   * Upload an attachment for a charge
   */
  async uploadAttachment(
    chargeId: string,
    file: Buffer,
    fileName: string,
    fileType: string,
    fileSize: number,
    performedBy: string
  ): Promise<AttachmentResponse> {
    try {
      // Validate charge exists
      const charge = await FinancialModel.findChargeById(chargeId)

      if (!charge) {
        throw new Error(`Charge with ID ${chargeId} not found`)
      }

      // Validate file type (PDF, images)
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ]

      if (!allowedTypes.includes(fileType)) {
        throw new Error(
          `Invalid file type: ${fileType}. Allowed types: ${allowedTypes.join(', ')}`
        )
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (fileSize > maxSize) {
        throw new Error(
          `File size exceeds maximum allowed size of 10MB. File size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`
        )
      }

      // Upload to Supabase (we'll add this method to the service)
      // For now, we'll use a similar pattern to uploadPrizeImage
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8)
      const extension = fileName.split('.').pop()
      const uniqueFileName = `charge-${timestamp}-${randomString}.${extension}`
      const filePath = `charge-attachments/${charge.companyId}/${chargeId}/${uniqueFileName}`

      logger.info('Uploading charge attachment to Supabase', {
        chargeId,
        fileName,
        fileSize,
        fileType,
      })

      // Upload using the existing client (reusing uploadPrizeImage method structure)
      // TODO: Add uploadChargeAttachment method to supabase-storage.service.ts
      const { publicUrl } = await supabaseStorageService.uploadPrizeImage(
        file,
        fileName,
        fileType
      )

      // Create attachment record
      const attachment = await FinancialModel.createAttachment(
        chargeId,
        fileName,
        publicUrl,
        fileSize,
        fileType,
        performedBy
      )

      // Log audit
      await auditLogger.log({
        userId: performedBy,
        action: AuditAction.CHARGE_ATTACHMENT_UPLOAD,
        entityType: AuditEntityType.CHARGE_ATTACHMENT,
        entityId: attachment.id,
        companyId: charge.companyId,
        metadata: {
          chargeId,
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
        },
      })

      logger.info('Attachment uploaded successfully', {
        attachmentId: attachment.id,
        chargeId,
        performedBy,
      })

      return {
        success: true,
        data: attachment,
      }
    } catch (error) {
      logger.error('Error uploading attachment', {
        error,
        chargeId,
        fileName,
        performedBy,
      })
      throw error
    }
  },

  /**
   * Delete an attachment from a charge
   */
  async deleteAttachment(
    chargeId: string,
    attachmentId: string,
    performedBy: string
  ): Promise<DeleteResponse> {
    try {
      // Validate attachment exists and belongs to charge
      const attachment = await FinancialModel.findAttachmentById(attachmentId)

      if (!attachment) {
        throw new Error(`Attachment with ID ${attachmentId} not found`)
      }

      if (attachment.chargeId !== chargeId) {
        throw new Error(`Attachment ${attachmentId} does not belong to charge ${chargeId}`)
      }

      // Delete from Supabase storage
      try {
        const path = supabaseStorageService.extractPathFromUrl(attachment.fileUrl)
        await supabaseStorageService.deletePrizeImage(path) // Reusing the generic delete method
      } catch (error) {
        logger.warn('Failed to delete attachment from storage', {
          error,
          attachmentId,
        })
        // Continue with DB deletion even if storage deletion fails
      }

      // Delete from database
      await FinancialModel.deleteAttachment(attachmentId)

      // Log audit
      await auditLogger.log({
        userId: performedBy,
        action: AuditAction.CHARGE_ATTACHMENT_DELETE,
        entityType: AuditEntityType.CHARGE_ATTACHMENT,
        entityId: attachmentId,
        metadata: {
          chargeId,
          fileName: attachment.fileName,
        },
      })

      logger.info('Attachment deleted successfully', {
        attachmentId,
        chargeId,
        performedBy,
      })

      return {
        success: true,
        message: 'Attachment deleted successfully',
      }
    } catch (error) {
      logger.error('Error deleting attachment', {
        error,
        chargeId,
        attachmentId,
        performedBy,
      })
      throw error
    }
  },

  /**
   * Check and mark overdue charges (can be called by a cron job)
   */
  async checkOverdueCharges(): Promise<{ count: number }> {
    try {
      const count = await FinancialModel.markOverdueCharges()

      logger.info('Overdue charges marked', { count })

      return { count }
    } catch (error) {
      logger.error('Error checking overdue charges', { error })
      throw error
    }
  },
}
