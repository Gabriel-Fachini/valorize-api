# API Endpoints - Company Settings (FAC-82)

Documentação completa dos endpoints necessários para a funcionalidade de Configurações da Empresa.

## Base URL

```
/api/admin/company
```

## Authentication

Todos os endpoints requerem autenticação via Bearer Token:

```
Authorization: Bearer {access_token}
```

---

## 1. GET /admin/company/settings

Busca todas as configurações da empresa.

### Request

**Method:** `GET`
**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Query Parameters:** Nenhum

### Response

**Status:** `200 OK`

**Body:**
```typescript
{
  id: string                    // UUID da empresa
  name: string                  // Nome da empresa
  logo_url?: string             // URL da logo (opcional)
  domains: string[]             // Array de domínios permitidos
  weekly_renewal_amount: number // Quantidade de moedas (50-500)
  renewal_day: number           // Dia da semana (1-7, 1=Monday)
  timezone?: string             // Timezone (opcional)
  created_at: string            // ISO 8601 date-time
  updated_at: string            // ISO 8601 date-time
}
```

**Exemplo de Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Empresa X Tecnologia",
  "logo_url": "https://storage.example.com/logos/company-x.png",
  "domains": ["empresax.com.br", "empresax.com"],
  "weekly_renewal_amount": 100,
  "renewal_day": 1,
  "timezone": "America/Sao_Paulo",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-20T14:45:00Z"
}
```

### Error Responses

**404 Not Found** - Empresa não encontrada
```json
{
  "error": "Company not found",
  "message": "No company settings found for this user"
}
```

**401 Unauthorized** - Token inválido ou ausente
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

---

## 2. PUT /admin/company/settings

Atualiza todas as configurações da empresa (substituição completa).

### Request

**Method:** `PUT`
**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```typescript
{
  name: string                  // Obrigatório, min: 1, max: 100
  logo_url?: string             // Opcional, URL válida
  domains: string[]             // Obrigatório, min: 1 domínio
  weekly_renewal_amount: number // Obrigatório, min: 50, max: 500
  renewal_day: number           // Obrigatório, min: 1, max: 7
}
```

**Exemplo de Request:**
```json
{
  "name": "Empresa X Tecnologia Ltda",
  "logo_url": "https://storage.example.com/logos/new-logo.png",
  "domains": ["empresax.com.br", "empresax.com", "empresax.net"],
  "weekly_renewal_amount": 150,
  "renewal_day": 2
}
```

### Response

**Status:** `200 OK`

**Body:** Mesmo formato do GET (objeto Company completo atualizado)

### Error Responses

**400 Bad Request** - Validação falhou
```json
{
  "error": "Validation error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "weekly_renewal_amount",
      "message": "Must be between 50 and 500"
    },
    {
      "field": "domains",
      "message": "At least one domain is required"
    }
  ]
}
```

**404 Not Found** - Empresa não encontrada
**401 Unauthorized** - Não autorizado

---

## 3. PATCH /admin/company/settings/basic-info

Atualiza apenas informações básicas (nome e logo).

### Request

**Method:** `PATCH`
**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```typescript
{
  name: string      // Obrigatório
  logo_url?: string // Opcional
}
```

**Exemplo de Request:**
```json
{
  "name": "Empresa X Tech",
  "logo_url": "https://storage.example.com/logos/updated-logo.png"
}
```

### Response

**Status:** `200 OK`

**Body:** Objeto Company completo com as alterações aplicadas

### Error Responses

**400 Bad Request** - Nome inválido
```json
{
  "error": "Validation error",
  "message": "Company name is required and must be between 3 and 100 characters"
}
```

---

## 4. PATCH /admin/company/settings/domains

Atualiza a lista de domínios permitidos para SSO.

### Request

**Method:** `PATCH`
**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```typescript
{
  domains: string[] // Array de domínios (min: 1)
}
```

**Exemplo de Request:**
```json
{
  "domains": [
    "empresax.com.br",
    "empresax.com",
    "subsidiaria.com.br"
  ]
}
```

**Validações de Domínio:**
- Formato válido: `empresa.com.br`, `empresa.com`
- Não pode conter `http://` ou `https://`
- Não pode conter `@`
- Deve ser lowercase
- Regex: `/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i`

