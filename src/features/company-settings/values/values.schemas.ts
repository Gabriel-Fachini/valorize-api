export const createCompanyValueSchema = {
  body: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 3,
      },
      description: {
        type: 'string',
        minLength: 10,
      },
      iconName: {
        type: 'string',
        minLength: 1,
      },
      iconColor: {
        type: 'string',
      },
    },
    required: ['title', 'description', 'iconName'],
    additionalProperties: false,
  },
  params: {
    type: 'object',
    properties: {
      companyId: {
        type: 'string',
      },
    },
    required: ['companyId'],
    additionalProperties: false,
  },
}

export const listCompanyValuesSchema = {
  params: {
    type: 'object',
    properties: {
      companyId: {
        type: 'string',
      },
    },
    required: ['companyId'],
    additionalProperties: false,
  },
}

export type CreateCompanyValueInput = {
  title: string
  description: string
  iconName: string
  iconColor?: string
}