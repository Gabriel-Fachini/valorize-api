import { z } from 'zod'

// Company schemas
export const createCompanySchema = {
  body: z.object({
    name: z.string().min(1, 'Company name is required').max(255, 'Company name too long'),
    domain: z.string()
      .min(1, 'Domain is required')
      .max(255, 'Domain too long')
      .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, 'Invalid domain format'),
    country: z.string().length(2, 'Country code must be 2 characters').optional(),
    timezone: z.string().optional(),
    brazilData: z.object({
      cnpj: z.string().min(14, 'CNPJ must have 14 digits').max(18, 'CNPJ too long'),
      razaoSocial: z.string().min(1, 'Razão social is required').max(255, 'Razão social too long'),
      inscricaoEstadual: z.string().max(20, 'Inscrição estadual too long').optional(),
      inscricaoMunicipal: z.string().max(20, 'Inscrição municipal too long').optional(),
      nire: z.string().max(20, 'NIRE too long').optional(),
      cnaePrincipal: z.string().min(1, 'CNAE principal is required').max(10, 'CNAE principal too long'),
      cnaeSecundario: z.string().max(255, 'CNAE secundário too long').optional(),
      naturezaJuridica: z.string().min(1, 'Natureza jurídica is required').max(100, 'Natureza jurídica too long'),
      porteEmpresa: z.string().min(1, 'Porte da empresa is required').max(50, 'Porte da empresa too long'),
      situacaoCadastral: z.string().min(1, 'Situação cadastral is required').max(50, 'Situação cadastral too long'),
    }).optional(),
  }),
}

