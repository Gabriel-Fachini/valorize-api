# Roles Management Module# Roles Management Module# Roles Management Module



Complete role and permission management system with multi-tenancy support.



## OverviewSistema completo de gerenciamento de roles (cargos) e permissões com suporte a multi-tenancy.Sistema completo de gerenciamento de roles (cargos) e permissões com suporte a multi-tenancy.



Complete RESTful API for administrators to manage roles, permissions, and user role assignments.



## Features## Overview## 📋 Visão Geral



- Create, list, update and delete roles per company

- Assign and remove permissions from roles

- Associate roles to usersO módulo de Roles Management fornece uma API RESTful completa para administradores gerenciarem roles, permissões e atribuições de roles a usuários.O módulo de Roles Management fornece uma API RESTful completa para administradores gerenciarem:

- View all available system permissions

- Complete data isolation per company (multi-tenancy)



## Base Path## Features- **Roles (Cargos)**: Criar, listar, atualizar e deletar roles por empresa



`/admin/roles`- **Permissões de Roles**: Atribuir, adicionar ou remover permissões dos roles



## Main Endpoints- Criar, listar, atualizar e deletar roles por empresa- **Atribuição de Roles a Usuários**: Associar roles a usuários



### Current User (Admin)- Atribuir e remover permissões de roles- **Listagem de Permissões do Sistema**: Visualizar todas as permissões disponíveis



- GET /me - Get own permissions and roles (requires roles:read)- Associar roles a usuários



### Roles Management- Visualizar todas as permissões disponíveis do sistema## 🏗️ Arquitetura



- GET / - List company roles (requires roles:read)- Isolamento total de dados por empresa (multi-tenancy)

- GET /:roleId - Get role details (requires roles:read)

- POST / - Create new role (requires roles:create)```

- PATCH /:roleId - Update role (requires roles:update)

- DELETE /:roleId - Delete role (requires roles:delete)## Base Path/src/features/admin/roles-management/



### Role Permissions├── types.ts                              # Tipos TypeScript e interfaces



- GET /:roleId/permissions - List role permissions (requires roles:read)`/admin/roles`├── roles-management.schemas.ts          # Schemas de validação JSON

- PUT /:roleId/permissions - Replace all permissions (requires roles:manage_permissions)

- POST /:roleId/permissions - Add permissions (requires roles:manage_permissions)├── roles-management.service.ts          # Lógica de negócio (service layer)

- DELETE /:roleId/permissions - Remove permissions (requires roles:manage_permissions)

## Principais Endpoints├── roles-management.routes.ts           # Definição de endpoints

### System Permissions

└── README.md                             # Este arquivo

- GET /system/permissions - List all system permissions (requires roles:read)

- GET /system/categories - List permission categories (requires roles:read)### Roles```



### User Roles



- GET /users/:userId/roles - List user roles (requires users:read)- `GET /` - Listar roles da empresa (requer `roles:read`)### Separação de Responsabilidades

- POST /users/:userId/roles - Assign role to user (requires users:manage_roles)

- DELETE /users/:userId/roles/:roleId - Remove role from user (requires users:manage_roles)- `GET /:roleId` - Detalhes de um role (requer `roles:read`)



## Multi-tenancy- `POST /` - Criar novo role (requer `roles:create`)```typescript



All endpoints enforce complete data isolation per company. The companyId is automatically extracted from the authenticated user in all services.- `PATCH /:roleId` - Atualizar role (requer `roles:update`)- **types.ts**: Define todas as interfaces e tipos de dados



## Architecture- `DELETE /:roleId` - Deletar role (requer `roles:delete`)- **schemas.ts**: Valida requisições e documenta respostas (OpenAPI)



```- **service.ts**: Contém toda lógica de negócio e acesso a dados

roles-management/

├── types.ts                      - TypeScript interfaces and types### Permissions de Role- **routes.ts**: Mapeia HTTP requests para funções de service

├── roles-management.schemas.ts   - JSON validation and OpenAPI docs

├── roles-management.service.ts   - Business logic```

├── roles-management.routes.ts    - HTTP endpoints

└── README.md                      - Documentation- `GET /:roleId/permissions` - Listar permissões do role (requer `roles:read`)

