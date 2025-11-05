# 🎨 Frontend Implementation Guide - Roles Management API

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
| `GET` | `/me/permissions` | Obter permissões do usuário logado |
| `GET` | `/admin/roles?limit=50&offset=0` | Listar roles |
| `GET` | `/admin/roles/:id` | Obter role |
| `POST` | `/admin/roles` | Criar role |
| `PATCH` | `/admin/roles/:id` | Atualizar role |
| `DELETE` | `/admin/roles/:id` | Deletar role |
| `GET` | `/admin/roles/system/permissions` | Listar permissões |
| `GET` | `/admin/roles/:id/permissions` | Permissões do role |
| `PUT` | `/admin/roles/:id/permissions` | Definir permissões |
| `POST` | `/admin/roles/:id/permissions` | Adicionar permissão |
| `DELETE` | `/admin/roles/:id/permissions` | Remover permissão |
| `GET` | `/admin/roles/users/:userId/roles` | Roles do usuário |
| `POST` | `/admin/roles/users/:userId/roles` | Atribuir role |
| `DELETE` | `/admin/roles/users/:userId/roles/:roleId` | Remover role |

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

// Role com contagem
interface RoleWithCounts extends Role {
  _count: {
    permissions: number
    users: number
  }
}

// Detalhes completos do role
interface RoleDetail extends RoleWithCounts {
  permissions: {
    id: string
    name: string
    description?: string | null
    category: string
  }[]
  users: {
    id: string
    name: string
    email: string
    avatar?: string | null
  }[]
}

// Permissão
interface Permission {
  id: string
  name: string
  description?: string | null
  category: string
}

// Permissões agrupadas por categoria
interface PermissionsByCategory {
  category: string
  permissions: Permission[]
}

// Usuário
interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string | null
  companyId: string
}

// User-Role
interface UserRole {
  userId: string
  roleId: string
  role: Role
}

// Resposta de erro
interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}
```

### Respostas Padrão

```typescript
// Sucesso com dados
interface ApiResponse<T> {
  success: true
  data: T
  timestamp: string
}

// Sucesso com paginação
interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  timestamp: string
}

// Erro
interface ErrorResponse {
  success: false
  error: ApiError
  timestamp: string
}
```

---

## 📱 Implementação por Endpoint

### 1. **Listar Roles com Paginação**

```typescript
// GET /admin/roles?limit=50&offset=0

interface ListRolesParams {
  limit?: number  // default: 50, max: 100
  offset?: number // default: 0
}

const listRoles = async (params: ListRolesParams = {}) => {
  const { limit = 50, offset = 0 } = params
  
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  })
  
  const response = await fetch(
    `${API_URL}/admin/roles?${query}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  )
  
  if (!response.ok) {
    throw new Error(`Erro ao listar roles: ${response.statusText}`)
  }
  
  return response.json() // PaginatedResponse<RoleWithCounts>
}

// Uso
const handleLoadRoles = async () => {
  try {
    const data = await listRoles({ limit: 20, offset: 0 })
    setRoles(data.data)
    setPagination(data.pagination)
  } catch (error) {
    setError(error.message)
  }
}
```

---

### 2. **Obter Role Específico**

```typescript
// GET /admin/roles/:id

const getRoleById = async (roleId: string) => {
  const response = await fetch(
    `${API_URL}/admin/roles/${roleId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  )
  
  if (!response.ok) {
    throw new Error(`Role não encontrado`)
  }
  
  return response.json() // ApiResponse<RoleDetail>
}

// Uso
const handleViewRole = async (roleId: string) => {
  try {
    const { data } = await getRoleById(roleId)
    setSelectedRole(data)
    setShowDetailModal(true)
  } catch (error) {
    showNotification('error', error.message)
  }
}
```

---

### 3. **Criar Novo Role**

```typescript
// POST /admin/roles

interface CreateRoleInput {
  name: string
  description?: string
}

const createRole = async (input: CreateRoleInput) => {
  const response = await fetch(
    `${API_URL}/admin/roles`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error.message || 'Erro ao criar role')
  }
  
  return response.json() // ApiResponse<Role>
}

// Componente React
function CreateRoleForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await createRole(formData)
      showNotification('success', 'Role criado com sucesso!')
      setFormData({ name: '', description: '' })
      // Recarregar lista de roles
      await loadRoles()
    } catch (error) {
      showNotification('error', error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nome do role"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <textarea
        placeholder="Descrição (opcional)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Role'}
      </button>
    </form>
  )
}
```

---

### 4. **Atualizar Role**

```typescript
// PATCH /admin/roles/:id