### Response

**Status:** `200 OK`

**Body:** Objeto Company completo com os domínios atualizados

### Error Responses

**400 Bad Request** - Domínios inválidos
```json
{
  "error": "Validation error",
  "message": "Invalid domain format",
  "details": [
    {
      "domain": "empresa@.com",
      "message": "Invalid domain format"
    }
  ]
}
```

**400 Bad Request** - Nenhum domínio fornecido
```json
{
  "error": "Validation error",
  "message": "At least one domain is required"
}
```

---

## 5. PATCH /admin/company/settings/coin-economy

Atualiza configurações de economia de moedas.

### Request

**Method:** `PATCH`
**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```typescript
{
  weekly_renewal_amount: number // Min: 50, Max: 500
  renewal_day: number           // Min: 1, Max: 7 (1=Monday, 7=Sunday)
}
```

**Exemplo de Request:**
```json
{
  "weekly_renewal_amount": 200,
  "renewal_day": 1
}
```

**Mapeamento de Dias:**
- `1` = Segunda-feira (Monday)
- `2` = Terça-feira (Tuesday)
- `3` = Quarta-feira (Wednesday)
- `4` = Quinta-feira (Thursday)
- `5` = Sexta-feira (Friday)
- `6` = Sábado (Saturday)
- `7` = Domingo (Sunday)

### Response

**Status:** `200 OK`

**Body:** Objeto Company completo com as configurações atualizadas

### Error Responses

**400 Bad Request** - Valores fora do range
```json
{
  "error": "Validation error",
  "message": "Invalid coin economy settings",
  "details": [
    {
      "field": "weekly_renewal_amount",
      "message": "Must be between 50 and 500"
    },
    {
      "field": "renewal_day",
      "message": "Must be between 1 (Monday) and 7 (Sunday)"
    }
  ]
}
```

---

## 6. POST /admin/company/logo

Upload de logo da empresa.

### Request

**Method:** `POST`
**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
logo: File  // Arquivo de imagem
```

**Validações:**
- **Formatos aceitos:** `image/png`, `image/jpeg`, `image/jpg`, `image/svg+xml`
- **Tamanho máximo:** 1 MB (1.048.576 bytes)
- **Dimensões recomendadas:** 200x200px

**Exemplo de Request (JavaScript):**
```javascript
const formData = new FormData();
formData.append('logo', fileObject);

