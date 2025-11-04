# 🎨 Frontend Implementation Guide - Roles Management API (RESUMIDO)

**API Base URL**: `http://localhost:3000/admin/roles`  
**Authentication**: Bearer Token (JWT)

---

## 🔐 Autenticação

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📊 Endpoints Essenciais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/admin/roles?limit=50&offset=0` | Listar roles com paginação |
| `GET` | `/admin/roles/:id` | Obter role específico |
| `POST` | `/admin/roles` | Criar novo role |
| `PATCH` | `/admin/roles/:id` | Atualizar role |
| `DELETE` | `/admin/roles/:id` | Deletar role |
| `GET` | `/admin/roles/system/permissions` | Listar todas permissões |
| `GET` | `/admin/roles/:id/permissions` | Obter permissões do role |
| `PUT` | `/admin/roles/:id/permissions` | Substituir permissões |
| `POST` | `/admin/roles/:id/permissions` | Adicionar permissão |
| `DELETE` | `/admin/roles/:id/permissions` | Remover permissão |
| `GET` | `/admin/roles/users/:userId/roles` | Listar roles do usuário |
| `POST` | `/admin/roles/users/:userId/roles` | Atribuir role a usuário |
| `DELETE` | `/admin/roles/users/:userId/roles/:roleId` | Remover role de usuário |

---

## 💾 Tipos TypeScript Essenciais

```typescript
interface Role {
  id: string
  name: string
  description?: string | null
  companyId: string
  createdAt: Date
  updatedAt: Date
}

interface RoleWithCounts extends Role {
  _count: { permissions: number; users: number }
}

interface Permission {
  id: string
  name: string
  description?: string | null
  category: string
}

interface ApiResponse<T> {
  success: true
  data: T
  timestamp: string
}

interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
  timestamp: string
}
```

---

## 🔧 Implementação Rápida por Endpoint

### 1. Listar Roles
```typescript
const listRoles = async (limit = 50, offset = 0) => {
  const response = await fetch(
    `${API_URL}/admin/roles?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  )
  return response.json()
}
```

### 2. Criar Role
```typescript
const createRole = async (name: string, description?: string) => {
  const response = await fetch(`${API_URL}/admin/roles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, description })
  })
  return response.json()
}
```

### 3. Atualizar Role
```typescript
const updateRole = async (roleId: string, name?: string, description?: string) => {
  const response = await fetch(`${API_URL}/admin/roles/${roleId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, description })
  })
  return response.json()
}
```

### 4. Deletar Role
```typescript
const deleteRole = async (roleId: string) => {
  const response = await fetch(`${API_URL}/admin/roles/${roleId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}
```

### 5. Listar Permissões
```typescript
const getAllPermissions = async () => {
  const response = await fetch(
    `${API_URL}/admin/roles/system/permissions`,
    { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
  )
  return response.json()
}
```

### 6. Definir Permissões do Role
```typescript
const setRolePermissions = async (roleId: string, permissionNames: string[]) => {
  const response = await fetch(
    `${API_URL}/admin/roles/${roleId}/permissions`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ permissionNames })
    }
  )
  return response.json()
}
```

### 7. Atribuir Role a Usuário
```typescript
const assignRoleToUser = async (userId: string, roleId: string) => {
  const response = await fetch(
    `${API_URL}/admin/roles/users/${userId}/roles`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roleId })
    }
  )
  return response.json()
}
```

### 8. Remover Role de Usuário
```typescript
const removeRoleFromUser = async (userId: string, roleId: string) => {
  const response = await fetch(
    `${API_URL}/admin/roles/users/${userId}/roles/${roleId}`,
    { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
  )
  return response.json()
}
```

### 9. Listar Roles do Usuário
```typescript
const getUserRoles = async (userId: string) => {
  const response = await fetch(
    `${API_URL}/admin/roles/users/${userId}/roles`,
    { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
  )
  return response.json()
}
```

---

## ⚠️ Códigos de Erro

| Código | Significado |
|--------|-------------|
| `ROLE_NOT_FOUND` | Role não encontrado |
| `USER_NOT_FOUND` | Usuário não encontrado |
| `ROLE_ALREADY_EXISTS` | Role com este nome já existe |
| `ROLE_HAS_USERS` | Não pode deletar role com usuários atribuídos |
| `UNAUTHORIZED` | Token inválido/expirado |
| `FORBIDDEN` | Acesso negado |
| `INSUFFICIENT_PERMISSIONS` | Permissão insuficiente |
| `INVALID_INPUT` | Dados de entrada inválidos |

---

## 🎣 Hook Custom - useRolesManagement

```typescript
import { useState } from 'react'

export const useRolesManagement = (token: string) => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const API_URL = 'http://localhost:3000/admin'

  const loadRoles = async (limit = 50, offset = 0) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/roles?limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Erro ao carregar roles')
      const data = await response.json()
      setRoles(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  const createRole = async (name: string, description?: string) => {
    try {
      const response = await fetch(`${API_URL}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description })
      })
      if (!response.ok) throw new Error('Erro ao criar role')
      await loadRoles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
      throw err
    }
  }

  const updateRole = async (roleId: string, updates: any) => {
    try {
      const response = await fetch(`${API_URL}/roles/${roleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Erro ao atualizar')
      await loadRoles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
      throw err
    }
  }

  const deleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`${API_URL}/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Erro ao deletar')
      await loadRoles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
      throw err
    }
  }

  return { roles, loading, error, loadRoles, createRole, updateRole, deleteRole }
}
```

---

## ✅ Checklist de Implementação

- [ ] **Listar Roles** - GET `/admin/roles` com paginação
- [ ] **Ver Role** - GET `/admin/roles/:id`
- [ ] **Criar Role** - POST `/admin/roles`
- [ ] **Editar Role** - PATCH `/admin/roles/:id`
- [ ] **Deletar Role** - DELETE `/admin/roles/:id`
- [ ] **Listar Permissões** - GET `/admin/roles/system/permissions`
- [ ] **Listar Permissões do Role** - GET `/admin/roles/:id/permissions`
- [ ] **Definir Permissões** - PUT `/admin/roles/:id/permissions`
- [ ] **Adicionar Permissão** - POST `/admin/roles/:id/permissions`
- [ ] **Remover Permissão** - DELETE `/admin/roles/:id/permissions`
- [ ] **Listar Roles do Usuário** - GET `/admin/roles/users/:userId/roles`
- [ ] **Atribuir Role a Usuário** - POST `/admin/roles/users/:userId/roles`
- [ ] **Remover Role de Usuário** - DELETE `/admin/roles/users/:userId/roles/:roleId`
- [ ] **Tratamento de Erros** - Implementar códigos de erro específicos
- [ ] **Loading States** - Adicionar indicadores de carregamento
- [ ] **Notificações** - Toast/snackbar de sucesso/erro
- [ ] **Confirmações** - Modais para ações destrutivas (delete)
- [ ] **Validação de Entrada** - Validar dados antes de enviar
- [ ] **Estado Global** - Zustand ou Context API
- [ ] **Testes Unitários** - Testes das funções de API
- [ ] **Testes de Integração** - Testes dos fluxos completos
- [ ] **Tratamento de Empresa** - Validar companyId no frontend
- [ ] **Paginação** - Implementar navegação entre páginas
- [ ] **Filtros** - Ordenação e busca de roles
- [ ] **Responsividade** - Testes em mobile/tablet
- [ ] **Performance** - Cache de permissões e roles
- [ ] **Acessibilidade** - Atributos ARIA e navegação por teclado
- [ ] **Documentação** - Comentários no código
- [ ] **UI/UX** - Design consistente com o rest da aplicação