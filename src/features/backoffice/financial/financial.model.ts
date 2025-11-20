import prisma from '@/lib/database'
import type { Prisma, ChargeStatus, Charge, ChargeAttachment, ChargePayment } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import type {
  ListChargesFilters,
  ListChargesPagination,
  ChargeWithRelations,
  CalculateChargeBalanceResult,
  ChargeAggregations,
  CreateChargeRequest,
  UpdateChargeRequest,
  RegisterPaymentRequest,
} from './financial.types'

/**
 * Financial Model
 * Cross-company queries for financial management (Super Admins only)
 */
export class FinancialModel {
  /**
   * Find charges with filters, pagination and sorting
   */
  static async findCharges(
    filters: ListChargesFilters,
    pagination: ListChargesPagination,
  ): Promise<{ charges: ChargeWithRelations[]; total: number }> {
    const {
      companyId,
      status,
      dueDateFrom,
      dueDateTo,
      issueDateFrom,
      issueDateTo,
      search,
    } = filters

    const {
      page = 1,
      limit = 20,
      sortBy = 'dueDate',
      sortOrder = 'desc',
    } = pagination

    // Build where clause
    const where: Prisma.ChargeWhereInput = {}

    if (companyId) {
      where.companyId = companyId
    }

    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status }
      } else {
        where.status = status
      }
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {}
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom)
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo)
      }
    }

    if (issueDateFrom || issueDateTo) {
      where.issueDate = {}
      if (issueDateFrom) {
        where.issueDate.gte = new Date(issueDateFrom)
      }
      if (issueDateTo) {
        where.issueDate.lte = new Date(issueDateTo)
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Build orderBy clause
    const orderBy: Prisma.ChargeOrderByWithRelationInput = {}

    if (sortBy === 'issueDate') {
      orderBy.issueDate = sortOrder
    } else if (sortBy === 'dueDate') {
      orderBy.dueDate = sortOrder
    } else if (sortBy === 'amount') {
      orderBy.amount = sortOrder
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder
    }

    // Execute query
    const [charges, total] = await Promise.all([
      prisma.charge.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              companyBrazil: {
                select: {
                  cnpj: true,
                },
              },
            },
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
          payments: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.charge.count({ where }),
    ])

    // Transform to ChargeWithRelations
    const chargesWithRelations: ChargeWithRelations[] = charges.map((charge) => ({
      ...charge,
      company: {
        id: charge.company.id,
        name: charge.company.name,
        cnpj: charge.company.companyBrazil?.cnpj,
      },
      createdByUser: charge.createdByUser,
      attachments: charge.attachments,
      payments: charge.payments,
    }))

    return {
      charges: chargesWithRelations,
      total,
    }
  }

  /**
   * Find charge by ID with full details
   */
  static async findChargeById(chargeId: string): Promise<ChargeWithRelations | null> {
    const charge = await prisma.charge.findUnique({
      where: { id: chargeId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            companyBrazil: {
              select: {
                cnpj: true,
              },
            },
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: true,
        payments: true,
      },
    })

    if (!charge) {
      return null
    }

    return {
      ...charge,
      company: {
        id: charge.company.id,
        name: charge.company.name,
        cnpj: charge.company.companyBrazil?.cnpj,
      },
      createdByUser: charge.createdByUser,
      attachments: charge.attachments,
      payments: charge.payments,
    }
  }

  /**
   * Create a new charge
   */
  static async createCharge(
    data: CreateChargeRequest,
    createdBy: string,
  ): Promise<Charge> {
    return prisma.charge.create({
      data: {
        companyId: data.companyId,
        amount: data.amount,
        description: data.description,
        dueDate: new Date(data.dueDate),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        createdBy,
        // Auto-set status to OVERDUE if due date is in the past
        status: new Date(data.dueDate) < new Date() ? 'OVERDUE' : 'PENDING',
      },
    })
  }

  /**
   * Update a charge
   */
  static async updateCharge(
    chargeId: string,
    data: UpdateChargeRequest,
  ): Promise<Charge> {
    const updateData: Prisma.ChargeUpdateInput = {}

    if (data.amount !== undefined) {
      updateData.amount = data.amount
    }
    if (data.description !== undefined) {
      updateData.description = data.description
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = new Date(data.dueDate)
    }
    if (data.paymentMethod !== undefined) {
      updateData.paymentMethod = data.paymentMethod
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }

    return prisma.charge.update({
      where: { id: chargeId },
      data: updateData,
    })
  }

  /**
   * Delete a charge (only if status is PENDING or CANCELED)
   */
  static async deleteCharge(chargeId: string): Promise<void> {
    await prisma.charge.delete({
      where: { id: chargeId },
    })
  }

  /**
   * Cancel a charge
   */
  static async cancelCharge(chargeId: string): Promise<Charge> {
    return prisma.charge.update({
      where: { id: chargeId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    })
  }

  /**
   * Create attachment
   */
  static async createAttachment(
    chargeId: string,
    fileName: string,
    fileUrl: string,
    fileSize: number,
    fileType: string,
    uploadedBy: string,
  ): Promise<ChargeAttachment> {
    return prisma.chargeAttachment.create({
      data: {
        chargeId,
        fileName,
        fileUrl,
        fileSize,
        fileType,
        uploadedBy,
      },
    })
  }

  /**
   * Find attachment by ID
   */
  static async findAttachmentById(
    attachmentId: string,
  ): Promise<ChargeAttachment | null> {
    return prisma.chargeAttachment.findUnique({
      where: { id: attachmentId },
    })
  }

  /**
   * Delete attachment
   */
  static async deleteAttachment(attachmentId: string): Promise<void> {
    await prisma.chargeAttachment.delete({
      where: { id: attachmentId },
    })
  }

  /**
   * Register payment
   */
  static async registerPayment(
    chargeId: string,
    data: RegisterPaymentRequest,
    registeredBy: string,
  ): Promise<ChargePayment> {
    return prisma.chargePayment.create({
      data: {
        chargeId,
        amount: data.amount,
        paidAt: new Date(data.paidAt),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        registeredBy,
      },
    })
  }

  /**
   * Calculate charge balance and suggest status
   */
  static async calculateChargeBalance(
    chargeId: string,
  ): Promise<CalculateChargeBalanceResult> {
    const charge = await prisma.charge.findUnique({
      where: { id: chargeId },
      include: {
        payments: true,
      },
    })

    if (!charge) {
      throw new Error(`Charge ${chargeId} not found`)
    }

    const totalPaid = charge.payments.reduce((sum, payment) => {
      return sum.add(payment.amount)
    }, new Decimal(0))

    const balance = new Decimal(charge.amount).sub(totalPaid)
    const isPaid = balance.lessThanOrEqualTo(0)

    // Determine suggested status
    let suggestedStatus: ChargeStatus = charge.status

    if (isPaid) {
      suggestedStatus = 'PAID'
    } else if (totalPaid.greaterThan(0) && balance.greaterThan(0)) {
      suggestedStatus = 'PARTIAL'
    } else if (charge.dueDate < new Date() && balance.greaterThan(0)) {
      suggestedStatus = 'OVERDUE'
    } else if (balance.greaterThan(0)) {
      suggestedStatus = 'PENDING'
    }

    return {
      balance,
      totalPaid,
      isPaid,
      suggestedStatus,
    }
  }

  /**
   * Update charge status based on payments
   */
  static async updateChargeStatus(chargeId: string): Promise<Charge> {
    const { suggestedStatus, isPaid } = await this.calculateChargeBalance(chargeId)

    return prisma.charge.update({
      where: { id: chargeId },
      data: {
        status: suggestedStatus,
        paidAt: isPaid ? new Date() : null,
      },
    })
  }

  /**
   * Calculate aggregations for charges
   */
  static async calculateAggregations(
    filters: ListChargesFilters,
  ): Promise<ChargeAggregations> {
    const { companyId } = filters

    const where: Prisma.ChargeWhereInput = {}
    if (companyId) {
      where.companyId = companyId
    }

    // Get all charges with their payments
    const charges = await prisma.charge.findMany({
      where,
      include: {
        payments: true,
      },
    })

    // Calculate aggregations
    let totalAmount = new Decimal(0)
    let pendingAmount = new Decimal(0)
    let paidAmount = new Decimal(0)
    let overdueAmount = new Decimal(0)
    let partialAmount = new Decimal(0)

    const chargesByStatus = {
      PENDING: 0,
      PAID: 0,
      OVERDUE: 0,
      CANCELED: 0,
      PARTIAL: 0,
    }

    charges.forEach((charge) => {
      totalAmount = totalAmount.add(charge.amount)

      chargesByStatus[charge.status]++

      if (charge.status === 'PAID') {
        paidAmount = paidAmount.add(charge.amount)
      } else if (charge.status === 'PENDING') {
        pendingAmount = pendingAmount.add(charge.amount)
      } else if (charge.status === 'OVERDUE') {
        overdueAmount = overdueAmount.add(charge.amount)
      } else if (charge.status === 'PARTIAL') {
        const totalPaid = charge.payments.reduce(
          (sum, p) => sum.add(p.amount),
          new Decimal(0),
        )
        const balance = new Decimal(charge.amount).sub(totalPaid)
        partialAmount = partialAmount.add(balance)
      }
    })

    return {
      totalAmount,
      pendingAmount,
      paidAmount,
      overdueAmount,
      partialAmount,
      chargesByStatus,
    }
  }

  /**
   * Mark overdue charges (charges with dueDate < now and status PENDING)
   */
  static async markOverdueCharges(): Promise<number> {
    const result = await prisma.charge.updateMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      },
      data: {
        status: 'OVERDUE',
      },
    })

    return result.count
  }
}