export const updateCompanySchema = {
  params: z.object({
    id: z.string().cuid('Invalid company ID format'),
  }),
  body: z.object({
    name: z.string().min(1, 'Company name is required').max(255, 'Company name too long').optional(),
    domain: z.string()
      .min(1, 'Domain is required')
      .max(255, 'Domain too long')
      .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, 'Invalid domain format')
      .optional(),
    country: z.string().length(2, 'Country code must be 2 characters').optional(),
    timezone: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
}

export const getCompanySchema = {
  params: z.object({
    id: z.string().cuid('Invalid company ID format'),
  }),
}

export const getCompanyByDomainSchema = {
  params: z.object({
    domain: z.string().min(1, 'Domain is required'),
  }),
}

export const deleteCompanySchema = {
  params: z.object({
    id: z.string().cuid('Invalid company ID format'),
  }),
}

// Company Brazil schemas
export const createCompanyBrazilSchema = {
  body: z.object({
    companyId: z.string().cuid('Invalid company ID format'),
    cnpj: z.string().min(14, 'CNPJ must have 14 digits').max(18, 'CNPJ too long'),
    razaoSocial: z.string().min(1, 'Razão social is required').max(255, 'Razão social too long'),
    inscricaoEstadual: z.string().max(20, 'Inscrição estadual too long').optional(),
    inscricaoMunicipal: z.string().max(20, 'Inscrição municipal too long').optional(),
    nire: z.string().max(20, 'NIRE too long').optional(),
    cnaePrincipal: z.string().min(1, 'CNAE principal is required').max(10, 'CNAE principal too long'),
    cnaeSecundario: z.string().max(255, 'CNAE secundário too long').optional(),
    naturezaJuridica: z.string().min(1, 'Natureza jurídica is required').max(100, 'Natureza jurídica too long'),
    porteEmpresa: z.string().min(1, 'Porte da empresa is required').max(50, 'Porte da empresa too long'),
    situacaoCadastral: z.string().min(1, 'Situação cadastral is required').max(50, 'Situação cadastral too long'),
  }),
}

export const updateCompanyBrazilSchema = {
  params: z.object({
    companyId: z.string().cuid('Invalid company ID format'),
  }),
  body: z.object({
    cnpj: z.string().min(14, 'CNPJ must have 14 digits').max(18, 'CNPJ too long').optional(),
    razaoSocial: z.string().min(1, 'Razão social is required').max(255, 'Razão social too long').optional(),
    inscricaoEstadual: z.string().max(20, 'Inscrição estadual too long').optional(),
    inscricaoMunicipal: z.string().max(20, 'Inscrição municipal too long').optional(),
    nire: z.string().max(20, 'NIRE too long').optional(),
    cnaePrincipal: z.string().min(1, 'CNAE principal is required').max(10, 'CNAE principal too long').optional(),
    cnaeSecundario: z.string().max(255, 'CNAE secundário too long').optional(),
    naturezaJuridica: z.string().min(1, 'Natureza jurídica is required').max(100, 'Natureza jurídica too long').optional(),
    porteEmpresa: z.string().min(1, 'Porte da empresa is required').max(50, 'Porte da empresa too long').optional(),
    situacaoCadastral: z.string().min(1, 'Situação cadastral is required').max(50, 'Situação cadastral too long').optional(),
  }),
}

export const validateCNPJSchema = {
  body: z.object({
    cnpj: z.string().min(14, 'CNPJ must have 14 digits').max(18, 'CNPJ too long'),
  }),
}

// Company Contact schemas
export const addCompanyContactSchema = {
  body: z.object({
    companyId: z.string().cuid('Invalid company ID format'),
    userId: z.string().cuid('Invalid user ID format'),
    role: z.string().min(1, 'Role is required').max(100, 'Role too long'),
    isPrimary: z.boolean().optional(),
  }),
}

export const updateCompanyContactSchema = {
  params: z.object({
    id: z.string().cuid('Invalid contact ID format'),
  }),
  body: z.object({
    role: z.string().min(1, 'Role is required').max(100, 'Role too long').optional(),
    isPrimary: z.boolean().optional(),
  }),
}

export const getCompanyContactsSchema = {
  params: z.object({
    companyId: z.string().cuid('Invalid company ID format'),
  }),
}

export const removeCompanyContactSchema = {
  params: z.object({
    id: z.string().cuid('Invalid contact ID format'),
  }),
}

export const setPrimaryContactSchema = {
  params: z.object({
    id: z.string().cuid('Invalid contact ID format'),
  }),
}

// Response schemas
export const companyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  country: z.string(),
  timezone: z.string(),
  isActive: z.boolean(),
  companyBrazil: z.object({
    id: z.string(),
    cnpj: z.string(),
    razaoSocial: z.string(),
    inscricaoEstadual: z.string().nullable(),
    inscricaoMunicipal: z.string().nullable(),
    nire: z.string().nullable(),
    cnaePrincipal: z.string(),
    cnaeSecundario: z.string().nullable(),
    naturezaJuridica: z.string(),
    porteEmpresa: z.string(),
    situacaoCadastral: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }).nullable(),
  contacts: z.array(z.object({
    id: z.string(),
    role: z.string(),
    isPrimary: z.boolean(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    }),
    createdAt: z.date(),
    updatedAt: z.date(),
  })).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const companiesListResponseSchema = z.array(companyResponseSchema)

export const companyBrazilResponseSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  cnpj: z.string(),
  razaoSocial: z.string(),
  inscricaoEstadual: z.string().nullable(),
  inscricaoMunicipal: z.string().nullable(),
  nire: z.string().nullable(),
  cnaePrincipal: z.string(),
  cnaeSecundario: z.string().nullable(),
  naturezaJuridica: z.string(),
  porteEmpresa: z.string(),
  situacaoCadastral: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const companyContactResponseSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  userId: z.string(),
  role: z.string(),
  isPrimary: z.boolean(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  company: z.object({
    id: z.string(),
    name: z.string(),
    domain: z.string(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const companyContactsListResponseSchema = z.array(companyContactResponseSchema)

// Error response schema
export const errorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
})

// Success response schema
export const successResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.any(),
  meta: z.object({
    timestamp: z.string(),
  }).optional(),
})