```

- `PUT /:roleId/permissions` - Substituir todas as permissões (requer `roles:manage_permissions`)## 🔐 Multi-tenancy

## Service Layer

- `POST /:roleId/permissions` - Adicionar permissões (requer `roles:manage_permissions`)

`rolesManagementService` exposes methods for:

- `DELETE /:roleId/permissions` - Remover permissões (requer `roles:manage_permissions`)Todos os endpoints garantem isolamento de dados por empresa:

- Roles: listRoles, getRoleById, createRole, updateRole, deleteRole

- Permissions: getRolePermissions, setRolePermissions, addRolePermissions, removeRolePermissions

- System: listAllPermissions, getPermissionCategories

- User Roles: getUserRoles, assignRoleToUser, removeRoleFromUser### System Permissions```typescript



## Validation// Usuário autenticado em empresa A



- Permissions must follow pattern: feature:objective (e.g. users:read)- `GET /system/permissions` - Listar todas as permissões do sistema (requer `roles:read`)// ❌ Não consegue acessar roles da empresa B

- Role names are unique per company

- Cannot delete role with assigned users- `GET /system/categories` - Listar categorias de permissões (requer `roles:read`)// ✅ Consegue gerenciar apenas roles da empresa A

- All operations validate that resources belong to user's company

```

## Error Codes

### User Roles

- ROLE_NOT_FOUND (404) - Role not found

- USER_NOT_FOUND (404) - User not foundA validação ocorre em dois níveis:

- PERMISSION_NOT_FOUND (400) - Permission not found

- ROLE_ALREADY_EXISTS (409) - Role name already exists in company- `GET /users/:userId/roles` - Listar roles de um usuário (requer `users:read`)

- ROLE_HAS_USERS (409) - Cannot delete role with assigned users

- ROLE_ALREADY_ASSIGNED (409) - Role already assigned to user- `POST /users/:userId/roles` - Atribuir role a usuário (requer `users:manage_roles`)1. **Middleware de Autenticação**: Extrai `auth0Id` do token



## Integration- `DELETE /users/:userId/roles/:roleId` - Remover role de usuário (requer `users:manage_roles`)2. **Service Layer**: Valida que o `companyId` corresponde ao usuário logado



Module is registered in `/src/features/admin/admin.routes.ts` with prefix `/roles`.



See also:## Multi-tenancy## 📡 Endpoints

- Prisma Schema: `/prisma/schema.prisma`

- Permission Constants: `/src/features/rbac/permissions.constants.ts`

- RBAC Middleware: `/src/middleware/rbac.ts`

- Issue FAC-100: Full implementation detailsTodos os endpoints garantem isolamento completo de dados por empresa. O `companyId` é extraído automaticamente do usuário autenticado em todos os serviços.### Base Path: `/admin/roles`




## Architecture#### Gerenciamento de Roles



```| Método | Endpoint | Permissão | Descrição |

roles-management/|--------|----------|-----------|-----------|

├── types.ts                      # Interfaces e tipos TypeScript| GET | `/` | `roles:read` | Lista roles da empresa |

├── roles-management.schemas.ts   # Validação JSON e OpenAPI docs| GET | `/:roleId` | `roles:read` | Detalhe de um role |

├── roles-management.service.ts   # Lógica de negócio| POST | `/` | `roles:create` | Criar novo role |

├── roles-management.routes.ts    # Endpoints HTTP| PATCH | `/:roleId` | `roles:update` | Atualizar role |

└── README.md                      # Documentação| DELETE | `/:roleId` | `roles:delete` | Deletar role |

