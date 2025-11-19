import { FastifyInstance, FastifyRequest } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { complimentService } from './compliment.service'
import {
  sendComplimentSchema,
  SendComplimentInput,
  complimentHistorySchema,
  ComplimentHistoryQuery,
} from './compliment.schemas'
import { User } from '../users/user.model'

export default async function complimentRoutes(fastify: FastifyInstance) {
  fastify.post('/send-compliment', {
    schema: sendComplimentSchema,
  }, async (
      request: FastifyRequest<{ Body: SendComplimentInput }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuth0Id(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'Sender user not found.' })
      }

      try {
        const compliment = await complimentService.sendCompliment(
          user.id,
          request.body,
        )
        return reply.code(201).send({
          message: 'Compliment sent successfully!',
          compliment,
        })
      } catch (error) {
        return reply.code(400).send({
          message:
            error instanceof Error ? error.message : 'An error occurred.',
        })
      }
    },
  )

  fastify.get('/list-receivable-users', async (request, reply) => {
    const currentUser = getCurrentUser(request)
    const user = await User.findByAuth0Id(currentUser.sub)

    if (!user) {
      return reply.code(404).send({ message: 'Current user not found.' })
    }

    try {
      const users = await complimentService.listReceivableUsers(user.id)
      return reply.send({ users })
    } catch (error) {
      return reply.code(400).send({
        message:
          error instanceof Error ? error.message : 'An error occurred.',
      })
    }
  })

  fastify.get('/history', {
    schema: complimentHistorySchema,
  }, async (
    request: FastifyRequest<{ Querystring: ComplimentHistoryQuery }>,
    reply,
  ) => {
    const currentUser = getCurrentUser(request)
    const user = await User.findByAuth0Id(currentUser.sub)

    if (!user) {
      return reply.code(404).send({ message: 'Current user not found.' })
    }

    try {
      const { type, page, limit } = request.query as ComplimentHistoryQuery
      const result = await complimentService.getComplimentHistory(
        user.id,
        type,
        page,
        limit,
      )

      return reply.send(result)
    } catch (error) {
      return reply.code(400).send({
        message:
          error instanceof Error ? error.message : 'An error occurred.',
      })
    }
  })

  fastify.get('/feed', async (request, reply) => {
    const currentUser = getCurrentUser(request)
    const user = await User.findByAuth0Id(currentUser.sub)

    if (!user) {
      return reply.code(404).send({ message: 'Current user not found.' })
    }

    try {
      const feed = await complimentService.getFeed(user.companyId)
      return reply.send(feed)
    } catch (error) {
      return reply.code(400).send({
        message:
          error instanceof Error ? error.message : 'An error occurred.',
      })
    }
  })
}
