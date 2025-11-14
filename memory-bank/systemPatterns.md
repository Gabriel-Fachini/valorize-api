# System Patterns - Valorize API

## Arquitetura Geral

### Feature-First Architecture
O Valorize segue uma arquitetura **Feature-First** otimizada para desenvolvimento solo e iteração rápida.

#### Estrutura de Diretórios
```
src/
├── features/           # Funcionalidades organizadas por domínio
│   ├── auth/          # Autenticação e autorização
│   ├── users/         # Gestão de usuários
│   ├── companies/     # Sistema de empresas
│   ├── rbac/          # Controle de acesso (implementado)
│   └── [future]/      # Próximas features (analytics, integrações)
├── lib/               # Utilitários compartilhados
├── middleware/        # Middlewares do Fastify
├── types/            # Tipos TypeScript compartilhados
└── config/           # Configurações da aplicação
```

### Padrão de Feature
Cada feature segue a estrutura consistente:

```
feature/
├── feature.model.ts     # Entidade + Repository methods
├── feature.service.ts   # Business logic
├── feature.routes.ts    # HTTP endpoints
├── feature.schemas.ts 
└── feature.types.ts     # TypeScript types (quando necessário)
```

### Padrão de Feature Multi-País (Exemplo: Companies)
Para features que precisam de dados específicos por país:

```
companies/
├── company.model.ts              # Model genérico
├── company.service.ts            # Service principal
├── company.routes.ts             # Routes principais
├── company.schemas.ts            # Validações
├── brazil/                       # Pasta específica do país
│   ├── company-brazil.model.ts   # Model específico
│   └── company-brazil.service.ts # Service específico
└── contacts/                     # Sub-funcionalidades
    ├── company-contact.model.ts
    └── company-contact.service.ts
```

## Padrões de Implementação

### 1. Model Pattern (Entidade + Repository)
```typescript
// Exemplo: user.model.ts
export class User {
  // Propriedades da entidade
  constructor(private data: UserData) {}
  
  // Métodos de instância
  async save(): Promise<User> { }
  async delete(): Promise<void> { }
  
  // Métodos estáticos (Repository)
  static async findById(id: string): Promise<User | null> { }
  static async findByAuth0Id(auth0Id: string): Promise<User | null> { }
  static async create(data: CreateUserData): Promise<User> { }
}
```

**Benefícios:**
- Colocation: entidade e repository no mesmo arquivo
- Simplicidade: sem abstrações desnecessárias
- Testabilidade: métodos isolados e focados

### 2. Service Pattern (Business Logic)
```typescript
// Exemplo: user.service.ts
export const userService = {
  async signUp(userData: SignUpData): Promise<User> {
    // Validações
    // Regras de negócio
    // Persistência
    // Logs
  },
  
  async updateProfile(userId: string, data: UpdateData): Promise<User> {
    // Lógica de atualização
  }
}
```

**Características:**
- Object literal para simplicidade
- Funções assíncronas para operações de I/O
- Tratamento de erros consistente
- Logging estruturado

### 3. Routes Pattern (HTTP Layer)
```typescript
// Exemplo: user.routes.ts
export default async function userRoutes(fastify: FastifyInstance) {
  // Middleware de autenticação
  await fastify.register(authMiddleware)
  
  // Endpoints com schemas de validação
  fastify.get('/profile', {
    schema: getUserProfileSchema,
    handler: async (request, reply) => {
      // Extração de dados
      // Chamada do service
      // Resposta estruturada
    }
  })
}
```

## Decisões Arquiteturais Importantes

### 1. Migração de Clean Architecture
**Antes:** Clean Architecture com 4-5 camadas
**Depois:** Feature-First com 2-3 arquivos por feature

**Razões da Mudança:**
- **Simplicidade**: Menos abstrações para um desenvolvedor solo
- **Velocidade**: Navegação e desenvolvimento mais rápidos
- **Pragmatismo**: Foco em entregar valor, não em arquitetura perfeita
- **Manutenibilidade**: Mais fácil de entender e modificar

### 2. Fastify como Framework
**Escolhas:**
- **Performance**: Mais rápido que Express
- **TypeScript First**: Suporte nativo e robusto
- **Schema Validation**: Validação automática com JSON Schema
- **Plugins**: Arquitetura modular e extensível

### 3. Prisma como ORM
**Benefícios:**
- **Type Safety**: Tipos gerados automaticamente
- **Developer Experience**: Excelente intellisense
- **Migrations**: Controle de versão do banco
- **Query Builder**: Sintaxe intuitiva

## Padrões de Código

### Nomenclatura
```typescript
// Arquivos
feature.model.ts      // PascalCase para classes
feature.service.ts    // camelCase para serviços
feature.routes.ts     // default export para rotas

// Exports
export class Feature { }           // PascalCase
export const featureService = { } // camelCase
export default featureRoutes       // default
```

### Imports
```typescript
// Absolutos com alias (preferido)
import { User } from '@/features/users/user.model'
import { logger } from '@/lib/logger'

// Relativos dentro da feature
import { validateUser } from './user.schemas'
```

