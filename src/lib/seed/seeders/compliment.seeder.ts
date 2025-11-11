/**
 * Compliment seeder - creates sample compliments with wallet transactions
 */

import { Prisma } from '@prisma/client'
import { BaseSeeder } from './base.seeder'
import { BatchWalletUpdater } from '../utils/batch-wallet-updater'
import { progressReporter } from '../utils/progress-reporter'
import { REALISTIC_VOLUMES } from '../config/realistic-volumes'
import { ComplimentFactory, type GeneratedCompliment } from '../factories/compliment.factory'
import {
  COMPLIMENTS_FROM_GABRIEL,
  COMPLIMENTS_TO_GABRIEL,
  GABRIEL_AUTH0_ID,
  VALORIZE_COMPANY_ID,
  daysAgo,
  type ComplimentData,
} from '../data/compliments'

export class ComplimentSeeder extends BaseSeeder {
  protected get name(): string {
    return 'compliments'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    // Get Gabriel's user
    const gabriel = await this.prisma.user.findUnique({
      where: { auth0Id: GABRIEL_AUTH0_ID },
      include: { wallet: true },
    })
    
    if (!gabriel || !gabriel.wallet) {
      this.logWarning('Gabriel user or wallet not found, skipping compliment seeding')
      return
    }
    
    // Get all users from Valorize Corp (Gabriel's company)
    const valorizeUsers = await this.prisma.user.findMany({
      where: { 
        companyId: VALORIZE_COMPANY_ID,
        id: { not: gabriel.id }, // Exclude Gabriel
      },
      include: { wallet: true },
    })
    
    // Get company values for Valorize Corp
    const valorizeValues = await this.prisma.companyValue.findMany({
      where: { companyId: VALORIZE_COMPANY_ID },
    })
    
    if (valorizeValues.length === 0) {
      this.logWarning('No company values found for Valorize Corp, skipping compliment seeding')
      return
    }
    
    let createdCount = 0
    let totalCoinsFromGabriel = 0
    let totalCoinsToGabriel = 0
    let currentGabrielComplimentBalance = gabriel.wallet.complimentBalance
    let currentGabrielRedeemableBalance = gabriel.wallet.redeemableBalance
    
    // Create compliments from Gabriel
    for (const complimentData of COMPLIMENTS_FROM_GABRIEL) {
      const receiver = valorizeUsers.find(u => u.auth0Id === complimentData.receiverAuth0Id)
      if (receiver && receiver.wallet && valorizeValues[complimentData.valueIndex]) {
        // Determine creation date (if daysAgo is specified, use it)
        const createdAt = complimentData.daysAgo ? daysAgo(complimentData.daysAgo) : new Date()

        // Create compliment
        await this.prisma.compliment.create({
          data: {
            senderId: gabriel.id,
            receiverId: receiver.id,
            companyId: VALORIZE_COMPANY_ID,
            valueId: valorizeValues[complimentData.valueIndex].id,
            message: complimentData.message,
            coins: complimentData.coins,
            isPublic: complimentData.isPublic,
            createdAt,
          },
        })
        
        // Create debit transaction for Gabriel
        const previousBalance = currentGabrielComplimentBalance
        const newBalance = previousBalance - complimentData.coins
        await this.prisma.walletTransaction.create({
          data: {
            walletId: gabriel.wallet.id,
            userId: gabriel.id,
            transactionType: 'DEBIT',
            balanceType: 'COMPLIMENT',
            amount: complimentData.coins,
            previousBalance,
            newBalance,
            reason: `Compliment sent to ${receiver.name}`,
            metadata: {
              receiverId: receiver.id,
              receiverName: receiver.name,
              valueId: valorizeValues[complimentData.valueIndex].id,
              message: complimentData.message.substring(0, 100),
            } as Prisma.JsonObject,
          },
        })
        currentGabrielComplimentBalance = newBalance
        
        // Create credit transaction for receiver
        const receiverPreviousBalance = receiver.wallet.redeemableBalance
        const receiverNewBalance = receiverPreviousBalance + complimentData.coins
        await this.prisma.walletTransaction.create({
          data: {
            walletId: receiver.wallet.id,
            userId: receiver.id,
            transactionType: 'CREDIT',
            balanceType: 'REDEEMABLE',
            amount: complimentData.coins,
            previousBalance: receiverPreviousBalance,
            newBalance: receiverNewBalance,
            reason: `Compliment received from ${gabriel.name}`,
            metadata: {
              senderId: gabriel.id,
              senderName: gabriel.name,
              valueId: valorizeValues[complimentData.valueIndex].id,
              message: complimentData.message.substring(0, 100),
            } as Prisma.JsonObject,
          },
        })
        
        // Update receiver wallet balance
        await this.prisma.wallet.update({
          where: { userId: receiver.id },
          data: { redeemableBalance: receiverNewBalance },
        })
        
        totalCoinsFromGabriel += complimentData.coins
        createdCount++
      }
    }
    
    // Initialize balance tracking for senders to Gabriel
    const complimentsToGabrielBalanceMap = new Map<string, number>()
    for (const user of valorizeUsers) {
      complimentsToGabrielBalanceMap.set(user.id, user.wallet?.complimentBalance || 0)
    }

    // Create compliments to Gabriel
    for (const complimentData of COMPLIMENTS_TO_GABRIEL) {
      const sender = valorizeUsers.find(u => u.auth0Id === complimentData.senderAuth0Id)
      if (sender && sender.wallet && valorizeValues[complimentData.valueIndex]) {
        // Determine creation date (if daysAgo is specified, use it)
        const createdAt = complimentData.daysAgo ? daysAgo(complimentData.daysAgo) : new Date()

        // Create compliment
        await this.prisma.compliment.create({
          data: {
            senderId: sender.id,
            receiverId: gabriel.id,
            companyId: VALORIZE_COMPANY_ID,
            valueId: valorizeValues[complimentData.valueIndex].id,
            message: complimentData.message,
            coins: complimentData.coins,
            isPublic: complimentData.isPublic,
            createdAt,
          },
        })

        // Create debit transaction for sender
        const senderPreviousBalance = complimentsToGabrielBalanceMap.get(sender.id) || 0
        const senderNewBalance = senderPreviousBalance - complimentData.coins
        await this.prisma.walletTransaction.create({
          data: {
            walletId: sender.wallet.id,
            userId: sender.id,
            transactionType: 'DEBIT',
            balanceType: 'COMPLIMENT',
            amount: complimentData.coins,
            previousBalance: senderPreviousBalance,
            newBalance: senderNewBalance,
            reason: `Compliment sent to ${gabriel.name}`,
            metadata: {
              receiverId: gabriel.id,
              receiverName: gabriel.name,
              valueId: valorizeValues[complimentData.valueIndex].id,
              message: complimentData.message.substring(0, 100),
            } as Prisma.JsonObject,
          },
        })

        // Update balance map for accurate tracking
        complimentsToGabrielBalanceMap.set(sender.id, senderNewBalance)

        // Update sender wallet balance
        await this.prisma.wallet.update({
          where: { userId: sender.id },
          data: { complimentBalance: senderNewBalance },
        })
        
        // Create credit transaction for Gabriel
        const previousBalance = currentGabrielRedeemableBalance
        const newBalance = previousBalance + complimentData.coins
        await this.prisma.walletTransaction.create({
          data: {
            walletId: gabriel.wallet.id,
            userId: gabriel.id,
            transactionType: 'CREDIT',
            balanceType: 'REDEEMABLE',
            amount: complimentData.coins,
            previousBalance,
            newBalance,
            reason: `Compliment received from ${sender.name}`,
            metadata: {
              senderId: sender.id,
              senderName: sender.name,
              valueId: valorizeValues[complimentData.valueIndex].id,
              message: complimentData.message.substring(0, 100),
            } as Prisma.JsonObject,
          },
        })
        currentGabrielRedeemableBalance = newBalance
        
        totalCoinsToGabriel += complimentData.coins
        createdCount++
      }
    }
    
    // Update Gabriel's wallet balance
    await this.prisma.wallet.update({
      where: { userId: gabriel.id },
      data: {
        complimentBalance: currentGabrielComplimentBalance,
        redeemableBalance: currentGabrielRedeemableBalance,
      },
    })

    // Create compliments for Valorize Corp employees (8,500 compliments)
    await this.seedFactoryCompliments(VALORIZE_COMPANY_ID, REALISTIC_VOLUMES.compliments.valorize)

    // Create compliments for other companies
    await this.seedFactoryCompliments('demo-company-002', REALISTIC_VOLUMES.compliments.techstart)
    await this.seedFactoryCompliments('demo-company-003', REALISTIC_VOLUMES.compliments.global)

    this.logComplete(createdCount, 'compliments')
    this.logInfo(`Gabriel sent ${totalCoinsFromGabriel} coins and received ${totalCoinsToGabriel} coins`)
    this.logInfo(`Created ${createdCount * 2} wallet transactions`)
  }

