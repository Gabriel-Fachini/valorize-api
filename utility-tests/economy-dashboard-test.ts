/**
 * Economy Dashboard Test Script
 *
 * This script tests the economy dashboard endpoint:
 * 1. Login as admin
 * 2. Request the economy dashboard data
 * 3. Verify and display all metrics and data validation
 *
 * Usage:
 *   npx tsx utility-tests/economy-dashboard-test.ts
 *
 * Or with custom credentials (environment variables):
 *   ADMIN_EMAIL=email@example.com ADMIN_PASSWORD=password npx tsx utility-tests/economy-dashboard-test.ts
 */

import { email as defaultEmail, password as defaultPassword } from './auth-constants'

const API_URL = process.env.API_URL || 'http://localhost:4000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || defaultEmail
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || defaultPassword

// Type definitions (matching backend)
type MetricStatus = 'healthy' | 'warning' | 'critical' | 'excess'
type AlertPriority = 'critical' | 'warning' | 'info'

interface WalletBalanceCard {
  total_loaded: number
  total_spent: number
  available_balance: number
  percentage_of_ideal: number
  status: MetricStatus
}

interface PrizeFundCard {
  current_balance: number
  avg_monthly_consumption: number
  runway_days: number
  status: MetricStatus
}

interface RedeemableCoinsCard {
  total_in_circulation: number
  equivalent_in_brl: number
  coverage_index: number
  status: MetricStatus
}

interface ComplimentEngagementCard {
  distributed_this_week: number
  used: number
  wasted: number
  usage_rate: number
  status: MetricStatus
}

interface RedemptionRateCard {
  coins_redeemed_this_month: number
  coins_issued_this_month: number
  redemption_percentage: number
  status: MetricStatus
}

interface EconomyAlert {
  id: string
  priority: AlertPriority
  title: string
  description: string
  recommended_action?: string
  dismissible: boolean
}

interface WalletDepositHistoryItem {
  id: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  payment_method?: string
  deposited_at: string
  resulting_balance: number
}

interface SuggestedDeposit {
  amount: number
  reason: string
  target_runway_days: number
}

interface EconomyDashboardResponse {
  wallet_balance: WalletBalanceCard
  prize_fund: PrizeFundCard
  redeemable_coins: RedeemableCoinsCard
  compliment_engagement: ComplimentEngagementCard
  redemption_rate: RedemptionRateCard
  alerts: EconomyAlert[]
  deposit_history: WalletDepositHistoryItem[]
  suggested_deposit?: SuggestedDeposit
}

interface LoginResponse {
  success: boolean
  data: {
    access_token: string
    user?: {
      id: string
      email: string
      name: string
    }
  }
}

class EconomyDashboardTester {
  private token: string = ''

  async run() {
    console.log('\n')
    console.log('🎯 Valorize API - Economy Dashboard Test')
    console.log('═════════════════════════════════════════\n')

    try {
      // Step 1: Login
      await this.login()

      // Step 2: Fetch economy dashboard
      const dashboard = await this.fetchEconomyDashboard()

      // Step 3: Validate and display data
      await this.validateAndDisplay(dashboard)

      console.log('\n✅ Test completed successfully!\n')
    } catch (error) {
      console.error('\n❌ Test failed:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  }

  private async login() {
    console.log('🔐 Step 1: Authenticating...')
    console.log(`   Email: ${ADMIN_EMAIL}\n`)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        }),
      })

      const data = (await response.json()) as LoginResponse

      if (!response.ok || !data.success) {
        throw new Error(
          `Login failed with status ${response.status}: ${JSON.stringify(data)}`
        )
      }

      this.token = data.data.access_token

