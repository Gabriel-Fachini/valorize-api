/**
 * Transaction seeder - creates wallet transaction records
 * Note: Compliment transactions are automatically created by ComplimentSeeder
 * This seeder adds additional sample transactions for demonstration
 */

import { Prisma } from '@prisma/client'
import { BaseSeeder } from './base.seeder'
import { 
  SAMPLE_ADDITIONAL_TRANSACTIONS,
  TRANSACTION_DATA,
} from '../data/transactions'
import { GABRIEL_AUTH0_ID } from '../data/compliments'

export class TransactionSeeder extends BaseSeeder {
  protected get name(): string {
    return 'wallet transactions'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    // Get Gabriel's user and wallet
    const gabriel = await this.prisma.user.findUnique({
      where: { auth0Id: GABRIEL_AUTH0_ID },
      include: { wallet: true },
    })
    
    if (!gabriel || !gabriel.wallet) {
      this.logWarning('Gabriel user or wallet not found, skipping additional transaction seeding')
      return
    }

    let createdCount = 0
    let currentComplimentBalance = gabriel.wallet.complimentBalance
    let currentRedeemableBalance = gabriel.wallet.redeemableBalance

    // Create additional sample transactions
    for (const transactionData of SAMPLE_ADDITIONAL_TRANSACTIONS) {
      const isComplimentBalance = transactionData.balanceType === 'COMPLIMENT'
      const isCredit = transactionData.transactionType === 'CREDIT'
      
      const previousBalance = isComplimentBalance 
        ? currentComplimentBalance 
        : currentRedeemableBalance
      
      const newBalance = isCredit 
        ? previousBalance + transactionData.amount
        : previousBalance - transactionData.amount

      // Generate metadata based on type
      let metadata: Prisma.JsonObject | null = null
      
      switch (transactionData.metadataType) {
        case 'monthlyAllowance':
          metadata = TRANSACTION_DATA.METADATA_EXAMPLES.monthlyAllowance() as Prisma.JsonObject
          break
        case 'bonus':
          metadata = TRANSACTION_DATA.METADATA_EXAMPLES.bonus(
            transactionData.metadataValue ?? 'Achievement',
          ) as Prisma.JsonObject
          break
        case 'adminAction':
          metadata = TRANSACTION_DATA.METADATA_EXAMPLES.adminAction(
            'system',
            transactionData.metadataValue ?? 'System adjustment',
          ) as Prisma.JsonObject
          break
      }

      // Create transaction record
      await this.prisma.walletTransaction.create({
        data: {
          walletId: gabriel.wallet.id,
          userId: gabriel.id,
          transactionType: transactionData.transactionType,
          balanceType: transactionData.balanceType,
          amount: transactionData.amount,
          previousBalance,
          newBalance,
          reason: transactionData.reason,
          metadata: metadata ?? undefined,
        },
      })

      // Update current balance for next iteration
      if (isComplimentBalance) {
        currentComplimentBalance = newBalance
      } else {
        currentRedeemableBalance = newBalance
      }
      
      createdCount++
    }

    // Update Gabriel's wallet with final balances
    await this.prisma.wallet.update({
      where: { id: gabriel.wallet.id },
      data: {
        complimentBalance: currentComplimentBalance,
        redeemableBalance: currentRedeemableBalance,
      },
    })

    this.logComplete(createdCount, 'additional sample transactions')
    this.logInfo(`💰 Updated Gabriel's wallet: ${currentComplimentBalance} compliment, ${currentRedeemableBalance} redeemable`)
  }
}
