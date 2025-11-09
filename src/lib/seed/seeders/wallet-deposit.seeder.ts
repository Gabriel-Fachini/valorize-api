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

      // Create deposit history - 3 monthly recharges of R$ 10,000 each
      const deposits = [
        {
          amount: new Decimal('10000.00'),
          status: 'completed' as const,
          paymentMethod: 'pix',
          depositedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // ~90 days ago (month 1)
        },
        {
          amount: new Decimal('10000.00'),
          status: 'completed' as const,
          paymentMethod: 'pix',
          depositedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // ~60 days ago (month 2)
        },
        {
          amount: new Decimal('10000.00'),
          status: 'completed' as const,
          paymentMethod: 'boleto',
          depositedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // ~30 days ago (month 3)
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
