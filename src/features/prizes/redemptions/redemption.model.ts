import { logger } from '@/lib/logger'
import { Redemption, Prisma } from '@prisma/client'
import { prisma } from '@/lib/database'

export type RedemptionData = Redemption
export type CreateRedemptionData = Omit<
  RedemptionData,
  'id' | 'redeemedAt' | 'status' | 'trackingCode'
>

export type RedemptionWithDetails = Redemption & {
  prize: {
    id: string
    name: string
    images: string[]
    category: string
  }
  variant?: {
    id: string
    name: string
    value: string
  } | null
  tracking: Array<{
    id: string
    status: string
    notes: string | null
    createdAt: Date
  }>
}

export class RedemptionModel {
  constructor(private data: Redemption) {}

  get id() {
    return this.data.id
  }

  get userId() {
    return this.data.userId
  }

  get prizeId() {
    return this.data.prizeId
  }

  get variantId() {
    return this.data.variantId
  }

  get companyId() {
    return this.data.companyId
  }

  get coinsSpent() {
    return this.data.coinsSpent
  }

  get status() {
    return this.data.status
  }

  get addressId() {
    return this.data.addressId
  }

  get trackingCode() {
    return this.data.trackingCode
  }

  get redeemedAt() {
    return this.data.redeemedAt
  }

  toJSON() {
    return {
      id: this.data.id,
      userId: this.data.userId,
      prizeId: this.data.prizeId,
      variantId: this.data.variantId,
      companyId: this.data.companyId,
      coinsSpent: this.data.coinsSpent,
      status: this.data.status,
      addressId: this.data.addressId,
      trackingCode: this.data.trackingCode,
      redeemedAt: this.data.redeemedAt,
    }
  }

  static async create(
    data: CreateRedemptionData,
    tx: Prisma.TransactionClient,
  ): Promise<RedemptionModel> {
    try {
      const redemption = await tx.redemption.create({
        data: {
          ...data,
          status: 'pending',
        },
      })

      logger.info('Redemption created successfully', {
        redemptionId: redemption.id,
        userId: data.userId,
        prizeId: data.prizeId,
      })
      return new RedemptionModel(redemption)
    } catch (error) {
      logger.error('Error creating redemption', { error, data })
      throw new Error('Failed to create redemption')
    }
  }

  static async findById(
    id: string,
    includeDetails = false,
  ): Promise<RedemptionModel | null> {
    try {
      const redemption = await prisma.redemption.findUnique({
        where: { id },
        include: includeDetails
          ? {
              prize: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  category: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  value: true,
                },
              },
              tracking: {
                select: {
                  id: true,
                  status: true,
                  notes: true,
                  createdAt: true,
                },
                orderBy: { createdAt: 'asc' },
              },
            }
          : undefined,
      })

      return redemption ? new RedemptionModel(redemption) : null
    } catch (error) {
      logger.error('Error finding redemption by ID', { error, id })
      throw new Error('Failed to find redemption')
    }
  }

  static async findByUserId(
    userId: string,
    pagination: { limit: number; offset: number },
  ): Promise<RedemptionWithDetails[]> {
    try {
      const redemptions = await prisma.redemption.findMany({
        where: { userId },
        include: {
          prize: {
            select: {
              id: true,
              name: true,
              images: true,
              category: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              value: true,
            },
          },
          tracking: {
            select: {
              id: true,
              status: true,
              notes: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { redeemedAt: 'desc' },
        take: pagination.limit,
        skip: pagination.offset,
      })

      return redemptions
    } catch (error) {
      logger.error('Error finding user redemptions', { error, userId })
      throw new Error('Failed to find user redemptions')
    }
  }

  static async findByCompanyId(
    companyId: string,
    filters: {
      status?: string
      limit: number
      offset: number
    },
  ): Promise<RedemptionWithDetails[]> {
    try {
      const where: Prisma.RedemptionWhereInput = { companyId }

      if (filters.status) {
        where.status = filters.status
      }

      const redemptions = await prisma.redemption.findMany({
        where,
        include: {
          prize: {
            select: {
              id: true,
              name: true,
              images: true,
              category: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              value: true,
            },
          },
          tracking: {
            select: {
              id: true,
              status: true,
              notes: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { redeemedAt: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      })

      return redemptions
    } catch (error) {
      logger.error('Error finding company redemptions', { error, companyId })
      throw new Error('Failed to find company redemptions')
    }
  }

  async updateStatus(
    status: string,
    tx: Prisma.TransactionClient,
  ): Promise<RedemptionModel> {
    try {
      const updated = await tx.redemption.update({
        where: { id: this.data.id },
        data: { status },
      })

      this.data = updated
      logger.info('Redemption status updated', {
        redemptionId: this.data.id,
        newStatus: status,
      })
      return this
    } catch (error) {
      logger.error('Error updating redemption status', {
        error,
        redemptionId: this.data.id,
      })
      throw new Error('Failed to update redemption status')
    }
  }

  async updateTrackingCode(
    trackingCode: string,
  ): Promise<RedemptionModel> {
    try {
      const updated = await prisma.redemption.update({
        where: { id: this.data.id },
        data: { trackingCode },
      })

      this.data = updated
      logger.info('Redemption tracking code updated', {
        redemptionId: this.data.id,
      })
      return this
    } catch (error) {
      logger.error('Error updating redemption tracking code', {
        error,
        redemptionId: this.data.id,
      })
      throw new Error('Failed to update tracking code')
    }
  }
}

