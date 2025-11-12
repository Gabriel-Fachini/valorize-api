/**
 * Demo data seeder for new users
 * Creates sample compliments, transactions, and redemptions to showcase platform features
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

export interface DemoDataConfig {
  userId: string
  companyId: string
  userName: string
  userEmail: string
}

export const demoDataService = {
  /**
   * Create demo data for a new user to showcase platform features
   */
  async createDemoDataForUser(config: DemoDataConfig): Promise<void> {
    try {
      logger.info('Creating demo data for new user', {
        userId: config.userId,
        userName: config.userName,
        companyId: config.companyId,
      })

      // Get company values for compliments
      const companyValues = await prisma.companyValue.findMany({
        where: { 
          companyId: config.companyId,
          isActive: true,
        },
        take: 3,
      })

      if (companyValues.length === 0) {
        logger.warn('No company values found for demo data', {
          companyId: config.companyId,
        })
        return
      }

      // Get other users from the same company to send/receive compliments
      const otherUsers = await prisma.user.findMany({
        where: { 
          companyId: config.companyId,
          id: { not: config.userId },
          isActive: true,
        },
        take: 5,
      })

      if (otherUsers.length === 0) {
        logger.warn('No other users found for demo data', {
          companyId: config.companyId,
        })
        return
      }

      // Create demo compliments (user receiving compliments)
      await this.createReceivedCompliments(config, otherUsers, companyValues)

      // Create demo compliments (user sending compliments)
      await this.createSentCompliments(config, otherUsers, companyValues)

      // Create demo wallet transactions
      await this.createDemoTransactions(config)

      // Create demo prize redemptions
      await this.createDemoRedemptions(config)

      logger.info('Demo data created successfully', {
        userId: config.userId,
        userName: config.userName,
      })

    } catch (error) {
      logger.error('Error creating demo data for user', {
        userId: config.userId,
        error: error instanceof Error ? error.message : String(error),
      })
      // Don't throw error here as user creation should still succeed
    }
  },

  /**
   * Create compliments that the user received (to show in received compliments)
   */
  async createReceivedCompliments(
    config: DemoDataConfig,
    otherUsers: any[],
    companyValues: any[],
  ): Promise<void> {
    const complimentsReceived = [
      {
        message: 'Excelente trabalho no projeto! Sua dedicação e atenção aos detalhes são impressionantes.',
        coins: 25,
        valueId: companyValues[0].id,
        senderId: otherUsers[0].id,
        senderName: otherUsers[0].name,
        daysAgo: 2,
      },
      {
        message: 'Obrigado por sempre estar disponível para ajudar a equipe. Você é um exemplo de colaboração!',
        coins: 15,
        valueId: companyValues[1].id,
        senderId: otherUsers[1].id,
        senderName: otherUsers[1].name,
        daysAgo: 5,
      },
      {
        message: 'Sua apresentação foi fantástica! Muito profissional e bem estruturada.',
        coins: 30,
        valueId: companyValues[2].id,
        senderId: otherUsers[2].id,
        senderName: otherUsers[2].name,
        daysAgo: 7,
      },
    ]

    for (const compliment of complimentsReceived) {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - compliment.daysAgo)

      await prisma.compliment.create({
        data: {
          senderId: compliment.senderId,
          receiverId: config.userId,
          companyId: config.companyId,
          valueId: compliment.valueId,
          message: compliment.message,
          coins: compliment.coins,
          isPublic: true,
          createdAt,
        },
      })

      // Create corresponding wallet transaction
      await this.createWalletTransaction(
        config.userId,
        'CREDIT',
        'REDEEMABLE',
        compliment.coins,
        `Compliment received from ${compliment.senderName}`,
        {
          complimentId: 'demo-compliment',
          senderId: compliment.senderId,
          senderName: compliment.senderName,
          message: compliment.message.substring(0, 50) + '...',
        },
        createdAt,
      )
    }
  },

  /**
   * Create compliments that the user sent (to show in sent compliments)
   */
  async createSentCompliments(
    config: DemoDataConfig,
    otherUsers: any[],
    companyValues: any[],
  ): Promise<void> {
    const complimentsSent = [
      {
        message: 'Parabéns pelo excelente resultado no último sprint! Sua organização fez toda a diferença.',
        coins: 20,
        valueId: companyValues[0].id,
        receiverId: otherUsers[0].id,
        receiverName: otherUsers[0].name,
        daysAgo: 1,
      },
      {
        message: 'Admiro sua criatividade e inovação. Você sempre traz soluções incríveis para os desafios!',
        coins: 35,
        valueId: companyValues[1].id,
        receiverId: otherUsers[1].id,
        receiverName: otherUsers[1].name,
        daysAgo: 3,
      },
    ]

    for (const compliment of complimentsSent) {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - compliment.daysAgo)

      await prisma.compliment.create({
        data: {
          senderId: config.userId,
          receiverId: compliment.receiverId,
          companyId: config.companyId,
          valueId: compliment.valueId,
          message: compliment.message,
          coins: compliment.coins,
          isPublic: true,
          createdAt,
        },
      })

      // Create corresponding wallet transaction
      await this.createWalletTransaction(
        config.userId,
        'DEBIT',
        'COMPLIMENT',
        compliment.coins,
        `Compliment sent to ${compliment.receiverName}`,
        {
          complimentId: 'demo-compliment',
          receiverId: compliment.receiverId,
          receiverName: compliment.receiverName,
          message: compliment.message.substring(0, 50) + '...',
        },
        createdAt,
      )
    }
  },

  /**
   * Create demo wallet transactions
   */
  async createDemoTransactions(config: DemoDataConfig): Promise<void> {
    const transactions = [
      {
        type: 'CREDIT' as const,
        balanceType: 'REDEEMABLE' as const,
        amount: 50,
        reason: 'Monthly performance bonus',
        daysAgo: 10,
        metadata: {
          bonusType: 'performance',
          month: 'December 2024',
        },
      },
      {
        type: 'CREDIT' as const,
        balanceType: 'REDEEMABLE' as const,
        amount: 25,
        reason: 'Team collaboration reward',
        daysAgo: 15,
        metadata: {
          rewardType: 'collaboration',
          project: 'Q4 Initiative',
        },
      },
      {
        type: 'RESET' as const,
        balanceType: 'COMPLIMENT' as const,
        amount: 100,
        reason: 'Weekly balance reset',
        daysAgo: 3,
        metadata: {
          resetType: 'weekly',
          adminId: 'system',
        },
      },
    ]

    for (const transaction of transactions) {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - transaction.daysAgo)

      await this.createWalletTransaction(
        config.userId,
        transaction.type,
        transaction.balanceType,
        transaction.amount,
        transaction.reason,
        transaction.metadata,
        createdAt,
      )
    }
  },

  /**
   * Create demo prize redemptions
   */
  async createDemoRedemptions(config: DemoDataConfig): Promise<void> {
    // Get available prizes for the company
    const prizes = await prisma.prize.findMany({
      where: { 
        companyId: config.companyId,
        isActive: true,
        stock: { gt: 0 },
      },
      take: 2,
    })

    if (prizes.length === 0) {
      logger.warn('No prizes available for demo redemptions', {
        companyId: config.companyId,
      })
      return
    }

    // Create a demo address for the user
    const demoAddress = await prisma.address.create({
      data: {
        userId: config.userId,
        name: 'Casa',
        isDefault: true,
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '123',
        city: 'São Paulo',
        neighborhood: 'Centro',
        state: 'SP',
        country: 'BR',
        phone: '(11) 99999-9999',
      },
    })

    const redemptions = [
      {
        prizeId: prizes[0].id,
        prizeName: prizes[0].name,
        coinsSpent: prizes[0].coinPrice,
        status: 'DELIVERED' as const,
        daysAgo: 8,
      },
      {
        prizeId: prizes[1]?.id,
        prizeName: prizes[1]?.name,
        coinsSpent: prizes[1]?.coinPrice,
        status: 'PROCESSING' as const,
        daysAgo: 2,
      },
    ].filter(r => r.prizeId) // Filter out undefined prizes

    for (const redemption of redemptions) {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - redemption.daysAgo)

      // Create redemption
      await prisma.redemption.create({
        data: {
          userId: config.userId,
          prizeId: redemption.prizeId,
          companyId: config.companyId,
          addressId: demoAddress.id,
          coinsSpent: redemption.coinsSpent,
          status: redemption.status,
          redeemedAt: createdAt,
        },
      })

      // Create wallet transaction for redemption
      await this.createWalletTransaction(
        config.userId,
        'DEBIT',
        'REDEEMABLE',
        redemption.coinsSpent,
        `Prize redemption: ${redemption.prizeName}`,
        {
          redemptionId: 'demo-redemption',
          prizeId: redemption.prizeId,
          prizeName: redemption.prizeName,
          status: redemption.status,
        },
        createdAt,
      )
    }
  },

  /**
   * Create a wallet transaction with proper balance tracking
   */
  async createWalletTransaction(
    userId: string,
    transactionType: 'DEBIT' | 'CREDIT' | 'RESET',
    balanceType: 'COMPLIMENT' | 'REDEEMABLE',
    amount: number,
    reason: string,
    metadata: any,
    createdAt: Date,
  ): Promise<void> {
    // Get current wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      logger.warn('Wallet not found for transaction', { userId })
      return
    }

    // Calculate new balance
    let newBalance: number
    if (balanceType === 'COMPLIMENT') {
      if (transactionType === 'DEBIT') {
        newBalance = wallet.complimentBalance - amount
      } else if (transactionType === 'CREDIT') {
        newBalance = wallet.complimentBalance + amount
      } else { // RESET
        newBalance = amount // Reset to the amount specified
      }
    } else { // REDEEMABLE
      if (transactionType === 'DEBIT') {
        newBalance = wallet.redeemableBalance - amount
      } else if (transactionType === 'CREDIT') {
        newBalance = wallet.redeemableBalance + amount
      } else { // RESET
        newBalance = amount
      }
    }

    // Create transaction record
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        transactionType,
        balanceType,
        amount,
        previousBalance: balanceType === 'COMPLIMENT' ? wallet.complimentBalance : wallet.redeemableBalance,
        newBalance,
        reason,
        metadata,
        createdAt,
      },
    })

    // Update wallet balance
    await prisma.wallet.update({
      where: { userId },
      data: balanceType === 'COMPLIMENT' 
        ? { complimentBalance: newBalance }
        : { redeemableBalance: newBalance },
    })
  },
}
