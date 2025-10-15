/**
 * Compliment seeder - creates sample compliments with wallet transactions
 */

import { Prisma } from '@prisma/client'
import { BaseSeeder } from './base.seeder'
import {
  COMPLIMENTS_FROM_GABRIEL,
  COMPLIMENTS_TO_GABRIEL,
  GABRIEL_AUTH0_ID,
  VALORIZE_COMPANY_ID,
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
    
    // Create compliments to Gabriel
    for (const complimentData of COMPLIMENTS_TO_GABRIEL) {
      const sender = valorizeUsers.find(u => u.auth0Id === complimentData.senderAuth0Id)
      if (sender && sender.wallet && valorizeValues[complimentData.valueIndex]) {
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
          },
        })
        
        // Create debit transaction for sender
        const senderPreviousBalance = sender.wallet.complimentBalance
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
    
    this.logComplete(createdCount, 'compliments')
    this.logInfo(`Gabriel sent ${totalCoinsFromGabriel} coins and received ${totalCoinsToGabriel} coins`)
    this.logInfo(`Created ${createdCount * 2} wallet transactions`)
  }
}
