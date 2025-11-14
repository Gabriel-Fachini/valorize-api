export const createAddressSchema = {
  description: 'Create a new address',
  tags: ['addresses'],
  body: {
    type: 'object',
    required: [
      'name',
      'street',
      'number',
      'neighborhood',
      'city',
      'state',
      'zipCode',
      'phone',
    ],
    properties: {
      name: {
        type: 'string',
        description: 'A friendly name for the address (e.g., Home, Work)',
      },
      street: { type: 'string' },
      number: { type: 'string' },
      complement: { type: 'string' },
      neighborhood: { type: 'string' },
      city: { type: 'string' },
      state: { type: 'string' },
      zipCode: { type: 'string' },
      country: { type: 'string', default: 'BR' },
      phone: { type: 'string' },
      isDefault: { type: 'boolean', default: false },
    },
  },
}

export const getUserAddressesSchema = {
  description: 'Get all addresses for the current user',
  tags: ['addresses'],
}

export const getAddressByIdSchema = {
  description: 'Get a specific address by ID',
  tags: ['addresses'],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
}

export const updateAddressSchema = {
  description: 'Update an existing address',
  tags: ['addresses'],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      street: { type: 'string' },
      number: { type: 'string' },
      complement: { type: 'string' },
      neighborhood: { type: 'string' },
      city: { type: 'string' },
      state: { type: 'string' },
      zipCode: { type: 'string' },
      country: { type: 'string' },
      phone: { type: 'string' },
      isDefault: { type: 'boolean' },
    },
  },
}

export const deleteAddressSchema = {
  description: 'Delete an address',
  tags: ['addresses'],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
}

export const setDefaultAddressSchema = {
  description: 'Set an address as the default',
  tags: ['addresses'],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
}

