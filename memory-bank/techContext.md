# Tech Context - Valorize API

## Stack Tecnológico Principal

### Backend Framework
**Fastify v5.5.0**
- **Escolha**: Performance superior ao Express
- **TypeScript First**: Suporte nativo robusto
- **Schema Validation**: Validação automática com JSON Schema
- **Plugin System**: Arquitetura modular
- **Swagger Integration**: Documentação automática da API

### Database & ORM
**PostgreSQL + Prisma v6.15.0**
- **Database**: PostgreSQL para robustez e features avançadas
- **ORM**: Prisma para type safety e developer experience
- **Migrations**: Controle de versão do schema
- **Client Generation**: Tipos TypeScript automáticos

### Autenticação
**Auth0 + JWT**
- **Provider**: Auth0 para gestão de identidade
- **Tokens**: JWT para autenticação stateless
- **Middleware**: `@fastify/jwt` para validação automática
- **JWKS**: `jwks-rsa` para verificação de assinaturas

### Linguagem & Build
**TypeScript v5.9.2**
- **Runtime**: Node.js >=18.0.0
- **Build Tool**: TSC (TypeScript Compiler)
- **Dev Server**: `tsx` para hot reload
- **Target**: ES2022 para features modernas

## Dependências Principais

### Core Dependencies
```json
{
  "fastify": "^5.5.0",                    // Web framework
  "@prisma/client": "^6.15.0",           // Database client
  "@fastify/jwt": "^10.0.0",             // JWT authentication
  "jsonwebtoken": "^9.0.2",              // JWT utilities
  "jwks-rsa": "^3.2.0",                  // JWKS verification
  "dotenv": "^17.2.1"                    // Environment variables
}
```

### Fastify Plugins
```json
{
  "@fastify/cors": "^11.1.0",            // CORS handling
  "@fastify/helmet": "^13.0.1",          // Security headers
  "@fastify/rate-limit": "^10.3.0",      // Rate limiting
  "@fastify/swagger": "^9.5.1",          // API documentation
  "@fastify/swagger-ui": "^5.2.3"        // Swagger UI
}
```

### Development Tools
```json
{
  "typescript": "^5.9.2",                // TypeScript compiler
  "tsx": "^4.20.5",                      // TypeScript executor
  "eslint": "^9.34.0",                   // Code linting
  "@typescript-eslint/parser": "^8.41.0", // TS ESLint parser
  "vitest": "^3.2.4",                    // Testing framework
  "prisma": "^6.15.0"                    // Prisma CLI
}
```

