# Active Context - Valorize API

## Foco Atual de Desenvolvimento

### ✅ Funcionalidades Recém-Implementadas

#### Sistema de Empresas (Companies)
Implementação completa da entidade **Company** com suporte específico para dados brasileiros e sistema de contatos empresariais.

#### Sistema RBAC (Role-Based Access Control)
Implementação completa do **Sistema de Controle de Acesso Baseado em Roles (RBAC)** com permissões granulares, middleware de autorização e interface administrativa.

### Próxima Funcionalidade Prioritária: Sistema de Elogios
O desenvolvimento agora está focado na implementação do **Sistema de Elogios**, primeira funcionalidade core da plataforma.

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

5. **Infraestrutura Base**
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
├── rbac.model.ts      # Role e Permission entities
├── rbac.service.ts    # Business logic completo
├── rbac.routes.ts     # Admin endpoints
└── rbac.schemas.ts    # Validações Fastify
src/middleware/
└── rbac.ts           # Middleware requirePermission
tests/
├── rbac.middleware.test.ts      # Testes do middleware
└── permission-validation.test.ts # Testes de validação
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

## Sistema de Elogios - Próxima Funcionalidade Prioritária

### Objetivos do Sistema de Elogios
1. **Reconhecimento Peer-to-Peer**: Colaboradores reconhecem uns aos outros
2. **Baseado em Valores**: Elogios conectados aos valores da empresa
3. **Sistema de Moedas**: Economia virtual com limites e renovação
4. **Visibilidade**: Feed de reconhecimentos para toda a empresa

### Funcionalidades Planejadas

#### 1. Estrutura de Elogios
```typescript
model Praise {
  id          String   @id @default(cuid())
  senderId    String   @map("sender_id")
  receiverId  String   @map("receiver_id")
  companyId   String   @map("company_id")
  valueId     String   @map("value_id")
  message     String
  coins       Int      // Máximo 100 por elogio
  isPublic    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  sender    User @relation("PraiseSender", fields: [senderId], references: [id])
  receiver  User @relation("PraiseReceiver", fields: [receiverId], references: [id])
  company   Company @relation(fields: [companyId], references: [id])
  value     CompanyValue @relation(fields: [valueId], references: [id])
}
```

#### 2. Sistema de Moedas Duplo
- **Saldo de Elogios**: 100 moedas semanais (renovável, uso exclusivo para elogios)
- **Saldo de Resgate**: Acumulativo das moedas recebidas (para prêmios)

#### 3. Valores da Empresa
```typescript
model CompanyValue {
  id          String @id @default(cuid())
  companyId   String @map("company_id")
  name        String
  description String?
  isActive    Boolean @default(true)
  
  company Company @relation(fields: [companyId], references: [id])
  praises Praise[]
}
```

### Endpoints Planejados
```typescript
// Elogios
POST   /praise/send                    # Enviar elogio
GET    /praise/feed                    # Feed de elogios da empresa
GET    /praise/received                # Elogios recebidos pelo usuário
GET    /praise/sent                    # Elogios enviados pelo usuário

// Moedas
GET    /coins/balance                  # Saldo atual (elogios + resgate)
GET    /coins/history                  # Histórico de transações

// Valores da empresa
GET    /company-values                 # Listar valores da empresa
POST   /admin/company-values           # Criar valor (admin)
```

## Considerações para o Futuro

### Após RBAC
1. **Sistema de Elogios**: Primeira funcionalidade core
2. **Sistema de Moedas**: Economia virtual da plataforma
3. **Loja de Prêmios**: Catálogo e resgate
4. **Biblioteca**: Funcionalidades de livros e avaliações

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
