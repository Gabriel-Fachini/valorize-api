/**
 * Redemption seeder - creates sample prize redemptions with addresses and tracking
 */

import { BaseSeeder } from './base.seeder'
import {
  GABRIEL_REDEMPTIONS,
  COMPANY_REDEMPTIONS,
  GABRIEL_ADDRESS,
  SAMPLE_ADDRESSES,
  daysAgo,
} from '../data/redemptions'
import { GABRIEL_AUTH0_ID, VALORIZE_COMPANY_ID } from '../data/compliments'

export class RedemptionSeeder extends BaseSeeder {
  protected get name(): string {
    return 'redemptions'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    // Get Gabriel's user
    const gabriel = await this.prisma.user.findUnique({
      where: { auth0Id: GABRIEL_AUTH0_ID },
      include: { wallet: true },
    })
    
    if (!gabriel || !gabriel.wallet) {
      this.logWarning('Gabriel user or wallet not found, skipping redemption seeding')
      return
    }

    // Get Valorize company
    const valorizeCompany = await this.prisma.company.findFirst({
      where: { id: VALORIZE_COMPANY_ID },
    })

    if (!valorizeCompany) {
      this.logWarning('Valorize company not found, skipping redemption seeding')
      return
    }

    let redemptionCount = 0
    let addressCount = 0
    let trackingCount = 0
    let totalCoinsSpent = 0

    // Create Gabriel's address
    const gabrielAddress = await this.prisma.address.create({
      data: {
        userId: gabriel.id,
        ...GABRIEL_ADDRESS,
      },
    })
    addressCount++

    // Create Gabriel's redemptions
    for (const redemptionData of GABRIEL_REDEMPTIONS) {
      // Find the prize by name
      const prize = await this.prisma.prize.findFirst({
        where: {
          name: redemptionData.prizeName,
        },
        include: {
          variants: true,
        },
      })

      if (!prize) {
        this.logWarning(`Prize "${redemptionData.prizeName}" not found, skipping`)
        continue
      }

      // Find the variant if specified
      let variantId: string | null = null
      if (redemptionData.variantValue && prize.variants.length > 0) {
        const variant = prize.variants.find(v => v.value === redemptionData.variantValue)
        if (variant) {
          variantId = variant.id
        }
      }

      // Determine redemption date based on status
      let redeemedAt = new Date()
      if (redemptionData.status === 'delivered') {
        redeemedAt = daysAgo(10) // 10 days ago
      } else if (redemptionData.status === 'shipped') {
        redeemedAt = daysAgo(5) // 5 days ago
      } else if (redemptionData.status === 'processing') {
        redeemedAt = daysAgo(2) // 2 days ago
      } else {
        redeemedAt = daysAgo(1) // 1 day ago
      }

      // Create redemption
      const redemption = await this.prisma.redemption.create({
        data: {
          userId: gabriel.id,
          prizeId: prize.id,
          variantId,
          companyId: valorizeCompany.id,
          addressId: gabrielAddress.id,
          coinsSpent: redemptionData.coinsSpent,
          status: redemptionData.status,
          trackingCode: redemptionData.trackingCode,
          redeemedAt,
        },
      })

      // Create tracking entries
      for (let i = 0; i < redemptionData.tracking.length; i++) {
        const trackingData = redemptionData.tracking[i]
        const trackingDate = new Date(redeemedAt)
        trackingDate.setHours(trackingDate.getHours() + i * 24) // Each tracking entry 24 hours apart

        await this.prisma.redemptionTracking.create({
          data: {
            redemptionId: redemption.id,
            status: trackingData.status,
            notes: trackingData.notes,
            createdBy: trackingData.createdBy,
            createdAt: trackingDate,
          },
        })
        trackingCount++
      }

      totalCoinsSpent += redemptionData.coinsSpent
      redemptionCount++

      // Update prize stock (decrease by 1)
      await this.prisma.prize.update({
        where: { id: prize.id },
        data: { stock: { decrement: 1 } },
      })

      // Update variant stock if applicable
      if (variantId) {
        await this.prisma.prizeVariant.update({
          where: { id: variantId },
          data: { stock: { decrement: 1 } },
        })
      }
    }

    // Create wallet transaction for Gabriel's redemptions (debit redeemable balance)
    const currentRedeemableBalance = gabriel.wallet.redeemableBalance
    const newRedeemableBalance = currentRedeemableBalance - totalCoinsSpent

    await this.prisma.walletTransaction.create({
      data: {
        walletId: gabriel.wallet.id,
        userId: gabriel.id,
        transactionType: 'DEBIT',
        balanceType: 'REDEEMABLE',
        amount: totalCoinsSpent,
        previousBalance: currentRedeemableBalance,
        newBalance: newRedeemableBalance,
        reason: 'Prize redemptions',
        metadata: {
          type: 'batch_redemptions',
          redemptionCount: redemptionCount,
          automatic: true,
        },
      },
    })

    // Update Gabriel's wallet balance
    await this.prisma.wallet.update({
      where: { id: gabriel.wallet.id },
      data: { redeemableBalance: newRedeemableBalance },
    })

    // Create redemptions for other users
    for (const redemptionData of COMPANY_REDEMPTIONS) {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { auth0Id: redemptionData.userAuth0Id },
        include: { wallet: true },
      })

