/**
 * Compliment seeder - creates sample compliments and updates wallet balances
 */

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
    })
    
    if (!gabriel) {
      this.logWarning('Gabriel user not found, skipping compliment seeding')
      return
    }
    
    // Get all users from Valorize Corp (Gabriel's company)
    const valorizeUsers = await this.prisma.user.findMany({
      where: { 
        companyId: VALORIZE_COMPANY_ID,
        id: { not: gabriel.id }, // Exclude Gabriel
      },
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
    
    // Create compliments from Gabriel
    for (const complimentData of COMPLIMENTS_FROM_GABRIEL) {
      const receiver = valorizeUsers.find(u => u.auth0Id === complimentData.receiverAuth0Id)
      if (receiver && valorizeValues[complimentData.valueIndex]) {
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
        totalCoinsFromGabriel += complimentData.coins
        createdCount++
      }
    }
    
    // Create compliments to Gabriel
    for (const complimentData of COMPLIMENTS_TO_GABRIEL) {
      const sender = valorizeUsers.find(u => u.auth0Id === complimentData.senderAuth0Id)
      if (sender && valorizeValues[complimentData.valueIndex]) {
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
        totalCoinsToGabriel += complimentData.coins
        createdCount++
      }
    }
    
    // Update Gabriel's wallet balance
    await this.prisma.wallet.update({
      where: { userId: gabriel.id },
      data: {
        complimentBalance: 100 - totalCoinsFromGabriel,
        redeemableBalance: totalCoinsToGabriel,
      },
    })
    
    // Update other users' balances for compliments from Gabriel
    for (const complimentData of COMPLIMENTS_FROM_GABRIEL) {
      const receiver = valorizeUsers.find(u => u.auth0Id === complimentData.receiverAuth0Id)
      if (receiver) {
        await this.prisma.wallet.update({
          where: { userId: receiver.id },
          data: {
            redeemableBalance: { increment: complimentData.coins },
          },
        })
      }
    }
    
    // Update other users' balances for compliments to Gabriel
    for (const complimentData of COMPLIMENTS_TO_GABRIEL) {
      const sender = valorizeUsers.find(u => u.auth0Id === complimentData.senderAuth0Id)
      if (sender) {
        await this.prisma.wallet.update({
          where: { userId: sender.id },
          data: {
            complimentBalance: { decrement: complimentData.coins },
          },
        })
      }
    }
    
    this.logComplete(createdCount, 'compliments')
    this.logInfo(`Gabriel sent ${totalCoinsFromGabriel} coins and received ${totalCoinsToGabriel} coins`)
  }
}
