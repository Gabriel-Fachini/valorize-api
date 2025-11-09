/**
 * Realistic Volumes Configuration
 * Defines data volumes for seed to simulate a realistic scenario
 * Targets: 200+ users, 10,000+ compliments for comprehensive testing
 */

export const REALISTIC_VOLUMES = {
  // User volumes per company
  users: {
    // Valorize Corp - main company (similar to Toro Investimentos)
    valorize: 150,
    // TechStart Brasil - secondary
    techstart: 30,
    // Global Solutions - international
    global: 20,
    // Total
    total: 200,
  },

  // Compliment volumes
  compliments: {
    // Base compliments per company
    // Using Pareto distribution: 20% of users generate 80% of activity
    valorize: 8500, // ~57 per user on average
    techstart: 1000, // ~33 per user
    global: 500, // ~25 per user
    total: 10000,
  },

  // Redemption volumes
  redemptions: {
    // ~5-10% of users make redemptions
    percentageOfUsers: 0.07,
    // Average redemptions per active user
    averagePerUser: 1.5,
  },

  // Weekly renewal tracking
  weeklyRenewals: {
    // 13 weeks = ~90 days of data (3 months)
    // Users get 500 coins per week (total 6,500 coins per user for 90 days)
    // This supports realistic Pareto distribution where power users generate 4x activity
    weeks: 13,
    coinsPerWeek: 500,
  },

  // Prize variety
  prizes: {
    global: 9, // Global catalog
    companySpecific: 4, // Company-branded prizes
    variants: 25, // Price points and options
  },

  // Temporal distribution
  timeRange: {
    // Data spans last 90 days
    daysBack: 90,
    // Most activity in recent weeks
    recentWeightPercentage: 60, // 60% of compliments in last 30 days
  },

  // Activity distribution (Pareto 80/20)
  activityDistribution: {
    // 20% of users are "power users"
    powerUsersPercentage: 0.20,
    powerUserComplimentMultiplier: 4, // 4x average activity

    // 60% of users are "normal"
    normalUsersPercentage: 0.60,
    normalUserComplimentMultiplier: 1, // baseline

    // 20% of users are "inactive"
    inactiveUsersPercentage: 0.20,
    inactiveUserComplimentMultiplier: 0.2, // 20% of average
  },

  // Pattern preferences
  patterns: {
    // More compliments on Fridays
    dayWeighting: {
      monday: 0.8,
      tuesday: 0.9,
      wednesday: 1.0,
      thursday: 1.1,
      friday: 1.3, // 30% more
      saturday: 0.5,
      sunday: 0.4,
    },
  },

  // Edge cases
  edgeCases: {
    // Some users with zero compliments
    inactiveUsersWithZeroCompliments: true,
    inactivePercentage: 0.05,

    // Some users at max balance
    usersAtMaxBalance: true,
    maxBalancePercentage: 0.02,

    // Some cancelled redemptions
    hasCancelledRedemptions: true,
    cancelledPercentage: 0.10,
  },
}

/**
 * Get realistic volumes configuration
 */
export function getRealisticVolumes() {
  return REALISTIC_VOLUMES
}

/**
 * Calculate expected total compliments based on distribution
 */
export function calculateExpectedCompliments(
  totalUsers: number,
  baseComplimentsPerUser: number
): number {
  const distribution = REALISTIC_VOLUMES.activityDistribution
  const powerUsers = totalUsers * distribution.powerUsersPercentage
  const normalUsers = totalUsers * distribution.normalUsersPercentage
  const inactiveUsers = totalUsers * distribution.inactiveUsersPercentage

  return (
    powerUsers * baseComplimentsPerUser * distribution.powerUserComplimentMultiplier +
    normalUsers * baseComplimentsPerUser * distribution.normalUserComplimentMultiplier +
    inactiveUsers * baseComplimentsPerUser * distribution.inactiveUserComplimentMultiplier
  )
}

/**
 * Get users per distribution group
 */
export function getUsersByDistribution(totalUsers: number) {
  const distribution = REALISTIC_VOLUMES.activityDistribution
  return {
    powerUsers: Math.floor(totalUsers * distribution.powerUsersPercentage),
    normalUsers: Math.floor(totalUsers * distribution.normalUsersPercentage),
    inactiveUsers: Math.floor(totalUsers * distribution.inactiveUsersPercentage),
  }
}