## Configuração de Desenvolvimento

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@features/*": ["features/*"],
      "@lib/*": ["lib/*"],
      "@middleware/*": ["middleware/*"],
      "@types/*": ["types/*"],
      "@config/*": ["config/*"]
    }
  }
}
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/valorize"

# Auth0
AUTH0_DOMAIN="your-domain.auth0.com"
AUTH0_AUDIENCE="your-api-identifier"

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# JWT
JWT_SECRET="your-jwt-secret"
```

### Scripts de Desenvolvimento
```json
{
  "dev": "tsx watch src/app.ts",          // Desenvolvimento com hot reload
  "build": "tsc",                         // Build para produção
  "start": "node dist/app.js",            // Executar build
  "test": "vitest",                       // Testes
  "lint": "eslint src --ext .ts",         // Linting
  "db:generate": "prisma generate",       // Gerar Prisma client
  "db:push": "prisma db push",            // Sync schema com DB
  "db:migrate": "prisma migrate dev",     // Criar migration
  "db:studio": "prisma studio",           // Interface visual do DB
  "db:seed": "tsx src/shared/infrastructure/database/seed.ts"
}
```

## Estrutura de Configuração

### Application Config
```typescript
// src/config/app.ts
export const buildApp = async () => {
  const fastify = Fastify({
    logger: true,
    ajv: { customOptions: { removeAdditional: 'all' } }
  })

  // Plugins de segurança
  await fastify.register(helmet)
  await fastify.register(cors)
  await fastify.register(rateLimit)

  // Documentação
  await fastify.register(swagger)
  await fastify.register(swaggerUi)

  // Features
  await fastify.register(authRoutes, { prefix: '/auth' })
  await fastify.register(userRoutes, { prefix: '/users' })

  return fastify
}
```

### Database Configuration
```typescript
// src/lib/database.ts
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

export const connectDB = async () => {
  await prisma.$connect()
}

export const disconnectDB = async () => {
  await prisma.$disconnect()
}
```

## Padrões de Desenvolvimento

### Code Quality
- **ESLint**: Configuração TypeScript estrita
- **Clean Code**: Princípios de código limpo
- **Type Safety**: TypeScript strict mode
- **Error Handling**: Tratamento consistente de erros

### Testing Strategy (Planejado)
- **Framework**: Vitest para performance
- **Coverage**: @vitest/coverage-v8
- **Types**: Unit, Integration, E2E
- **Mocking**: Prisma mocking para testes

### Logging
```typescript
// src/lib/logger.ts
import { pino } from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
})
```

## Integrações Externas

### Atuais
- **Auth0**: Autenticação e autorização
- **PostgreSQL**: Persistência de dados

### Futuras (Planejadas)
- **Fornecedor de Prêmios**: API para catálogo e entrega
- **Email Service**: Notificações (SendGrid/AWS SES)
- **File Storage**: Upload de imagens (AWS S3/Cloudinary)
- **Analytics**: Métricas de uso (Mixpanel/Amplitude)

## Constraints Técnicos

### Performance
- **Target**: <200ms response time para 95% das requests
- **Concurrency**: Suporte a 1000+ usuários simultâneos
- **Database**: Otimização de queries com Prisma

### Segurança
- **Authentication**: JWT tokens com expiração
- **Authorization**: RBAC granular (próxima feature)
- **Data Protection**: Sanitização de inputs
- **Rate Limiting**: Proteção contra abuse

### Escalabilidade
- **Horizontal**: Stateless design para load balancing
- **Database**: Connection pooling e query optimization
- **Caching**: Redis para sessões e dados frequentes (futuro)

## Deployment & Infrastructure

### Desenvolvimento
- **Local**: Docker Compose para PostgreSQL
- **Hot Reload**: tsx watch para desenvolvimento rápido
- **Debug**: VSCode debug configuration

### Produção (Planejado)
- **Platform**: Vercel/Railway/Render
- **Database**: PostgreSQL managed (Neon/Supabase)
- **Monitoring**: Application metrics e logs
- **CI/CD**: GitHub Actions para deploy automático

## Decisões Técnicas Importantes

### Por que Fastify?
1. **Performance**: 2-3x mais rápido que Express
2. **TypeScript**: Suporte nativo, não afterthought
3. **Schema Validation**: Built-in, não precisa de libs extras
4. **Plugins**: Arquitetura modular e testável

### Por que Prisma?
1. **Type Safety**: Tipos gerados, menos bugs
2. **Developer Experience**: Autocomplete perfeito
3. **Migrations**: Controle de versão do schema
4. **Query Optimization**: Queries eficientes automáticas

### Por que Feature-First?
1. **Solo Development**: Otimizado para um desenvolvedor
2. **Velocity**: Menos navegação, mais produtividade
3. **Simplicity**: Menos abstrações, mais foco no produto
4. **Pragmatism**: Arquitetura serve ao negócio

## Evolução Técnica

### Próximas Adições
1. **Testing Suite**: Configuração completa de testes
2. **RBAC System**: Sistema de permissões granulares
3. **File Upload**: Suporte a imagens e documentos
4. **Caching Layer**: Redis para performance
5. **Monitoring**: APM e métricas de negócio

### Considerações Futuras
- **Microservices**: Se complexidade justificar
- **GraphQL**: Se clientes precisarem de flexibilidade
- **Event Sourcing**: Para auditoria e analytics avançadas
- **Queue System**: Para processamento assíncrono
