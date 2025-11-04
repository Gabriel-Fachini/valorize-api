# Active Context - Valorize API

## Foco Atual de Desenvolvimento

### ✅ Funcionalidades Recém-Implementadas

#### Sistema de Organização Empresarial
Implementação completa de **Departamentos** e **Cargos (Job Titles)** para estruturação organizacional dentro das empresas.

#### Sistema de Endereços
Implementação completa do **Sistema de Endereços** com validações brasileiras, limite de 3 endereços por usuário e gestão de endereço padrão.

#### Sistema de Dashboard
Implementação de **Dashboard Centralizado** com métricas em tempo real e integração com múltiplos services.

#### Sistema de Múltiplos Domínios
Implementação de **AllowedDomains** para suporte a empresas com múltiplos domínios de email no SSO.

#### Sistema de Empresas (Companies)
Implementação completa da entidade **Company** com suporte específico para dados brasileiros e sistema de contatos empresariais.

#### Sistema RBAC (Role-Based Access Control)
Implementação completa do **Sistema de Controle de Acesso Baseado em Roles (RBAC)** com permissões granulares, middleware de autorização e interface administrativa.

### ✅ Sistema de Elogios - IMPLEMENTADO
O **Sistema de Elogios** foi implementado com sucesso, incluindo sistema de auditoria completo e correções críticas aplicadas.

## Estado Atual do Projeto

### ✅ Funcionalidades Implementadas
1. **Autenticação (Auth0)**
   - Login/logout via Auth0
   - Validação de JWT tokens
   - Middleware de autenticação

2. **Gestão de Usuários**
   - Cadastro e perfil de usuário
   - Integração com Auth0
   - CRUD básico de usuários

3. **Sistema de Empresas (Companies)**
   - Entidade Company genérica para todos os países
   - CompanyBrazil com dados específicos (CNPJ, razão social, etc.)
   - CompanyContact para contatos principais da empresa
   - Validação completa de CNPJ brasileiro
   - Integração com User e Role via companyId
   - API REST completa com endpoints descritivos

4. **Sistema RBAC (Role-Based Access Control)**
   - Models Role e Permission com validações
   - Middleware requirePermission para proteção de rotas
   - Service com verificação granular de permissões
   - Endpoints administrativos para gestão de roles
   - Padrão de permissões feature:objective
   - Integração completa com User e Company
   - Testes unitários implementados

5. **Sistema de Elogios (Compliments) - RECÉM-IMPLEMENTADO**
   - Modelo Compliment com validações de negócio
   - Sistema de moedas duplo (compliment + redeemable)
   - Valores da empresa (CompanyValue e CompanySettings)
   - Validações: múltiplos de 5, máximo 100 moedas, mínimo 2 valores
   - Sistema de auditoria completo (WalletTransaction)
   - Reset manual semanal por admin
   - Endpoints para envio, listagem e histórico
   - Integração com RBAC e permissões

9. **Sistema de Auditoria de Carteiras (100%) ✅ IMPLEMENTADO**
   - Modelo WalletTransaction para rastreamento completo
   - Log de todas movimentações (débito, crédito, reset)
   - Metadados detalhados para cada transação
   - Endpoints para consulta de histórico (usuário e admin)
   - Prova documental para confrontar usuários desconfiados

10. **Loja de Prêmios MVP (100%) ✅ IMPLEMENTADO**
   - Prize & PrizeVariant Models com estoque
   - Redemption & RedemptionTracking com histórico
   - Race Condition protection com transações atômicas
   - API REST completa (catálogo, admin, resgates)
   - Cancelamento inteligente (3 dias + devolução)
   - Integração com Wallet e Address

11. **Sistema de Endereços (100%) ✅ NOVO**
   - Address Model com validações brasileiras
   - Limite de 3 endereços por usuário
   - Sistema de endereço padrão automático
   - Validações: CEP, telefone, campos obrigatórios
   - CRUD completo com Zod schemas
   - Integração com Redemptions

12. **Sistema de Departamentos (100%) ✅ NOVO**
   - Department Model com relacionamentos
   - Validação de unicidade (nome único por empresa)
   - Integração com User e Company
   - Cascade delete ao remover empresa
   - CRUD completo para gestão

13. **Sistema de Job Titles/Cargos (100%) ✅ NOVO**
   - JobTitle Model com relacionamentos
   - Validação de unicidade (nome único por empresa)
   - Integração com User e Company
   - Cascade delete ao remover empresa
   - CRUD completo para gestão

14. **Sistema de Dashboard (100%) ✅ NOVO**
   - Métricas centralizadas da empresa
   - Integração com múltiplos services
   - Validações de pertencimento (dept/cargo)
   - Analytics em tempo real
   - Endpoints otimizados

