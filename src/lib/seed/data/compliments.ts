/**
 * Compliment seed data
 */

export interface ComplimentData {
  senderAuth0Id: string
  receiverAuth0Id: string
  companyId: string
  valueIndex: number // Index in the company's values array
  message: string
  coins: number
  isPublic: boolean
  daysAgo?: number // Optional: create compliment X days in the past
}

// Helper function to create dates in the past
export function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

// Compliments sent by Gabriel (distributed over last 8 weeks)
export const COMPLIMENTS_FROM_GABRIEL: Omit<ComplimentData, 'senderAuth0Id' | 'companyId'>[] = [
  // Week 1 (most recent - 0-7 days ago)
  {
    receiverAuth0Id: 'auth0|demo-company-admin-valorize',
    valueIndex: 0, // Innovation
    message: 'João, sua abordagem inovadora para resolver aquele problema de performance da API foi brilhante! A forma como você otimizou nossas queries salvou toneladas de recursos. Continue com o trabalho incrível! 🚀',
    coins: 25,
    isPublic: true,
    daysAgo: 2,
  },
  {
    receiverAuth0Id: 'auth0|demo-hr-manager-valorize',
    valueIndex: 1, // Collaboration
    message: 'Maria, obrigado por unir a equipe durante o processo de onboarding. Seu espírito colaborativo fez os novos membros se sentirem bem-vindos e produtivos desde o primeiro dia!',
    coins: 20,
    isPublic: true,
    daysAgo: 4,
  },
  {
    receiverAuth0Id: 'auth0|demo-team-lead-valorize',
    valueIndex: 2, // Excellence
    message: 'Carlos, a revisão de código que você fez ontem foi excepcional. Sua atenção aos detalhes e feedback construtivo nos ajudou a encontrar bugs críticos antes da produção. Trabalho verdadeiramente excelente!',
    coins: 30,
    isPublic: true,
    daysAgo: 1,
  },

  // Week 2 (8-14 days ago)
  {
    receiverAuth0Id: 'auth0|demo-employee-valorize-1',
    valueIndex: 3, // Integrity
    message: 'Ana, realmente aprecio sua honestidade ao identificar aquela vulnerabilidade de segurança. Sua integridade ao reportar imediatamente protegeu nossos usuários e mostrou verdadeiro profissionalismo.',
    coins: 25,
    isPublic: true,
    daysAgo: 10,
  },
  {
    receiverAuth0Id: 'auth0|demo-employee-valorize-2',
    valueIndex: 4, // Customer Focus
    message: 'Pedro, a forma como você lidou com aquele problema difícil do cliente foi extraordinária. Você manteve a paciência, ouviu com atenção e encontrou uma solução que superou as expectativas!',
    coins: 20,
    isPublic: true,
    daysAgo: 12,
  },
  {
    receiverAuth0Id: 'auth0|demo-company-admin-valorize',
    valueIndex: 1, // Collaboration
    message: 'João, ótimo trabalho colaborando com o time de design nas novas funcionalidades da UI. A comunicação foi impecável!',
    coins: 15,
    isPublic: true,
    daysAgo: 14,
  },

  // Week 3 (15-21 days ago)
  {
    receiverAuth0Id: 'auth0|demo-team-lead-valorize',
    valueIndex: 0, // Innovation
    message: 'Carlos, sua solução criativa para a camada de cache foi genial! A performance melhorou 40%.',
    coins: 30,
    isPublic: true,
    daysAgo: 18,
  },
  {
    receiverAuth0Id: 'auth0|demo-hr-manager-valorize',
    valueIndex: 2, // Excellence
    message: 'Maria, o processo de avaliação trimestral que você desenhou é excelente. Todos apreciaram a estrutura clara!',
    coins: 25,
    isPublic: true,
    daysAgo: 20,
  },

  // Week 4 (22-28 days ago)
  {
    receiverAuth0Id: 'auth0|demo-employee-valorize-1',
    valueIndex: 4, // Customer Focus
    message: 'Ana, sua apresentação para o cliente foi fantástica. Você realmente entendeu as necessidades deles!',
    coins: 20,
    isPublic: true,
    daysAgo: 25,
  },
  {
    receiverAuth0Id: 'auth0|demo-employee-valorize-2',
    valueIndex: 2, // Excellence
    message: 'Pedro, a documentação que você escreveu é de primeira. Os novos membros do time vão adorar isso!',
    coins: 20,
    isPublic: true,
    daysAgo: 27,
  },

  // Week 5 (29-35 days ago)
  {
    receiverAuth0Id: 'auth0|demo-company-admin-valorize',
    valueIndex: 3, // Integrity
    message: 'João, obrigado por ser transparente sobre os desafios do cronograma do projeto. Sua honestidade nos ajuda a planejar melhor.',
    coins: 15,
    isPublic: true,
    daysAgo: 32,
  },

  // Week 6 (36-42 days ago)
  {
    receiverAuth0Id: 'auth0|demo-team-lead-valorize',
    valueIndex: 1, // Collaboration
    message: 'Carlos, sua mentoria dos desenvolvedores juniores está fazendo uma diferença real. Obrigado!',
    coins: 25,
    isPublic: true,
    daysAgo: 39,
  },
  {
    receiverAuth0Id: 'auth0|demo-hr-manager-valorize',
    valueIndex: 4, // Customer Focus
    message: 'Maria, a pesquisa de satisfação dos funcionários que você conduziu mostrou verdadeiro cuidado com nosso time.',
    coins: 20,
    isPublic: true,
    daysAgo: 40,
  },

  // Week 7 (43-49 days ago)
  {
    receiverAuth0Id: 'auth0|demo-employee-valorize-1',
    valueIndex: 0, // Innovation
    message: 'Ana, sua ideia para o pipeline de testes automatizados nos economizou muito tempo!',
    coins: 30,
    isPublic: true,
    daysAgo: 46,
  },

  // Week 8 (50-56 days ago)
  {
    receiverAuth0Id: 'auth0|demo-employee-valorize-2',
    valueIndex: 3, // Integrity
    message: 'Pedro, aprecio sua abordagem ética ao lidar com dados dos usuários. Segurança em primeiro lugar!',
    coins: 25,
    isPublic: true,
    daysAgo: 53,
  },
]

