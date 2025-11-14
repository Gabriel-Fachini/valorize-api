import { Address } from '@prisma/client'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

export type AddressData = Address

export type CreateAddressData = Omit<
  AddressData,
  'id' | 'createdAt' | 'updatedAt'
>

export type UpdateAddressData = Partial<
  Omit<AddressData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>

export class AddressModel {
  constructor(private data: Address) {}

  get id() {
    return this.data.id
  }

  get userId() {
    return this.data.userId
  }

  get name() {
    return this.data.name
  }

  get street() {
    return this.data.street
  }

  get number() {
    return this.data.number
  }

  get complement() {
    return this.data.complement
  }

  get neighborhood() {
    return this.data.neighborhood
  }

  get city() {
    return this.data.city
  }

  get state() {
    return this.data.state
  }

  get zipCode() {
    return this.data.zipCode
  }

  get country() {
    return this.data.country
  }

  get phone() {
    return this.data.phone
  }

  get isDefault() {
    return this.data.isDefault
  }

  get createdAt() {
    return this.data.createdAt
  }

  get updatedAt() {
    return this.data.updatedAt
  }

  toJSON() {
    return {
      id: this.data.id,
      userId: this.data.userId,
      name: this.data.name,
      street: this.data.street,
      number: this.data.number,
      complement: this.data.complement,
      neighborhood: this.data.neighborhood,
      city: this.data.city,
      state: this.data.state,
      zipCode: this.data.zipCode,
      country: this.data.country,
      phone: this.data.phone,
      isDefault: this.data.isDefault,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
    }
  }

  static async create(data: CreateAddressData): Promise<AddressModel> {
    try {
      const address = await prisma.address.create({
        data,
      })

      logger.info('Address created successfully', {
        addressId: address.id,
        userId: data.userId,
      })
      return new AddressModel(address)
    } catch (error) {
      logger.error('Error creating address', { error, data })
      throw new Error('Failed to create address')
    }
  }

  static async findById(id: string): Promise<AddressModel | null> {
    try {
      const address = await prisma.address.findUnique({
        where: { id },
      })

      return address ? new AddressModel(address) : null
    } catch (error) {
      logger.error('Error finding address by ID', { error, id })
      throw new Error('Failed to find address')
    }
  }

  static async findByUserId(userId: string): Promise<AddressModel[]> {
    try {
      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      })

      return addresses.map((address) => new AddressModel(address))
    } catch (error) {
      logger.error('Error finding addresses by user ID', { error, userId })
      throw new Error('Failed to find addresses')
    }
  }

  static async findDefaultByUserId(
    userId: string,
  ): Promise<AddressModel | null> {
    try {
      const address = await prisma.address.findFirst({
        where: { userId, isDefault: true },
      })

      return address ? new AddressModel(address) : null
    } catch (error) {
      logger.error('Error finding default address', { error, userId })
      throw new Error('Failed to find default address')
    }
  }

  static async countByUserId(userId: string): Promise<number> {
    try {
      return await prisma.address.count({
        where: { userId },
      })
    } catch (error) {
      logger.error('Error counting addresses', { error, userId })
      throw new Error('Failed to count addresses')
    }
  }

  async update(data: UpdateAddressData): Promise<AddressModel> {
    try {
      const updated = await prisma.address.update({
        where: { id: this.data.id },
        data,
      })

      this.data = updated
      logger.info('Address updated successfully', { addressId: this.data.id })
      return this
    } catch (error) {
      logger.error('Error updating address', {
        error,
        addressId: this.data.id,
      })
      throw new Error('Failed to update address')
    }
  }

  async delete(): Promise<void> {
    try {
      await prisma.address.delete({
        where: { id: this.data.id },
      })

      logger.info('Address deleted successfully', { addressId: this.data.id })
    } catch (error) {
      logger.error('Error deleting address', {
        error,
        addressId: this.data.id,
      })
      throw new Error('Failed to delete address')
    }
  }

  static async unsetDefaultForUser(userId: string): Promise<void> {
    try {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })

      logger.info('Unset default addresses for user', { userId })
    } catch (error) {
      logger.error('Error unsetting default addresses', { error, userId })
      throw new Error('Failed to unset default addresses')
    }
  }
}

