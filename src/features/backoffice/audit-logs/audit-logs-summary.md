# Backoffice - Audit Logs Module

Módulo de visualização de logs de auditoria para Super Admins do backoffice.

## Endpoints Disponíveis

### 1. Listar Todos os Logs (Global)

```
GET /backoffice/audit-logs
```

**Descrição**: Lista todos os logs de auditoria do sistema (cross-company).

**Query Parameters**:
- `page` (number, default: 1) - Página atual
- `limit` (number, default: 50, max: 100) - Itens por página
- `sortOrder` (string: 'asc' | 'desc', default: 'desc') - Ordenação por data
- `action` (string, optional) - Filtrar por tipo de ação (ex: CREATE, UPDATE, DELETE)
- `entityType` (string, optional) - Filtrar por tipo de entidade (ex: Company, User, Wallet)
- `userId` (string, optional) - Filtrar por usuário que executou a ação
- `companyId` (string, optional) - Filtrar por empresa
- `startDate` (ISO 8601, optional) - Data inicial do período
- `endDate` (ISO 8601, optional) - Data final do período

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "userId": "user-123",
      "user": {
        "id": "user-123",
        "name": "João Silva",
        "email": "joao@valorize.com"
      },
      "action": "UPDATE",
      "entityType": "Company",
      "entityId": "company-456",
      "changes": {
        "name": {
          "before": "Empresa Antiga",
          "after": "Empresa Nova"
        }
      },
      "metadata": {
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      },
      "createdAt": "2025-11-17T19:00:00Z",
      "companyId": "company-456"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 342,
    "totalPages": 7
  }
}
```

### 2. Listar Logs de uma Empresa Específica

```
GET /backoffice/audit-logs/companies/:companyId
```

**Descrição**: Lista todos os logs relacionados a uma empresa específica.

**Path Parameters**:
- `companyId` (string, required) - ID da empresa

**Query Parameters**: Mesmos da rota global, exceto `companyId`

**Response**: Mesmo formato da rota global

### 3. Listar Logs de um Super Admin Específico

```
GET /backoffice/audit-logs/users/:userId
```

**Descrição**: Lista todas as ações executadas por um Super Admin específico.

**Path Parameters**:
- `userId` (string, required) - ID do usuário

**Query Parameters**: Mesmos da rota global, exceto `userId`

**Response**: Mesmo formato da rota global

## Tipos de Ações (AuditAction)

```typescript
enum AuditAction {
  // General CRUD
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',

  // Company lifecycle
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',

  // Wallet operations
  WALLET_CREDIT = 'WALLET_CREDIT',
  WALLET_DEBIT = 'WALLET_DEBIT',
  WALLET_FREEZE = 'WALLET_FREEZE',
  WALLET_UNFREEZE = 'WALLET_UNFREEZE',

  // Contact management
  CONTACT_ADD = 'CONTACT_ADD',
  CONTACT_UPDATE = 'CONTACT_UPDATE',
  CONTACT_DELETE = 'CONTACT_DELETE',

  // Domain management
  DOMAIN_ADD = 'DOMAIN_ADD',
  DOMAIN_DELETE = 'DOMAIN_DELETE',

  // Plan management
  PLAN_CHANGE = 'PLAN_CHANGE',
}
```

## Tipos de Entidades (AuditEntityType)

```typescript
enum AuditEntityType {
  COMPANY = 'Company',
  USER = 'User',
  WALLET = 'Wallet',
  COMPANY_WALLET = 'CompanyWallet',
  COMPANY_CONTACT = 'CompanyContact',
  COMPANY_PLAN = 'CompanyPlan',
  ALLOWED_DOMAIN = 'AllowedDomain',
}
```

## Segurança

✅ Todas as rotas requerem autenticação via Auth0 JWT
✅ Todas as rotas requerem role `Super Administrador`
✅ Apenas usuários da empresa "Valorize HQ" podem acessar

## Exemplos de Uso

### Buscar logs de criação de empresas nos últimos 7 dias

```bash
GET /backoffice/audit-logs?action=CREATE&entityType=Company&startDate=2025-11-10T00:00:00Z
```

### Buscar todas as ações de um Super Admin específico

```bash
GET /backoffice/audit-logs/users/user-123?page=1&limit=100
```

### Buscar logs de operações de carteira de uma empresa

```bash
GET /backoffice/audit-logs/companies/company-456?action=WALLET_CREDIT
```

### Buscar logs entre datas específicas

```bash
GET /backoffice/audit-logs?startDate=2025-11-01T00:00:00Z&endDate=2025-11-17T23:59:59Z
```

## Estrutura de Arquivos

```
src/features/backoffice/audit-logs/
├── audit-logs.types.ts      # Interfaces TypeScript
├── audit-logs.schemas.ts    # Validação Fastify (JSON Schema)
├── audit-logs.service.ts    # Lógica de negócio
├── audit-logs.routes.ts     # Endpoints HTTP
└── README.md               # Esta documentação
```

## Desenvolvimento

### Adicionar novo tipo de ação auditada

1. Adicionar enum em `/src/lib/audit-logger.ts`
2. Atualizar tipos se necessário
3. Garantir que o service está chamando `auditLogger.log()` onde necessário

### Adicionar novo filtro

1. Atualizar interface `AuditLogFilters` em `audit-logs.types.ts`
2. Adicionar query param em `audit-logs.schemas.ts`
3. Atualizar função `buildWhereClause()` em `audit-logs.service.ts`
4. Adicionar extração do filtro nas rotas em `audit-logs.routes.ts`
