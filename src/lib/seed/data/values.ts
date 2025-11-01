/**
 * Company values seed data
 */

export interface CompanyValueData {
  title: string
  description: string
  iconName: string
  iconColor?: string
  isActive: boolean
}

export interface CompanyValuesSet {
  companyId: string
  values: CompanyValueData[]
}

export const DEMO_COMPANY_VALUES: CompanyValuesSet[] = [
  // Valorize Corp values
  {
    companyId: 'demo-company-001',
    values: [
      {
        title: 'Inovação',
        description: 'Buscando constantemente novas e melhores formas de resolver problemas',
        iconName: 'lightbulb',
        iconColor: '#8B5CF6',
        isActive: true,
      },
      {
        title: 'Colaboração',
        description: 'Trabalhando juntos para alcançar objetivos comuns',
        iconName: 'handshake',
        iconColor: '#10B981',
        isActive: true,
      },
      {
        title: 'Excelência',
        description: 'Buscando a mais alta qualidade em tudo o que fazemos',
        iconName: 'star',
        iconColor: '#F59E0B',
        isActive: true,
      },
      {
        title: 'Integridade',
        description: 'Ser honesto e transparente em todas as nossas ações',
        iconName: 'shield-check',
        iconColor: '#1E40AF',
        isActive: true,
      },
      {
        title: 'Foco no Cliente',
        description: 'Colocar nossos clientes no centro de tudo o que fazemos',
        iconName: 'target',
        iconColor: '#EF4444',
        isActive: true,
      },
    ],
  },
  // TechStart Brasil values
  {
    companyId: 'demo-company-002',
    values: [
      {
        title: 'Inovação',
        description: 'Buscando constantemente novas formas de resolver problemas',
        iconName: 'lightning',
        iconColor: '#3B82F6',
        isActive: true,
      },
      {
        title: 'Trabalho em Equipe',
        description: 'Colaborando para alcançar objetivos comuns',
        iconName: 'users',
        iconColor: '#10B981',
        isActive: true,
      },
      {
        title: 'Compromisso',
        description: 'Dedicação e responsabilidade em tudo que fazemos',
        iconName: 'hand-fist',
        iconColor: '#EF4444',
        isActive: true,
      },
      {
        title: 'Transparência',
        description: 'Comunicação clara e honesta',
        iconName: 'eye',
        iconColor: '#06B6D4',
        isActive: true,
      },
    ],
  },
  // Global Solutions Inc values
  {
    companyId: 'demo-company-003',
    values: [
      {
        title: 'Inovação',
        description: 'Impulsionando mudanças através de soluções criativas',
        iconName: 'rocket',
        iconColor: '#8B5CF6',
        isActive: true,
      },
      {
        title: 'Trabalho em Equipe',
        description: 'Alcançando mais juntos',
        iconName: 'users',
        iconColor: '#10B981',
        isActive: true,
      },
      {
        title: 'Responsabilidade',
        description: 'Assumir propriedade de nossas ações e resultados',
        iconName: 'seal-check',
        iconColor: '#8B5CF6',
        isActive: true,
      },
    ],
  },
]
