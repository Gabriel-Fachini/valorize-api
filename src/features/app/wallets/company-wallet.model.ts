import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { CompanyWallet, Prisma } from '@prisma/client'

export type CompanyWalletData = Omit<CompanyWallet, 'createdAt' | 'updatedAt'>

export class InsufficientCompanyBalanceError extends Error {
  constructor() {
    super('Insufficient company wallet balance')
    this.name = 'InsufficientCompanyBalanceError'
  }
}

export class CompanyWalletModel {
  public balance: number
  public totalDeposited: number
  public totalSpent: number

  constructor(private data: CompanyWalletData) {
    this.balance = data.balance.toNumber()
    this.totalDeposited = data.totalDeposited.toNumber()
    this.totalSpent = data.totalSpent.toNumber()
  }

  static async findByCompanyId(
    companyId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<CompanyWalletModel | null> {
    const db = tx ?? prisma
    try {
      const wallet = await db.companyWallet.findUnique({
        where: { companyId },
      })
      if (!wallet) return null
      return new CompanyWalletModel(wallet)
    } catch (error) {
      logger.error('Error finding company wallet', { error, companyId })
      throw new Error('Failed to retrieve company wallet.')
    }
  }

  /**
   * Debita valor da wallet da empresa
   * @param companyId ID da empresa
   * @param amountBRL Valor em reais (BRL)
   * @param tx Transaction client do Prisma
   * @param reason Motivo do débito (para logs)
   * @param metadata Metadados adicionais (JSON)
   */
  static async debitBalance(
    companyId: string,
    amountBRL: number,
    tx: Prisma.TransactionClient,
    reason = 'Bulk voucher redemption',
    metadata?: Prisma.JsonObject,
  ): Promise<CompanyWalletModel> {
    try {
      // 1. Buscar wallet atual
      const currentWallet = await tx.companyWallet.findUnique({
        where: { companyId },
      })

      if (!currentWallet) {
        throw new Error('Company wallet not found')
      }

      const previousBalance = currentWallet.balance.toNumber()
      const newBalance = previousBalance - amountBRL

      // 2. Verificar se tem saldo suficiente (sem overdraft - não permite saldo negativo)
      if (newBalance < 0) {
        logger.warn('Insufficient company wallet balance', {
          companyId,
          previousBalance,
          amountBRL,
          newBalance,
          reason,
        })
        throw new InsufficientCompanyBalanceError()
      }

      // 3. Atualizar balance e totalSpent
      const updatedWallet = await tx.companyWallet.update({
        where: { companyId },
        data: {
          balance: { decrement: amountBRL },
          totalSpent: { increment: amountBRL },
        },
      })

      logger.info('Company wallet debited successfully', {
        companyId,
        amountBRL,
        previousBalance,
        newBalance: updatedWallet.balance.toNumber(),
        reason,
        metadata,
      })

      return new CompanyWalletModel(updatedWallet)
    } catch (error) {
      logger.error('Error debiting company wallet balance', {
        error,
        companyId,
        amountBRL,
        reason,
      })
      throw error
    }
  }

  /**
   * Credita valor de volta na wallet da empresa (usado em rollback)
   * @param companyId ID da empresa
   * @param amountBRL Valor em reais (BRL)
   * @param tx Transaction client do Prisma
   * @param reason Motivo do crédito (para logs)
   * @param metadata Metadados adicionais (JSON)
   */
  static async creditBalance(
    companyId: string,
    amountBRL: number,
    tx: Prisma.TransactionClient,
    reason = 'Bulk voucher redemption rollback',
    metadata?: Prisma.JsonObject,
  ): Promise<CompanyWalletModel> {
    try {
      const currentWallet = await tx.companyWallet.findUnique({
        where: { companyId },
      })

      if (!currentWallet) {
        throw new Error('Company wallet not found')
      }

      const previousBalance = currentWallet.balance.toNumber()

      // Creditar: aumenta balance, diminui totalSpent
      const updatedWallet = await tx.companyWallet.update({
        where: { companyId },
        data: {
          balance: { increment: amountBRL },
          totalSpent: { decrement: amountBRL },
        },
      })

      logger.info('Company wallet credited successfully (rollback)', {
        companyId,
        amountBRL,
        previousBalance,
        newBalance: updatedWallet.balance.toNumber(),
        reason,
        metadata,
      })

      return new CompanyWalletModel(updatedWallet)
    } catch (error) {
      logger.error('Error crediting company wallet balance', {
        error,
        companyId,
        amountBRL,
        reason,
      })
      throw error
    }
  }

  toJSON() {
    return {
      balance: this.balance,
      totalDeposited: this.totalDeposited,
      totalSpent: this.totalSpent,
    }
  }
}
