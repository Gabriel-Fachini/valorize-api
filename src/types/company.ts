export interface CompanyData {
  id: string
  name: string
  domain: string
  country: string
  timezone: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CompanyBrazilData {
  id: string
  companyId: string
  cnpj: string
  razaoSocial: string
  inscricaoEstadual?: string | null
  inscricaoMunicipal?: string | null
  nire?: string | null
  cnaePrincipal: string
  cnaeSecundario?: string | null
  naturezaJuridica: string
  porteEmpresa: string
  situacaoCadastral: string
  createdAt: Date
  updatedAt: Date
}

export interface CompanyContactData {
  id: string
  companyId: string
  userId: string
  role: string
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateCompanyRequest {
  name: string
  domain: string
  country?: string
  timezone?: string
  brazilData?: {
    cnpj: string
    razaoSocial: string
    inscricaoEstadual?: string
    inscricaoMunicipal?: string
    nire?: string
    cnaePrincipal: string
    cnaeSecundario?: string
    naturezaJuridica: string
    porteEmpresa: string
    situacaoCadastral: string
  }
}

export interface UpdateCompanyRequest {
  name?: string
  domain?: string
  country?: string
  timezone?: string
  isActive?: boolean
}

export interface CreateCompanyBrazilRequest {
  companyId: string
  cnpj: string
  razaoSocial: string
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  nire?: string
  cnaePrincipal: string
  cnaeSecundario?: string
  naturezaJuridica: string
  porteEmpresa: string
  situacaoCadastral: string
}

export interface UpdateCompanyBrazilRequest {
  cnpj?: string
  razaoSocial?: string
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  nire?: string
  cnaePrincipal?: string
  cnaeSecundario?: string
  naturezaJuridica?: string
  porteEmpresa?: string
  situacaoCadastral?: string
}

export interface CreateCompanyContactRequest {
  companyId: string
  userId: string
  role: string
  isPrimary?: boolean
}

export interface UpdateCompanyContactRequest {
  role?: string
  isPrimary?: boolean
}

// Response types
export interface CompanyResponse {
  id: string
  name: string
  domain: string
  country: string
  timezone: string
  isActive: boolean
  companyBrazil?: CompanyBrazilData | null
  contacts?: CompanyContactResponse[]
  createdAt: Date
  updatedAt: Date
}

export interface CompanyBrazilResponse {
  id: string
  companyId: string
  cnpj: string
  razaoSocial: string
  inscricaoEstadual?: string | null
  inscricaoMunicipal?: string | null
  nire?: string | null
  cnaePrincipal: string
  cnaeSecundario?: string | null
  naturezaJuridica: string
  porteEmpresa: string
  situacaoCadastral: string
  createdAt: Date
  updatedAt: Date
}

export interface CompanyContactResponse {
  id: string
  companyId: string
  userId: string
  role: string
  isPrimary: boolean
  user?: {
    id: string
    name: string
    email: string
  }
  company?: {
    id: string
    name: string
    domain: string
  }
  createdAt: Date
  updatedAt: Date
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  meta?: {
    total?: number
    timestamp: string
  }
}

// Common error codes
export enum CompanyErrorCodes {
  COMPANY_NOT_FOUND = 'COMPANY_NOT_FOUND',
  DOMAIN_EXISTS = 'DOMAIN_EXISTS',
  CNPJ_EXISTS = 'CNPJ_EXISTS',
  INVALID_CNPJ = 'INVALID_CNPJ',
  CONTACT_EXISTS = 'CONTACT_EXISTS',
  CONTACT_NOT_FOUND = 'CONTACT_NOT_FOUND',
  BRAZIL_DATA_EXISTS = 'BRAZIL_DATA_EXISTS',
  BRAZIL_DATA_NOT_FOUND = 'BRAZIL_DATA_NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// CNPJ validation result
export interface CNPJValidationResult {
  cnpj: string
  formatted: string
  isValid: boolean
}
