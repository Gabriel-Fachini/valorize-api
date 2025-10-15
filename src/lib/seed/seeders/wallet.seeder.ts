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
      // Give Gabriel (main demo user) a generous balance for testing
      const isGabriel = user.email === 'gabriel@valorize.com'
      
      await this.prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          complimentBalance: isGabriel ? 500 : 100,
          redeemableBalance: isGabriel ? 31950 : 0,
        },
      })
      
      if (isGabriel) {
        this.logInfo('   💰 Gabriel\'s wallet initialized with generous balance: 500 compliment, 31950 redeemable')
      }
    }
    
    this.logComplete(users.length, 'wallets')
  }
}