### Error Handling
```typescript
// Pattern consistente
try {
  const result = await operation()
  logger.info('Operation successful', { context })
  return result
} catch (error) {
  logger.error('Operation failed', { error, context })
  throw new CustomError('User friendly message', error)
}
```

## Padrões de Validação e Regras de Negócio

### Validação de Limites (Exemplo: Endereços)
```typescript
// Pattern: Validar no service antes de criar
const MAX_ITEMS_PER_USER = 3

async create(userId: string, data: CreateData) {
  const itemCount = await Model.countByUserId(userId)
  
  if (itemCount >= MAX_ITEMS_PER_USER) {
    throw new BadRequestError(
      `User cannot have more than ${MAX_ITEMS_PER_USER} items`,
      { name: 'MaxItemsReachedError' }
    )
  }
  
  return await Model.create(data)
}
```

### Gestão de Valores Padrão (Default Handling)
```typescript
// Pattern: Auto-default para primeiro item
async create(userId: string, data: CreateData) {
  const existingCount = await Model.countByUserId(userId)
  
  // Se é o primeiro item, marca como padrão
  if (existingCount === 0) {
    data.isDefault = true
  }
  
  // Se marcado como padrão, remove padrão dos outros
  if (data.isDefault) {
    await Model.unsetDefaultForUser(userId)
  }
  
  return await Model.create(data)
}

// Pattern: Promover outro item ao deletar o padrão
async delete(itemId: string, userId: string) {
  const item = await Model.findById(itemId)
  
  await item.delete()
  
  // Se era o padrão, promove outro
  if (item.isDefault) {
    const otherItems = await Model.findByUserId(userId)
    if (otherItems.length > 0) {
      await otherItems[0].update({ isDefault: true })
    }
  }
}
```

### Validação de Pertencimento (Ownership Validation)
```typescript
// Pattern: Validar que recurso pertence à empresa/usuário
async validateBelongsToCompany(itemId: string, companyId: string) {
  const item = await Model.findById(itemId)
  
  if (!item) {
    throw new NotFoundError('Item not found')
  }
  
  if (item.companyId !== companyId) {
    throw new ForbiddenError('Item does not belong to this company')
  }
  
  return true
}
```

### Validação de Unicidade por Escopo
```typescript
// Pattern: Nome único dentro do escopo (ex: por empresa)
// Implementado no Prisma Schema
model Department {
  companyId String
  name      String
  
  @@unique([companyId, name]) // Nome único por empresa
}

// Validação no service (se necessário)
async create(companyId: string, name: string) {
  const existing = await Department.findByCompanyAndName(companyId, name)
  
  if (existing) {
    throw new ConflictError('Department name already exists in this company')
  }
  
  return await Department.create({ companyId, name })
}
```

## Padrões de Segurança

### Autenticação (Auth0)
- **JWT Tokens**: Validação via Auth0
- **Middleware**: Proteção automática de rotas
- **User Context**: Injeção automática de dados do usuário

### Autorização (RBAC - Implementado)
- **Role-Based**: Roles definidos por empresa
- **Permissions**: Permissões granulares com padrão feature:objective
- **Middleware**: requirePermission para verificação automática
- **Error Handling**: InsufficientPermissionError customizado
- **Validation**: Validação de padrões de permissão

## Padrões de Dados

### Database Schema
```typescript
// Prisma Schema Pattern
model EntityName {
  id        String   @id @default(cuid())
  // ... campos específicos
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("table_name")
}
```

### API Response
```typescript
// Response Pattern Consistente
{
  success: boolean,
  data?: any,
  error?: {
    message: string,
    code: string,
    details?: any
  },
  meta?: {
    pagination?: PaginationInfo,
    timestamp: string
  }
}
```

## Padrões de Testing (Futuro)

### Estrutura de Testes
```
tests/
├── unit/              # Testes unitários por feature
├── integration/       # Testes de API
└── e2e/              # Testes end-to-end
```

### Testing Strategy
- **Unit Tests**: Services e models
- **Integration Tests**: Routes e database
- **E2E Tests**: Fluxos principais do usuário

## Monitoramento e Observabilidade

### Logging
- **Structured Logging**: JSON format
- **Context Injection**: Request ID, user ID
- **Error Tracking**: Stack traces e context

### Métricas (Futuro)
- **Performance**: Response times, throughput
- **Business**: Elogios enviados, usuários ativos
- **System**: CPU, memória, database connections

## Evolução da Arquitetura

### Princípios Guia
1. **Simplicidade First**: Escolher sempre a solução mais simples que funciona
2. **Pragmatismo**: Arquitetura serve ao produto, não o contrário
3. **Evolução Gradual**: Melhorar conforme necessidade, não antecipadamente
4. **Developer Experience**: Otimizar para produtividade do desenvolvedor solo

### Quando Refatorar
- **Performance Issues**: Bottlenecks identificados
- **Complexity Growth**: Quando simplicidade se torna limitação
- **Team Growth**: Se a equipe crescer significativamente
- **Scale Requirements**: Quando demanda exigir mudanças estruturais
