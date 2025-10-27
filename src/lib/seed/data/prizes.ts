/**
 * Prize (Reward) seed data
 * Prêmios disponíveis no catálogo de recompensas
 */

export const PRIZE_CATEGORIES = {
  ELECTRONICS: 'Eletrônicos',
  GIFT_CARDS: 'Cartões Presente',
  EXPERIENCES: 'Experiências',
  BOOKS: 'Livros e Mídia',
  WELLNESS: 'Saúde e Bem-estar',
  FOOD: 'Alimentação e Bebidas',
  MERCHANDISE: 'Produtos da Marca',
  CHARITY: 'Doações para Caridade',
}

/**
 * Prêmios globais (disponíveis para todas as empresas)
 */
export const GLOBAL_PRIZES = [
  {
    name: 'Cartão Presente Amazon R$ 50',
    description: 'Resgate para qualquer produto na Amazon.com.br. Perfeito para compras, livros, eletrônicos e muito mais.',
    category: PRIZE_CATEGORIES.GIFT_CARDS,
    images: ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500'],
    coinPrice: 250,
    brand: 'Amazon',
    stock: 100,
    specifications: {
      value: 'R$ 50 BRL',
      formato: 'Código Digital',
      validade: 'Sem expiração',
      entrega: 'Entrega instantânea por email',
    },
    variants: [
      { name: 'Valor', value: 'R$ 50', stock: 100 },
    ],
  },
  {
    name: 'Cartão Presente Amazon R$ 100',
    description: 'Dobre o valor, dobre as possibilidades. Compre o que precisar na Amazon.',
    category: PRIZE_CATEGORIES.GIFT_CARDS,
    images: ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500'],
    coinPrice: 500,
    brand: 'Amazon',
    stock: 50,
    specifications: {
      value: 'R$ 100 BRL',
      formato: 'Código Digital',
      validade: 'Sem expiração',
      entrega: 'Entrega instantânea por email',
    },
    variants: [
      { name: 'Valor', value: 'R$ 100', stock: 50 },
    ],
  },
  {
    name: 'Spotify Premium - 3 Meses',
    description: 'Aproveite música sem anúncios, escuta offline e pulos ilimitados com Spotify Premium.',
    category: PRIZE_CATEGORIES.GIFT_CARDS,
    images: ['https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=500'],
    coinPrice: 300,
    brand: 'Spotify',
    stock: 75,
    specifications: {
      duração: '3 meses',
      formato: 'Código Digital',
      recursos: 'Sem anúncios, escuta offline, pulos ilimitados',
      entrega: 'Email em até 24 horas',
    },
    variants: [
      { name: 'Duração', value: '3 meses', stock: 75 },
    ],
  },
  {
    name: 'Fones Bluetooth Sem Fio',
    description: 'Fones de alta qualidade com cancelamento de ruído e bateria de 30 horas.',
    category: PRIZE_CATEGORIES.ELECTRONICS,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
    coinPrice: 800,
    brand: 'SoundMax',
    stock: 20,
    specifications: {
      bateria: '30 horas',
      conectividade: 'Bluetooth 5.0',
      recursos: 'Cancelamento Ativo de Ruído, Design Dobrável',
      garantia: '1 ano',
    },
    variants: [
      { name: 'Cor', value: 'Preto', stock: 10 },
      { name: 'Cor', value: 'Prata', stock: 10 },
    ],
  },
  {
    name: 'Cartão Presente Starbucks R$ 50',
    description: 'Aproveite seu café, chá ou lanche favorito em qualquer loja Starbucks.',
    category: PRIZE_CATEGORIES.FOOD,
    images: ['https://images.unsplash.com/photo-1559496417-e7f25c5fb10d?w=500'],
    coinPrice: 250,
    brand: 'Starbucks',
    stock: 150,
    specifications: {
      value: 'R$ 50 BRL',
      formato: 'Físico ou Digital',
      locais: 'Válido em todas as lojas Starbucks',
      validade: 'Sem expiração',
    },
    variants: [
      { name: 'Formato', value: 'Digital', stock: 100 },
      { name: 'Formato', value: 'Cartão Físico', stock: 50 },
    ],
  },
  {
    name: 'Curso de Culinária Online',
    description: 'Aprenda a cozinhar uma nova culinária com chefs profissionais nesta aula online ao vivo.',
    category: PRIZE_CATEGORIES.EXPERIENCES,
    images: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500'],
    coinPrice: 400,
    brand: 'MasterClass',
    stock: 30,
    specifications: {
      duração: '2 horas',
      formato: 'Sessão online ao vivo',
      inclui: 'Guia de receitas e lista de ingredientes',
      agendamento: 'Múltiplas datas disponíveis',
    },
    variants: [
      { name: 'Culinária', value: 'Italiana', stock: 10 },
      { name: 'Culinária', value: 'Japonesa', stock: 10 },
      { name: 'Culinária', value: 'Francesa', stock: 10 },
    ],
  },
  {
    name: 'Kindle Paperwhite',
    description: 'Leitor digital à prova d\'água com tela sem reflexo. Perfeito para ler em qualquer lugar.',
    category: PRIZE_CATEGORIES.ELECTRONICS,
    images: ['https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500'],
    coinPrice: 1200,
    brand: 'Amazon',
    stock: 15,
    specifications: {
      tela: '6.8" sem reflexo',
      armazenamento: '8GB ou 16GB',
      resistência: 'Classificação IPX8',
      bateria: 'Até 10 semanas',
    },
    variants: [
      { name: 'Armazenamento', value: '8GB', stock: 10 },
      { name: 'Armazenamento', value: '16GB', stock: 5 },
    ],
  },
  {
    name: 'Tapete de Yoga Premium',
    description: 'Tapete de yoga ecológico com aderência superior e amortecimento. Inclui alça de transporte.',
    category: PRIZE_CATEGORIES.WELLNESS,
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'],
    coinPrice: 350,
    brand: 'ZenFit',
    stock: 40,
    specifications: {
      material: 'TPE ecológico',
      espessura: '6mm',
      tamanho: '183cm x 61cm',
      inclui: 'Alça de transporte',
    },
    variants: [
      { name: 'Cor', value: 'Roxo', stock: 15 },
      { name: 'Cor', value: 'Azul', stock: 15 },
      { name: 'Cor', value: 'Verde', stock: 10 },
    ],
  },
  {
    name: 'Kit de Livros Bestsellers',
    description: 'Coleção de 3 livros bestsellers de vários gêneros. Perfeito para amantes da leitura.',
    category: PRIZE_CATEGORIES.BOOKS,
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500'],
    coinPrice: 450,
    brand: null,
    stock: 25,
    specifications: {
      quantidade: '3 livros',
      formato: 'Capa dura ou brochura',
      gêneros: 'Ficção, Não-ficção, Biografia',
      frete: 'Frete grátis',
    },
    variants: [
      { name: 'Pacote de Gênero', value: 'Mix de Ficção', stock: 10 },
      { name: 'Pacote de Gênero', value: 'Negócios e Autoajuda', stock: 10 },
      { name: 'Pacote de Gênero', value: 'Mistério e Suspense', stock: 5 },
    ],
  },
  {
    name: 'Doação para Educação',
    description: 'Faça a diferença! Doe para programas educacionais de crianças carentes.',
    category: PRIZE_CATEGORIES.CHARITY,
    images: ['https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500'],
    coinPrice: 200,
    brand: null,
    stock: 999,
    specifications: {
      valor: 'R$ 100 BRL',
      organização: 'Fundo Global de Educação',
      impacto: 'Fornece material escolar para 2 crianças',
      comprovante: 'Recibo para dedução fiscal fornecido',
    },
    variants: [
      { name: 'Valor', value: 'R$ 100', stock: 999 },
    ],
  },
]