fetch('/api/admin/company/logo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Response

**Status:** `200 OK`

**Body:**
```typescript
{
  logo_url: string // URL pública da logo após upload
}
```

**Exemplo de Response:**
```json
{
  "logo_url": "https://storage.example.com/logos/550e8400-logo.png"
}
```

### Error Responses

**400 Bad Request** - Arquivo inválido
```json
{
  "error": "Invalid file",
  "message": "Invalid file format. Accepted: PNG, JPG, SVG"
}
```

**413 Payload Too Large** - Arquivo muito grande
```json
{
  "error": "File too large",
  "message": "File size exceeds 1MB limit"
}
```

---

## Modelo de Dados TypeScript

```typescript
/**
 * Company interface - Complete company settings
 */
interface Company {
  id: string
  name: string
  logo_url?: string
  domains: string[]
  weekly_renewal_amount: number
  renewal_day: number
  timezone?: string
  created_at: string
  updated_at: string
}

/**
 * Request body para atualização completa (PUT)
 */
interface UpdateCompanySettingsRequest {
  name: string
  logo_url?: string
  domains: string[]
  weekly_renewal_amount: number
  renewal_day: number
}

/**
 * Request body para atualização de informações básicas (PATCH)
 */
interface UpdateBasicInfoRequest {
  name: string
  logo_url?: string
}

/**
 * Request body para atualização de domínios (PATCH)
 */
interface UpdateDomainsRequest {
  domains: string[]
}

/**
 * Request body para atualização de economia (PATCH)
 */
interface UpdateCoinEconomyRequest {
  weekly_renewal_amount: number
  renewal_day: number
}

/**
 * Response para upload de logo
 */
interface UploadLogoResponse {
  logo_url: string
}
```

---

## Regras de Negócio

### 1. Validação de Domínios
- Converter para lowercase antes de salvar
- Remover espaços em branco
- Não permitir duplicatas
- Pelo menos 1 domínio obrigatório
- Formato: `dominio.com.br` ou `subdominio.dominio.com`

### 2. Economia de Moedas
- Quantidade mínima: 50 moedas
- Quantidade máxima: 500 moedas
- Valor padrão: 100 moedas
- Renovação ocorre semanalmente no dia especificado

### 3. Upload de Logo
- Armazenar em storage seguro (S3, CloudFlare R2, etc.)
- Gerar nome único para o arquivo
- Retornar URL pública acessível
- Deletar logo anterior ao fazer upload de nova (opcional)

### 4. Segurança
- Validar que o usuário logado tem permissão de admin
- Validar que o usuário pertence à empresa sendo editada
- Rate limiting para endpoints de upload
- Sanitizar inputs para prevenir XSS/injection

---

## Exemplos de Fluxo Completo

### Fluxo 1: Carregar e Atualizar Informações Básicas

```javascript
// 1. Carregar configurações atuais
const response = await fetch('/api/admin/company/settings', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const company = await response.json();

// 2. Fazer upload de nova logo (se houver)
const formData = new FormData();
formData.append('logo', logoFile);

const uploadResponse = await fetch('/api/admin/company/logo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
const { logo_url } = await uploadResponse.json();

// 3. Atualizar informações básicas
const updateResponse = await fetch('/api/admin/company/settings/basic-info', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Novo Nome da Empresa',
    logo_url: logo_url
  })
});
const updatedCompany = await updateResponse.json();
```

### Fluxo 2: Atualizar Lista de Domínios

```javascript
// 1. Preparar lista de domínios (já validados no frontend)
const domains = ['empresa.com.br', 'empresa.com', 'subsidiaria.com.br'];

// 2. Enviar para API
const response = await fetch('/api/admin/company/settings/domains', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ domains })
});

if (response.ok) {
  const updatedCompany = await response.json();
  console.log('Domínios atualizados:', updatedCompany.domains);
} else {
  const error = await response.json();
  console.error('Erro:', error.message);
}
```

### Fluxo 3: Configurar Economia de Moedas

```javascript
// Atualizar configurações de moedas
const response = await fetch('/api/admin/company/settings/coin-economy', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    weekly_renewal_amount: 150,
    renewal_day: 1  // Segunda-feira
  })
});

const updatedCompany = await response.json();
console.log(`Renovação configurada: ${updatedCompany.weekly_renewal_amount} moedas toda segunda-feira`);
```

---

## Notas de Implementação

1. **Timezone:** Se não fornecido, usar `America/Sao_Paulo` como padrão
2. **Transações:** Updates devem ser atômicos (usar transações de DB)
3. **Audit Log:** Registrar todas as alterações de configurações para auditoria
4. **Cache:** Considerar cache de configurações (invalidar após updates)
5. **Webhooks:** Opcional - disparar webhook quando domínios forem alterados (para sincronizar com SSO provider)

---

## Checklist de Implementação Backend

- [ ] Criar tabela `companies` no banco de dados
- [ ] Implementar GET `/admin/company/settings`
- [ ] Implementar PUT `/admin/company/settings`
- [ ] Implementar PATCH `/admin/company/settings/basic-info`
- [ ] Implementar PATCH `/admin/company/settings/domains`
- [ ] Implementar PATCH `/admin/company/settings/coin-economy`
- [ ] Implementar POST `/admin/company/logo` com upload para storage
- [ ] Adicionar validações com Zod/Joi/class-validator
- [ ] Adicionar middleware de autenticação
- [ ] Adicionar middleware de autorização (role: admin)
- [ ] Adicionar rate limiting para uploads
- [ ] Criar testes unitários para cada endpoint
- [ ] Criar testes de integração
- [ ] Documentar no Swagger/OpenAPI

---

**Última atualização:** 2025-10-30
**Versão da API:** 1.0
**Autor:** Gabriel Fachini
