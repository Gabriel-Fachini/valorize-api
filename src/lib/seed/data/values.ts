/**
 * Company values seed data
 */

export interface CompanyValueData {
  title: string
  description: string
  icon: string
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
        title: 'Innovation',
        description: 'Constantly seeking new and better ways to solve problems',
        icon: '💡',
        isActive: true,
      },
      {
        title: 'Collaboration',
        description: 'Working together to achieve common goals',
        icon: '🤝',
        isActive: true,
      },
      {
        title: 'Excellence',
        description: 'Striving for the highest quality in everything we do',
        icon: '⭐',
        isActive: true,
      },
      {
        title: 'Integrity',
        description: 'Being honest and transparent in all our actions',
        icon: '🛡️',
        isActive: true,
      },
      {
        title: 'Customer Focus',
        description: 'Putting our customers at the center of everything we do',
        icon: '🎯',
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
        icon: '💡',
        isActive: true,
      },
      {
        title: 'Trabalho em Equipe',
        description: 'Colaborando para alcançar objetivos comuns',
        icon: '🤝',
        isActive: true,
      },
      {
        title: 'Compromisso',
        description: 'Dedicação e responsabilidade em tudo que fazemos',
        icon: '💪',
        isActive: true,
      },
      {
        title: 'Transparência',
        description: 'Comunicação clara e honesta',
        icon: '🔍',
        isActive: true,
      },
    ],
  },
  // Global Solutions Inc values
  {
    companyId: 'demo-company-003',
    values: [
      {
        title: 'Innovation',
        description: 'Driving change through creative solutions',
        icon: '🚀',
        isActive: true,
      },
      {
        title: 'Teamwork',
        description: 'Achieving more together',
        icon: '👥',
        isActive: true,
      },
      {
        title: 'Accountability',
        description: 'Taking ownership of our actions and results',
        icon: '✓',
        isActive: true,
      },
    ],
  },
]