```

#### Gerenciamento de Permissões de Role

## Service Layer

| Método | Endpoint | Permissão | Descrição |

`rolesManagementService` expõe métodos para:|--------|----------|-----------|-----------|

| GET | `/:roleId/permissions` | `roles:read` | Lista permissões do role |

- **Roles**: listRoles, getRoleById, createRole, updateRole, deleteRole| PUT | `/:roleId/permissions` | `roles:manage_permissions` | Substituir todas as permissões |

- **Permissions**: getRolePermissions, setRolePermissions, addRolePermissions, removeRolePermissions| POST | `/:roleId/permissions` | `roles:manage_permissions` | Adicionar permissões (incremental) |

- **System**: listAllPermissions, getPermissionCategories| DELETE | `/:roleId/permissions` | `roles:manage_permissions` | Remover permissões |

- **User Roles**: getUserRoles, assignRoleToUser, removeRoleFromUser

#### Listagem de Permissões do Sistema

## Validation

| Método | Endpoint | Permissão | Descrição |

- Permissões devem seguir padrão: `feature:objective` (ex: `users:read`)|--------|----------|-----------|-----------|

- Nomes de roles são únicos por empresa| GET | `/system/permissions` | `roles:read` | Lista todas as permissões do sistema |

- Não é possível deletar role com usuários atribuídos| GET | `/system/categories` | `roles:read` | Lista categorias de permissões |

- Todas as operações validam que recursos pertencem à empresa do usuário

#### Atribuição de Roles a Usuários

## Error Codes

| Método | Endpoint | Permissão | Descrição |

- `ROLE_NOT_FOUND` (404) - Role não encontrado|--------|----------|-----------|-----------|

- `USER_NOT_FOUND` (404) - Usuário não encontrado| GET | `/users/:userId/roles` | `users:read` | Lista roles de um usuário |

- `PERMISSION_NOT_FOUND` (400) - Permissão não encontrada| POST | `/users/:userId/roles` | `users:manage_roles` | Atribuir role a usuário |

- `ROLE_ALREADY_EXISTS` (409) - Nome de role já existe na empresa| DELETE | `/users/:userId/roles/:roleId` | `users:manage_roles` | Remover role de usuário |

- `ROLE_HAS_USERS` (409) - Impossível deletar role com usuários atribuídos

- `ROLE_ALREADY_ASSIGNED` (409) - Role já atribuído ao usuário## 💡 Exemplos de Uso



## Integration### 1. Listar Roles da Empresa



O módulo é registrado em `/src/features/admin/admin.routes.ts` com prefix `/roles`.```bash

GET /admin/roles?search=manager&sortBy=name&sortOrder=asc&page=1&limit=10

Ver também:Authorization: Bearer <token>

- Schema Prisma: `/prisma/schema.prisma````

- Constantes de Permissões: `/src/features/rbac/permissions.constants.ts`

- Middleware RBAC: `/src/middleware/rbac.ts`**Resposta:**


```json
{
  "success": true,
  "data": [
    {
      "id": "clk1a2b3c4d5e6f7g8h9i0j",
      "name": "HR Manager",
      "description": "Gerente de RH",
      "companyId": "comp123",
      "usersCount": 5,
      "permissionsCount": 12,
      "createdAt": "2025-11-03T00:00:00Z",
      "updatedAt": "2025-11-03T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "hasNextPage": false
  }
}
```

### 2. Criar um Novo Role

```bash
POST /admin/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Project Manager",
  "description": "Gerente de Projetos",
  "permissionNames": ["projects:read", "projects:create", "users:read"]
}
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "id": "new_role_id",
    "name": "Project Manager",
    "description": "Gerente de Projetos",
    "companyId": "comp123",
    "usersCount": 0,
    "permissionsCount": 3,
    "createdAt": "2025-11-03T12:00:00Z",
    "updatedAt": "2025-11-03T12:00:00Z"
  }
}
```

### 3. Atribuir Role a Usuário

```bash
POST /admin/roles/users/user123/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "new_role_id"
}
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "roleId": "new_role_id"
  }
}
```

### 4. Adicionar Permissões a um Role

```bash
POST /admin/roles/role123/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionNames": ["reports:read", "analytics:view"]
}
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "roleId": "role123",
    "addedPermissions": ["analytics:view", "reports:read"],
    "totalPermissions": 15
  }
}
```

### 5. Listar Permissões do Sistema

```bash
GET /admin/roles/system/permissions
Authorization: Bearer <token>
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "User Management",
        "permissions": [
          {
            "id": "perm_users:read",
            "name": "users:read",
            "description": "View user information",
            "category": "User Management",
            "inUse": true
          },
          {
            "id": "perm_users:create",
            "name": "users:create",
            "description": "Create new users",
            "category": "User Management",
            "inUse": false
          }
        ]
      }
    ],
    "total": 28
  }
}
```

## ✅ Validações

### Padrão de Permissões

Todas as permissões devem seguir o padrão: `feature:objective`

**Exemplos válidos:**
- `users:read`
- `projects:create`
- `analytics:view`
- `admin:manage_system`

**Exemplos inválidos:**
- `users` ❌ (sem objective)
- `read:users` ❌ (ordem invertida)
- `users-read` ❌ (sem colon)

### Regras de Negócio

1. **Nome de Role Único por Empresa**: Duas empresas podem ter roles com o mesmo nome, mas dentro de uma empresa nomes são únicos
2. **Deleção Bloqueada**: Não é possível deletar um role que tem usuários atribuídos
3. **Validação de Multi-tenancy**: Todas as operações validam que o recurso pertence à empresa do usuário autenticado
4. **Permissões Read-only**: Permissões do sistema não podem ser criadas/editadas por admins, apenas visualizadas

## 🔄 Códigos de Erro

| Código | Status HTTP | Descrição |
|--------|-------------|-----------|
| `ROLE_NOT_FOUND` | 404 | Role não existe ou não pertence à empresa |
| `USER_NOT_FOUND` | 404 | Usuário não existe ou não pertence à empresa |
| `PERMISSION_NOT_FOUND` | 400 | Uma ou mais permissões não existem no sistema |
| `ROLE_ALREADY_EXISTS` | 409 | Já existe um role com este nome na empresa |
| `ROLE_HAS_USERS` | 409 | Não é possível deletar role com usuários atribuídos |
| `ROLE_ALREADY_ASSIGNED` | 409 | O usuário já possui este role |

## 🔐 Permissões Necessárias

Para acessar os endpoints, o usuário deve ter as seguintes permissões:

### Leitura
- `roles:read` - Listar e visualizar roles

### Criação
- `roles:create` - Criar novos roles

### Atualização
- `roles:update` - Atualizar roles existentes

### Deleção
- `roles:delete` - Deletar roles

### Gerenciamento de Permissões
- `roles:manage_permissions` - Atribuir/remover permissões de roles

### Gerenciamento de Usuários
- `users:read` - Visualizar usuários
- `users:manage_roles` - Atribuir/remover roles de usuários

## 🏢 Multi-tenancy em Ação

### Cenário: 2 Empresas, 1 Usuário por Empresa

```
Empresa A (companyId: comp_a)
├── Role: "Manager"
├── Role: "Developer"
└── User: alice (auth0_id: alice@a)

