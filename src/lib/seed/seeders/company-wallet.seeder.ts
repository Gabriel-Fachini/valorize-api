/**
 * Company Wallet seeder - creates company wallets for testing economy dashboard
 */

import { BaseSeeder } from './base.seeder'
import { Decimal } from '@prisma/client/runtime/library'

export class CompanyWalletSeeder extends BaseSeeder {
  protected get name(): string {
    return 'company wallets'
  }

  async seed(): Promise<void> {
    this.logStart()

    const companies = await this.prisma.company.findMany()

    for (const company of companies) {
      // Calculate totalSpent: simulate ~109k moedas spent = R$ 6.550 (0.06/coin)
      // Valorize Corp gets more realistic spending for economy dashboard
      const totalSpent = company.id === 'demo-company-001'
        ? new Decimal('26550.00')  // +R$ 6.550 for ~109k moedas consumed
        : new Decimal('20000.00')   // other companies unchanged

      await this.prisma.companyWallet.upsert({
        where: { companyId: company.id },
        update: {},
        create: {
          companyId: company.id,
          balance: new Decimal('10000.00'),
          totalDeposited: new Decimal('30000.00'),
          totalSpent,
          overdraftLimit: new Decimal('12000.00'), // 120% do saldo atual
        },
      })

      this.logInfo(
        `   💰 Company "${company.name}" wallet initialized with R$ 10.000,00 balance (spent R$ 20.000,00)`,
      )
    }

    this.logComplete(companies.length, 'company wallets')
  }
}
