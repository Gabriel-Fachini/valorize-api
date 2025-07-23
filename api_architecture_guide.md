# Guia de Arquitetura - API Plataforma de Cultura

## Visão Geral do Projeto

Esta API é uma plataforma B2B de cultura e engajamento corporativo que permite:
- Sistema de moedas virtuais (saldo acumulativo + saldo semanal renovável)
- Sistema de elogios entre colaboradores com valores da empresa
- Loja virtual para troca de moedas por prêmios
- Módulo educacional com vales e biblioteca virtual
- Sistema de avaliação e comentários de livros

## Arquitetura Escolhida

### Monolito Modular + Clean Architecture

**Definição**: Uma aplicação única (monolito) organizada em módulos independentes, cada um seguindo os princípios de Clean Architecture.

**Justificativa**:
- Recursos limitados (startup)
- Domínio coeso e interconectado
- Facilidade de desenvolvimento e deploy
- Possibilidade de evolução para microserviços

## Stack Tecnológica

- **Runtime**: Node.js com TypeScript
- **Framework**: Fastify (performance + TypeScript nativo)
- **Banco Principal**: PostgreSQL (dados relacionais)
- **Cache/Sessões**: Redis (performance + dados temporários)
- **Documentação**: OpenAPI 3.0 + Swagger UI
- **Validação**: JSON Schema (integrado ao Fastify)

## Estrutura de Pastas

```
src/
├── modules/                    # Módulos de domínio
│   ├── users/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── User.ts
│   │   │   │   └── UserProfile.ts
│   │   │   ├── repositories/
│   │   │   │   └── UserRepository.ts
│   │   │   ├── services/
│   │   │   │   └── UserDomainService.ts
│   │   │   └── events/
│   │   │       └── UserCreatedEvent.ts
│   │   ├── application/
│   │   │   ├── dto/
│   │   │   │   ├── CreateUserDto.ts
│   │   │   │   └── UpdateUserDto.ts
│   │   │   ├── use-cases/
│   │   │   │   ├── CreateUserUseCase.ts
│   │   │   │   ├── AuthenticateUserUseCase.ts
│   │   │   │   └── UpdateProfileUseCase.ts
│   │   │   └── services/
│   │   │       └── UserApplicationService.ts
│   │   ├── infrastructure/
│   │   │   ├── database/
│   │   │   │   ├── UserRepositoryImpl.ts
│   │   │   │   └── migrations/
│   │   │   ├── cache/
│   │   │   │   └── UserCacheService.ts
│   │   │   └── external/
│   │   │       └── EmailService.ts
│   │   └── presentation/
│   │       ├── controllers/
│   │       │   └── UserController.ts
│   │       ├── routes/
│   │       │   └── userRoutes.ts
│   │       ├── middlewares/
│   │       │   └── authMiddleware.ts
│   │       └── schemas/
│   │           └── userSchemas.ts
│   ├── coins/
│   ├── praise/
│   ├── store/
│   ├── education/
│   └── library/
├── shared/                     # Código compartilhado
│   ├── domain/
│   │   ├── events/
│   │   │   └── DomainEvent.ts
│   │   ├── entities/
│   │   │   └── BaseEntity.ts
│   │   └── value-objects/
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── DatabaseConnection.ts
│   │   │   └── BaseRepository.ts
│   │   ├── cache/
│   │   │   └── RedisClient.ts
│   │   ├── events/
│   │   │   └── EventBus.ts
│   │   └── logger/
│   │       └── Logger.ts
│   └── presentation/
│       ├── middlewares/
│       │   ├── errorHandler.ts
│       │   ├── rateLimiter.ts
│       │   └── validation.ts
│       └── responses/
│           └── ApiResponse.ts
├── config/
│   ├── database.ts
│   ├── redis.ts
│   └── app.ts
├── docs/
│   └── openapi.yaml
└── app.ts                      # Entry point
```

## Módulos da Aplicação

### 1. Módulo Users
**Responsabilidades**:
- Autenticação e autorização
- Gestão de perfis de usuário
- Sessões e tokens JWT
- Relacionamentos entre usuários

**Entidades Principais**:
- `User`: Dados básicos do usuário
- `UserProfile`: Perfil detalhado (cargo, departamento)
- `UserSession`: Sessões ativas

### 2. Módulo Coins
**Responsabilidades**:
- Gestão de moedas acumulativas
- Gestão de moedas semanais (renovável)
- Histórico de transações
- Regras de negócio para débito/crédito

