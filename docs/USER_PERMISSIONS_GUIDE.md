# 🔐 Guia: Obtenção de Permissões do Usuário Logado

**Endpoint**: `GET /me/permissions`  
**Autenticação**: Bearer Token (obrigatório)  
**Status Code**: `200 OK` ou `500 Internal Server Error`

---

## 📋 Visão Geral

Este endpoint permite que qualquer usuário autenticado obtenha suas próprias permissões do sistema. É perfeito para:

- ✅ Renderização condicional de elementos na UI
- ✅ Verificação de acesso antes de navegar
- ✅ Exibição/ocultação de botões e painéis
- ✅ Validação no lado do cliente

---

## 📡 Requisição

```bash
curl -X GET http://localhost:3000/me/permissions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

---

## 📦 Resposta

### Sucesso (200)

```json
{
  "success": true,
  "data": [
    "roles:read",
    "roles:create",
    "roles:update",
    "users:read",
    "users:update",
    "compliments:create",
    "compliments:read"
  ]
}
```

### Erro (500)

```json
{
  "error": "PERMISSIONS_FETCH_ERROR",
  "message": "User not found",
  "statusCode": 500
}
```

---

## 🎯 Usar em React

### Hook Customizado

```typescript
// hooks/useUserPermissions.ts

import { useState, useEffect } from 'react'

export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Token não encontrado')
        }

        const response = await fetch('http://localhost:3000/me/permissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar permissões')
        }

        const data = await response.json()
        setPermissions(data.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  // Função auxiliar para verificar permissão
  const can = (permission: string) => permissions.includes(permission)

  // Função para verificar múltiplas permissões
  const canAll = (permissions: string[]) => 
    permissions.every(p => can(p))

  const canAny = (permissions: string[]) => 
    permissions.some(p => can(p))

  return { 
    permissions, 
    loading, 
    error, 
    can,
    canAll,
    canAny
  }
}
```

### Usar no Componente

```typescript
function MyComponent() {
  const { can, canAll, loading } = useUserPermissions()

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      {can('roles:read') && (
        <button>Visualizar Roles</button>
      )}

      {canAll(['roles:create', 'roles:update']) && (
        <button>Criar e Editar Roles</button>
      )}

      {canAny(['admin', 'manager']) && (
        <AdminPanel />
      )}
    </div>
  )
}
```

---

## 🛡️ Componente PermissionGuard

```typescript
// components/PermissionGuard.tsx

interface PermissionGuardProps {
  permission: string | string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { can, loading } = useUserPermissions()

  if (loading) return <div>Carregando...</div>

  const permissions = Array.isArray(permission) ? permission : [permission]
  const hasPermission = requireAll
    ? permissions.every(p => can(p))
    : permissions.some(p => can(p))

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

// Uso
<PermissionGuard 
  permission={['roles:read', 'roles:update']}
  requireAll={true}
  fallback={<p>Sem permissão</p>}
>
  <AdminPanel />
</PermissionGuard>
```

---

## 🔄 Atualizar Permissões

Para refrescar as permissões (ex: após login ou mudança de role):

```typescript
const { useUserPermissions } = await import('@/hooks/useUserPermissions')
const { updatePermissions } = useUserPermissions()

// Chamar após login
await updatePermissions()
```

---

## 📊 Permissões Disponíveis

Veja a lista completa de permissões em:

- `GET /admin/roles/system/permissions`
- `GET /admin/roles/system/categories`

---

## ⚠️ Considerações

1. **Cache Local**: As permissões são obtidas uma vez ao montar o componente
2. **Real-time Updates**: Se as permissões mudam (ex: role atribuído), é necessário recarregar
3. **Segurança**: Nunca use apenas validação do lado do cliente; sempre valide no backend
4. **Fallback UI**: Sempre forneça uma mensagem amigável quando sem permissão

---

## 🧪 Teste Rápido

```bash
# 1. Login para obter token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# 2. Use o token retornado
export TOKEN="seu_token_aqui"

# 3. Obtenha as permissões
curl -X GET http://localhost:3000/me/permissions \
  -H "Authorization: Bearer $TOKEN"
```

---

**Última atualização**: 3 de novembro de 2025
