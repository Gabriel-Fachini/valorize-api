import { logger } from '@/lib/logger'
import { RedemptionTracking, Prisma } from '@prisma/client'
import { prisma } from '@/lib/database'

export type RedemptionTrackingData = RedemptionTracking
export type CreateRedemptionTrackingData = Omit<
  RedemptionTrackingData,
  'id' | 'createdAt'
>

export class RedemptionTrackingModel {
  constructor(private data: RedemptionTracking) {}

  get id() {
    return this.data.id
  }

  get redemptionId() {
    return this.data.redemptionId
  }

  get status() {
    return this.data.status
  }

  get notes() {
    return this.data.notes
  }

  get createdBy() {
    return this.data.createdBy
  }

  get createdAt() {
    return this.data.createdAt
  }

  toJSON() {
    return {
      id: this.data.id,
      redemptionId: this.data.redemptionId,
      status: this.data.status,
      notes: this.data.notes,
      createdBy: this.data.createdBy,
      createdAt: this.data.createdAt,
    }
  }

  static async create(
    data: CreateRedemptionTrackingData,
    tx: Prisma.TransactionClient,
  ): Promise<RedemptionTrackingModel> {
    try {
      const tracking = await tx.redemptionTracking.create({
        data,
      })

      logger.info('Redemption tracking created successfully', {
        trackingId: tracking.id,
        redemptionId: data.redemptionId,
        status: data.status,
      })
      return new RedemptionTrackingModel(tracking)
    } catch (error) {
      logger.error('Error creating redemption tracking', { error, data })
      throw new Error('Failed to create redemption tracking')
    }
  }

  static async findByRedemptionId(
    redemptionId: string,
  ): Promise<RedemptionTrackingModel[]> {
    try {
      const trackings = await prisma.redemptionTracking.findMany({
        where: { redemptionId },
        orderBy: { createdAt: 'asc' },
      })

      return trackings.map((tracking) => new RedemptionTrackingModel(tracking))
    } catch (error) {
      logger.error('Error finding redemption trackings', {
        error,
        redemptionId,
      })
      throw new Error('Failed to find redemption trackings')
    }
  }
}

