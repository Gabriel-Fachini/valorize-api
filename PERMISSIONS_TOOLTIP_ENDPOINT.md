## Implementação - Rota GET de Permissões para Tooltips

### Resumo
Foi implementada uma rota GET autenticada sob o escopo do admin que lista todas as permissões cadastradas no sistema com suas descrições e categorias. Essa rota foi desenvolvida para servir ao frontend com informações para exibição de tooltips informativos.

### Mudanças Realizadas

#### 1. **Nova Permissão Adicionada**
**Arquivo:** `src/features/rbac/permissions.constants.ts`

- Adicionada nova permissão: `PERMISSIONS_READ_ALL: 'permissions:read_all'`
- Descrição: "View all available permissions for tooltips and documentation"
- Categoria: "Role Management"

#### 2. **Nova Rota Implementada**
**Arquivo:** `src/features/admin/roles-management/roles-management.routes.ts`

- **Endpoint:** `GET /admin/roles/system/permissions-info`
- **Permissão Requerida:** `permissions:read_all`
- **Autenticação:** Obrigatória (Bearer Token)
- **Escopo:** Admin

#### 3. **Método de Serviço Adicionado**
**Arquivo:** `src/features/admin/roles-management/roles-management.service.ts`

Novo método: `getPermissionsInfoForTooltips()`
- Retorna todas as permissões disponíveis agrupadas por categoria
- Não requer validação de empresa (companyId não é usado)
- Retorna informações: nome, descrição e categoria de cada permissão

### Resposta da Rota

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "Administration",
        "permissions": [
          {
            "name": "admin:access_panel",
            "description": "Access administrative panel",
            "category": "Administration"
          },
          {
            "name": "admin:view_analytics",
            "description": "View system analytics and reports",
            "category": "Administration"
          },
          ...
        ]
      },
      {
        "category": "Coins System",
        "permissions": [...]
      },
      ...
    ],
    "total": 35
  }
}
```

### Permissões Necessárias

Para que um usuário possa acessar essa rota, ele deve ter:
- **Permissão:** `permissions:read_all` atribuída através de um role

Essa permissão foi adicionada à categoria "Role Management" e deve ser atribuída aos roles que precisam acessar essas informações (ex: Admin, Manager de permissões).

### Exemplo de Uso Frontend

```javascript
// Fazer requisição com token de autenticação
const response = await fetch('/admin/roles/system/permissions-info', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  }
});

const data = await response.json();

// Usar data.data.categories para popular tooltips
data.data.categories.forEach(category => {
  category.permissions.forEach(permission => {
    // Exibir tooltip com permission.description
  });
});
```

### Como Atribuir a Permissão a um Role

1. Acesse `/admin/roles` (requer `ROLES_READ`)
2. Selecione ou crie um role
3. Adicione a permissão `permissions:read_all`
4. Salve as mudanças

Agora usuários com esse role poderão acessar `/admin/roles/system/permissions-info`.

### Notas Técnicas

- A rota retorna **todas** as permissões do sistema, não apenas as usadas na empresa
- As permissões são agrupadas e ordenadas alfabeticamente por categoria
- A resposta inclui o `total` de permissões para referência
- Nenhum middleware de validação de empresa é necessário para esta rota
- A rota está documentada no Swagger com esquema completo
