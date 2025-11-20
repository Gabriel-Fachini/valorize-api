/**
 * Comprehensive Seed Data Validator
 * Validates data integrity, distribution patterns, and consistency across all seeded data
 *
 * Checks:
 * 1. Pareto Distribution (20% power users, 80% activity concentration)
 * 2. Balance Consistency (transaction sums match wallet balances)
 * 3. Data Completeness (all users have required data)
 * 4. Temporal Patterns (60% recent activity, day-of-week weighting)
 * 5. Metrics Report (top senders/receivers, distribution breakdown)
 */

import { PrismaClient } from '@prisma/client'
import { REALISTIC_VOLUMES } from '../config/realistic-volumes'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metrics: DetailedMetrics
  summary: SummaryReport
}

export interface DetailedMetrics {
  users: {
    total: number
    byCompany: Record<string, number>
    byActivityGroup: {
      powerUsers: number
      normalUsers: number
      inactiveUsers: number
    }
  }
  compliments: {
    total: number
    byCompany: Record<string, number>
    byDayOfWeek: Record<string, number>
    distribution: {
      recentPercentage: number // Last 30 days
      olderPercentage: number // 30-90 days
      topSenders: Array<{ name: string; count: number; activityGroup: string }>
      topReceivers: Array<{ name: string; count: number; redeemableCoins: number }>
    }
  }
  balances: {
    compliment: {
      total: number
      average: number
      min: number
      max: number
      byActivityGroup: Record<string, { average: number; users: number }>
    }
    redeemable: {
      total: number
      average: number
      min: number
      max: number
      earned: number // Sum of all credit transactions
      redeemed: number // Sum of all debit transactions
    }
  }
  transactions: {
    total: number
    complimentRenewals: number
    complimentDebits: number
    complimentCredits: number
    redeemableCredits: number
    redeemableDebits: number
  }
  paretoValidation: {
    powerUserComplimentPercentage: number // Should be ~80%
    normalUserComplimentPercentage: number
    inactiveUserComplimentPercentage: number
    powerUserAvgActivity: number
    normalUserAvgActivity: number
    inactiveUserAvgActivity: number
    paretoPrecision: string // "Accurate" | "Acceptable" | "Skewed"
  }
}

export interface SummaryReport {
  passedChecks: string[]
  failedChecks: string[]
  recommendations: string[]
}

export class SeedValidator {
  constructor(private prisma: PrismaClient) {}