15. **Sistema de Domínios Permitidos (100%) ✅ NOVO**
   - AllowedDomain Model para SSO
   - Suporte a múltiplos domínios por empresa
   - Validação no fluxo de autenticação
   - Unique constraint por empresa

16. **Infraestrutura Base**
   - API REST com Fastify
   - Database PostgreSQL + Prisma
   - Logging estruturado
   - Error handling consistente
   - Documentação Swagger

### 🔄 Migração Concluída
- **Clean Architecture → Feature-First**: Migração bem-sucedida
- **Estrutura Simplificada**: Redução de 83% no número de arquivos
- **Developer Experience**: Navegação e desenvolvimento mais ágeis

## Sistema de Empresas - Recém-Implementado

### Estrutura Implementada
```
src/features/companies/
├── company.model.ts              # Model genérico Company
├── company.service.ts            # Service principal (simplificado)
├── company.routes.ts             # Routes principais
├── company.schemas.ts            # Validações Zod
├── brazil/                       # Pasta específica para Brasil
│   ├── company-brazil.model.ts   # Model específico Brasil
│   └── company-brazil.service.ts # Service específico Brasil
└── contacts/
    ├── company-contact.model.ts  # Model para contatos
    └── company-contact.service.ts # Service para contatos
```

### Database Schema
```prisma
model Company {
  id          String   @id @default(cuid())
  name        String   // Nome fantasia
  domain      String   @unique // Para verificação de email no login
  country     String   @default("BR")
  timezone    String   @default("America/Sao_Paulo")
  isActive    Boolean  @default(true)
  
  users         User[]
  roles         Role[]
  companyBrazil CompanyBrazil?
  contacts      CompanyContact[]
}

model CompanyBrazil {
  id                String  @id @default(cuid())
  companyId         String  @unique
  cnpj              String  @unique
  razaoSocial       String
  inscricaoEstadual String?
  inscricaoMunicipal String?
  nire              String?
  cnaePrincipal     String
  cnaeSecundario    String?
  naturezaJuridica  String
  porteEmpresa      String
  situacaoCadastral String
  
  company Company @relation(fields: [companyId], references: [id])
}

model CompanyContact {
  id        String   @id @default(cuid())
  companyId String
  userId    String
  role      String
  isPrimary Boolean  @default(false)
  
  company Company @relation(fields: [companyId], references: [id])
  user    User    @relation(fields: [userId], references: [id])
}
```

### Endpoints Implementados
```
GET    /companies/get-all-companies           # Listar empresas
POST   /companies/create-company              # Criar empresa (com dados BR opcionais)
GET    /companies/get-company/:id             # Obter empresa por ID
GET    /companies/get-company-by-domain/:domain # Buscar por domínio
PUT    /companies/update-company/:id          # Atualizar empresa
DELETE /companies/delete-company/:id          # Deletar empresa (soft delete)
POST   /companies/validate-cnpj               # Validar CNPJ
GET    /companies/get-company-contacts/:companyId # Listar contatos
POST   /companies/add-company-contact         # Adicionar contato
PUT    /companies/update-company-contact/:id  # Atualizar contato
DELETE /companies/remove-company-contact/:id # Remover contato
```

### Funcionalidades Principais
- **Validação CNPJ**: Algoritmo completo com dígitos verificadores
- **Formatação CNPJ**: Formatação automática (XX.XXX.XXX/XXXX-XX)
- **Domínio Único**: Verificação para login via email
- **Contatos Empresariais**: Sistema de contatos principais
- **Extensibilidade**: Estrutura preparada para outros países
- **Integração**: Relacionamentos com User e Role existentes

## Sistema RBAC - Implementado ✅

### Estrutura Implementada
```
src/features/rbac/
├── rbac.model.ts              # Role e Permission entities
├── rbac.service.ts            # Business logic completo
├── permissions.constants.ts    # Constantes de permissões
└── roles.constants.ts          # Constantes de roles

src/features/admin/roles-management/  # Endpoints de administração
├── types.ts                    # Tipos e interfaces
├── roles-management.schemas.ts # Validações Fastify
├── roles-management.service.ts # Lógica de negócio
└── roles-management.routes.ts  # Endpoints CRUD

src/middleware/
└── rbac.ts                     # Middleware requirePermission
```

### Funcionalidades Implementadas

#### 1. Models e Validações
- **Role Model**: Entidade com validações e métodos estáticos
- **Permission Model**: Sistema de permissões com padrão feature:objective
- **Validação de Padrão**: Permissões devem seguir formato "feature:objective"

