# 🎯 Nova Rota: Listar Usuários da Empresa

## Descrição

Foi adicionada uma nova rota para listar **todos os usuários ativos** da empresa. Esta rota serve para popular dropdowns e permitir que admins vejam todos os usuários disponíveis ao gerenciar roles e permissões.

## Endpoint

```http
GET /admin/roles/users/list
```

### Autenticação

- ✅ Requer token JWT válido
- ✅ Requer permissão `ROLES_READ` (`roles:read`)
- ✅ Apenas usuários da mesma empresa podem acessar

### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid-1",
      "name": "João Silva",
      "email": "joao@empresa.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    {
      "id": "user-uuid-2",
      "name": "Maria Santos",
      "email": "maria@empresa.com",
      "avatar": null
    }
  ]
}
```

### Características

- ✅ Lista **apenas usuários ativos** (`isActive: true`)
- ✅ Ordenação alfabética por nome
- ✅ Sem paginação (retorna todos os usuários)
- ✅ Inclui `id`, `name`, `email` e `avatar` (opcional)
- ✅ Isolamento multi-tenant (apenas usuários da empresa autenticada)
- ✅ Sem duplicatas

## Casos de Uso

### 1. Dropdown para Atribuição de Roles

```typescript
// Frontend
const response = await fetch('/admin/roles/users/list', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const { data: users } = await response.json()
// Usar `users` para popular dropdown
```

### 2. Dropdown para Adicionar Permissões

```typescript
// Selecionar usuários para dar acesso a um recurso
// Usar a mesma rota
```

### 3. Gestão Simplificada

```typescript
// Listar todos os usuários para gerenciamento geral
// Verificar quem tem permissões específicas
```

## Implementação

### Serviço (`roles-management.service.ts`)

```typescript
async listCompanyUsers(companyId: string) {
  const users = await prisma.user.findMany({
    where: {
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
    orderBy: { name: 'asc' },
  })
  return users
}
```

### Rota (`roles-management.routes.ts`)

```typescript
fastify.get(
  '/users/list',
  {
    preHandler: [requirePermission(PERMISSION.ROLES_READ)],
    schema: listCompanyUsersSchema,
  },
  async (request, reply) => {
    const auth0Id = getAuth0Id(request)
    const companyId = await getCompanyIdFromUser(auth0Id)
    const users = await rolesManagementService.listCompanyUsers(companyId)

    return reply.code(200).send({
      success: true,
      data: users,
    })
  },
)
```

### Schema (`roles-management.schemas.ts`)

```typescript
export const listCompanyUsersSchema = {
  tags: ['Roles Management'],
  description: 'List all active users in the company',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              avatar: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
  },
}
```

## Testes via cURL

```bash
# Listar usuários da empresa
curl -X GET http://localhost:3000/admin/roles/users/list \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Permissões Necessárias

- ✅ `ROLES_READ` - Necessária para acessar a rota

## Comportamento

| Cenário | Resultado |
|---------|-----------|
| Usuário sem token | 401 Unauthorized |
| Usuário sem permissão | 403 Forbidden |
| Usuário ativo na empresa | 200 com lista de usuários |
| Usuário inativo | Não listado na resposta |
| Nenhum usuário ativo | 200 com array vazio |

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `roles-management.service.ts` | ✅ Adicionado método `listCompanyUsers()` |
| `roles-management.routes.ts` | ✅ Adicionado rota `GET /users/list` |
| `roles-management.schemas.ts` | ✅ Adicionado schema `listCompanyUsersSchema` |

## Status

- ✅ Funcionalidade implementada
- ✅ Sem erros de compilação
- ✅ Testes unitários podem ser adicionados se necessário
- ✅ Pronto para uso