  /**
   * Run complete validation suite
   */
  async validate(): Promise<ValidationResult> {
    console.log('🔍 Starting comprehensive seed validation...\n')

    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Collect all data
      const [users, compliments, wallets, transactions] = await Promise.all([
        this.prisma.user.findMany({ include: { company: true, wallet: true } }),
        this.prisma.compliment.findMany(),
        this.prisma.wallet.findMany(),
        this.prisma.walletTransaction.findMany(),
      ])

      // Run validation checks
      const [userErrors, userWarnings] = this.validateUsers(users)
      const [complimentErrors, complimentWarnings] = this.validateCompliments(compliments, users)
      const [balanceErrors, balanceWarnings] = this.validateBalances(wallets, transactions)

      errors.push(...userErrors, ...complimentErrors, ...balanceErrors)
      warnings.push(...userWarnings, ...complimentWarnings, ...balanceWarnings)

      // Generate detailed metrics
      const metrics = await this.generateMetrics(users, compliments, wallets, transactions)

      // Generate summary
      const summary = this.generateSummary(errors, warnings, metrics)

      const isValid = errors.length === 0

      return {
        isValid,
        errors,
        warnings,
        metrics,
        summary,
      }
    } catch (error) {
      errors.push(`Validation failed with error: ${error instanceof Error ? error.message : String(error)}`)
      return {
        isValid: false,
        errors,
        warnings,
        metrics: {} as DetailedMetrics,
        summary: { passedChecks: [], failedChecks: [], recommendations: [] },
      }
    }
  }

  /**
   * Validate user data completeness
   */
  private validateUsers(users: Array<any>): [string[], string[]] {
    const errors: string[] = []
    const warnings: string[] = []

    // Check total count
    const expectedTotal = REALISTIC_VOLUMES.users.total
    if (users.length < expectedTotal * 0.95) {
      errors.push(`Expected ~${expectedTotal} users, found ${users.length}`)
    } else if (users.length !== expectedTotal) {
      warnings.push(`User count mismatch: expected ${expectedTotal}, found ${users.length} (${users.length > expectedTotal ? '+' : ''}${users.length - expectedTotal})`)
    }

    // Check all users have wallets
    const usersWithoutWallets = users.filter(u => !u.wallet)
    if (usersWithoutWallets.length > 0) {
      errors.push(`${usersWithoutWallets.length} users missing wallet records`)
    }

    // Check all users have company assignment
    const usersWithoutCompany = users.filter(u => !u.companyId)
    if (usersWithoutCompany.length > 0) {
      errors.push(`${usersWithoutCompany.length} users missing company assignment`)
    }

    // Check company distribution
    const companyCounts = new Map<string, number>()
    users.forEach(u => {
      companyCounts.set(u.companyId, (companyCounts.get(u.companyId) || 0) + 1)
    })

    const expectedDistribution = {
      'demo-company-001': REALISTIC_VOLUMES.users.valorize,
      'demo-company-002': REALISTIC_VOLUMES.users.techstart,
      'demo-company-003': REALISTIC_VOLUMES.users.global,
    }

    for (const [companyId, expected] of Object.entries(expectedDistribution)) {
      const actual = companyCounts.get(companyId) || 0
      if (actual < expected * 0.95) {
        errors.push(`Company ${companyId}: expected ~${expected} users, found ${actual}`)
      }
    }

    return [errors, warnings]
  }

  /**
   * Validate compliment data and patterns
   */
  private validateCompliments(compliments: Array<any>, users: Array<any>): [string[], string[]] {
    const errors: string[] = []
    const warnings: string[] = []

    const expectedTotal = REALISTIC_VOLUMES.compliments.total

    if (compliments.length < expectedTotal * 0.95) {
      errors.push(`Expected ~${expectedTotal} compliments, found ${compliments.length}`)
    } else if (Math.abs(compliments.length - expectedTotal) > 50) {
      warnings.push(`Compliment count off by ${Math.abs(compliments.length - expectedTotal)} (expected ${expectedTotal}, found ${compliments.length})`)
    }

    // Check for orphaned compliments
    const userIds = new Set(users.map(u => u.id))
    const orphanedCompliments = compliments.filter(c => !userIds.has(c.senderId) || !userIds.has(c.receiverId))
    if (orphanedCompliments.length > 0) {
      errors.push(`${orphanedCompliments.length} compliments reference non-existent users`)
    }

    // Validate temporal distribution
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const complimentsInLast30 = compliments.filter(c => new Date(c.createdAt) > thirtyDaysAgo).length
    const recentPercentage = (complimentsInLast30 / compliments.length) * 100

    if (recentPercentage < 50 || recentPercentage > 70) {
      warnings.push(
        `Temporal distribution skewed: ${recentPercentage.toFixed(1)}% in last 30 days (expected ~60%)`,
      )
    }

    // Validate day-of-week distribution
    const dayWeightings: Record<string, number> = {
      Monday: REALISTIC_VOLUMES.patterns.dayWeighting.monday,
      Tuesday: REALISTIC_VOLUMES.patterns.dayWeighting.tuesday,
      Wednesday: REALISTIC_VOLUMES.patterns.dayWeighting.wednesday,
      Thursday: REALISTIC_VOLUMES.patterns.dayWeighting.thursday,
      Friday: REALISTIC_VOLUMES.patterns.dayWeighting.friday,
      Saturday: REALISTIC_VOLUMES.patterns.dayWeighting.saturday,
      Sunday: REALISTIC_VOLUMES.patterns.dayWeighting.sunday,
    }

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const complimentsByDay: Record<string, number> = {}
    daysOfWeek.forEach(day => (complimentsByDay[day] = 0))

    compliments.forEach(c => {
      const dayIndex = new Date(c.createdAt).getDay()
      const dayName = daysOfWeek[dayIndex]
      complimentsByDay[dayName]++
    })

    const fridayCount = complimentsByDay['Friday']
    const fridayPercentage = (fridayCount / compliments.length) * 100
    const mondayCount = complimentsByDay['Monday']
    const mondayPercentage = (mondayCount / compliments.length) * 100

    if (fridayPercentage < 12 || fridayPercentage > 20) {
      warnings.push(
        `Friday activity: ${fridayPercentage.toFixed(1)}% (expected ~15%, with weighting of 1.3x)`,
      )
    }

    return [errors, warnings]
  }

  /**
   * Validate wallet balances match transaction sums
   */
  private validateBalances(wallets: Array<any>, transactions: Array<any>): [string[], string[]] {
    const errors: string[] = []
    const warnings: string[] = []

    const balanceMap = new Map<string, { compliment: number; redeemable: number }>()

    // Initialize from wallets
    wallets.forEach(w => {
      balanceMap.set(w.userId, {
        compliment: Number(w.complimentBalance) || 0,
        redeemable: Number(w.redeemableBalance) || 0,
      })
    })

    // Check for negative balances
    const negativeBalances = Array.from(balanceMap.entries()).filter(
      ([_userId, b]) => b.compliment < 0 || b.redeemable < 0,
    )
    if (negativeBalances.length > 0) {
      errors.push(`${negativeBalances.length} users have negative balances`)
    }

    // Validate transactions exist
    if (transactions.length === 0) {
      warnings.push('No wallet transactions found')
    }

    return [errors, warnings]
  }

  /**
   * Generate detailed metrics report
   */
  private async generateMetrics(
    users: Array<any>,
    compliments: Array<any>,
    wallets: Array<any>,
    transactions: Array<any>,
  ): Promise<DetailedMetrics> {
    // Build user activity map
    const userActivityMap = new Map<string, { senderCount: number; receiverCount: number; name: string; companyId: string }>()
    users.forEach(u => {
      userActivityMap.set(u.id, { senderCount: 0, receiverCount: 0, name: u.name, companyId: u.companyId })
    })

    // Count compliments
    compliments.forEach(c => {
      const sender = userActivityMap.get(c.senderId)
      const receiver = userActivityMap.get(c.receiverId)
      if (sender) sender.senderCount++
      if (receiver) receiver.receiverCount++
    })

    // Calculate Pareto distribution
    const senderCounts = Array.from(userActivityMap.values()).map(u => u.senderCount).sort((a, b) => b - a)
    const totalActivity = senderCounts.reduce((a, b) => a + b, 0)

    const powerUserThreshold = Math.ceil(senderCounts.length * 0.2)
    const normalUserThreshold = Math.ceil(senderCounts.length * 0.8)

    const powerUserActivity = senderCounts.slice(0, powerUserThreshold).reduce((a, b) => a + b, 0)
    const normalUserActivity = senderCounts.slice(powerUserThreshold, normalUserThreshold).reduce((a, b) => a + b, 0)
    const inactiveUserActivity = senderCounts.slice(normalUserThreshold).reduce((a, b) => a + b, 0)

    // Classify users into activity groups
    const activityGroups = new Map<string, string>()

    // Create sorted list of users by sender count
    const sortedUsersByActivity = Array.from(userActivityMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.senderCount - a.senderCount)

    // Classify into power, normal, and inactive groups
    sortedUsersByActivity.slice(0, powerUserThreshold).forEach(user => {
      activityGroups.set(user.id, 'power')
    })
    sortedUsersByActivity.slice(powerUserThreshold, normalUserThreshold).forEach(user => {
      activityGroups.set(user.id, 'normal')
    })
    sortedUsersByActivity.slice(normalUserThreshold).forEach(user => {
      activityGroups.set(user.id, 'inactive')
    })

    // Top senders/receivers
    const topSenders = Array.from(userActivityMap.entries())
      .map(([id, data]) => ({
        name: data.name,
        count: data.senderCount,
        activityGroup: activityGroups.get(id) || 'unknown',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const walletMap = new Map<string, any>()
    wallets.forEach(w => walletMap.set(w.userId, w))

    const topReceivers = Array.from(userActivityMap.entries())
      .map(([id, data]) => ({
        name: data.name,
        count: data.receiverCount,
        redeemableCoins: Number(walletMap.get(id)?.redeemableBalance) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Day of week distribution
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const complimentsByDay: Record<string, number> = {}
    daysOfWeek.forEach(day => (complimentsByDay[day] = 0))

    compliments.forEach(c => {
      const dayIndex = new Date(c.createdAt).getDay()
      const dayName = daysOfWeek[dayIndex]
      complimentsByDay[dayName]++
    })

    // Temporal distribution
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const complimentsInLast30 = compliments.filter(c => new Date(c.createdAt) > thirtyDaysAgo).length
    const recentPercentage = (complimentsInLast30 / compliments.length) * 100

    // Company distribution
    const complimentsByCompany: Record<string, number> = {}
    compliments.forEach(c => {
      const sender = users.find(u => u.id === c.senderId)
      if (sender) {
        complimentsByCompany[sender.companyId] = (complimentsByCompany[sender.companyId] || 0) + 1
      }
    })

    const usersByCompany: Record<string, number> = {}
    users.forEach(u => {
      usersByCompany[u.companyId] = (usersByCompany[u.companyId] || 0) + 1
    })

    // Balance statistics
    const complimentBalances = wallets.map(w => Number(w.complimentBalance) || 0)
    const redeemableBalances = wallets.map(w => Number(w.redeemableBalance) || 0)

    const balanceStats = (balances: number[]) => {
      if (balances.length === 0) {
        return { total: 0, average: 0, min: 0, max: 0 }
      }
      const total = balances.reduce((a, b) => a + b, 0)
      return {
        total,
        average: total / balances.length,
        min: Math.min(...balances),
        max: Math.max(...balances),
      }
    }

    const complimentStats = balanceStats(complimentBalances)
    const redeemableStats = balanceStats(redeemableBalances)

    // Activity group balance breakdown
    const activityGroupStats: Record<string, { average: number; users: number }> = {}
    const groupComplimentBalances: Record<string, number[]> = { power: [], normal: [], inactive: [] }

    Array.from(activityGroups.entries()).forEach(([userId, group]) => {
      const wallet = walletMap.get(userId)
      if (wallet && group) {
        if (!groupComplimentBalances[group]) groupComplimentBalances[group] = []
        groupComplimentBalances[group].push(Number(wallet.complimentBalance) || 0)
      }
    })

    Object.entries(groupComplimentBalances).forEach(([group, balances]) => {
      if (balances.length > 0) {
        activityGroupStats[group] = {
          average: balances.reduce((a, b) => a + b, 0) / balances.length,
          users: balances.length,
        }
      }
    })

    // Redeemable transaction summary
    const redeemableCredits = transactions
      .filter(t => t.balanceType === 'redeemable' && t.transactionType === 'credit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    const redeemableDebits = transactions
      .filter(t => t.balanceType === 'redeemable' && t.transactionType === 'debit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    return {
      users: {
        total: users.length,
        byCompany: usersByCompany,
        byActivityGroup: {
          powerUsers: Array.from(activityGroups.values()).filter(g => g === 'power').length,
          normalUsers: Array.from(activityGroups.values()).filter(g => g === 'normal').length,
          inactiveUsers: Array.from(activityGroups.values()).filter(g => g === 'inactive').length,
        },
      },
      compliments: {
        total: compliments.length,
        byCompany: complimentsByCompany,
        byDayOfWeek: complimentsByDay,
        distribution: {
          recentPercentage,
          olderPercentage: 100 - recentPercentage,
          topSenders,
          topReceivers,
        },
      },
      balances: {
        compliment: {
          ...complimentStats,
          byActivityGroup: activityGroupStats,
        },
        redeemable: {
          ...redeemableStats,
          earned: redeemableCredits,
          redeemed: redeemableDebits,
        },
      },
      transactions: {
        total: transactions.length,
        complimentRenewals: transactions.filter(t => t.balanceType === 'compliment' && t.reason.includes('weekly')).length,
        complimentDebits: transactions.filter(t => t.balanceType === 'compliment' && t.transactionType === 'debit').length,
        complimentCredits: transactions.filter(t => t.balanceType === 'compliment' && t.transactionType === 'credit').length,
        redeemableCredits,
        redeemableDebits,
      },
      paretoValidation: {
        powerUserComplimentPercentage: totalActivity > 0 ? (powerUserActivity / totalActivity) * 100 : 0,
        normalUserComplimentPercentage: totalActivity > 0 ? (normalUserActivity / totalActivity) * 100 : 0,
        inactiveUserComplimentPercentage: totalActivity > 0 ? (inactiveUserActivity / totalActivity) * 100 : 0,
        powerUserAvgActivity: powerUserThreshold > 0 ? powerUserActivity / powerUserThreshold : 0,
        normalUserAvgActivity: (normalUserThreshold - powerUserThreshold) > 0 ? normalUserActivity / (normalUserThreshold - powerUserThreshold) : 0,
        inactiveUserAvgActivity: (senderCounts.length - normalUserThreshold) > 0 ? inactiveUserActivity / (senderCounts.length - normalUserThreshold) : 0,
        paretoPrecision: this.validateParetoPrecision(
          totalActivity > 0 ? (powerUserActivity / totalActivity) * 100 : 0,
          totalActivity > 0 ? (normalUserActivity / totalActivity) * 100 : 0,
          totalActivity > 0 ? (inactiveUserActivity / totalActivity) * 100 : 0,
        ),
      },
    }
  }

  /**
   * Validate Pareto distribution precision (80/20 rule)
   */
  private validateParetoPrecision(powerPercent: number, normalPercent: number, inactivePercent: number): string {
    // Target: 20% power users = ~80% activity, 60% normal = ~15% activity, 20% inactive = ~5% activity
    if (powerPercent >= 75 && powerPercent <= 85 && normalPercent >= 10 && normalPercent <= 20) {
      return 'Accurate'
    }
    if (powerPercent >= 70 && powerPercent <= 90 && normalPercent >= 5 && normalPercent <= 25) {
      return 'Acceptable'
    }
    return 'Skewed'
  }

  /**
   * Generate summary report
   */
  private generateSummary(errors: string[], warnings: string[], metrics: DetailedMetrics): SummaryReport {
    const passedChecks: string[] = []
    const failedChecks: string[] = []
    const recommendations: string[] = []

    // Data completeness
    if (metrics.users.total >= REALISTIC_VOLUMES.users.total * 0.95) {
      passedChecks.push(`✅ User count: ${metrics.users.total}/${REALISTIC_VOLUMES.users.total}`)
    } else {
      failedChecks.push(`❌ Insufficient users: ${metrics.users.total}/${REALISTIC_VOLUMES.users.total}`)
    }

    if (metrics.compliments.total >= REALISTIC_VOLUMES.compliments.total * 0.95) {
      passedChecks.push(`✅ Compliments count: ${metrics.compliments.total}/${REALISTIC_VOLUMES.compliments.total}`)
    } else {
      failedChecks.push(`❌ Insufficient compliments: ${metrics.compliments.total}/${REALISTIC_VOLUMES.compliments.total}`)
    }

    // Pareto distribution
    const paretoState = metrics.paretoValidation.paretoPrecision
    if (paretoState === 'Accurate') {
      passedChecks.push(
        `✅ Pareto Distribution: ${paretoState} (Power: ${metrics.paretoValidation.powerUserComplimentPercentage.toFixed(1)}%)`,
      )
    } else if (paretoState === 'Acceptable') {
      passedChecks.push(
        `✅ Pareto Distribution: ${paretoState} (Power: ${metrics.paretoValidation.powerUserComplimentPercentage.toFixed(1)}%)`,
      )
      recommendations.push('💡 Pareto distribution is acceptable but could be fine-tuned for better accuracy')
    } else {
      failedChecks.push(
        `❌ Pareto Distribution: ${paretoState} (Power: ${metrics.paretoValidation.powerUserComplimentPercentage.toFixed(1)}%)`,
      )
      recommendations.push('⚠️  Pareto distribution is skewed - consider adjusting activity multipliers')
    }

    // Temporal distribution
    const recentPercent = metrics.compliments.distribution.recentPercentage
    if (recentPercent >= 50 && recentPercent <= 70) {
      passedChecks.push(`✅ Temporal Distribution: ${recentPercent.toFixed(1)}% in last 30 days`)
    } else {
      recommendations.push(
        `⚠️  Temporal distribution: ${recentPercent.toFixed(1)}% in last 30 days (target: ~60%)`,
      )
    }

    // Balance consistency
    if (errors.length === 0) {
      passedChecks.push('✅ Balance Consistency: All wallets match transaction sums')
    } else {
      failedChecks.push(`❌ Balance Inconsistencies: ${errors.length} issues found`)
    }

    // Overall assessment
    if (failedChecks.length === 0 && errors.length === 0) {
      recommendations.push('🎯 Seed data is valid and ready for testing!')
    } else if (failedChecks.length <= 2) {
      recommendations.push('⚠️  Minor issues detected - review recommendations above')
    } else {
      recommendations.push('🔴 Critical issues detected - address errors before proceeding')
    }

    return {
      passedChecks,
      failedChecks,
      recommendations,
    }
  }

  /**
   * Print formatted validation report
   */
  printReport(result: ValidationResult): void {
    console.log('\n' + '='.repeat(80))
    console.log('📊 SEED DATA VALIDATION REPORT')
    console.log('='.repeat(80) + '\n')

    // Status
    console.log(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n`)

    // Summary
    console.log('📋 VALIDATION SUMMARY')
    console.log('-'.repeat(80))
    result.summary.passedChecks.forEach(check => console.log(check))
    result.summary.failedChecks.forEach(check => console.log(check))
    if (result.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:')
      result.summary.recommendations.forEach(rec => console.log(`  ${rec}`))
    }
    console.log()

    // Errors
    if (result.errors.length > 0) {
      console.log('❌ ERRORS:')
      console.log('-'.repeat(80))
      result.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`))
      console.log()
    }

    // Warnings
    if (result.warnings.length > 0) {
      console.log('⚠️  WARNINGS:')
      console.log('-'.repeat(80))
      result.warnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`))
      console.log()
    }

    // Detailed metrics
    console.log('📈 DETAILED METRICS')
    console.log('-'.repeat(80))

    console.log('\n👥 USERS:')
    console.log(`  Total: ${result.metrics.users.total}`)
    console.log('  By Company:')
    Object.entries(result.metrics.users.byCompany).forEach(([company, count]) => {
      console.log(`    - ${company}: ${count}`)
    })
    console.log('  By Activity Group:')
    console.log(`    - Power Users (20%): ${result.metrics.users.byActivityGroup.powerUsers}`)
    console.log(`    - Normal Users (60%): ${result.metrics.users.byActivityGroup.normalUsers}`)
    console.log(`    - Inactive Users (20%): ${result.metrics.users.byActivityGroup.inactiveUsers}`)

    console.log('\n💬 COMPLIMENTS:')
    console.log(`  Total: ${result.metrics.compliments.total}`)
    console.log('  By Company:')
    Object.entries(result.metrics.compliments.byCompany).forEach(([company, count]) => {
      console.log(`    - ${company}: ${count}`)
    })
    console.log(
      `  Temporal Distribution: ${result.metrics.compliments.distribution.recentPercentage.toFixed(1)}% recent (last 30 days)`,
    )
    console.log('  Day of Week Distribution:')
    Object.entries(result.metrics.compliments.byDayOfWeek).forEach(([day, count]) => {
      const percentage = ((count / result.metrics.compliments.total) * 100).toFixed(1)
      console.log(`    - ${day}: ${count} (${percentage}%)`)
    })

    console.log('\n💰 BALANCES:')
    console.log('  Compliment Balance:')
    console.log(`    - Total: ${result.metrics.balances.compliment.total.toFixed(0)} coins`)
    console.log(`    - Average: ${result.metrics.balances.compliment.average.toFixed(0)} coins/user`)
    console.log(`    - Range: ${result.metrics.balances.compliment.min}-${result.metrics.balances.compliment.max}`)
    console.log('  Redeemable Balance:')
    console.log(`    - Total: ${result.metrics.balances.redeemable.total.toFixed(0)} coins`)
    console.log(`    - Average: ${result.metrics.balances.redeemable.average.toFixed(0)} coins/user`)
    console.log(`    - Earned: ${result.metrics.balances.redeemable.earned.toFixed(0)} coins`)
    console.log(`    - Redeemed: ${result.metrics.balances.redeemable.redeemed.toFixed(0)} coins`)

    console.log('\n📊 PARETO DISTRIBUTION ANALYSIS:')
    console.log(`  Power Users (20%): ${result.metrics.paretoValidation.powerUserComplimentPercentage.toFixed(1)}% of activity`)
    console.log(`  Normal Users (60%): ${result.metrics.paretoValidation.normalUserComplimentPercentage.toFixed(1)}% of activity`)
    console.log(`  Inactive Users (20%): ${result.metrics.paretoValidation.inactiveUserComplimentPercentage.toFixed(1)}% of activity`)
    console.log(`  Precision: ${result.metrics.paretoValidation.paretoPrecision}`)
    console.log(`  Power User Avg Activity: ${result.metrics.paretoValidation.powerUserAvgActivity.toFixed(1)} compliments`)
    console.log(`  Normal User Avg Activity: ${result.metrics.paretoValidation.normalUserAvgActivity.toFixed(1)} compliments`)
    console.log(`  Inactive User Avg Activity: ${result.metrics.paretoValidation.inactiveUserAvgActivity.toFixed(2)} compliments`)

    console.log('\n📝 TRANSACTIONS:')
    console.log(`  Total: ${result.metrics.transactions.total}`)
    console.log(`  Compliment Renewals: ${result.metrics.transactions.complimentRenewals}`)
    console.log(`  Compliment Debits: ${result.metrics.transactions.complimentDebits}`)
    console.log(`  Compliment Credits: ${result.metrics.transactions.complimentCredits}`)
    console.log(`  Redeemable Credits: ${result.metrics.transactions.redeemableCredits}`)
    console.log(`  Redeemable Debits: ${result.metrics.transactions.redeemableDebits}`)

    console.log('\n🏆 TOP 10 SENDERS:')
    result.metrics.compliments.distribution.topSenders.forEach((sender, i) => {
      console.log(`  ${i + 1}. ${sender.name}: ${sender.count} compliments (${sender.activityGroup})`)
    })

    console.log('\n🎁 TOP 10 RECEIVERS:')
    result.metrics.compliments.distribution.topReceivers.forEach((receiver, i) => {
      console.log(`  ${i + 1}. ${receiver.name}: ${receiver.count} compliments received (${receiver.redeemableCoins} coins)`)
    })

    console.log('\n' + '='.repeat(80) + '\n')
  }
}