interface UpdateRoleInput {
  name?: string
  description?: string
}

const updateRole = async (roleId: string, input: UpdateRoleInput) => {
  const response = await fetch(
    `${API_URL}/admin/roles/${roleId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    }
  )
  
  if (!response.ok) {
    throw new Error('Erro ao atualizar role')
  }
  
  return response.json() // ApiResponse<Role>
}

// Uso
const handleUpdateRole = async (roleId: string, updates: UpdateRoleInput) => {
  try {
    const result = await updateRole(roleId, updates)
    showNotification('success', 'Role atualizado!')
    await loadRoles() // Recarregar
  } catch (error) {
    showNotification('error', error.message)
  }
}
```

---

### 5. **Deletar Role**

```typescript
// DELETE /admin/roles/:id

const deleteRole = async (roleId: string) => {
  const response = await fetch(
    `${API_URL}/admin/roles/${roleId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    // Erro: ROLE_HAS_USERS = "Role tem usuários atribuídos"
    throw new Error(error.error.message)
  }
  
  return response.json() // ApiResponse<{ message: string }>
}

// Uso com confirmação
const handleDeleteRole = async (roleId: string) => {
  const confirmed = window.confirm(
    'Tem certeza que deseja deletar este role?\nObs: Role não pode ter usuários atribuídos.'
  )
  
  if (!confirmed) return
  
  try {
    await deleteRole(roleId)
    showNotification('success', 'Role deletado!')
    await loadRoles()
  } catch (error) {
    showNotification('error', error.message)
  }
}
```

---

### 6. **Listar Todas as Permissões**

```typescript
// GET /admin/roles/system/permissions

const getAllPermissions = async () => {
  const response = await fetch(
    `${API_URL}/admin/roles/system/permissions`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Erro ao carregar permissões')
  }
  
  return response.json() // ApiResponse<PermissionsByCategory[]>
}

// Uso
const [permissions, setPermissions] = useState<PermissionsByCategory[]>([])

useEffect(() => {
  getAllPermissions().then(res => setPermissions(res.data))
}, [])

// Renderizar com checkboxes
function PermissionsSelect({ selectedPermissions, onChange }) {
  return (
    <div className="permissions-list">
      {permissions.map(category => (
        <div key={category.category} className="permission-category">
          <h4>{category.category}</h4>
          <div className="permission-checkboxes">
            {category.permissions.map(perm => (
              <label key={perm.id}>
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(perm.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedPermissions, perm.name])
                    } else {
                      onChange(selectedPermissions.filter(p => p !== perm.name))
                    }
                  }}
                />
                {perm.name}
                <small>{perm.description}</small>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

### 7. **Definir Permissões de um Role (Substituir Todas)**

```typescript
// PUT /admin/roles/:id/permissions

interface SetPermissionsInput {
  permissionNames: string[] // Array de permission codes
}

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
  
  if (!response.ok) {
    throw new Error('Erro ao atualizar permissões')
  }
  
  return response.json()
}

// Uso em componente
const handleSavePermissions = async (roleId: string, selectedPermissions: string[]) => {
  try {
    const result = await setRolePermissions(roleId, selectedPermissions)
    showNotification('success', 'Permissões atualizadas!')
    // Recarregar role para refletir mudanças
    const updated = await getRoleById(roleId)
    setRole(updated.data)
  } catch (error) {
    showNotification('error', error.message)
  }
}
```

---

### 8. **Adicionar Permissão Individual**

```typescript
// POST /admin/roles/:id/permissions

const addPermissionToRole = async (roleId: string, permissionNames: string[]) => {
  const response = await fetch(
    `${API_URL}/admin/roles/${roleId}/permissions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ permissionNames })
    }
  )
  
  if (!response.ok) {
    throw new Error('Erro ao adicionar permissão')
  }
  
  return response.json()
}
```

---

### 9. **Remover Permissão Individual**

```typescript
// DELETE /admin/roles/:id/permissions

const removePermissionFromRole = async (roleId: string, permissionNames: string[]) => {
  const response = await fetch(
    `${API_URL}/admin/roles/${roleId}/permissions`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ permissionNames })
    }
  )
  
  if (!response.ok) {
    throw new Error('Erro ao remover permissão')
  }
  
  return response.json()
}
```

---

### 10. **Atribuir Role a Usuário**

```typescript
// POST /admin/roles/users/:userId/roles