  private async seedFactoryCompliments(companyId: string, targetComplimentCount: number): Promise<void> {
    const startTime = Date.now()

    // Get company users
    const users = await this.prisma.user.findMany({
      where: { companyId },
      include: { wallet: true },
    })

    if (users.length === 0) {
      this.logWarning(`No users found for company ${companyId}`)
      return
    }

    // Get company values
    const values = await this.prisma.companyValue.findMany({
      where: { companyId },
    })

    if (values.length === 0) {
      this.logWarning(`No company values found for company ${companyId}`)
      return
    }

    const companyName = companyId === 'demo-company-001' ? 'Valorize' : companyId === 'demo-company-002' ? 'TechStart' : 'Global'
    progressReporter.printHeader(`Seeding ${companyName} Corp (${users.length} users, target ${targetComplimentCount} compliments)`)

    // Initialize compliment and redeemable balance tracking for each user
    const complimentBalanceMap = new Map<string, number>()
    const redeemableBalanceMap = new Map<string, number>()
    for (const user of users) {
      complimentBalanceMap.set(user.id, user.wallet?.complimentBalance || 0)
      redeemableBalanceMap.set(user.id, user.wallet?.redeemableBalance || 0)
    }

    // ============================================================================
    // BATCH 1: Create 13 weekly renewal transactions for each user (90 days = ~13 weeks)
    // ============================================================================
    const renewalProgressName = `${companyName} Weekly Renewals`
    progressReporter.createProgressBar({
      name: renewalProgressName,
      total: users.length * REALISTIC_VOLUMES.weeklyRenewals.weeks,
    })

    const renewalTransactions: Array<{
      walletId: string
      userId: string
      transactionType: string
      balanceType: string
      amount: number
      previousBalance: number
      newBalance: number
      reason: string
      metadata: Prisma.JsonObject
      createdAt: Date
    }> = []

    for (const user of users) {
      if (!user.wallet) continue

      const renewalCoins = REALISTIC_VOLUMES.weeklyRenewals.coinsPerWeek
      const totalWeeks = REALISTIC_VOLUMES.weeklyRenewals.weeks
      for (let week = 0; week < totalWeeks; week++) {
        const renewalDate = daysAgo(90 - (week * 7))
        const previousBalance = complimentBalanceMap.get(user.id) || 0
        const newBalance = previousBalance + renewalCoins

        renewalTransactions.push({
          walletId: user.wallet.id,
          userId: user.id,
          transactionType: 'CREDIT',
          balanceType: 'COMPLIMENT',
          amount: renewalCoins,
          previousBalance,
          newBalance,
          reason: 'Weekly compliment renewal',
          metadata: {
            week: week + 1,
            totalWeeks,
          } as Prisma.JsonObject,
          createdAt: renewalDate,
        })

        complimentBalanceMap.set(user.id, newBalance)
        progressReporter.updateProgress(renewalProgressName)
      }
    }

    // Batch insert all renewal transactions
    if (renewalTransactions.length > 0) {
      await this.prisma.walletTransaction.createMany({
        data: renewalTransactions,
      })
      progressReporter.completeProgress(renewalProgressName)
      progressReporter.printSuccess(`Inserted ${renewalTransactions.length} renewal transactions`)
    }

    // ============================================================================
    // Create activity distribution map (Pareto: 20% power users 4x, 60% normal 1x, 20% inactive 0.2x)
    // ============================================================================
    const distribution = REALISTIC_VOLUMES.activityDistribution
    const powerUserCount = Math.floor(users.length * distribution.powerUsersPercentage)
    const normalUserCount = Math.floor(users.length * distribution.normalUsersPercentage)
    const inactiveUserCount = users.length - powerUserCount - normalUserCount

    // Randomly assign users to distribution groups
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5)
    const activityDistributionMap = new Map<string, number>()

