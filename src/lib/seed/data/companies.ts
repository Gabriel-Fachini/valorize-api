/**
 * Company seed data including Brazil-specific information
 */

export interface BrazilCompanyData {
  cnpj: string
  razaoSocial: string
  inscricaoEstadual: string
  inscricaoMunicipal: string
  nire: string
  cnaePrincipal: string
  cnaeSecundario?: string
  naturezaJuridica: string
  porteEmpresa: string
  situacaoCadastral: string
}

export interface CompanyData {
  id: string
  name: string
  domain: string
  country: string
  timezone: string
  brazilData?: BrazilCompanyData
}

export const DEMO_COMPANIES: CompanyData[] = [
  {
    id: 'demo-company-001',
    name: 'Valorize Corp',
    domain: 'valorize.com',
    country: 'BR',
    timezone: 'America/Sao_Paulo',
    brazilData: {
      cnpj: '11222333000181',
      razaoSocial: 'Valorize Tecnologia Ltda',
      inscricaoEstadual: '123456789',
      inscricaoMunicipal: '987654321',
      nire: '35300123456',
      cnaePrincipal: '6201-5/00',
      cnaeSecundario: '6202-3/00, 6203-1/00',
      naturezaJuridica: 'Sociedade Empresária Limitada',
      porteEmpresa: 'Empresa de Pequeno Porte',
      situacaoCadastral: 'Ativa',
    },
  },
  {
    id: 'demo-company-002',
    name: 'TechStart Brasil',
    domain: 'techstart.com.br',
    country: 'BR',
    timezone: 'America/Sao_Paulo',
    brazilData: {
      cnpj: '22333444000195',
      razaoSocial: 'TechStart Inovação e Tecnologia Ltda',
      inscricaoEstadual: '234567890',
      inscricaoMunicipal: '876543210',
      nire: '35300234567',
      cnaePrincipal: '6204-0/00',
      cnaeSecundario: '6311-9/00, 7319-0/02',
      naturezaJuridica: 'Sociedade Empresária Limitada',
      porteEmpresa: 'Microempresa',
      situacaoCadastral: 'Ativa',
    },
  },
  {
    id: 'demo-company-003',
    name: 'Global Solutions Inc',
    domain: 'globalsolutions.com',
    country: 'US',
    timezone: 'America/New_York',
    // No Brazil data for international company
  },
]
