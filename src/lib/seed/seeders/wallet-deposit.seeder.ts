/**
 * Wallet Deposit seeder - creates deposit history for company wallets for testing
 */

import { BaseSeeder } from './base.seeder'
import { Decimal } from '@prisma/client/runtime/library'

export class WalletDepositSeeder extends BaseSeeder {
  protected get name(): string {
    return 'wallet deposits'
  }

  async seed(): Promise<void> {
    this.logStart()

    const companies = await this.prisma.company.findMany()
    let totalDeposits = 0

    for (const company of companies) {
      const companyWallet = await this.prisma.companyWallet.findUnique({
        where: { companyId: company.id },
      })

      if (!companyWallet) {
        this.logWarning(`Company wallet not found for "${company.name}", skipping deposits`)
        continue
      }

      // Create deposit history - last 3 deposits
      const deposits = [
        {
          amount: new Decimal('20000.00'),
          status: 'completed' as const,
          paymentMethod: 'pix',
          depositedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          amount: new Decimal('15000.00'),
          status: 'completed' as const,
          paymentMethod: 'boleto',
          depositedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        },
        {
          amount: new Decimal('15000.00'),
          status: 'completed' as const,
          paymentMethod: 'pix',
          depositedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
      ]

      for (const deposit of deposits) {
        await this.prisma.walletDeposit.create({
          data: {
            companyWalletId: companyWallet.id,
            amount: deposit.amount,
            status: deposit.status,
            paymentMethod: deposit.paymentMethod,
            depositedAt: deposit.depositedAt,
            notes: 'Aporte de teste para o dashboard de economia',
          },
        })
        totalDeposits++
      }

      this.logInfo(`   📊 Created ${deposits.length} deposits for "${company.name}"`)
    }

    this.logComplete(totalDeposits, 'wallet deposits')
  }
}