/**
 * Prêmios específicos da empresa (apenas para Valorize Corp)
 */
export const VALORIZE_COMPANY_PRIZES = [
  {
    name: 'Moletom Valorize',
    description: 'Moletom de qualidade premium com o logo da Valorize. Confortável e estiloso.',
    category: PRIZE_CATEGORIES.MERCHANDISE,
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500'],
    coinPrice: 600,
    brand: 'Valorize',
    stock: 50,
    specifications: {
      material: '80% algodão, 20% poliéster',
      modelo: 'Unissex',
      cuidados: 'Lavável na máquina',
      logo: 'Logo Valorize bordado',
    },
    variants: [
      { name: 'Tamanho', value: 'P', stock: 5 },
      { name: 'Tamanho', value: 'M', stock: 15 },
      { name: 'Tamanho', value: 'G', stock: 20 },
      { name: 'Tamanho', value: 'GG', stock: 10 },
    ],
  },
  {
    name: 'Vale Almoço da Equipe',
    description: 'Presenteie sua equipe com um almoço! Vale para restaurantes locais (até 5 pessoas).',
    category: PRIZE_CATEGORIES.EXPERIENCES,
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'],
    coinPrice: 1000,
    brand: 'Valorize',
    stock: 10,
    specifications: {
      valor: 'R$ 500 BRL',
      capacidade: 'Até 5 pessoas',
      restaurantes: 'Lista de restaurantes parceiros fornecida',
      validade: '3 meses',
    },
    variants: [
      { name: 'Tipo', value: 'Padrão', stock: 10 },
    ],
  },
  {
    name: 'Dia de Folga Extra',
    description: 'Aproveite um dia de folga remunerado extra! Perfeito para um fim de semana prolongado ou tempo pessoal.',
    category: PRIZE_CATEGORIES.EXPERIENCES,
    images: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500'],
    coinPrice: 1500,
    brand: 'Valorize',
    stock: 20,
    specifications: {
      tipo: 'Folga remunerada',
      validade: '6 meses a partir do resgate',
      requisitos: 'Aprovação do gestor necessária',
      restrições: 'Não pode ser usado em períodos de bloqueio',
    },
    variants: [
      { name: 'Tipo', value: 'Dia Único', stock: 20 },
    ],
  },
  {
    name: 'Garrafa Valorize - Térmica',
    description: 'Mantenha suas bebidas quentes ou frias o dia todo. Garrafa térmica premium.',
    category: PRIZE_CATEGORIES.MERCHANDISE,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    coinPrice: 200,
    brand: 'Valorize',
    stock: 100,
    specifications: {
      capacidade: '32 oz (1L)',
      material: 'Aço inoxidável',
      isolamento: 'Dupla parede a vácuo',
      temperatura: 'Quente 12h, Frio 24h',
    },
    variants: [
      { name: 'Cor', value: 'Preto', stock: 40 },
      { name: 'Cor', value: 'Azul', stock: 30 },
      { name: 'Cor', value: 'Prata', stock: 30 },
    ],
  },
]

/**
 * Helper para identificar a qual empresa um prêmio pertence
 */
export const VALORIZE_COMPANY_ID = 'valorize-corp-id' // Será substituído pelo ID real durante o seeding
