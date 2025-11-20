import { FastifyInstance, FastifyRequest } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { User } from '@/features/app/users/user.model'
import { addressService } from './address.service'
import {
  createAddressSchema,
  getUserAddressesSchema,
  getAddressByIdSchema,
  updateAddressSchema,
  deleteAddressSchema,
  setDefaultAddressSchema,
} from './address.schemas'

export default async function addressRoutes(fastify: FastifyInstance) {
  // POST /addresses - Create a new address
  fastify.post(
    '/',
    {
      schema: createAddressSchema,
    },
    async (
      request: FastifyRequest<{
        Body: {
          name: string
          street: string
          number: string
          complement?: string
          neighborhood: string
          city: string
          state: string
          zipCode: string
          country?: string
          phone: string
          isDefault?: boolean
        }
      }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuthUserId(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        const address = await addressService.createAddress({
          userId: user.id,
          name: request.body.name,
          street: request.body.street,
          number: request.body.number,
          complement: request.body.complement ?? null,
          neighborhood: request.body.neighborhood,
          city: request.body.city,
          state: request.body.state,
          zipCode: request.body.zipCode,
          country: request.body.country || 'BR',
          phone: request.body.phone,
          isDefault: request.body.isDefault || false,
        })

        return reply.code(201).send({
          message: 'Address created successfully',
          address: address.toJSON(),
        })
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'MaxAddressesReachedError') {
            return reply.code(400).send({ message: error.message })
          }
        }

        return reply.code(400).send({
          message:
            error instanceof Error ? error.message : 'Failed to create address',
        })
      }
    },
  )

  // GET /addresses - Get all user addresses
  fastify.get(
    '/',
    {
      schema: getUserAddressesSchema,
    },
    async (request, reply) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuthUserId(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        const addresses = await addressService.getUserAddresses(user.id)

        return reply.send({
          addresses: addresses.map((address) => address.toJSON()),
        })
      } catch (error) {
        return reply.code(400).send({
          message:
            error instanceof Error ? error.message : 'Failed to get addresses',
        })
      }
    },
  )

  // GET /addresses/:id - Get a specific address
  fastify.get(
    '/:id',
    {
      schema: getAddressByIdSchema,
    },
    async (
      request: FastifyRequest<{
        Params: { id: string }
      }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuthUserId(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        const address = await addressService.getAddressById(
          request.params.id,
          user.id,
        )

        return reply.send({ address: address.toJSON() })
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AddressNotFoundError') {
            return reply.code(404).send({ message: error.message })
          }
          if (error.name === 'UnauthorizedAddressAccessError') {
            return reply.code(403).send({ message: error.message })
          }
        }

        return reply.code(400).send({
          message:
            error instanceof Error ? error.message : 'Failed to get address',
        })
      }
    },
  )

  // PUT /addresses/:id - Update an address
  fastify.put(
    '/:id',
    {
      schema: updateAddressSchema,
    },
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: {
          name?: string
          street?: string
          number?: string
          complement?: string
          neighborhood?: string
          city?: string
          state?: string
          zipCode?: string
          country?: string
          phone?: string
          isDefault?: boolean
        }
      }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuthUserId(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        const address = await addressService.updateAddress(
          request.params.id,
          user.id,
          request.body,
        )

        return reply.send({
          message: 'Address updated successfully',
          address: address.toJSON(),
        })
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AddressNotFoundError') {
            return reply.code(404).send({ message: error.message })
          }
          if (error.name === 'UnauthorizedAddressAccessError') {
            return reply.code(403).send({ message: error.message })
          }
        }

        return reply.code(400).send({
          message:
            error instanceof Error ? error.message : 'Failed to update address',
        })
      }
    },
  )

  // DELETE /addresses/:id - Delete an address
  fastify.delete(
    '/:id',
    {
      schema: deleteAddressSchema,
    },
    async (
      request: FastifyRequest<{
        Params: { id: string }
      }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuthUserId(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        await addressService.deleteAddress(request.params.id, user.id)

        return reply.send({ message: 'Address deleted successfully' })
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AddressNotFoundError') {
            return reply.code(404).send({ message: error.message })
          }
          if (error.name === 'UnauthorizedAddressAccessError') {
            return reply.code(403).send({ message: error.message })
          }
        }

        return reply.code(400).send({
          message:
            error instanceof Error ? error.message : 'Failed to delete address',
        })
      }
    },
  )

  // POST /addresses/:id/set-default - Set an address as default
  fastify.post(
    '/:id/set-default',
    {
      schema: setDefaultAddressSchema,
    },
    async (
      request: FastifyRequest<{
        Params: { id: string }
      }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuthUserId(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        await addressService.setDefaultAddress(request.params.id, user.id)

        return reply.send({ message: 'Default address updated successfully' })
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AddressNotFoundError') {
            return reply.code(404).send({ message: error.message })
          }
          if (error.name === 'UnauthorizedAddressAccessError') {
            return reply.code(403).send({ message: error.message })
          }
        }

        return reply.code(400).send({
          message:
            error instanceof Error
              ? error.message
              : 'Failed to set default address',
        })
      }
    },
  )
}

