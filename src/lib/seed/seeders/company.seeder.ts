/**
 * Company seeder
 */

import { BaseSeeder } from './base.seeder'
import { DEMO_COMPANIES } from '../data/companies'

export class CompanySeeder extends BaseSeeder {
  protected get name(): string {
    return 'companies'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    for (const companyData of DEMO_COMPANIES) {
      // Create company
      const company = await this.prisma.company.upsert({
        where: { id: companyData.id },
        update: {
          name: companyData.name,
          domain: companyData.domain,
          country: companyData.country,
          timezone: companyData.timezone,
        },
        create: {
          id: companyData.id,
          name: companyData.name,
          domain: companyData.domain,
          country: companyData.country,
          timezone: companyData.timezone,
        },
      })
      
      // Create Brazil-specific data if exists
      if (companyData.brazilData) {
        await this.prisma.companyBrazil.upsert({
          where: { companyId: company.id },
          update: {
            cnpj: companyData.brazilData.cnpj,
            razaoSocial: companyData.brazilData.razaoSocial,
            inscricaoEstadual: companyData.brazilData.inscricaoEstadual,
            inscricaoMunicipal: companyData.brazilData.inscricaoMunicipal,
            nire: companyData.brazilData.nire,
            cnaePrincipal: companyData.brazilData.cnaePrincipal,
            cnaeSecundario: companyData.brazilData.cnaeSecundario,
            naturezaJuridica: companyData.brazilData.naturezaJuridica,
            porteEmpresa: companyData.brazilData.porteEmpresa,
            situacaoCadastral: companyData.brazilData.situacaoCadastral,
          },
          create: {
            companyId: company.id,
            cnpj: companyData.brazilData.cnpj,
            razaoSocial: companyData.brazilData.razaoSocial,
            inscricaoEstadual: companyData.brazilData.inscricaoEstadual,
            inscricaoMunicipal: companyData.brazilData.inscricaoMunicipal,
            nire: companyData.brazilData.nire,
            cnaePrincipal: companyData.brazilData.cnaePrincipal,
            cnaeSecundario: companyData.brazilData.cnaeSecundario,
            naturezaJuridica: companyData.brazilData.naturezaJuridica,
            porteEmpresa: companyData.brazilData.porteEmpresa,
            situacaoCadastral: companyData.brazilData.situacaoCadastral,
          },
        })
        
        this.logInfo(`Created company '${companyData.name}' with Brazil data`)
      } else {
        this.logInfo(`Created company '${companyData.name}'`)
      }
    }
    
    this.logComplete(DEMO_COMPANIES.length, 'companies')
  }
}
