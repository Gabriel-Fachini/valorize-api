import { FastifyInstance } from 'fastify'
import { requirePermission } from '@/middleware/rbac'
import { getCurrentUser } from '@/middleware/auth'
import { User } from '../users/user.model'
import { walletService } from './wallet.service'

export default async function walletRoutes(fastify: FastifyInstance) {
  // Get user's wallet balance
  fastify.get('/balance', async (request, reply) => {
    const currentUser = getCurrentUser(request)
    const user = await User.findByAuth0Id(currentUser.sub)
    
    if (!user) {
      return reply.code(404).send({ message: 'User not found.' })
    }
    
    const balance = await walletService.getUserBalance(user.id)
    return reply.send(balance)
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
      const query = request.query as any

      const options = {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
        ...(query.balanceType && { balanceType: query.balanceType }),
        ...(query.transactionType && { transactionType: query.transactionType }),
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

  // Manual reset for all wallets (admin only)
  fastify.post(
    '/reset-weekly-balance',
    {
      preHandler: [requirePermission('admin:manage_system')],
    },
    async (request, reply) => {
      try {
        const currentUser = getCurrentUser(request)
        const admin = await User.findByAuth0Id(currentUser.sub)
        
        if (!admin) {
          return reply.code(404).send({ message: 'Admin user not found.' })
        }

        const { resetWeeklyBalances } = await import('./wallet.service')
        const result = await resetWeeklyBalances(admin.id)
        
        return reply.send({
          message: 'Weekly balance reset completed successfully',
          companiesUpdated: result.companiesProcessed,
          walletsUpdated: result.totalWalletsUpdated,
          resetBy: admin.name,
        })
      } catch (error) {
        return reply.code(500).send({
          message: 'Failed to reset weekly balances',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  )

  // Admin: Get any user's transaction history
  fastify.get('/admin/transactions/:userId', {
    preHandler: [requirePermission('admin:manage_system')],
    schema: {
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
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
    try {
      const { userId } = request.params as any
      const query = request.query as any

      // Verify user exists
      const targetUser = await User.findById(userId)
      if (!targetUser) {
        return reply.code(404).send({ message: 'Target user not found.' })
      }

      const { WalletTransactionModel } = await import('./wallet-transaction.model')

      const options = {
        limit: query.limit || 50,
        offset: query.offset || 0,
        ...(query.balanceType && { balanceType: query.balanceType }),
        ...(query.transactionType && { transactionType: query.transactionType }),
        ...(query.fromDate && { fromDate: new Date(query.fromDate) }),
        ...(query.toDate && { toDate: new Date(query.toDate) }),
      }

      const [transactions, total] = await Promise.all([
        WalletTransactionModel.findByUserId(userId, options),
        WalletTransactionModel.countByUserId(userId, {
          balanceType: options.balanceType,
          transactionType: options.transactionType,
          fromDate: options.fromDate,
          toDate: options.toDate,
        }),
      ])

      const currentUser = getCurrentUser(request)
      const admin = await User.findByAuth0Id(currentUser.sub)

      return reply.send({
        targetUser: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },
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
        auditInfo: {
          requestedBy: admin?.name,
          requestedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      return reply.code(500).send({
        message: 'Failed to retrieve user transaction history',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
}
