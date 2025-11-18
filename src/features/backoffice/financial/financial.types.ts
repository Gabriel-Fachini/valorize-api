import type { Charge, ChargeAttachment, ChargePayment, ChargeStatus } from '@prisma/client'
import type { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// Core Entity Types
// ============================================================================

export type { Charge, ChargeAttachment, ChargePayment, ChargeStatus }

export interface ChargeWithRelations extends Charge {
  company: {
    id: string
    name: string
    cnpj?: string
  }
  createdByUser: {
    id: string
    name: string
    email: string
  }
  attachments: ChargeAttachment[]
  payments: ChargePayment[]
}

export interface ChargeDetails extends ChargeWithRelations {
  balance: Decimal // amount - sum(payments.amount)
  isPaid: boolean // balance <= 0
  totalPaid: Decimal // sum(payments.amount)
}

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateChargeRequest {
  companyId: string
  amount: number
  description: string
  dueDate: string // ISO date
  paymentMethod?: 'BOLETO' | 'PIX' | 'CREDIT_CARD'
  notes?: string
}

export interface UpdateChargeRequest {
  amount?: number
  description?: string
  dueDate?: string // ISO date
  paymentMethod?: 'BOLETO' | 'PIX' | 'CREDIT_CARD'
  notes?: string
}

export interface RegisterPaymentRequest {
  amount: number
  paidAt: string // ISO date-time
  paymentMethod: 'BOLETO' | 'PIX' | 'CREDIT_CARD'
  notes?: string
}

export interface UploadAttachmentRequest {
  file: Buffer
  fileName: string
  fileType: string
  fileSize: number
}

// ============================================================================
// Query Filters
// ============================================================================

export interface ListChargesFilters {
  companyId?: string
  status?: ChargeStatus | ChargeStatus[]
  dueDateFrom?: string // ISO date
  dueDateTo?: string // ISO date
  issueDateFrom?: string // ISO date
  issueDateTo?: string // ISO date
  search?: string // Search in description
}

export interface ListChargesPagination {
  page?: number
  limit?: number
  sortBy?: 'issueDate' | 'dueDate' | 'amount' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface ListChargesQuery extends ListChargesFilters, ListChargesPagination {}

// ============================================================================
// Response DTOs
// ============================================================================

export interface ListChargesResponse {
  success: true
  data: ChargeWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  aggregations: {
    totalAmount: Decimal
    pendingAmount: Decimal
    paidAmount: Decimal
    overdueAmount: Decimal
    partialAmount: Decimal
    chargesByStatus: {
      PENDING: number
      PAID: number
      OVERDUE: number
      CANCELED: number
      PARTIAL: number
    }
  }
}

export interface ChargeDetailsResponse {
  success: true
  data: ChargeDetails
}

export interface ChargeResponse {
  success: true
  data: Charge
}

export interface AttachmentResponse {
  success: true
  data: ChargeAttachment
}

export interface PaymentResponse {
  success: true
  data: ChargePayment
}

export interface DeleteResponse {
  success: true
  message: string
}

// ============================================================================
// Service Types
// ============================================================================

export interface CalculateChargeBalanceResult {
  balance: Decimal
  totalPaid: Decimal
  isPaid: boolean
  suggestedStatus: ChargeStatus
}

export interface ChargeAggregations {
  totalAmount: Decimal
  pendingAmount: Decimal
  paidAmount: Decimal
  overdueAmount: Decimal
  partialAmount: Decimal
  chargesByStatus: {
    PENDING: number
    PAID: number
    OVERDUE: number
    CANCELED: number
    PARTIAL: number
  }
}

// ============================================================================
// Error Types
// ============================================================================

export class ChargeNotFoundError extends Error {
  constructor(chargeId: string) {
    super(`Charge with ID ${chargeId} not found`)
    this.name = 'ChargeNotFoundError'
  }
}

export class AttachmentNotFoundError extends Error {
  constructor(attachmentId: string) {
    super(`Attachment with ID ${attachmentId} not found`)
    this.name = 'AttachmentNotFoundError'
  }
}

export class InvalidChargeStatusError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidChargeStatusError'
  }
}

export class InvalidPaymentAmountError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidPaymentAmountError'
  }
}
