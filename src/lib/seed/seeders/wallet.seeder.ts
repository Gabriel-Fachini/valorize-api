/**
 * Wallet seeder - creates wallets for all users
 */

import { BaseSeeder } from './base.seeder'

export class WalletSeeder extends BaseSeeder {
  protected get name(): string {
    return 'wallets'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    const users = await this.prisma.user.findMany()
    
    for (const user of users) {
      await this.prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          complimentBalance: 100,
          redeemableBalance: 0,
        },
      })
    }
    
    this.logComplete(users.length, 'wallets')
  }
}