#### 2. Service Layer Completo
```typescript
rbacService = {
  checkPermission(auth0Id, permission): Promise<boolean>
  createRole(companyId, name, permissions, description)
  assignRoleToUser(userId, roleId)
  getUserPermissions(auth0Id)
  checkPermissionWithDetails(auth0Id, permission)
}
```

#### 3. Middleware de Autorização
```typescript
// src/middleware/rbac.ts
export const requirePermission = (permission: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getCurrentUser(request)
    const { allowed, userPermissions } = await rbacService.checkPermissionWithDetails(user.sub, permission)
    
    if (!allowed) {
      throw new InsufficientPermissionError(permission, userPermissions)
    }
  }
}
```

#### 4. Admin Endpoints Implementados
```typescript
POST   /admin/create-role              # Criar role com permissões
PUT    /admin/users/:id/assign-role    # Atribuir role a usuário
GET    /admin/me/permissions           # Obter permissões do usuário atual
```

### Padrão de Permissões
**Formato**: `feature:objective`
**Exemplos**:
- `users:read` - Ler usuários
- `users:manage_roles` - Gerenciar roles de usuários
- `companies:create` - Criar empresas
- `admin:access_panel` - Acessar painel admin

### Integração Completa
- ✅ **Database Schema**: Relacionamentos com User e Company
- ✅ **Middleware Protection**: Proteção automática de rotas
- ✅ **Error Handling**: InsufficientPermissionError customizado
- ✅ **Logging**: Logs estruturados para auditoria
- ✅ **Validation**: Validação de padrões de permissão
- ✅ **Testing**: Testes unitários do middleware

## Sistema de Elogios - ✅ IMPLEMENTADO COM SUCESSO

### Funcionalidades Implementadas

#### 1. Estrutura de Elogios - ✅ COMPLETA
```typescript
model Compliment {
  id           String   @id @default(cuid())
  senderId     String   @map("sender_id")
  receiverId   String   @map("receiver_id")
  companyId    String   @map("company_id")
  valueId      Int      @map("value_id")  // CORRIGIDO: Int em vez de String
  message      String
  coins        Int      // Múltiplos de 5, máximo 100
  isPublic     Boolean  @default(true)
  createdAt    DateTime @default(now())
  
  sender       User         @relation("ComplimentSender")
  receiver     User         @relation("ComplimentReceiver")
  company      Company      @relation()
  companyValue CompanyValue @relation()
}
```

#### 2. Sistema de Moedas Duplo - ✅ IMPLEMENTADO
- **ComplimentBalance**: 100 moedas semanais (renovável, uso exclusivo para elogios)
- **RedeemableBalance**: Acumulativo das moedas recebidas (para prêmios futuros)
- **Reset Manual**: Endpoint admin para reset semanal quando necessário

#### 3. Valores da Empresa - ✅ COMPLETO
```typescript
model CompanyValue {
  id          Int     @id @default(autoincrement())  // CORRIGIDO
  companyId   String  @map("company_id")
  name        String
  description String?
  isActive    Boolean @default(true)
  
  company     Company     @relation()
  compliments Compliment[]
}

model CompanySettings {
  id                            Int     @id @default(autoincrement())
  companyId                     String  @unique @map("company_id")
  weeklyComplimentCoinLimit     Int     @default(100)
  maxCoinsPerCompliment         Int     @default(100)
  minActiveValuesRequired       Int     @default(2)
  
  company Company @relation()
}
```

#### 4. Sistema de Auditoria - ✅ NOVO RECURSO
```typescript
model WalletTransaction {
  id              String   @id @default(cuid())
  walletId        String   @map("wallet_id")
  userId          String   @map("user_id")
  transactionType String   // DEBIT, CREDIT, RESET
  balanceType     String   // COMPLIMENT, REDEEMABLE
  amount          Int
  previousBalance Int
  newBalance      Int
  reason          String
  metadata        Json?    // Dados adicionais para auditoria
  createdAt       DateTime @default(now())
}
```

### Endpoints Implementados - ✅ COMPLETOS
```typescript
// Elogios
POST   /compliments/send               # Enviar elogio ✅
GET    /compliments/feed               # Feed de elogios da empresa ✅
GET    /compliments/received           # Elogios recebidos ✅
GET    /compliments/sent               # Elogios enviados ✅

// Carteiras e Auditoria - NOVO
GET    /wallets/balance                # Saldo atual ✅
GET    /wallets/transactions           # Histórico pessoal ✅
GET    /wallets/admin/transactions/:userId # Histórico admin ✅
POST   /wallets/reset-weekly-balance   # Reset manual admin ✅

// Configurações da empresa
GET    /companies/:id/settings         # Obter configurações ✅
PUT    /companies/:id/settings         # Atualizar configurações ✅
GET    /companies/:id/values           # Listar valores ✅
POST   /companies/:id/values           # Criar valor ✅
PUT    /companies/:id/values/:valueId  # Atualizar valor ✅
DELETE /companies/:id/values/:valueId  # Deletar valor ✅
```

