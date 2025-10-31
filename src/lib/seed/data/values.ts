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
        title: 'Innovation',
        description: 'Constantly seeking new and better ways to solve problems',
        iconName: '💡',
        isActive: true,
      },
      {
        title: 'Collaboration',
        description: 'Working together to achieve common goals',
        iconName: '🤝',
        isActive: true,
      },
      {
        title: 'Excellence',
        description: 'Striving for the highest quality in everything we do',
        iconName: '⭐',
        isActive: true,
      },
      {
        title: 'Integrity',
        description: 'Being honest and transparent in all our actions',
        iconName: '🛡️',
        isActive: true,
      },
      {
        title: 'Customer Focus',
        description: 'Putting our customers at the center of everything we do',
        iconName: '🎯',
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
        iconName: '💡',
        isActive: true,
      },
      {
        title: 'Trabalho em Equipe',
        description: 'Colaborando para alcançar objetivos comuns',
        iconName: '🤝',
        isActive: true,
      },
      {
        title: 'Compromisso',
        description: 'Dedicação e responsabilidade em tudo que fazemos',
        iconName: '💪',
        isActive: true,
      },
      {
        title: 'Transparência',
        description: 'Comunicação clara e honesta',
        iconName: '🔍',
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
        iconName: '🚀',
        isActive: true,
      },
      {
        title: 'Teamwork',
        description: 'Achieving more together',
        iconName: '👥',
        isActive: true,
      },
      {
        title: 'Accountability',
        description: 'Taking ownership of our actions and results',
        iconName: '✓',
        isActive: true,
      },
    ],
  },
]
