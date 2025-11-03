/**
 * Economy Dashboard Types
 */

export type MetricStatus = 'healthy' | 'warning' | 'critical' | 'excess'
export type AlertPriority = 'critical' | 'warning' | 'info'

export interface WalletBalanceCard {
  total_loaded: number // R$
  total_spent: number // R$
  available_balance: number // R$
  overdraft_limit: number // R$
  percentage_of_ideal: number // %
  status: MetricStatus
}

export interface PrizeFundCard {
  current_balance: number // R$
  avg_monthly_consumption: number // R$
  runway_days: number
  status: MetricStatus
}

export interface RedeemableCoinsCard {
  total_in_circulation: number // moedas
  equivalent_in_brl: number // R$
  coverage_index: number // %
  status: MetricStatus
}

export interface ComplimentEngagementCard {
  distributed_this_week: number // moedas
  used: number // moedas
  wasted: number // moedas
  usage_rate: number // %
  status: MetricStatus
}

export interface RedemptionRateCard {
  coins_redeemed_this_month: number
  coins_issued_this_month: number
  redemption_percentage: number // %
  status: MetricStatus
}

export interface EconomyAlert {
  id: string
  priority: AlertPriority
  title: string
  description: string
  recommended_action?: string
  dismissible: boolean
}

export interface WalletDepositHistoryItem {
  id: string
  amount: number // R$
  status: 'completed' | 'pending' | 'failed'
  payment_method?: string
  deposited_at: string // ISO
  resulting_balance: number // R$
}

export interface SuggestedDeposit {
  amount: number // R$
  reason: string
  target_runway_days: number
}

export interface EconomyDashboardResponse {
  wallet_balance: WalletBalanceCard
  prize_fund: PrizeFundCard
  redeemable_coins: RedeemableCoinsCard
  compliment_engagement: ComplimentEngagementCard
  redemption_rate: RedemptionRateCard
  alerts: EconomyAlert[]
  deposit_history: WalletDepositHistoryItem[]
  suggested_deposit?: SuggestedDeposit
}
