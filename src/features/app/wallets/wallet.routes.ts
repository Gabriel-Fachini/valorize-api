import { FastifyInstance } from 'fastify'
import { requirePermission } from '@/middleware/rbac'
import { getCurrentUser } from '@/middleware/auth'
import { User } from '../users/user.model'
import { walletService, getExpiringCoins } from './wallet.service'
import { BalanceType, TransactionType } from './wallet-transaction.model'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'

export default async function walletRoutes(fastify: FastifyInstance) {
  // Get user's wallet balance (includes expiring coins information)
  fastify.get('/balance', async (request, reply) => {
    const currentUser = getCurrentUser(request)
    const user = await User.findByAuth0Id(currentUser.sub)

    if (!user) {
      return reply.code(404).send({ message: 'User not found.' })
    }

    try {
      // Get balance and expiring coins data in parallel
      const [balance, expiringCoins] = await Promise.all([
        walletService.getUserBalance(user.id),
        getExpiringCoins(user.id),
      ])

      return reply.send({
        ...balance,
        expiringCoins: {
          next30Days: expiringCoins.totalExpiringNext30Days,
          next90Days: expiringCoins.totalExpiringNext90Days,
          urgentExpiration: expiringCoins.urgentExpiration,
          details: expiringCoins.batches.map(batch => ({
            amount: batch.amount,
            expiresAt: batch.expiresAt,
            daysLeft: batch.daysUntilExpiration,
            isUrgent: batch.isUrgent,
          })),
        },
      })
    } catch (error) {
      return reply.code(500).send({
        message: 'Failed to retrieve wallet balance',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get user's transaction history
  fastify.get('/transactions', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          balanceType: { type: 'string', enum: ['COMPLIMENT', 'REDEEMABLE'] },
          transactionType: { type: 'string', enum: ['DEBIT', 'CREDIT', 'RESET'] },
          fromDate: { type: 'string', format: 'date-time' },
          toDate: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, async (request, reply) => {
    const currentUser = getCurrentUser(request)
    const user = await User.findByAuth0Id(currentUser.sub)
    
    if (!user) {
      return reply.code(404).send({ message: 'User not found.' })
    }

    try {
      const { WalletTransactionModel } = await import('./wallet-transaction.model')
      const query = request.query as {
        limit?: number
        offset?: number
        balanceType?: string
        transactionType?: string
        fromDate?: string
        toDate?: string
      }

      const options = {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
        ...(query.balanceType && { balanceType: query.balanceType as BalanceType }),
        ...(query.transactionType && { transactionType: query.transactionType as TransactionType }),
        ...(query.fromDate && { fromDate: new Date(query.fromDate) }),
        ...(query.toDate && { toDate: new Date(query.toDate) }),
      }

      const [transactions, total] = await Promise.all([
        WalletTransactionModel.findByUserId(user.id, options),
        WalletTransactionModel.countByUserId(user.id, {
          balanceType: options.balanceType,
          transactionType: options.transactionType,
          fromDate: options.fromDate,
          toDate: options.toDate,
        }),
      ])

      return reply.send({
        transactions: transactions.map(t => ({
          id: t.id,
          transactionType: t.transactionType,
          balanceType: t.balanceType,
          amount: t.amount,
          previousBalance: t.previousBalance,
          newBalance: t.newBalance,
          reason: t.reason,
          metadata: t.metadata,
          createdAt: t.createdAt,
        })),
        pagination: {
          total,
          limit: options.limit,
          offset: options.offset,
          hasMore: options.offset + options.limit < total,
        },
      })
    } catch (error) {
      return reply.code(500).send({
        message: 'Failed to retrieve transaction history',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Manual reset for wallets (admin only) - hybrid approach
  // If companyId is provided in query params, resets only that company
  // If no companyId, resets all companies
  fastify.post('/reset-weekly-balance',
    {
      preHandler: [requirePermission(PERMISSION.ADMIN_MANAGE_SYSTEM)],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            companyId: { type: 'string' },
          },
        },
      },
    }, async (request, reply) => {
      try {
        const currentUser = getCurrentUser(request)
        const admin = await User.findByAuth0Id(currentUser.sub)
        
        if (!admin) {
          return reply.code(404).send({ message: 'Admin user not found.' })
        }

        const query = request.query as { companyId?: string }
        const { companyId } = query

        if (companyId) {
          // Reset specific company
          const { resetWeeklyBalancesForCompany } = await import('./wallet.service')
          const result = await resetWeeklyBalancesForCompany(companyId, admin.id)
          
          return reply.send({
            message: 'Weekly balance reset completed successfully for company',
            companyId: result.companyId,
            companyName: result.companyName,
            walletsUpdated: result.totalWalletsUpdated,
            weeklyLimit: result.weeklyLimit,
            resetBy: admin.name,
          })
        } else {
          // Reset all companies
          const { resetWeeklyBalances } = await import('./wallet.service')
          const result = await resetWeeklyBalances(admin.id)
          
          return reply.send({
            message: 'Weekly balance reset completed successfully for all companies',
            companiesUpdated: result.companiesProcessed,
            walletsUpdated: result.totalWalletsUpdated,
            resetBy: admin.name,
          })
        }
      } catch (error) {
        return reply.code(500).send({
          message: 'Failed to reset weekly balances',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  )
}