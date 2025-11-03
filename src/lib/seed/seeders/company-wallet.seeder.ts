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
      await this.prisma.companyWallet.upsert({
        where: { companyId: company.id },
        update: {},
        create: {
          companyId: company.id,
          balance: new Decimal('37655.00'),
          totalDeposited: new Decimal('50000.00'),
          totalSpent: new Decimal('12345.00'),
          overdraftLimit: new Decimal('45186.00'), // 120% do ideal
        },
      })

      this.logInfo(
        `   💰 Company "${company.name}" wallet initialized with R$ 37.655,00 balance`,
      )
    }

    this.logComplete(companies.length, 'company wallets')
  }
}