### Correções Críticas Aplicadas - ✅
1. **🔴 BUG FATAL**: valueId corrigido de String para Int
2. **🟡 Validações**: Múltiplos de 5 (5-100), mínimo 2 valores ativos
3. **🟢 Auditoria**: Sistema completo de rastreamento de transações
4. **🔵 Reset Manual**: Sem cron jobs, reset administrativo quando necessário
5. **🟣 Metadados**: Informações detalhadas para cada transação

## Considerações para o Futuro

### Sistemas Recém-Implementados

#### Sistema de Endereços ✅
**Implementado**: Novembro 2025
**Funcionalidades**:
- Limite de 3 endereços por usuário (validação no service)
- Sistema automático de endereço padrão (default handling)
- Validações brasileiras: CEP, telefone, estado
- Integração completa com sistema de resgates
- Deleção inteligente: promove outro endereço como padrão

**Padrões Importantes**:
```typescript
// Validação de limite
if (addressCount >= MAX_ADDRESSES_PER_USER) {
  throw new Error('User cannot have more than 3 addresses')
}

// Auto-default quando é o primeiro endereço
if (addressCount === 0) {
  data.isDefault = true
}

// Ao deletar endereço padrão, promove outro
if (address.isDefault && otherAddresses.length > 0) {
  await otherAddresses[0].update({ isDefault: true })
}
```

#### Sistema de Organização Empresarial ✅
**Implementado**: Novembro 2025
**Funcionalidades**:
- **Departamentos**: Estruturação de áreas/setores
- **Job Titles**: Cargos/funções dos colaboradores
- **Validação de Unicidade**: Nome único por empresa
- **Cascade Delete**: Remoção automática ao deletar empresa
- **Integração com User**: Relacionamento M:1

**Uso**:
- Filtros e segmentação no dashboard
- Analytics por departamento/cargo
- Organização visual da estrutura empresarial
- Validação de pertencimento (dept/cargo pertencem à empresa)

#### Sistema de Dashboard ✅
**Implementado**: Novembro 2025
**Funcionalidades**:
- Métricas centralizadas (elogios, moedas, resgates)
- Integração com múltiplos services (compliments, wallets, prizes)
- Validações de pertencimento (departamento/cargo)
- Performance otimizada para consultas agregadas
- Analytics em tempo real

#### Sistema de Múltiplos Domínios (AllowedDomain) ✅
**Implementado**: Novembro 2025
**Motivação**: Empresas grandes possuem múltiplos domínios de email
**Exemplo**: @empresa.com.br, @empresa.com, @filial.com.br

**Implementação**:
```prisma
model AllowedDomain {
  id        String @id @default(cuid())
  companyId String
  domain    String
  
  @@unique([companyId, domain])
}
```

**Validação no Auth**:
```typescript
// Antes: apenas Company.domain
const company = await Company.findByDomain(emailDomain)

// Depois: Company.domain OU AllowedDomain.domain
const allowedDomain = await AllowedDomain.findByDomain(emailDomain)
```

### Próximas Funcionalidades
1. **✅ Sistema de Elogios**: IMPLEMENTADO COM SUCESSO
2. **Loja de Prêmios**: Catálogo e resgate de moedas redeemable
3. **Biblioteca**: Funcionalidades de livros e avaliações
4. **Dashboard Analytics**: Métricas e relatórios de elogios
5. **Gamificação**: Badges, rankings e conquistas

### Melhorias Técnicas
- **Caching**: Redis para permissões frequentes
- **Audit Log**: Rastreamento de mudanças
- **Bulk Operations**: Gestão em lote de usuários
- **Role Templates**: Templates pré-definidos por setor

## Contexto de Colaboração

### Workflow Preferido
- **Feature Branches**: Uma branch por funcionalidade
- **Clean Code**: Código limpo e bem documentado
- **Incremental**: Commits pequenos e frequentes
- **Testing**: Testes para funcionalidades críticas

### Comunicação
- **Documentation**: Swagger para APIs
- **Comments**: Código auto-explicativo com comments mínimos
- **Logging**: Logs estruturados para debugging
- **Error Messages**: Mensagens claras para usuários e desenvolvedores
