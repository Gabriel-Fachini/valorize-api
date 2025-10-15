/**
 * Transaction seed data
 * Sample wallet transactions for testing and demonstration
 */

export const TRANSACTION_DATA = {
  // Sample reasons for different transaction types
  REASONS: {
    COMPLIMENT_SENT: 'Compliment sent to colleague',
    COMPLIMENT_RECEIVED: 'Compliment received from colleague',
    ADMIN_CREDIT: 'Manual credit by administrator',
    ADMIN_DEBIT: 'Manual debit by administrator',
    PRIZE_REDEMPTION: 'Prize redemption',
    MONTHLY_ALLOWANCE: 'Monthly compliment allowance',
    BALANCE_RESET: 'Balance reset by administrator',
    BONUS_REWARD: 'Bonus reward for achievement',
    REFUND: 'Refund from cancelled redemption',
  },
  
  // Sample metadata for transactions
  METADATA_EXAMPLES: {
    compliment: (complimentId: string) => ({
      complimentId,
      type: 'compliment',
      automatic: true,
    }),
    adminAction: (adminId: string, reason: string) => ({
      adminId,
      reason,
      type: 'admin_action',
      automatic: false,
    }),
    prizeRedemption: (prizeId: string, prizeName: string) => ({
      prizeId,
      prizeName,
      type: 'prize_redemption',
      automatic: true,
    }),
    monthlyAllowance: () => ({
      type: 'monthly_allowance',
      automatic: true,
      period: new Date().toISOString().slice(0, 7), // YYYY-MM
    }),
    bonus: (achievement: string) => ({
      achievement,
      type: 'bonus',
      automatic: true,
    }),
  },
}

/**
 * Additional sample transactions for demonstration purposes
 * These will be created in addition to transactions from compliments
 */
export const SAMPLE_ADDITIONAL_TRANSACTIONS = [
  {
    // Monthly allowance credit
    transactionType: 'CREDIT',
    balanceType: 'COMPLIMENT',
    amount: 50,
    reason: TRANSACTION_DATA.REASONS.MONTHLY_ALLOWANCE,
    metadataType: 'monthlyAllowance',
  },
  {
    // Admin bonus credit
    transactionType: 'CREDIT',
    balanceType: 'REDEEMABLE',
    amount: 25,
    reason: TRANSACTION_DATA.REASONS.BONUS_REWARD,
    metadataType: 'bonus',
    metadataValue: 'Completed onboarding',
  },
  {
    // Admin adjustment
    transactionType: 'CREDIT',
    balanceType: 'COMPLIMENT',
    amount: 10,
    reason: TRANSACTION_DATA.REASONS.ADMIN_CREDIT,
    metadataType: 'adminAction',
    metadataValue: 'Balance adjustment',
  },
]