    for (let i = 0; i < shuffledUsers.length; i++) {
      const user = shuffledUsers[i]
      if (i < powerUserCount) {
        activityDistributionMap.set(user.auth0Id, distribution.powerUserComplimentMultiplier)
      } else if (i < powerUserCount + normalUserCount) {
        activityDistributionMap.set(user.auth0Id, distribution.normalUserComplimentMultiplier)
      } else {
        activityDistributionMap.set(user.auth0Id, distribution.inactiveUserComplimentMultiplier)
      }
    }

    progressReporter.printInfo(
      `Activity Distribution: ${powerUserCount} power (4x), ${normalUserCount} normal (1x), ${inactiveUserCount} inactive (0.2x)`,
    )

    // ============================================================================
    // BATCH 2: Generate compliments using factory and collect transactions
    // ============================================================================
    const generatedCompliments = ComplimentFactory.generateBulkCompliments(
      users.map(u => ({ auth0Id: u.auth0Id, id: u.id })),
      values.map((v, index) => index.toString()),
      targetComplimentCount,
      activityDistributionMap,
    )

    const complimentProgressName = `${companyName} Processing`
    progressReporter.createProgressBar({
      name: complimentProgressName,
      total: generatedCompliments.length,
    })

    const complimentsToCreate: Array<{
      senderId: string
      receiverId: string
      companyId: string
      valueId: number
      message: string
      coins: number
      isPublic: boolean
      createdAt: Date
    }> = []