interface AssignRoleInput {
  roleId: string
}

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
  
  if (!response.ok) {
    throw new Error('Erro ao atribuir role')
  }
  
  return response.json()
}

// Componente de atribuição
function AssignRoleModal({ userId, roles, onClose, onSuccess }) {
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleAssign = async () => {
    if (!selectedRole) {
      showNotification('warning', 'Selecione um role')
      return
    }
    
    setLoading(true)
    try {
      await assignRoleToUser(userId, selectedRole)
      showNotification('success', 'Role atribuído!')
      onSuccess()
      onClose()
    } catch (error) {
      showNotification('error', error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Modal>
      <h3>Atribuir Role ao Usuário</h3>
      <select 
        value={selectedRole} 
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="">Selecione um role...</option>
        {roles.map(role => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      <button onClick={handleAssign} disabled={loading}>
        {loading ? 'Atribuindo...' : 'Atribuir'}
      </button>
    </Modal>
  )
}
```

---

### 11. **Remover Role de Usuário**

```typescript
// DELETE /admin/roles/users/:userId/roles/:roleId

const removeRoleFromUser = async (userId: string, roleId: string) => {
  const response = await fetch(
    `${API_URL}/admin/roles/users/${userId}/roles/${roleId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Erro ao remover role')
  }
  
  return response.json()
}

// Uso
const handleRemoveRole = async (userId: string, roleId: string) => {
  const confirmed = window.confirm('Remover este role do usuário?')
  if (!confirmed) return
  
  try {
    await removeRoleFromUser({ userId, roleId })
    showNotification('success', 'Role removido!')
    await loadUserRoles(userId)
  } catch (error) {
    showNotification('error', error.message)
  }
}
```

---

### 12. **Listar Roles de um Usuário**

```typescript
// GET /admin/roles/users/:userId/roles

const getUserRoles = async (userId: string) => {
  const response = await fetch(
    `${API_URL}/admin/roles/users/${userId}/roles`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Erro ao carregar roles do usuário')
  }
  
  return response.json() // ApiResponse<UserRole[]>
}

// Uso
function UserRolesView({ userId }) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    setLoading(true)
    getUserRoles(userId)
      .then(res => setUserRoles(res.data))
      .finally(() => setLoading(false))
  }, [userId])
  
  return (
    <div className="user-roles">
      <h4>Roles do Usuário</h4>
      {loading ? (
        <p>Carregando...</p>
      ) : userRoles.length === 0 ? (
        <p>Nenhum role atribuído</p>
      ) : (
        <div className="roles-list">
          {userRoles.map(ur => (
            <div key={ur.roleId} className="role-item">
              <span>{ur.role.name}</span>
              <button onClick={() => handleRemoveRole(userId, ur.roleId)}>
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 🛠️ Exemplos Práticos

### Exemplo 0: Obter Permissões do Usuário Logado (Para Renderização Condicional)

```typescript
// hooks/useUserPermissions.ts

export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3000/me/permissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!response.ok) {
          throw new Error('Erro ao carregar permissões')
        }
        
        const data = await response.json()
        setPermissions(data.data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  const can = (permission: string) => permissions.includes(permission)

  return { permissions, loading, error, can }
}

// Uso em componentes
function Dashboard() {
  const { can, loading } = useUserPermissions()
  
  if (loading) return <p>Carregando permissões...</p>

  return (
    <div>
      {can('roles:read') && <RolesPanel />}
      {can('users:update') && <UsersPanel />}
      {can('compliments:create') && <ComplimentsPanel />}
    </div>
  )
}
```

---

### Exemplo 1: Hook Custom para Gerenciamento de Roles

```typescript
// hooks/useRolesManagement.ts

export const useRolesManagement = () => {
  const [roles, setRoles] = useState<RoleWithCounts[]>([])
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })

  const token = localStorage.getItem('token')
  const API_URL = 'http://localhost:3000/admin'

  const loadRoles = async (limit = 50, offset = 0) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${API_URL}/roles?limit=${limit}&offset=${offset}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      if (!response.ok) throw new Error('Erro ao carregar roles')
      
      const data = await response.json()
      setRoles(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const createNewRole = async (name: string, description?: string) => {
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
      
      const data = await response.json()
      await loadRoles() // Recarregar lista
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar role')
      throw err
    }
  }

  const updateExistingRole = async (roleId: string, updates: Partial<Role>) => {
    try {
      const response = await fetch(`${API_URL}/roles/${roleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) throw new Error('Erro ao atualizar role')
      
      const data = await response.json()
      await loadRoles()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
      throw err
    }
  }

  const deleteExistingRole = async (roleId: string) => {
    try {
      const response = await fetch(`${API_URL}/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Erro ao deletar role')
      
      await loadRoles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar')
      throw err
    }
  }

  return {
    roles,
    selectedRole,
    setSelectedRole,
    loading,
    error,
    pagination,
    loadRoles,
    createNewRole,
    updateExistingRole,
    deleteExistingRole
  }
}

// Uso em componente
function RolesPage() {
  const { roles, loading, createNewRole } = useRolesManagement()
  
  useEffect(() => {
    // Carrega ao montar
  }, [])
  
  return (
    <div>
      {loading && <p>Carregando...</p>}
      {roles.map(role => <RoleCard key={role.id} role={role} />)}
    </div>
  )
}
```

---

### Exemplo 2: Componente de Gerenciamento de Permissões

```typescript
// components/RolePermissionsEditor.tsx

interface RolePermissionsEditorProps {
  roleId: string
  initialPermissions: string[]
  onSave: (permissions: string[]) => Promise<void>
}

export function RolePermissionsEditor({
  roleId,
  initialPermissions,
  onSave
}: RolePermissionsEditorProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialPermissions)
  const [allPermissions, setAllPermissions] = useState<PermissionsByCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)

  useEffect(() => {
    // Carregar permissões disponíveis
    getAllPermissions().then(res => setAllPermissions(res.data))
  }, [])

  const handlePermissionChange = (permissionName: string, checked: boolean) => {
    const newPermissions = checked
      ? [...selectedPermissions, permissionName]
      : selectedPermissions.filter(p => p !== permissionName)
    
    setSelectedPermissions(newPermissions)
    setHasChanged(JSON.stringify(newPermissions) !== JSON.stringify(initialPermissions))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await setRolePermissions(roleId, selectedPermissions)
      showNotification('success', 'Permissões salvas!')
      setHasChanged(false)
    } catch (error) {
      showNotification('error', 'Erro ao salvar permissões')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="permissions-editor">
      <h3>Gerenciar Permissões</h3>
      
      <div className="permissions-categories">
        {allPermissions.map(category => (
          <div key={category.category} className="category">
            <h4>{category.category}</h4>
            <div className="permissions-grid">
              {category.permissions.map(perm => (
                <label key={perm.id} className="permission-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.name)}
                    onChange={(e) => handlePermissionChange(perm.name, e.target.checked)}
                  />
                  <span className="name">{perm.name}</span>
                  {perm.description && (
                    <span className="description">{perm.description}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <button 
          onClick={handleSave} 
          disabled={!hasChanged || loading}
          className="btn-primary"
        >
          {loading ? 'Salvando...' : 'Salvar Permissões'}
        </button>
      </div>
    </div>
  )
}

// Uso
function RoleDetailPage({ roleId }) {
  const [role, setRole] = useState<RoleDetail | null>(null)
  
  const handleSavePermissions = async (permissions: string[]) => {
    await setRolePermissions(roleId, permissions)
    // Recarregar role
    const updated = await getRoleById(roleId)
    setRole(updated.data)
  }

  return (
    <div>
      {role && (
        <RolePermissionsEditor
          roleId={roleId}
          initialPermissions={role.permissions.map(p => p.name)}
          onSave={handleSavePermissions}
        />
      )}
    </div>
  )
}
```

---

### Exemplo 3: Lista de Roles com Ações

```typescript
// components/RolesList.tsx

export function RolesList() {
  const { roles, loading, pagination, loadRoles } = useRolesManagement()
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    loadRoles(50, currentPage * 50)
  }, [currentPage])

  const handleNextPage = () => {
    if (pagination.hasMore) setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1)
  }

  return (
    <div className="roles-list-container">
      <h2>Gerenciamento de Roles</h2>
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <table className="roles-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Permissões</th>
                <th>Usuários</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id}>
                  <td>{role.name}</td>
                  <td>{role.description || '-'}</td>
                  <td>{role._count.permissions}</td>
                  <td>{role._count.users}</td>
                  <td>
                    <button onClick={() => handleViewRole(role.id)}>Ver</button>
                    <button onClick={() => handleEditRole(role.id)}>Editar</button>
                    <button onClick={() => handleDeleteRole(role.id)}>Deletar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button onClick={handlePrevPage} disabled={currentPage === 0}>
              ← Anterior
            </button>
            <span>Página {currentPage + 1}</span>
            <button onClick={handleNextPage} disabled={!pagination.hasMore}>
              Próxima →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

---

### Exemplo 4: Componente com Renderização Condicional por Permissão

```typescript
// components/PermissionGuard.tsx

interface PermissionGuardProps {
  permission: string | string[] // Uma permissão ou array de permissões
  requireAll?: boolean // Se true, precisa ter TODAS as permissões (AND). Se false, qualquer uma (OR)
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
function AdminPanel() {
  return (
    <div>
      <PermissionGuard permission="roles:read">
        <div className="roles-section">
          <h2>Gerenciamento de Roles</h2>
          {/* Conteúdo visível apenas para quem tem roles:read */}
        </div>
      </PermissionGuard>

      <PermissionGuard 
        permission={['users:read', 'users:update']}
        requireAll={true}
        fallback={<p>Sem permissão para gerenciar usuários</p>}
      >
        <div className="users-section">
          <h2>Gerenciamento de Usuários</h2>
          {/* Conteúdo visível apenas para quem tem AMBAS as permissões */}
        </div>
      </PermissionGuard>
    </div>
  )
}

// Componente com Botão Condicional
function RoleActions({ roleId }: { roleId: string }) {
  const { can } = useUserPermissions()

  return (
    <div className="actions">
      <PermissionGuard permission="roles:read">
        <button onClick={() => viewRole(roleId)}>Ver Detalhes</button>
      </PermissionGuard>

      <PermissionGuard permission="roles:update">
        <button onClick={() => editRole(roleId)}>Editar</button>
      </PermissionGuard>

      <PermissionGuard permission="roles:delete">
        <button onClick={() => deleteRole(roleId)} className="btn-danger">
          Deletar
        </button>
      </PermissionGuard>
    </div>
  )
}
```

---

## ⚠️ Tratamento de Erros

### Códigos de Erro da API

```typescript
enum ErrorCode {
  // Não encontrado
  ROLE_NOT_FOUND = 'ROLE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PERMISSION_NOT_FOUND = 'PERMISSION_NOT_FOUND',
  
  // Validação
  ROLE_ALREADY_EXISTS = 'ROLE_ALREADY_EXISTS',
  INVALID_PERMISSION = 'INVALID_PERMISSION',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Negócio
  ROLE_HAS_USERS = 'ROLE_HAS_USERS', // Não pode deletar se tem usuários
  COMPANY_MISMATCH = 'COMPANY_MISMATCH', // Role/User de empresas diferentes
  
  // Autenticação/Autorização
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
}

// Mapeamento de mensagens
const errorMessages: Record<ErrorCode, string> = {
  ROLE_NOT_FOUND: 'Role não encontrado',
  USER_NOT_FOUND: 'Usuário não encontrado',
  PERMISSION_NOT_FOUND: 'Permissão não encontrada',
  ROLE_ALREADY_EXISTS: 'Um role com este nome já existe nesta empresa',
  INVALID_PERMISSION: 'Permissão inválida',
  INVALID_INPUT: 'Dados de entrada inválidos',
  ROLE_HAS_USERS: 'Não é possível deletar um role que tem usuários atribuídos',
  COMPANY_MISMATCH: 'Role e usuário pertencem a empresas diferentes',
  UNAUTHORIZED: 'Você precisa estar autenticado',
  FORBIDDEN: 'Acesso negado',
  INSUFFICIENT_PERMISSIONS: 'Você não tem permissão para realizar esta ação'
}

// Interceptor de erros
const handleApiError = (error: ApiError) => {
  const message = errorMessages[error.code as ErrorCode] || error.message
  
  if (error.code === 'UNAUTHORIZED') {
    // Redirecionar para login
    window.location.href = '/login'
  }
  
  if (error.code === 'FORBIDDEN' || error.code === 'INSUFFICIENT_PERMISSIONS') {
    showNotification('error', 'Você não tem permissão para essa ação')
    return
  }
  
  showNotification('error', message)
}
```

---

### Tratamento Global

```typescript
// utils/api.ts

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiErrorClass(data.error.code, data.error.message, data.error.details)
  }

  return data.data
}

class ApiErrorClass extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Usar em qualquer lugar
try {
  const roles = await apiCall('/admin/roles', { method: 'GET' })
} catch (error) {
  if (error instanceof ApiErrorClass) {
    handleApiError({ code: error.code, message: error.message, details: error.details })
  }
}
```

---

## 🌐 Estado Global (Recomendações)

### Opção 1: Context API (React)

```typescript
// contexts/RolesContext.tsx

interface RolesContextType {
  roles: RoleWithCounts[]
  permissions: PermissionsByCategory[]
  loading: boolean
  error: string | null
  loadRoles: (limit?: number, offset?: number) => Promise<void>
  loadPermissions: () => Promise<void>
  createRole: (data: CreateRoleInput) => Promise<Role>
  updateRole: (id: string, data: UpdateRoleInput) => Promise<Role>
  deleteRole: (id: string) => Promise<void>
  setRolePermissions: (roleId: string, permissions: string[]) => Promise<void>
}

export const RolesContext = React.createContext<RolesContextType | null>(null)

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const [roles, setRoles] = useState<RoleWithCounts[]>([])
  const [permissions, setPermissions] = useState<PermissionsByCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRoles = async (limit = 50, offset = 0) => {
    setLoading(true)
    try {
      const data = await apiCall('/admin/roles', { 
        method: 'GET',
        body: JSON.stringify({ limit, offset })
      })
      setRoles(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      const data = await apiCall('/admin/roles/permissions/all')
      setPermissions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar permissões')
    }
  }

  return (
    <RolesContext.Provider
      value={{
        roles,
        permissions,
        loading,
        error,
        loadRoles,
        loadPermissions,
        // ... outros métodos
      }}
    >
      {children}
    </RolesContext.Provider>
  )
}

// Hook
export const useRoles = () => {
  const context = React.useContext(RolesContext)
  if (!context) {
    throw new Error('useRoles deve ser usado dentro de RolesProvider')
  }
  return context
}
```

### Opção 2: Zustand (Recomendado)

```typescript
// store/rolesStore.ts

import { create } from 'zustand'

interface RolesStore {
  roles: RoleWithCounts[]
  permissions: PermissionsByCategory[]
  loading: boolean
  error: string | null
  
  loadRoles: (limit?: number, offset?: number) => Promise<void>
  loadPermissions: () => Promise<void>
  createRole: (data: CreateRoleInput) => Promise<Role>
  updateRole: (id: string, data: UpdateRoleInput) => Promise<Role>
  deleteRole: (id: string) => Promise<void>
  setRolePermissions: (roleId: string, permissions: string[]) => Promise<void>
}

export const useRolesStore = create<RolesStore>((set, get) => ({
  roles: [],
  permissions: [],
  loading: false,
  error: null,

  loadRoles: async (limit = 50, offset = 0) => {
    set({ loading: true, error: null })
    try {
      const data = await apiCall('/admin/roles')
      set({ roles: data })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erro' })
    } finally {
      set({ loading: false })
    }
  },

  loadPermissions: async () => {
    try {
      const data = await apiCall('/admin/roles/permissions/all')
      set({ permissions: data })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erro' })
    }
  },

  // ... outros métodos
}))

// Usar em componentes
function MyComponent() {
  const { roles, loading, loadRoles } = useRolesStore()
  
  useEffect(() => {
    loadRoles()
  }, [])
  
  return <div>{/* ... */}</div>
}
```

---

## 📚 Checklist de Implementação

- [ ] Autenticação com token JWT
- [ ] **Obter permissões do usuário logado** (`/me/permissions`)
- [ ] **Renderização condicional com PermissionGuard**
- [ ] **Hook useUserPermissions customizado**
- [ ] Listar roles com paginação
- [ ] Visualizar role específico
- [ ] Criar novo role
- [ ] Editar role existente
- [ ] Deletar role
- [ ] Listar todas as permissões
- [ ] Visualizar permissões por categoria
- [ ] Gerenciar permissões de um role (adicionar/remover)
- [ ] Atribuir role a usuário
- [ ] Remover role de usuário
- [ ] Listar roles de um usuário
- [ ] Tratamento de erros com códigos específicos
- [ ] Validação de entrada
- [ ] Loading states
- [ ] Notificações de sucesso/erro
- [ ] Confirmação para ações destrutivas (delete)
- [ ] Estado global (Context/Zustand)
- [ ] Testes unitários
- [ ] Testes de integração

---

## 🎓 Recursos Adicionais

- **API Postman Collection**: `/docs/postman/roles-management-collection.json`
- **Seed Data**: `/src/lib/seed/` (para dados de teste)
- **Credenciais de Teste**: Ver arquivo SEED_STATUS.md

---

**Última atualização**: 3 de novembro de 2025