// Compliments received by Gabriel (distributed over last 8 weeks)
export const COMPLIMENTS_TO_GABRIEL: Omit<ComplimentData, 'receiverAuth0Id' | 'companyId'>[] = [
  // Week 1 (most recent - 0-7 days ago)
  {
    senderAuth0Id: 'auth0|demo-company-admin-valorize',
    valueIndex: 0, // Innovation
    message: 'Gabriel, sua visão para a plataforma Valorize é verdadeiramente inovadora! A forma como você está combinando reconhecimento com gamificação vai transformar como as empresas valorizam seus funcionários. Animado para construir isso com você!',
    coins: 30,
    isPublic: true,
    daysAgo: 3,
  },
  {
    senderAuth0Id: 'auth0|demo-hr-manager-valorize',
    valueIndex: 1, // Collaboration
    message: 'Obrigada por sempre estar aberto a feedback, Gabriel! Seu estilo de liderança colaborativa faz todos se sentirem ouvidos e valorizados. É um prazer trabalhar com você!',
    coins: 25,
    isPublic: true,
    daysAgo: 5,
  },

  // Week 2 (8-14 days ago)
  {
    senderAuth0Id: 'auth0|demo-team-lead-valorize',
    valueIndex: 2, // Excellence
    message: 'Gabriel, as decisões de arquitetura que você tomou para esta API são excelentes. Limpa, escalável e bem documentada. Isso vai facilitar muito nossas vidas conforme crescemos!',
    coins: 30,
    isPublic: true,
    daysAgo: 11,
  },
  {
    senderAuth0Id: 'auth0|demo-employee-valorize-1',
    valueIndex: 1, // Collaboration
    message: 'Gabriel, obrigada por ter programado em pair comigo naquela funcionalidade ontem. Sua paciência em explicar as partes complexas me ajudou a aprender muito!',
    coins: 15,
    isPublic: true,
    daysAgo: 13,
  },

  // Week 3 (15-21 days ago)
  {
    senderAuth0Id: 'auth0|demo-employee-valorize-2',
    valueIndex: 4, // Customer Focus
    message: 'Sua dedicação em entender as necessidades dos usuários é inspiradora, Gabriel. As funcionalidades que você prioriza sempre parecem ser exatamente o que nossos clientes precisam!',
    coins: 20,
    isPublic: true,
    daysAgo: 17,
  },
  {
    senderAuth0Id: 'auth0|demo-company-admin-valorize',
    valueIndex: 2, // Excellence
    message: 'Gabriel, a qualidade de suas revisões de código é excepcional. Você detecta problemas que eu nunca teria notado!',
    coins: 25,
    isPublic: true,
    daysAgo: 19,
  },

  // Week 4 (22-28 days ago)
  {
    senderAuth0Id: 'auth0|demo-team-lead-valorize',
    valueIndex: 3, // Integrity
    message: 'Aprecio sua transparência sobre a dívida técnica, Gabriel. Honestidade assim constrói confiança.',
    coins: 20,
    isPublic: true,
    daysAgo: 24,
  },
  {
    senderAuth0Id: 'auth0|demo-hr-manager-valorize',
    valueIndex: 0, // Innovation
    message: 'Sua abordagem inovadora para as funcionalidades do dashboard vai fazer um impacto enorme!',
    coins: 30,
    isPublic: true,
    daysAgo: 26,
  },

  // Week 5 (29-35 days ago)
  {
    senderAuth0Id: 'auth0|demo-employee-valorize-1',
    valueIndex: 4, // Customer Focus
    message: 'Gabriel, você sempre coloca o usuário em primeiro lugar. Fica claro em cada decisão que você toma!',
    coins: 20,
    isPublic: true,
    daysAgo: 31,
  },

  // Week 6 (36-42 days ago)
  {
    senderAuth0Id: 'auth0|demo-employee-valorize-2',
    valueIndex: 1, // Collaboration
    message: 'Obrigado por colaborar tão efetivamente com toda a equipe, Gabriel. Você torna todos melhores!',
    coins: 25,
    isPublic: true,
    daysAgo: 38,
  },
  {
    senderAuth0Id: 'auth0|demo-company-admin-valorize',
    valueIndex: 3, // Integrity
    message: 'Seu compromisso em fazer as coisas da maneira certa, mesmo quando leva mais tempo, é admirável.',
    coins: 20,
    isPublic: true,
    daysAgo: 41,
  },

  // Week 7 (43-49 days ago)
  {
    senderAuth0Id: 'auth0|demo-team-lead-valorize',
    valueIndex: 0, // Innovation
    message: 'Gabriel, aquele novo fluxo de autenticação que você desenhou é brilhante. Muito mais seguro!',
    coins: 30,
    isPublic: true,
    daysAgo: 45,
  },

  // Week 8 (50-56 days ago)
  {
    senderAuth0Id: 'auth0|demo-hr-manager-valorize',
    valueIndex: 2, // Excellence
    message: 'A excelência que você traz para este projeto define o padrão para todos. Continue assim!',
    coins: 25,
    isPublic: true,
    daysAgo: 52,
  },
]

// Gabriel's auth0Id for reference
export const GABRIEL_AUTH0_ID = 'auth0|688aa3e7f3f1dbd119c3b600'
export const VALORIZE_COMPANY_ID = 'demo-company-001'
