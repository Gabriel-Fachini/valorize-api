// JSON Schema for Fastify validation

export const listPrizesSchema = {
  querystring: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by prize category',
      },
      minPrice: {
        type: 'integer',
        minimum: 0,
        description: 'Minimum coin price',
      },
      maxPrice: {
        type: 'integer',
        minimum: 0,
        description: 'Maximum coin price',
      },
    },
    additionalProperties: false,
  },
}

export const getPrizeDetailsSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Prize ID',
      },
    },
    required: ['id'],
  },
}

export const createPrizeSchema = {
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        description: 'Prize name',
      },
      description: {
        type: 'string',
        minLength: 10,
        maxLength: 2000,
        description: 'Prize description',
      },
      category: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Prize category (e.g., Electronics, Books, Gift Cards)',
      },
      images: {
        type: 'array',
        items: {
          type: 'string',
          format: 'uri',
        },
        minItems: 1,
        maxItems: 10,
        description: 'Array of image URLs',
      },
      coinPrice: {
        type: 'integer',
        minimum: 1,
        description: 'Price in coins',
      },
      brand: {
        type: 'string',
        maxLength: 100,
        description: 'Prize brand (optional)',
      },
      specifications: {
        type: 'object',
        description: 'Additional specifications as key-value pairs (optional)',
      },
      stock: {
        type: 'integer',
        minimum: 0,
        default: 0,
        description: 'Available stock quantity',
      },
      isGlobal: {
        type: 'boolean',
        default: false,
        description: 'If true, prize is available to all companies',
      },
    },
    required: ['name', 'description', 'category', 'images', 'coinPrice', 'stock'],
    additionalProperties: false,
  },
}

export const addVariantSchema = {
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Prize ID',
      },
    },
    required: ['id'],
  },
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Variant name (e.g., Color, Voltage, Size)',
      },
      value: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Variant value (e.g., Blue, 110V, Large)',
      },
      stock: {
        type: 'integer',
        minimum: 0,
        default: 0,
        description: 'Stock quantity for this variant',
      },
    },
    required: ['name', 'value', 'stock'],
    additionalProperties: false,
  },
}