**Entidades Principais**:
- `CoinWallet`: Carteira de moedas do usuário
- `CoinTransaction`: Transações de moedas
- `WeeklyCoins`: Moedas semanais (cache Redis)

### 3. Módulo Praise
**Responsabilidades**:
- Envio de elogios entre colaboradores
- Associação com valores da empresa
- Validação de regras de negócio (limites, etc.)
- Histórico de elogios

**Entidades Principais**:
- `Praise`: Elogio enviado
- `CompanyValue`: Valores da empresa
- `PraiseReaction`: Reações aos elogios

### 4. Módulo Store
**Responsabilidades**:
- Catálogo de produtos/prêmios
- Processo de troca de moedas
- Gestão de estoque
- Histórico de compras

**Entidades Principais**:
- `Product`: Produtos disponíveis
- `Purchase`: Compras realizadas
- `ProductCategory`: Categorias de produtos

### 5. Módulo Education
**Responsabilidades**:
- Gestão de vales educação
- Catálogo de cursos/treinamentos
- Solicitações de reembolso
- Relatórios de uso

**Entidades Principais**:
- `EducationVoucher`: Vales educação
- `Course`: Cursos disponíveis
- `EducationRequest`: Solicitações de reembolso

### 6. Módulo Library
**Responsabilidades**:
- Catálogo de livros virtuais
- Sistema de avaliações e comentários
- Busca e filtragem de livros
- Recomendações

**Entidades Principais**:
- `Book`: Livros disponíveis
- `BookReview`: Avaliações de livros
- `BookComment`: Comentários sobre livros

## Padrões e Princípios

### Clean Architecture - Camadas

1. **Domain (Núcleo)**:
   - Entities: Objetos de negócio
   - Repositories: Interfaces para dados
   - Services: Lógica de domínio complexa
   - Events: Eventos de domínio

2. **Application (Casos de Uso)**:
   - Use Cases: Orquestração de operações
   - DTOs: Objetos de transferência
   - Services: Lógica de aplicação

3. **Infrastructure (Detalhes)**:
   - Database: Implementação de repositórios
   - External: Serviços externos
   - Cache: Implementação de cache

4. **Presentation (Interface)**:
   - Controllers: Endpoints HTTP
   - Routes: Configuração de rotas
   - Middlewares: Interceptadores
   - Schemas: Validação de entrada

### Regras de Dependência

- **Domain**: Não depende de nada
- **Application**: Depende apenas de Domain
- **Infrastructure**: Depende de Domain e Application
- **Presentation**: Depende de Application

### Comunicação Entre Módulos

```typescript
// Eventos de domínio para comunicação assíncrona
class UserCreatedEvent extends DomainEvent {
  constructor(public userId: string) {
    super();
  }
}

// Event Handler em outro módulo
class CoinEventHandler {
  async handle(event: UserCreatedEvent) {
    await this.coinService.initializeWallet(event.userId);
  }
}
```

## Configuração do Banco de Dados

### PostgreSQL - Estrutura Principal

```sql
-- Usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Perfis de usuário
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  department VARCHAR(100),
  position VARCHAR(100),
  hire_date DATE,
  avatar_url VARCHAR(500)
);

-- Carteira de moedas
CREATE TABLE coin_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  accumulated_coins INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transações de moedas
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL, -- 'CREDIT' or 'DEBIT'
  amount INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'PRAISE_RECEIVED', 'STORE_PURCHASE', etc.
  reference_id UUID, -- ID da transação origem
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Redis - Casos de Uso

```typescript
// 1. Sessões de usuário
const sessionKey = `session:${token}`;
await redis.setex(sessionKey, 3600, JSON.stringify(session));

// 2. Moedas semanais (auto-expira)
const weeklyCoinsKey = `coins:weekly:${userId}`;
await redis.setex(weeklyCoinsKey, 604800, weeklyCoins); // 7 dias

// 3. Rate limiting
const rateLimitKey = `rate:praise:${userId}`;
const count = await redis.incr(rateLimitKey);
if (count === 1) await redis.expire(rateLimitKey, 3600);

// 4. Cache de dados pesados
const rankingKey = 'ranking:monthly';
await redis.setex(rankingKey, 86400, JSON.stringify(ranking)); // 24h
```

## OpenAPI - Documentação da API

### Estrutura do OpenAPI

```yaml
openapi: 3.0.0
info:
  title: Plataforma de Cultura API
  version: 1.0.0
  description: API para plataforma de cultura e engajamento corporativo

