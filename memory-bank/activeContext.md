# Active Context - Valorize API

## Foco Atual de Desenvolvimento

### Próxima Funcionalidade Prioritária: Sistema RBAC
O desenvolvimento está focado na implementação de um **Sistema de Controle de Acesso Baseado em Roles (RBAC)** com permissões granulares e interface administrativa.

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

3. **Infraestrutura Base**
   - API REST com Fastify
   - Database PostgreSQL + Prisma
   - Logging estruturado
   - Error handling consistente
   - Documentação Swagger

### 🔄 Migração Concluída
- **Clean Architecture → Feature-First**: Migração bem-sucedida
- **Estrutura Simplificada**: Redução de 83% no número de arquivos
- **Developer Experience**: Navegação e desenvolvimento mais ágeis

## Sistema RBAC - Próxima Feature

### Objetivos do RBAC
1. **Controle Granular**: Permissões específicas por funcionalidade
2. **Gestão por Empresa**: Roles isolados por organização
3. **Interface Admin**: Painel para gestão de usuários e permissões
4. **Flexibilidade**: Sistema extensível para futuras funcionalidades

### Estrutura Planejada

#### Roles Principais
```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',    // Acesso total ao sistema
  COMPANY_ADMIN = 'company_admin', // Admin da empresa
  HR_MANAGER = 'hr_manager',       // Gestão de RH
  TEAM_LEAD = 'team_lead',         // Liderança de equipe
  EMPLOYEE = 'employee'            // Colaborador padrão
}
```

#### Permissões Granulares
```typescript
enum Permission {
  // Usuários
  'users:read',
  'users:create', 
  'users:update',
  'users:delete',
  'users:manage_roles',
  
  // Elogios (futura)
  'praise:send',
  'praise:view_all',
  'praise:moderate',
  
  // Moedas (futura)
  'coins:view_balance',
  'coins:transfer',
  'coins:manage_system',
  
  // Admin
  'admin:access_panel',
  'admin:view_analytics',
  'admin:manage_company'
}
```

#### Database Schema (Planejado)
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String
  description String?
  companyId   String   @map("company_id")
  permissions Permission[]
  users       UserRole[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  company Company @relation(fields: [companyId], references: [id])
  
  @@unique([name, companyId])
  @@map("roles")
}

model Permission {
  id          String @id @default(cuid())
  name        String @unique
  description String?
  resource    String  // 'users', 'praise', 'coins', etc.
  action      String  // 'read', 'write', 'delete', etc.
  roles       Role[]
  
  @@map("permissions")
}

model UserRole {
  id     String @id @default(cuid())
  userId String @map("user_id")
  roleId String @map("role_id")
  
  user User @relation(fields: [userId], references: [id])
  role Role @relation(fields: [roleId], references: [id])
  
  @@unique([userId, roleId])
  @@map("user_roles")
}
```

### Implementação Planejada

#### 1. Feature Structure
```
src/features/rbac/
├── rbac.model.ts      # Role, Permission entities
├── rbac.service.ts    # Business logic para RBAC
├── rbac.routes.ts     # Admin endpoints
└── rbac.middleware.ts # Permission checking middleware
```

#### 2. Admin Panel Endpoints
```typescript
// Gestão de Roles
POST   /admin/roles                    # Criar role
GET    /admin/roles                    # Listar roles da empresa
PUT    /admin/roles/:id               # Atualizar role
DELETE /admin/roles/:id               # Deletar role

// Gestão de Usuários
GET    /admin/users                   # Listar usuários da empresa
PUT    /admin/users/:id/roles         # Atribuir/remover roles
GET    /admin/users/:id/permissions   # Ver permissões do usuário

// Gestão de Permissões
GET    /admin/permissions             # Listar todas as permissões
POST   /admin/roles/:id/permissions   # Atribuir permissões à role
```

#### 3. Middleware de Autorização
```typescript
// rbac.middleware.ts
export const requirePermission = (permission: Permission) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user
    const hasPermission = await rbacService.checkPermission(
      user.id, 
      permission
    )
    
    if (!hasPermission) {
      throw new ForbiddenError('Insufficient permissions')
    }
  }
}

// Uso nas rotas
fastify.get('/admin/users', {
  preHandler: [requirePermission('users:read')],
  handler: getUsersHandler
})
```

## Decisões de Implementação

### Abordagem Escolhida
1. **Database-First**: Permissões armazenadas no PostgreSQL
2. **Middleware-Based**: Verificação automática nas rotas
3. **Company-Scoped**: Isolamento total entre empresas
4. **Permission-Centric**: Verificação por permissão, não por role

### Considerações de Segurança
- **Princípio do Menor Privilégio**: Usuários começam sem permissões
- **Auditoria**: Log de todas as mudanças de permissões
- **Validação Dupla**: Verificação no middleware e no service
- **Isolamento**: Permissões sempre filtradas por empresa

## Contexto de Tempo e Recursos

### Restrições
- **Desenvolvedor Solo**: Gabriel Fachini
- **Tempo Limitado**: Desenvolvimento em tempo livre (faculdade + trabalho)
- **Iteração Rápida**: Foco em MVP funcional

### Estratégia de Implementação
1. **MVP First**: Implementar roles básicos (admin, employee)
2. **Iteração Gradual**: Adicionar permissões conforme necessidade
3. **Testing**: Testes unitários para lógica de permissões
4. **Documentation**: Swagger para todos os endpoints admin

## Próximos Passos Imediatos

### Fase 1: Foundation (Semana 1-2)
- [ ] Criar migrations para Role, Permission, UserRole
- [ ] Implementar models básicos
- [ ] Service para verificação de permissões
- [ ] Middleware de autorização

### Fase 2: Admin Panel (Semana 3-4)  
- [ ] Endpoints para gestão de roles
- [ ] Endpoints para atribuição de permissões
- [ ] Interface para listagem de usuários
- [ ] Testes de integração

### Fase 3: Integration (Semana 5)
- [ ] Integrar RBAC com rotas existentes
- [ ] Atualizar middleware de auth
- [ ] Documentação da API
- [ ] Deploy e testes manuais

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