    const debitTransactions: Array<{
      walletId: string
      userId: string
      transactionType: string
      balanceType: string
      amount: number
      previousBalance: number
      newBalance: number
      reason: string
      metadata: Prisma.JsonObject
      createdAt: Date
    }> = []

    const creditTransactions: Array<{
      walletId: string
      userId: string
      transactionType: string
      balanceType: string
      amount: number
      previousBalance: number
      newBalance: number
      reason: string
      metadata: Prisma.JsonObject
      createdAt: Date
    }> = []

    let createdCompliments = 0
    for (const complimentData of generatedCompliments) {
      const sender = users.find(u => u.auth0Id === complimentData.senderAuth0Id)
      const receiver = users.find(u => u.auth0Id === complimentData.receiverAuth0Id)

      if (!sender || !receiver || !sender.wallet || !receiver.wallet) {
        progressReporter.updateProgress(complimentProgressName)
        continue
      }

      // Check if sender has sufficient balance
      const senderBalance = complimentBalanceMap.get(sender.id) || 0
      if (senderBalance < complimentData.coins) {
        progressReporter.updateProgress(complimentProgressName)
        continue
      }

      const createdAt = complimentData.daysAgo ? daysAgo(complimentData.daysAgo) : new Date()
      const value = values[complimentData.valueIndex]

      if (!value) {
        progressReporter.updateProgress(complimentProgressName)
        continue
      }

      // Add compliment to batch
      complimentsToCreate.push({
        senderId: sender.id,
        receiverId: receiver.id,
        companyId,
        valueId: value.id,
        message: complimentData.message,
        coins: complimentData.coins,
        isPublic: complimentData.isPublic,
        createdAt,
      })

      // Create debit transaction for sender
      const senderPreviousBalance = complimentBalanceMap.get(sender.id) || 0
      const senderNewBalance = senderPreviousBalance - complimentData.coins

      debitTransactions.push({
        walletId: sender.wallet.id,
        userId: sender.id,
        transactionType: 'DEBIT',
        balanceType: 'COMPLIMENT',
        amount: complimentData.coins,
        previousBalance: senderPreviousBalance,
        newBalance: senderNewBalance,
        reason: `Compliment sent to ${receiver.name}`,
        metadata: {
          receiverId: receiver.id,
          receiverName: receiver.name,
          valueId: value.id,
          message: complimentData.message.substring(0, 100),
        } as Prisma.JsonObject,
        createdAt,
      })

      complimentBalanceMap.set(sender.id, senderNewBalance)

      // Create credit transaction for receiver
      const receiverPreviousBalance = redeemableBalanceMap.get(receiver.id) || 0
      const receiverNewBalance = receiverPreviousBalance + complimentData.coins

      creditTransactions.push({
        walletId: receiver.wallet.id,
        userId: receiver.id,
        transactionType: 'CREDIT',
        balanceType: 'REDEEMABLE',
        amount: complimentData.coins,
        previousBalance: receiverPreviousBalance,
        newBalance: receiverNewBalance,
        reason: `Compliment received from ${sender.name}`,
        metadata: {
          senderId: sender.id,
          senderName: sender.name,
          valueId: value.id,
          message: complimentData.message.substring(0, 100),
        } as Prisma.JsonObject,
        createdAt,
      })

      redeemableBalanceMap.set(receiver.id, receiverNewBalance)
      createdCompliments++
      progressReporter.updateProgress(complimentProgressName)
    }

