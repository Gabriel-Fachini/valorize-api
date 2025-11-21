/**
 * Batch Wallet Updater - Utility for efficient bulk wallet balance updates
 * Uses raw SQL for optimal performance instead of individual Prisma updates
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface WalletUpdate {
  userId: string
  complimentBalance?: number | Decimal
  redeemableBalance?: number | Decimal
}

export class BatchWalletUpdater {
  constructor(private prisma: PrismaClient) {}

  /**
   * Update compliment balances for multiple users in a single operation
   */
  async updateComplimentBalances(updates: WalletUpdate[]): Promise<void> {
    if (updates.length === 0) return

    // Build SQL CASE statement for efficient multi-user update
    const caseParts = updates
      .map(u => `WHEN '${u.userId}' THEN ${Number(u.complimentBalance) || 0}`)
      .join(' ')

    const userIds = updates.map(u => `'${u.userId}'`).join(',')

    await this.prisma.$executeRawUnsafe(`
      UPDATE wallets
      SET compliment_balance = CASE user_id
        ${caseParts}
        ELSE compliment_balance
      END
      WHERE user_id IN (${userIds})
    `)
  }

  /**
   * Update redeemable balances for multiple users in a single operation
   */
  async updateRedeemableBalances(updates: WalletUpdate[]): Promise<void> {
    if (updates.length === 0) return

    // Build SQL CASE statement for efficient multi-user update
    const caseParts = updates
      .map(u => `WHEN '${u.userId}' THEN ${Number(u.redeemableBalance) || 0}`)
      .join(' ')

    const userIds = updates.map(u => `'${u.userId}'`).join(',')

    await this.prisma.$executeRawUnsafe(`
      UPDATE wallets
      SET redeemable_balance = CASE user_id
        ${caseParts}
        ELSE redeemable_balance
      END
      WHERE user_id IN (${userIds})
    `)
  }

  /**
   * Update both compliment and redeemable balances for multiple users
   */
  async updateBothBalances(updates: WalletUpdate[]): Promise<void> {
    if (updates.length === 0) return

    // Build SQL CASE statements for both balance types
    const complimentCaseParts = updates
      .filter(u => u.complimentBalance !== undefined)
      .map(u => `WHEN '${u.userId}' THEN ${Number(u.complimentBalance) || 0}`)
      .join(' ')

    const redeemableCaseParts = updates
      .filter(u => u.redeemableBalance !== undefined)
      .map(u => `WHEN '${u.userId}' THEN ${Number(u.redeemableBalance) || 0}`)
      .join(' ')

    const userIds = updates.map(u => `'${u.userId}'`).join(',')

    let sql = 'UPDATE wallets SET '

    if (complimentCaseParts) {
      sql += `compliment_balance = CASE user_id ${complimentCaseParts} ELSE compliment_balance END`
    }

    if (redeemableCaseParts) {
      sql += complimentCaseParts ? ', ' : ''
      sql += `redeemable_balance = CASE user_id ${redeemableCaseParts} ELSE redeemable_balance END`
    }

    sql += ` WHERE user_id IN (${userIds})`

    await this.prisma.$executeRawUnsafe(sql)
  }

  /**
   * Batch create wallet transactions (more efficient than createMany for this use case)
   */
  async createBatchTransactions(
    transactions: Array<{
      walletId: string
      userId: string
      transactionType: string
      balanceType: string
      amount: number
      previousBalance: number
      newBalance: number
      reason: string
      metadata?: Record<string, unknown>
      createdAt?: Date
    }>,
  ): Promise<void> {
    if (transactions.length === 0) return

    // Transform metadata to be compatible with Prisma JSON type
    const transformedTransactions = transactions.map(t => ({
      ...t,
      metadata: t.metadata ? JSON.parse(JSON.stringify(t.metadata)) : undefined,
    }))

    await this.prisma.walletTransaction.createMany({
      data: transformedTransactions,
    })
  }
}
