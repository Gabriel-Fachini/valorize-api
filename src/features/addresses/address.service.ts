import {
  AddressModel,
  CreateAddressData,
  UpdateAddressData,
} from './address.model'
import { logger } from '@/lib/logger'

const MAX_ADDRESSES_PER_USER = 3

class AddressService {
  async createAddress(data: CreateAddressData): Promise<AddressModel> {
    // Check if user already has 3 addresses
    const addressCount = await AddressModel.countByUserId(data.userId)
    if (addressCount >= MAX_ADDRESSES_PER_USER) {
      throw Object.assign(
        new Error(
          `User cannot have more than ${MAX_ADDRESSES_PER_USER} addresses`,
        ),
        { name: 'MaxAddressesReachedError' },
      )
    }

    // If this is marked as default, unset other default addresses
    if (data.isDefault) {
      await AddressModel.unsetDefaultForUser(data.userId)
    }

    // If user has no addresses, make this one default
    if (addressCount === 0) {
      data.isDefault = true
    }

    const address = await AddressModel.create(data)

    logger.info('Address created', {
      addressId: address.id,
      userId: data.userId,
    })

    return address
  }

  async getUserAddresses(userId: string): Promise<AddressModel[]> {
    return await AddressModel.findByUserId(userId)
  }

  async getAddressById(
    addressId: string,
    userId: string,
  ): Promise<AddressModel> {
    const address = await AddressModel.findById(addressId)

    if (!address) {
      throw Object.assign(new Error('Address not found'), {
        name: 'AddressNotFoundError',
      })
    }

    // Verify that the address belongs to the user
    if (address.userId !== userId) {
      throw Object.assign(
        new Error('You do not have permission to access this address'),
        { name: 'UnauthorizedAddressAccessError' },
      )
    }

    return address
  }

  async updateAddress(
    addressId: string,
    userId: string,
    data: UpdateAddressData,
  ): Promise<AddressModel> {
    const address = await this.getAddressById(addressId, userId)

    // If marking this as default, unset other default addresses
    if (data.isDefault === true) {
      await AddressModel.unsetDefaultForUser(userId)
    }

    const updated = await address.update(data)

    logger.info('Address updated', { addressId, userId })

    return updated
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const address = await this.getAddressById(addressId, userId)

    // If deleting the default address, set another address as default
    if (address.isDefault) {
      const addresses = await AddressModel.findByUserId(userId)
      const otherAddresses = addresses.filter((a) => a.id !== addressId)

      if (otherAddresses.length > 0) {
        await otherAddresses[0].update({ isDefault: true })
      }
    }

    await address.delete()

    logger.info('Address deleted', { addressId, userId })
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<void> {
    const address = await this.getAddressById(addressId, userId)

    // Unset all default addresses for this user
    await AddressModel.unsetDefaultForUser(userId)

    // Set this address as default
    await address.update({ isDefault: true })

    logger.info('Default address updated', { addressId, userId })
  }
}

export const addressService = new AddressService()