servers:
  - url: http://localhost:3000/api/v1
    description: Desenvolvimento
  - url: https://api.plataforma-cultura.com/v1
    description: Produção

paths:
  /users/profile:
    get:
      summary: Obter perfil do usuário autenticado
      tags: [Users]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Perfil do usuário
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserProfile'

  /praise:
    post:
      summary: Enviar elogio
      tags: [Praise]
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePraiseDto'
      responses:
        '201':
          description: Elogio enviado com sucesso

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    UserProfile:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
        department:
          type: string
        accumulatedCoins:
          type: integer
        weeklyCoins:
          type: integer
```

### Integração com Fastify

```typescript
// Registro do Swagger
await fastify.register(require('@fastify/swagger'), {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Plataforma de Cultura API',
      version: '1.0.0'
    }
  }
});

// Registro do Swagger UI
await fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  }
});

// Rota com schema
fastify.post('/api/v1/praise', {
  schema: {
    tags: ['Praise'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      properties: {
        receiverId: { type: 'string', format: 'uuid' },
        message: { type: 'string', minLength: 1, maxLength: 500 },
        coins: { type: 'integer', minimum: 1, maximum: 50 },
        companyValueId: { type: 'string', format: 'uuid' }
      },
      required: ['receiverId', 'message', 'coins', 'companyValueId']
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          message: { type: 'string' }
        }
      }
    }
  }
}, praiseController.create);
```

## Fluxo de Desenvolvimento

### 1. Definição da API (API-First)
- Escrever contratos OpenAPI antes do código
- Validar com stakeholders
- Gerar tipos TypeScript

### 2. Implementação por Módulo
- Começar pela camada Domain
- Implementar Application (Use Cases)
- Implementar Infrastructure
- Finalizar com Presentation

### 3. Testes
- Unit tests para Domain e Application
- Integration tests para Infrastructure
- E2E tests para Presentation

### 4. Ordem de Implementação Sugerida
1. **Users**: Base para autenticação
2. **Coins**: Core do sistema de moedas
3. **Praise**: Funcionalidade principal
4. **Store**: Sistema de recompensas
5. **Education**: Funcionalidades educacionais
6. **Library**: Sistema de biblioteca

## Configurações de Ambiente

### Variáveis de Ambiente
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cultura_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# API
PORT=3000
NODE_ENV=development

# External Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Configuração do Fastify
```typescript
// config/app.ts
import fastify from 'fastify';

export const buildApp = async () => {
  const app = fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  });

  // Plugins
  await app.register(require('@fastify/cors'));
  await app.register(require('@fastify/helmet'));
  await app.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute'
  });

  // Swagger
  await app.register(require('@fastify/swagger'), {
    openapi: require('../docs/openapi.yaml')
  });

  // Routes
  await app.register(require('../modules/users/presentation/routes/userRoutes'));
  await app.register(require('../modules/praise/presentation/routes/praiseRoutes'));
  // ... outras rotas

  return app;
};
```

## Comandos Úteis

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm test
npm run test:coverage

# Migrations
npm run migrate:up
npm run migrate:down
npm run migrate:create <name>

# Gerar documentação
npm run docs:generate
```

### Deploy
```bash
# Build para produção
npm run build

# Rodar migrações
npm run migrate:up

# Iniciar aplicação
npm start
```

## Considerações de Segurança

### Autenticação
- JWT tokens com expiração
- Refresh tokens para renovação
- Rate limiting por usuário

### Autorização
- Role-based access control
- Middleware de autorização por rota
- Validação de ownership nos recursos

### Validação
- Sanitização de inputs
- Validação de schemas OpenAPI
- Escape de queries SQL

### Logging
- Log de todas as operações sensíveis
- Não loggar dados sensíveis
- Estrutura de logs para monitoramento

## Próximos Passos

1. **Setup inicial**: Configurar projeto base com Fastify + TypeScript
2. **Database**: Configurar PostgreSQL + Redis
3. **Swagger**: Implementar documentação OpenAPI
4. **Módulo Users**: Implementar autenticação básica
5. **Módulo Coins**: Implementar sistema de moedas
6. **Testes**: Configurar ambiente de testes
7. **Deploy**: Configurar pipeline de deploy

Este documento serve como referência completa para o desenvolvimento da API. Mantenha-o atualizado conforme o projeto evolui.