      if (!user || !user.wallet) {
        this.logWarning(`User "${redemptionData.userAuth0Id}" not found, skipping`)
        continue
      }

      // Create address for user if not exists
      const addressData = SAMPLE_ADDRESSES.find(a => a.userAuth0Id === redemptionData.userAuth0Id)
      if (!addressData) {
        this.logWarning(`Address data for user "${redemptionData.userAuth0Id}" not found, skipping`)
        continue
      }

      const userAddress = await this.prisma.address.create({
        data: {
          userId: user.id,
          ...addressData.address,
        },
      })
      addressCount++

      // Find the prize
      const prize = await this.prisma.prize.findFirst({
        where: { name: redemptionData.prizeName },
        include: { variants: true },
      })

      if (!prize) {
        this.logWarning(`Prize "${redemptionData.prizeName}" not found, skipping`)
        continue
      }

      // Find variant
      let variantId: string | null = null
      if (redemptionData.variantValue && prize.variants.length > 0) {
        const variant = prize.variants.find(v => v.value === redemptionData.variantValue)
        if (variant) {
          variantId = variant.id
        }
      }

      // Determine redemption date
      let redeemedAt = new Date()
      if (redemptionData.status === 'delivered') {
        redeemedAt = daysAgo(15)
      } else if (redemptionData.status === 'shipped') {
        redeemedAt = daysAgo(7)
      }

      // Create redemption
      const redemption = await this.prisma.redemption.create({
        data: {
          userId: user.id,
          prizeId: prize.id,
          variantId,
          companyId: valorizeCompany.id,
          addressId: userAddress.id,
          coinsSpent: redemptionData.coinsSpent,
          status: redemptionData.status,
          trackingCode: redemptionData.trackingCode,
          redeemedAt,
        },
      })

      // Create tracking entries
      for (let i = 0; i < redemptionData.tracking.length; i++) {
        const trackingData = redemptionData.tracking[i]
        const trackingDate = new Date(redeemedAt)
        trackingDate.setHours(trackingDate.getHours() + i * 48) // Each tracking 48 hours apart

        await this.prisma.redemptionTracking.create({
          data: {
            redemptionId: redemption.id,
            status: trackingData.status,
            notes: trackingData.notes,
            createdBy: trackingData.createdBy,
            createdAt: trackingDate,
          },
        })
        trackingCount++
      }

      // Update prize stock
      await this.prisma.prize.update({
        where: { id: prize.id },
        data: { stock: { decrement: 1 } },
      })

      if (variantId) {
        await this.prisma.prizeVariant.update({
          where: { id: variantId },
          data: { stock: { decrement: 1 } },
        })
      }

      // Create wallet transaction for user
      const userCurrentBalance = user.wallet.redeemableBalance
      const userNewBalance = userCurrentBalance - redemptionData.coinsSpent

      await this.prisma.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          userId: user.id,
          transactionType: 'DEBIT',
          balanceType: 'REDEEMABLE',
          amount: redemptionData.coinsSpent,
          previousBalance: userCurrentBalance,
          newBalance: userNewBalance,
          reason: `Prize redemption: ${redemptionData.prizeName}`,
          metadata: {
            redemptionId: redemption.id,
            prizeName: redemptionData.prizeName,
            type: 'redemption',
            automatic: true,
          },
        },
      })

      // Update user wallet
      await this.prisma.wallet.update({
        where: { id: user.wallet.id },
        data: { redeemableBalance: userNewBalance },
      })

      redemptionCount++
    }

    this.logComplete(redemptionCount, 'redemptions')
    this.logInfo(`Created ${addressCount} addresses`)
    this.logInfo(`Created ${trackingCount} tracking entries`)
    this.logInfo(`Total coins spent: ${totalCoinsSpent + COMPANY_REDEMPTIONS.reduce((sum, r) => sum + r.coinsSpent, 0)}`)
  }
}
