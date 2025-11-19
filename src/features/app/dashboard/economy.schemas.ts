/**
 * JSON Schemas for Economy Dashboard endpoints
 */

export const getEconomyDashboardSchema = {
  tags: ['Admin - Economy Dashboard'],
  description: 'Get complete economy dashboard with metrics, alerts, and suggestions',
  response: {
    200: {
      type: 'object',
      properties: {
        wallet_balance: {
          type: 'object',
          properties: {
            total_loaded: { type: 'number' },
            total_spent: { type: 'number' },
            available_balance: { type: 'number' },
            percentage_of_ideal: { type: 'number' },
            status: { type: 'string' },
          },
        },
        prize_fund: {
          type: 'object',
          properties: {
            current_balance: { type: 'number' },
            avg_monthly_consumption: { type: 'number' },
            runway_days: { type: 'number' },
            status: { type: 'string' },
          },
        },
        redeemable_coins: {
          type: 'object',
          properties: {
            total_in_circulation: { type: 'number' },
            equivalent_in_brl: { type: 'number' },
            coverage_index: { type: 'number' },
            status: { type: 'string' },
          },
        },
        compliment_engagement: {
          type: 'object',
          properties: {
            distributed_this_week: { type: 'number' },
            used: { type: 'number' },
            wasted: { type: 'number' },
            usage_rate: { type: 'number' },
            status: { type: 'string' },
          },
        },
        redemption_rate: {
          type: 'object',
          properties: {
            coins_redeemed_this_month: { type: 'number' },
            coins_issued_this_month: { type: 'number' },
            redemption_percentage: { type: 'number' },
            status: { type: 'string' },
          },
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              priority: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              recommended_action: { type: 'string' },
              dismissible: { type: 'boolean' },
            },
          },
        },
        deposit_history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              status: { type: 'string' },
              payment_method: { type: 'string' },
              deposited_at: { type: 'string' },
              resulting_balance: { type: 'number' },
            },
          },
        },
        suggested_deposit: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            reason: { type: 'string' },
            target_runway_days: { type: 'number' },
          },
        },
      },
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
}