      console.log('✓ Login successful')
      if (data.data.user) {
        console.log(`  User: ${data.data.user.name}`)
        console.log(`  Email: ${data.data.user.email}`)
      }
      console.log(`  Token: ${this.token.substring(0, 20)}...\n`)
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  private async fetchEconomyDashboard(): Promise<EconomyDashboardResponse> {
    console.log('📊 Step 2: Fetching economy dashboard...\n')

    try {
      const response = await fetch(`${API_URL}/admin/dashboard/economy`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed with status ${response.status}: ${errorData}`)
      }

      const dashboard = (await response.json()) as EconomyDashboardResponse
      console.log('✓ Dashboard data fetched successfully\n')

      return dashboard
    } catch (error) {
      throw new Error(
        `Failed to fetch economy dashboard: ${error instanceof Error ? error.message : error}`
      )
    }
  }

  private async validateAndDisplay(dashboard: EconomyDashboardResponse) {
    console.log('📈 Step 3: Displaying Dashboard Metrics\n')
    console.log('═════════════════════════════════════════\n')

    // Wallet Balance Card
    console.log('💰 WALLET BALANCE')
    console.log(`   Status: ${this.colorizeStatus(dashboard.wallet_balance.status)}`)
    console.log(`   Total Loaded: R$ ${this.formatCurrency(dashboard.wallet_balance.total_loaded)}`)
    console.log(`   Total Spent: R$ ${this.formatCurrency(dashboard.wallet_balance.total_spent)}`)
    console.log(`   Available Balance: R$ ${this.formatCurrency(dashboard.wallet_balance.available_balance)}`)
    console.log(`   Percentage of Ideal: ${dashboard.wallet_balance.percentage_of_ideal.toFixed(2)}%\n`)

    // Prize Fund Card
    console.log('🎁 PRIZE FUND')
    console.log(`   Status: ${this.colorizeStatus(dashboard.prize_fund.status)}`)
    console.log(`   Current Balance: R$ ${this.formatCurrency(dashboard.prize_fund.current_balance)}`)
    console.log(`   Avg Monthly Consumption: R$ ${this.formatCurrency(dashboard.prize_fund.avg_monthly_consumption)}`)
    console.log(`   Runway Days: ${dashboard.prize_fund.runway_days} days\n`)

    // Redeemable Coins Card
    console.log('🪙 REDEEMABLE COINS')
    console.log(`   Status: ${this.colorizeStatus(dashboard.redeemable_coins.status)}`)
    console.log(`   Total in Circulation: ${dashboard.redeemable_coins.total_in_circulation.toLocaleString()} moedas`)
    console.log(`   Equivalent in BRL: R$ ${this.formatCurrency(dashboard.redeemable_coins.equivalent_in_brl)}`)
    console.log(`   Coverage Index: ${dashboard.redeemable_coins.coverage_index.toFixed(2)}%\n`)

    // Compliment Engagement Card
    console.log('👏 COMPLIMENT ENGAGEMENT')
    console.log(`   Status: ${this.colorizeStatus(dashboard.compliment_engagement.status)}`)
    console.log(`   Distributed This Week: ${dashboard.compliment_engagement.distributed_this_week} moedas`)
    console.log(`   Used: ${dashboard.compliment_engagement.used} moedas`)
    console.log(`   Wasted: ${dashboard.compliment_engagement.wasted} moedas`)
    console.log(`   Usage Rate: ${dashboard.compliment_engagement.usage_rate.toFixed(2)}%\n`)

    // Redemption Rate Card
    console.log('🔄 REDEMPTION RATE')
    console.log(`   Status: ${this.colorizeStatus(dashboard.redemption_rate.status)}`)
    console.log(`   Coins Redeemed This Month: ${dashboard.redemption_rate.coins_redeemed_this_month}`)
    console.log(`   Coins Issued This Month: ${dashboard.redemption_rate.coins_issued_this_month}`)
    console.log(`   Redemption Percentage: ${dashboard.redemption_rate.redemption_percentage.toFixed(2)}%\n`)

    // Suggested Deposit
    if (dashboard.suggested_deposit) {
      console.log('💸 SUGGESTED DEPOSIT')
      console.log(`   Amount: R$ ${this.formatCurrency(dashboard.suggested_deposit.amount)}`)
      console.log(`   Reason: ${dashboard.suggested_deposit.reason}`)
      console.log(`   Target Runway Days: ${dashboard.suggested_deposit.target_runway_days} days\n`)
    }

    // Alerts
    if (dashboard.alerts.length > 0) {
      console.log('⚠️  ALERTS')
      for (const alert of dashboard.alerts) {
        const priorityColor = this.colorizePriority(alert.priority)
        console.log(`   [${priorityColor}] ${alert.title}`)
        console.log(`       ${alert.description}`)
        if (alert.recommended_action) {
          console.log(`       💡 Action: ${alert.recommended_action}`)
        }
        console.log('')
      }
    } else {
      console.log('✓ No alerts\n')
    }

    // Deposit History
    console.log('📜 DEPOSIT HISTORY (Last 10)')
    console.log('─────────────────────────────────────────')
    if (dashboard.deposit_history.length > 0) {
      for (const deposit of dashboard.deposit_history) {
        const statusEmoji = deposit.status === 'completed' ? '✓' : '⏳'
        console.log(
          `   ${statusEmoji} R$ ${this.formatCurrency(deposit.amount)} - ${deposit.status} (${new Date(deposit.deposited_at).toLocaleDateString()})`
        )
        if (deposit.payment_method) {
          console.log(`      Payment: ${deposit.payment_method} | Resulting: R$ ${this.formatCurrency(deposit.resulting_balance)}`)
        }
      }
    } else {
      console.log('   No deposit history')
    }
    console.log('\n')

    // Summary
    this.displaySummary(dashboard)
  }

  private displaySummary(dashboard: EconomyDashboardResponse) {
    console.log('═════════════════════════════════════════')
    console.log('📋 SUMMARY ANALYSIS\n')

    const balance = dashboard.wallet_balance.available_balance
    const monthlySpend = dashboard.prize_fund.avg_monthly_consumption
    const runwayDays = dashboard.prize_fund.runway_days
    const coverage = dashboard.redeemable_coins.coverage_index

    console.log('Key Metrics:')
    console.log(`  • Available Balance: R$ ${this.formatCurrency(balance)}`)
    console.log(`  • Monthly Burn Rate: R$ ${this.formatCurrency(monthlySpend)}/month`)
    console.log(`  • Runway: ${runwayDays} days (${(runwayDays / 30).toFixed(1)} months)`)
    console.log(`  • Coverage Index: ${coverage.toFixed(2)}%\n`)

    // Status check
    const allStatuses = [
      dashboard.wallet_balance.status,
      dashboard.prize_fund.status,
      dashboard.redeemable_coins.status,
      dashboard.compliment_engagement.status,
      dashboard.redemption_rate.status,
    ]

    const hasAny = (status: string) => allStatuses.some(s => s === status)

    if (hasAny('critical')) {
      console.log('⚠️  CRITICAL: Some metrics require immediate attention')
    } else if (hasAny('warning')) {
      console.log('⚠️  WARNING: Some metrics need monitoring')
    } else if (hasAny('healthy')) {
      console.log('✓ All metrics are healthy or normal')
    }

    // Target check
    console.log(`\nSeed Data Validation:`)
    console.log(`  • Target Monthly Spend: ~R$ 5.000`)
    console.log(`  • Actual Monthly Spend: R$ ${this.formatCurrency(monthlySpend)}`)
    if (monthlySpend >= 4500 && monthlySpend <= 5500) {
      console.log(`  ✓ Monthly spend is within target range`)
    } else {
      console.log(
        `  ⚠️  Monthly spend is ${monthlySpend < 4500 ? 'below' : 'above'} target - consider adjusting seed data`
      )
    }

    console.log(`\n  • Total Coins in Circulation: ${dashboard.redeemable_coins.total_in_circulation.toLocaleString()}`)
    console.log(`  • Equivalent Value: R$ ${this.formatCurrency(dashboard.redeemable_coins.equivalent_in_brl)}`)
  }

  private colorizeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      healthy: '🟢 healthy',
      warning: '🟡 warning',
      critical: '🔴 critical',
      excess: '🟣 excess',
    }
    return statusMap[status] || status
  }

  private colorizePriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      critical: '🔴 CRITICAL',
      warning: '🟡 WARNING',
      info: '🔵 INFO',
    }
    return priorityMap[priority] || priority
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
}

// Run the test
const tester = new EconomyDashboardTester()
tester.run().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
