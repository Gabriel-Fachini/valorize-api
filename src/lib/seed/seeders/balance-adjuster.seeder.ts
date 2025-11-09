/**
 * Balance adjuster seeder - distributes coins to achieve realistic economy dashboard metrics
 * This seeder efficiently adjusts user wallet balances via batch SQL operation
 */

import { BaseSeeder } from './base.seeder'

export class BalanceAdjusterSeeder extends BaseSeeder {
  protected get name(): string {
    return 'balance adjustments'
  }

  async seed(): Promise<void> {
    this.logStart()

    const VALORIZE_COMPANY_ID = 'demo-company-001'
    const TARGET_CIRCULATION = 138888 // Target coins in circulation
    const CONVERSION_RATE = 0.06 // BRL per coin

    // Get Valorize Corp users
    const users = await this.prisma.user.findMany({
      where: { companyId: VALORIZE_COMPANY_ID },
    })

    if (users.length === 0) {
      this.logWarning('No users found for Valorize Corp')
      return
    }

    // Calculate coins to distribute (approximately 2,184 per user for 50 users)
    const coinsPerUser = Math.floor(TARGET_CIRCULATION / users.length)
    const totalCoinsToAdd = coinsPerUser * users.length

    // Distribute coins to all users via batch SQL operation
    await this.prisma.$executeRaw`
      UPDATE wallets
      SET redeemable_balance = redeemable_balance + ${coinsPerUser}
      WHERE user_id IN (
        SELECT id FROM users WHERE company_id = ${VALORIZE_COMPANY_ID}
      )
    `

    const equivalentBRL = totalCoinsToAdd * CONVERSION_RATE
    this.logComplete(users.length, 'users updated')
    this.logInfo(`   📊 Distributed ${totalCoinsToAdd.toLocaleString()} moedas (~R$ ${equivalentBRL.toLocaleString('pt-BR', { maximumFractionDigits: 2 })})`)
    this.logInfo(`   👥 ${coinsPerUser.toLocaleString()} moedas per user`)
  }
}