    progressReporter.completeProgress(complimentProgressName)

    // Batch insert all compliments
    if (complimentsToCreate.length > 0) {
      await this.prisma.compliment.createMany({
        data: complimentsToCreate,
      })
      progressReporter.printSuccess(`Inserted ${complimentsToCreate.length} compliments`)
    }

    // Batch insert all transactions (debits + credits)
    const allTransactions = [...debitTransactions, ...creditTransactions]
    if (allTransactions.length > 0) {
      await this.prisma.walletTransaction.createMany({
        data: allTransactions,
      })
      progressReporter.printSuccess(`Inserted ${allTransactions.length} wallet transactions`)
    }

    // ============================================================================
    // BATCH 3: Update all wallet balances in a single operation
    // ============================================================================
    const walletUpdates: Array<{ userId: string; complimentBalance?: number; redeemableBalance?: number }> = []

    for (const user of users) {
      const complimentBalance = complimentBalanceMap.get(user.id)
      const redeemableBalance = redeemableBalanceMap.get(user.id)

      // Only include if balance changed
      if (complimentBalance !== undefined || redeemableBalance !== undefined) {
        walletUpdates.push({
          userId: user.id,
          complimentBalance,
          redeemableBalance,
        })
      }
    }

    // Batch update all wallet balances
    if (walletUpdates.length > 0) {
      const batchUpdater = new BatchWalletUpdater(this.prisma)
      await batchUpdater.updateBothBalances(walletUpdates)
      progressReporter.printSuccess(`Updated ${walletUpdates.length} wallet balances`)
    }

    const elapsedMs = Date.now() - startTime
    progressReporter.printCompleted(`${companyName} seeding`, createdCompliments, elapsedMs)
    this.logInfo(`Created ${createdCompliments} compliments for company ${companyId} (generated: ${generatedCompliments.length})`)
  }
}
