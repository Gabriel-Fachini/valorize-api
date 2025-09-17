import { logger } from '@/lib/logger'
import { Compliment, Prisma } from '@prisma/client'

export type ComplimentData = Omit<Compliment, 'createdAt'>
export type CreateComplimentData = Omit<ComplimentData, 'id' | 'isPublic'>

export class ComplimentModel {
  constructor(private data: ComplimentData) {}

  static async create(
    data: CreateComplimentData,
    tx: Prisma.TransactionClient,
  ): Promise<ComplimentModel> {
    try {
      const compliment = await tx.compliment.create({
        data,
      })
      return new ComplimentModel(compliment)
    } catch (error) {
      logger.error('Error creating compliment', { error, data })
      throw new Error('Failed to create compliment.')
    }
  }
}
