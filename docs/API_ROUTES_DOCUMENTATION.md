# Documentação das Rotas da API Valorize

Esta documentação contém todas as rotas disponíveis na API Valorize, seus parâmetros de entrada, respostas esperadas e propósitos específicos.

## Índice

- [Informações Gerais](#informações-gerais)
- [Autenticação](#autenticação)
- [Usuários](#usuários)
- [Empresas](#empresas)
- [Configurações da Empresa](#configurações-da-empresa)
- [Valores da Empresa](#valores-da-empresa)
- [Complimentos](#complimentos)
- [Carteiras (Wallets)](#carteiras-wallets)
- [RBAC (Controle de Acesso)](#rbac-controle-de-acesso)
- [Sistema](#sistema)

## Informações Gerais

### Base URL
- **Desenvolvimento**: `http://localhost:3000`

### Autenticação
A maioria das rotas requer autenticação via Bearer Token (JWT). Inclua o token no header:
```
Authorization: Bearer <seu_token_jwt>
```

### Formato de Resposta Padrão
```json
{
  "success": true|false,
  "data": {...},
  "meta": {
    "timestamp": "2025-09-18T00:00:00.000Z"
  }
}
```

---

## Autenticação

### `POST /auth/login`
**Propósito**: Realizar login com email e senha utilizando Auth0.

**Entrada**:
```json
{
  "email": "string (email)",
  "password": "string (mínimo 1 caractere)"
}
```

**Saída (200)**:
```json
{
  "success": true,
  "data": {
    "access_token": "string",
    "token_type": "Bearer",
    "expires_in": "number",
    "refresh_token": "string",
    "scope": "string",
    "user_info": {
      "id": "string (UUID)",
      "email": "string",
      "name": "string",
      "avatar": "string",
      "companyId": "string",
      "isActive": "boolean"
    }
  }
}
```

**Códigos de Erro**: 400 (dados inválidos), 401 (credenciais incorretas), 500 (erro do servidor)

### `POST /auth/refresh`
**Propósito**: Renovar token de acesso usando refresh token.

**Entrada**:
```json
{
  "refresh_token": "string"
}
```

**Saída (200)**:
```json
{
  "success": true,
  "data": {
    "access_token": "string",
    "token_type": "Bearer",
    "expires_in": "number",
    "refresh_token": "string",
    "scope": "string"
  }
}
```

### `GET /auth/verify`
**Propósito**: Verificar validade do token e obter informações da sessão.

**Query Parameters**:
- `minimal` (boolean, opcional): Retorna apenas validação simples se `true`

**Saída (200)**:
```json
{
  "success": true,
  "data": {
    "isValid": "boolean",
    "timeRemaining": "number",
    "expiresAt": "string (ISO date)",
    "timeRemainingFormatted": "string",
    "needsRefresh": "boolean",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "avatar": "string",
      "companyId": "string",
      "isActive": "boolean"
    },
    "message": "string"
  }
}
```

### `GET /auth/refresh-instructions`
**Propósito**: Obter instruções para renovação de tokens.

**Saída (200)**:
```json
{
  "success": true,
  "data": {
    "endpoint": "string",
    "instructions": "string",
    "requiredFields": ["string"]
  }
}
```

### `GET /auth/health`
**Propósito**: Verificar saúde do módulo de autenticação.

**Saída (200)**:
```json
{
  "status": "ok",
  "module": "auth",
  "timestamp": "string (ISO date)"
}
```

---

## Usuários

### `GET /users/profile`
**Propósito**: Obter perfil do usuário atual.
**Autenticação**: Requerida

**Saída (200)**:
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "auth0Id": "string",
    "email": "string",
    "name": "string",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

### `PUT /users/profile`
**Propósito**: Atualizar perfil do usuário atual.
**Autenticação**: Requerida

**Entrada**:
```json
{
  "name": "string (2-100 caracteres, opcional)"
}
```

**Saída (200)**:
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "auth0Id": "string",
    "email": "string",
    "name": "string",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

### `DELETE /users/profile`
**Propósito**: Desativar conta do usuário atual.
**Autenticação**: Requerida

**Saída (200)**:
```json
{
  "success": true,
  "message": "User account deactivated successfully"
}
```

### `GET /users/me/get-my-balance`
**Propósito**: Obter saldo de moedas do usuário atual.
**Autenticação**: Requerida

**Saída (200)**:
```json
{
  "complimentBalance": "number",
  "redeemableBalance": "number"
}
```

### `GET /users/health`
**Propósito**: Verificar saúde do módulo de usuários.

**Saída (200)**:
```json
{
  "status": "ok",
  "module": "users",
  "timestamp": "string (ISO date)"
}
```

---

## Empresas

### `GET /companies/get-all-companies`
**Propósito**: Listar todas as empresas ativas.

**Saída (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "domain": "string",
      "country": "string",
      "timezone": "string",
      "isActive": "boolean",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ],
  "meta": {
    "total": "number",
    "timestamp": "string (ISO date)"
  }
}
```

### `POST /companies/create-company`
**Propósito**: Criar nova empresa.

**Entrada**:
```json
{
  "name": "string (1-255 caracteres)",
  "domain": "string (1-255 caracteres, formato de domínio)",
  "country": "string (2 caracteres, opcional)",
  "timezone": "string (opcional)",
  "brazilData": {
    "cnpj": "string (14-18 caracteres)",
    "razaoSocial": "string (1-255 caracteres)",
    "inscricaoEstadual": "string (máx 20 caracteres, opcional)",
    "inscricaoMunicipal": "string (máx 20 caracteres, opcional)",
    "nire": "string (máx 20 caracteres, opcional)",
    "cnaePrincipal": "string (1-10 caracteres)",
    "cnaeSecundario": "string (máx 255 caracteres, opcional)",
    "naturezaJuridica": "string (1-100 caracteres)",
    "porteEmpresa": "string (1-50 caracteres)",
    "situacaoCadastral": "string (1-50 caracteres)"
  }
}
```

**Saída (201)**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "domain": "string",
    "country": "string",
    "timezone": "string",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)",
    "companyBrazil": {
      "id": "string",
      "cnpj": "string",
      "razaoSocial": "string",
      "inscricaoEstadual": "string|null",
      "inscricaoMunicipal": "string|null",
      "nire": "string|null",
      "cnaePrincipal": "string",
      "cnaeSecundario": "string|null",
      "naturezaJuridica": "string",
      "porteEmpresa": "string",
      "situacaoCadastral": "string",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    },
    "contacts": []
  },
  "meta": {
    "timestamp": "string (ISO date)"
  }
}
```

### `POST /companies/validate-cnpj`
**Propósito**: Validar número de CNPJ brasileiro.

**Entrada**:
```json
{
  "cnpj": "string (14-18 caracteres)"
}
```

**Saída (200)**:
```json
{
  "success": true,
  "data": {
    "cnpj": "string",
    "formatted": "string",
    "isValid": "boolean"
  },
  "meta": {
    "timestamp": "string (ISO date)"
  }
}
```

---

## Configurações da Empresa

### `GET /companies/:companyId/settings`
**Propósito**: Obter configurações de uma empresa específica.

**Parâmetros de URL**:
- `companyId`: ID da empresa

**Saída (200)**:
```json
{
  "settings": {
    "id": "string",
    "companyId": "string",
    "weeklyComplimentCoinLimit": "number",
    "maxCoinsPerCompliment": "number",
    "minActiveValuesRequired": "number",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

### `PUT /companies/:companyId/settings`
**Propósito**: Atualizar configurações de uma empresa.
**Autenticação**: Requerida
**Permissão**: `company:manage_settings`

**Parâmetros de URL**:
- `companyId`: ID da empresa

**Entrada**:
```json
{
  "weeklyComplimentCoinLimit": "number (positivo, opcional)",
  "maxCoinsPerCompliment": "number (5-100, opcional)",
  "minActiveValuesRequired": "number (mínimo 1, opcional)"
}
```

**Saída (200)**:
```json
{
  "message": "Company settings updated successfully!",
  "settings": {
    "id": "string",
    "companyId": "string",
    "weeklyComplimentCoinLimit": "number",
    "maxCoinsPerCompliment": "number",
    "minActiveValuesRequired": "number",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

---

## Valores da Empresa

### `POST /companies/:companyId/create-value`
**Propósito**: Criar novo valor para uma empresa.
**Autenticação**: Requerida
**Permissão**: `company:manage_settings`

**Parâmetros de URL**:
- `companyId`: ID da empresa

**Entrada**:
```json
{
  "title": "string (mínimo 3 caracteres)",
  "description": "string (mínimo 10 caracteres)",
  "icon": "string (obrigatório)"
}
```

**Saída (201)**:
```json
{
  "message": "Company value created successfully!",
  "value": {
    "id": "number",
    "companyId": "string",
    "title": "string",
    "description": "string",
    "icon": "string",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

### `GET /companies/:companyId/values`
**Propósito**: Listar todos os valores de uma empresa.

**Parâmetros de URL**:
- `companyId`: ID da empresa

**Saída (200)**:
```json
{
  "values": [
    {
      "id": "number",
      "companyId": "string",
      "title": "string",
      "description": "string",
      "icon": "string",
      "isActive": "boolean",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ]
}
```

---

## Compliments

### `POST /compliments/send-compliment`
**Propósito**: Enviar um complimento para outro usuário.
**Autenticação**: Requerida

**Entrada**:
```json
{
  "receiverId": "string (CUID)",
  "valueId": "number (ID do valor da empresa)",
  "message": "string (10-280 caracteres)",
  "coins": "number (5-100, múltiplos de 5)"
}
```

**Saída (201)**:
```json
{
  "message": "Compliment sent successfully!",
  "compliment": {
    "id": "string",
    "senderId": "string",
    "receiverId": "string",
    "valueId": "number",
    "message": "string",
    "coins": "number",
    "createdAt": "string (ISO date)"
  }
}
```

### `GET /compliments/list-receivable-users`
**Propósito**: Listar usuários que podem receber complimentos (mesma empresa).
**Autenticação**: Requerida

**Saída (200)**:
```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatar": "string|null"
    }
  ]
}
```

---

## Carteiras (Wallets)

### `GET /wallets/balance`
**Propósito**: Obter saldo das carteiras do usuário atual.
**Autenticação**: Requerida

**Saída (200)**:
```json
{
  "complimentBalance": "number",
  "redeemableBalance": "number"
}
```

### `GET /wallets/transactions`
**Propósito**: Obter histórico de transações do usuário atual.
**Autenticação**: Requerida

**Query Parameters**:
- `limit`: number (1-100, padrão: 50)
- `offset`: number (mínimo 0, padrão: 0)
- `balanceType`: string ("COMPLIMENT" | "REDEEMABLE")
- `transactionType`: string ("DEBIT" | "CREDIT" | "RESET")
- `fromDate`: string (ISO date)
- `toDate`: string (ISO date)

**Saída (200)**:
```json
{
  "transactions": [
    {
      "id": "string",
      "transactionType": "DEBIT|CREDIT|RESET",
      "balanceType": "COMPLIMENT|REDEEMABLE",
      "amount": "number",
      "previousBalance": "number",
      "newBalance": "number",
      "reason": "string",
      "metadata": "object|null",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "total": "number",
    "limit": "number",
    "offset": "number",
    "hasMore": "boolean"
  }
}
```

### `POST /wallets/reset-weekly-balance`
**Propósito**: Reiniciar saldos semanais (apenas administradores).
**Autenticação**: Requerida
**Permissão**: `admin:manage_system`

**Query Parameters**:
- `companyId`: string (opcional, se fornecido, reinicia apenas essa empresa)

**Saída (200)**:
```json
{
  "message": "Weekly balance reset completed successfully",
  "companiesUpdated": "number",
  "walletsUpdated": "number",
  "resetBy": "string"
}
```

---

## RBAC (Controle de Acesso)

### `POST /admin/create-role`
**Propósito**: Criar nova função/papel.
**Autenticação**: Requerida
**Permissão**: `users:manage_roles`

**Entrada**:
```json
{
  "name": "string",
  "description": "string (opcional)",
  "permissions": ["string"] // formato: "feature:objective"
}
```

**Saída (201)**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string|null",
    "permissions": ["string"]
  }
}
```

### `PUT /admin/users/:id/assign-role`
**Propósito**: Atribuir função a um usuário.
**Autenticação**: Requerida
**Permissão**: `users:manage_roles`

**Parâmetros de URL**:
- `id`: ID do usuário

**Entrada**:
```json
{
  "roleId": "string"
}
```

**Saída (200)**:
```json
{
  "success": true
}
```

### `GET /admin/me/permissions`
**Propósito**: Obter permissões e funções do usuário atual.
**Autenticação**: Requerida

**Saída (200)**:
```json
{
  "success": true,
  "data": {
    "permissions": ["string"],
    "roles": [
      {
        "id": "string",
        "name": "string",
        "description": "string|null"
      }
    ]
  }
}
```

---

## Sistema

### `GET /health`
**Propósito**: Verificar saúde geral da aplicação.

**Saída (200)**:
```json
{
  "status": "ok",
  "timestamp": "string (ISO date)",
  "uptime": "number (segundos)"
}
```

---

## Códigos de Status HTTP

### Códigos de Sucesso
- **200 OK**: Operação realizada com sucesso
- **201 Created**: Recurso criado com sucesso

### Códigos de Erro
- **400 Bad Request**: Dados de entrada inválidos
- **401 Unauthorized**: Token inválido ou ausente
- **403 Forbidden**: Sem permissão para acessar o recurso
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito de dados (ex: email já existe)
- **500 Internal Server Error**: Erro interno do servidor

---

## Observações Importantes

1. **Autenticação**: A maioria das rotas requer autenticação via Bearer Token
2. **Permissões**: Algumas rotas requerem permissões específicas via RBAC
3. **Rate Limiting**: API possui limitação de taxa (padrão: 100 requisições por minuto)
4. **CORS**: Configurado para aceitar requisições de origens específicas
5. **Validação**: Todos os dados de entrada são validados conforme os esquemas especificados
6. **Documentação Swagger**: Disponível em `/docs` durante desenvolvimento

---

## Contato

Para dúvidas sobre a API, entre em contato com a equipe de desenvolvimento em `support@valorize.com`.
