import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import {
  EconomyDashboardResponse,
  WalletBalanceCard,
  PrizeFundCard,
  RedeemableCoinsCard,
  ComplimentEngagementCard,
  RedemptionRateCard,
  EconomyAlert,
  WalletDepositHistoryItem,
  SuggestedDeposit,
  MetricStatus,
} from './economy.types'

// Constantes
const COIN_TO_BRL_RATE = 0.06
const IDEAL_RUNWAY_DAYS = 45
const WARNING_RUNWAY_DAYS = 30
const CRITICAL_RUNWAY_DAYS = 15

export const economyDashboardService = {
  /**
   * Get complete economy dashboard
   */
  async getEconomyDashboard(companyId: string): Promise<EconomyDashboardResponse> {
    logger.info(`Fetching economy dashboard for company ${companyId}`)

    const [
      walletBalance,
      prizeFund,
      redeemableCoins,
      complimentEngagement,
      redemptionRate,
      depositHistory,
    ] = await Promise.all([
      this.getWalletBalanceCard(companyId),
      this.getPrizeFundCard(companyId),
      this.getRedeemableCoinsCard(companyId),
      this.getComplimentEngagementCard(companyId),
      this.getRedemptionRateCard(companyId),
      this.getDepositHistory(companyId, 10),
    ])

    const alerts = this.generateAlerts({
      walletBalance,
      prizeFund,
      complimentEngagement,
      redemptionRate,
      redeemableCoins,
    })

    const suggestedDeposit = this.calculateSuggestedDeposit(prizeFund, walletBalance)

    return {
      wallet_balance: walletBalance,
      prize_fund: prizeFund,
      redeemable_coins: redeemableCoins,
      compliment_engagement: complimentEngagement,
      redemption_rate: redemptionRate,
      alerts,
      deposit_history: depositHistory,
      suggested_deposit: suggestedDeposit,
    }
  },

  /**
   * Card 0: Saldo da Carteira
   */
  async getWalletBalanceCard(companyId: string): Promise<WalletBalanceCard> {
    let wallet = await prisma.companyWallet.findUnique({
      where: { companyId },
    })

    if (!wallet) {
      wallet = await prisma.companyWallet.create({
        data: { companyId },
      })
    }

    const balance = wallet.balance.toNumber()
    const totalLoaded = wallet.totalDeposited.toNumber()
    const totalSpent = wallet.totalSpent.toNumber()
    const overdraftLimit = wallet.overdraftLimit.toNumber()

    const avgMonthlyConsumption = await this.calculateAvgMonthlyConsumption(companyId)
    const idealBalance = avgMonthlyConsumption * (IDEAL_RUNWAY_DAYS / 30)
    const percentageOfIdeal = idealBalance > 0 ? (balance / idealBalance) * 100 : 100

    let status: MetricStatus = 'healthy'
    if (percentageOfIdeal < 30) status = 'critical'
    else if (percentageOfIdeal < 70) status = 'warning'

    return {
      total_loaded: totalLoaded,
      total_spent: totalSpent,
      available_balance: balance,
      overdraft_limit: overdraftLimit,
      percentage_of_ideal: Math.round(percentageOfIdeal),
      status,
    }
  },

  /**
   * Card 1: Carteira de Prêmios (com Runway)
   */
  async getPrizeFundCard(companyId: string): Promise<PrizeFundCard> {
    const wallet = await prisma.companyWallet.findUnique({
      where: { companyId },
    })

    const balance = wallet?.balance.toNumber() ?? 0
    const avgMonthlyConsumption = await this.calculateAvgMonthlyConsumption(companyId)
    const runwayDays =
      avgMonthlyConsumption > 0 ? Math.floor((balance / avgMonthlyConsumption) * 30) : 999

    let status: MetricStatus = 'healthy'
    if (runwayDays < CRITICAL_RUNWAY_DAYS) status = 'critical'
    else if (runwayDays < WARNING_RUNWAY_DAYS) status = 'warning'

    return {
      current_balance: balance,
      avg_monthly_consumption: avgMonthlyConsumption,
      runway_days: runwayDays,
      status,
    }
  },

  /**
   * Card 2: Moedas de Resgate Ativas
   */
  async getRedeemableCoinsCard(companyId: string): Promise<RedeemableCoinsCard> {
    const result = await prisma.wallet.aggregate({
      where: {
        user: { companyId, isActive: true },
      },
      _sum: {
        redeemableBalance: true,
      },
    })

    const totalCoins = result._sum.redeemableBalance ?? 0
    const equivalentInBRL = totalCoins * COIN_TO_BRL_RATE

    const companyWallet = await prisma.companyWallet.findUnique({
      where: { companyId },
    })
    const walletBalance = companyWallet?.balance.toNumber() ?? 0

    const coverageIndex = equivalentInBRL > 0 ? (walletBalance / equivalentInBRL) * 100 : 100

    let status: MetricStatus = 'healthy'
    if (coverageIndex < 80) status = 'critical'
    else if (coverageIndex < 120) status = 'warning'
    else if (coverageIndex > 200) status = 'excess'

    return {
      total_in_circulation: totalCoins,
      equivalent_in_brl: Math.round(equivalentInBRL * 100) / 100,
      coverage_index: Math.round(coverageIndex),
      status,
    }
  },

  /**
   * Card 3: Engajamento de Elogios
   */
  async getComplimentEngagementCard(companyId: string): Promise<ComplimentEngagementCard> {
    const settings = await prisma.companySettings.findUnique({
      where: { companyId },
    })
    const weeklyRenewal = settings?.weeklyRenewalAmount ?? 100

    const activeUsers = await prisma.user.count({
      where: { companyId, isActive: true },
    })

    const distributedThisWeek = activeUsers * weeklyRenewal

    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)

    const usedResult = await prisma.compliment.aggregate({
      where: {
        companyId,
        createdAt: { gte: startOfWeek },
      },
      _sum: { coins: true },
    })

    const used = usedResult._sum.coins ?? 0
    const wasted = distributedThisWeek - used
    const usageRate = distributedThisWeek > 0 ? (used / distributedThisWeek) * 100 : 0

    let status: MetricStatus = 'healthy'
    if (usageRate < 50) status = 'critical'
    else if (usageRate < 70) status = 'warning'

    return {
      distributed_this_week: distributedThisWeek,
      used,
      wasted,
      usage_rate: Math.round(usageRate),
      status,
    }
  },

  /**
   * Card 4: Taxa de Resgate Mensal
   */
  async getRedemptionRateCard(companyId: string): Promise<RedemptionRateCard> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const redeemedResult = await prisma.redemption.aggregate({
      where: {
        companyId,
        redeemedAt: { gte: startOfMonth },
      },
      _sum: { coinsSpent: true },
    })

    const coinsRedeemed = redeemedResult._sum.coinsSpent ?? 0

    const issuedResult = await prisma.compliment.aggregate({
      where: {
        companyId,
        createdAt: { gte: startOfMonth },
      },
      _sum: { coins: true },
    })

    const coinsIssued = issuedResult._sum.coins ?? 0

    const redemptionPercentage = coinsIssued > 0 ? (coinsRedeemed / coinsIssued) * 100 : 0

    let status: MetricStatus = 'healthy'
    if (redemptionPercentage < 15) status = 'warning'
    else if (redemptionPercentage > 60) status = 'warning'

    return {
      coins_redeemed_this_month: coinsRedeemed,
      coins_issued_this_month: coinsIssued,
      redemption_percentage: Math.round(redemptionPercentage),
      status,
    }
  },

  /**
   * Histórico de Carregamentos
   */
  async getDepositHistory(
    companyId: string,
    limit: number = 10,
  ): Promise<WalletDepositHistoryItem[]> {
    const wallet = await prisma.companyWallet.findUnique({
      where: { companyId },
    })

    if (!wallet) return []

    const deposits = await prisma.walletDeposit.findMany({
      where: { companyWalletId: wallet.id },
      orderBy: { depositedAt: 'desc' },
      take: limit,
    })

    return deposits.map((deposit) => ({
      id: deposit.id,
      amount: deposit.amount.toNumber(),
      status: deposit.status as 'completed' | 'pending' | 'failed',
      payment_method: deposit.paymentMethod ?? undefined,
      deposited_at: deposit.depositedAt.toISOString(),
      resulting_balance: 0, // Simplificado para MVP
    }))
  },

  /**
   * Calcular consumo médio mensal
   */
  async calculateAvgMonthlyConsumption(companyId: string): Promise<number> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await prisma.redemption.aggregate({
      where: {
        companyId,
        redeemedAt: { gte: thirtyDaysAgo },
      },
      _sum: { coinsSpent: true },
    })

    const totalCoinsSpent = result._sum.coinsSpent ?? 0
    const totalInBRL = totalCoinsSpent * COIN_TO_BRL_RATE

    return Math.round(totalInBRL * 100) / 100
  },

  /**
   * Gerar alertas automáticos
   */
  generateAlerts(metrics: {
    walletBalance: WalletBalanceCard
    prizeFund: PrizeFundCard
    complimentEngagement: ComplimentEngagementCard
    redemptionRate: RedemptionRateCard
    redeemableCoins: RedeemableCoinsCard
  }): EconomyAlert[] {
    const alerts: EconomyAlert[] = []

    if (metrics.walletBalance.percentage_of_ideal < 30) {
      alerts.push({
        id: 'wallet-critical',
        priority: 'critical',
        title: 'Carteira de Prêmios Crítica',
        description: `Saldo está abaixo de 30% do ideal (${metrics.walletBalance.percentage_of_ideal}%)`,
        recommended_action: 'Carregar saldo imediatamente',
        dismissible: false,
      })
    }

    if (metrics.prizeFund.runway_days < CRITICAL_RUNWAY_DAYS) {
      alerts.push({
        id: 'runway-critical',
        priority: 'critical',
        title: 'Runway Crítico',
        description: `Saldo esgotará em ${metrics.prizeFund.runway_days} dias`,
        recommended_action: 'Fazer aporte urgente',
        dismissible: false,
      })
    } else if (metrics.prizeFund.runway_days < WARNING_RUNWAY_DAYS) {
      alerts.push({
        id: 'runway-warning',
        priority: 'warning',
        title: 'Runway em Atenção',
        description: `Saldo esgotará em ${metrics.prizeFund.runway_days} dias`,
        recommended_action: 'Considerar novo aporte',
        dismissible: true,
      })
    }

    if (metrics.complimentEngagement.usage_rate < 50) {
      alerts.push({
        id: 'engagement-low',
        priority: 'critical',
        title: 'Engajamento Muito Baixo',
        description: `Taxa de uso: ${metrics.complimentEngagement.usage_rate}%`,
        recommended_action: 'Revisar estratégia de comunicação',
        dismissible: true,
      })
    } else if (metrics.complimentEngagement.usage_rate < 70) {
      alerts.push({
        id: 'engagement-warning',
        priority: 'warning',
        title: 'Engajamento Abaixo do Ideal',
        description: `Taxa de uso: ${metrics.complimentEngagement.usage_rate}%`,
        recommended_action: 'Incentivar uso de elogios',
        dismissible: true,
      })
    }

    if (metrics.redemptionRate.redemption_percentage < 15) {
      alerts.push({
        id: 'redemption-low',
        priority: 'warning',
        title: 'Taxa de Resgate Baixa',
        description: 'Usuários não estão resgatando prêmios',
        recommended_action: 'Revisar catálogo de prêmios',
        dismissible: true,
      })
    } else if (metrics.redemptionRate.redemption_percentage > 60) {
      alerts.push({
        id: 'redemption-high',
        priority: 'warning',
        title: 'Taxa de Resgate Muito Alta',
        description: 'Verificar possível anomalia',
        recommended_action: 'Auditar resgates recentes',
        dismissible: true,
      })
    }

    if (metrics.redeemableCoins.coverage_index < 80) {
      alerts.push({
        id: 'coverage-critical',
        priority: 'critical',
        title: 'Índice de Cobertura Crítico',
        description: `Saldo não cobre moedas em circulação (${metrics.redeemableCoins.coverage_index}%)`,
        recommended_action: 'Aporte urgente necessário',
        dismissible: false,
      })
    }

    return alerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return order[a.priority] - order[b.priority]
    })
  },

  /**
   * Sugestão inteligente de aporte
   */
  calculateSuggestedDeposit(
    prizeFund: PrizeFundCard,
    walletBalance: WalletBalanceCard,
  ): SuggestedDeposit | undefined {
    if (prizeFund.runway_days >= WARNING_RUNWAY_DAYS) {
      return undefined
    }

    const targetBalance = prizeFund.avg_monthly_consumption * (IDEAL_RUNWAY_DAYS / 30)
    const suggestedAmount = targetBalance - walletBalance.available_balance

    if (suggestedAmount <= 0) {
      return undefined
    }

    return {
      amount: Math.ceil(suggestedAmount),
      reason: `Para manter ${IDEAL_RUNWAY_DAYS} dias de cobertura`,
      target_runway_days: IDEAL_RUNWAY_DAYS,
    }
  },
}