Empresa B (companyId: comp_b)
├── Role: "Manager"  ← Nome igual, mas é um role DIFERENTE
├── Role: "Analyst"
└── User: bob (auth0_id: bob@b)
```

**Alice fazendo requisição:**
```bash
GET /admin/roles
# ✅ Retorna: Manager (da empresa A), Developer (da empresa A)
# ❌ Nunca retorna: Analyst (da empresa B) ou o Manager da empresa B
```

**Bob fazendo requisição:**
```bash
GET /admin/roles
# ✅ Retorna: Manager (da empresa B), Analyst (da empresa B)
# ❌ Nunca retorna: Developer (da empresa A) ou o Manager da empresa A
```

## 🧪 Testes

Os principais casos de teste cobrem:

- ✅ Isolamento multi-tenant
- ✅ Validações de permissões
- ✅ Bloqueio de deleção com usuários
- ✅ Duplicação de nomes em empresas diferentes
- ✅ Padrão de permissões (feature:objective)
- ✅ Atribuição de roles a usuários
- ✅ Operações incrementais vs replace

## 📚 Service Layer

O arquivo `roles-management.service.ts` expõe os seguintes métodos:

```typescript
rolesManagementService.listRoles(companyId, filters)
rolesManagementService.getRoleById(companyId, roleId)
rolesManagementService.createRole(companyId, name, description?, permissions?)
rolesManagementService.updateRole(companyId, roleId, updates)
rolesManagementService.deleteRole(companyId, roleId)

rolesManagementService.getRolePermissions(companyId, roleId)
rolesManagementService.setRolePermissions(companyId, roleId, permissionNames)
rolesManagementService.addRolePermissions(companyId, roleId, permissionNames)
rolesManagementService.removeRolePermissions(companyId, roleId, permissionNames)

rolesManagementService.listAllPermissions(companyId)
rolesManagementService.getPermissionCategories()

rolesManagementService.getUserRoles(companyId, userId)
rolesManagementService.assignRoleToUser(companyId, userId, roleId)
rolesManagementService.removeRoleFromUser(companyId, userId, roleId)
```

## 🔗 Dependências

- **Prisma**: ORM para banco de dados
- **Fastify**: Framework HTTP
- **rbac.service**: Serviço de verificação de permissões
- **rbac.constants**: Constantes de permissões do sistema

## 📖 Referências

- [RBAC Middleware](/src/middleware/rbac.ts)
- [Constantes de Permissões](/src/features/rbac/permissions.constants.ts)
- [Schema Prisma](/prisma/schema.prisma)
- [Issue FAC-100](https://linear.app/fachini-software/issue/FAC-100)

## 🚀 Próximos Passos

- [ ] Implementar testes unitários
- [ ] Implementar testes de integração
- [ ] Adicionar rate limiting para endpoints sensíveis
- [ ] Implementar auditoria de alterações
- [ ] Dashboard de roles e permissões
