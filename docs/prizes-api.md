# 🎁 API de Prêmios e Resgates - Documentação

## Visão Geral

O sistema de prêmios permite que usuários resgatem produtos usando moedas reembolsáveis (`redeemableBalance`) acumuladas através de elogios recebidos na plataforma Valorize.

## 🔑 Autenticação

Todos os endpoints requerem autenticação Bearer Token:
```
Authorization: Bearer {{auth_token}}
```

## 📚 Endpoints

### 1️⃣ Catálogo de Prêmios

#### `GET /prizes/catalog`
Lista todos os prêmios disponíveis para o usuário autenticado.

**Query Parameters (opcionais):**
```javascript
{
  "category": "Electronics",    // Filtrar por categoria
  "minPrice": 100,              // Preço mínimo em moedas
  "maxPrice": 5000              // Preço máximo em moedas
}
```

**Resposta de Sucesso (200):**
```json
{
  "prizes": [
    {
      "id": "ckx...",
      "name": "iPhone 15 Pro",
      "description": "Smartphone Apple iPhone 15 Pro 256GB",
      "category": "Electronics",
      "images": ["https://..."],
      "coinPrice": 5000,
      "brand": "Apple",
      "stock": 10,
      "isActive": true,
      "variants": [
        {
          "id": "ckx...",
          "name": "Color",
          "value": "Black",
          "stock": 5
        }
      ]
    }
  ]
}
```

**Lógica de Negócio:**
- Retorna apenas prêmios **ativos** (`isActive: true`)
- Retorna apenas prêmios **com estoque** (`stock > 0`)
- Inclui prêmios **globais** (`companyId: null`) + prêmios **da empresa do usuário**

---

#### `GET /prizes/catalog/:prizeId`
Obtém detalhes completos de um prêmio específico.

**Path Parameters:**
- `prizeId` - ID do prêmio

**Resposta de Sucesso (200):**
```json
{
  "prize": {
    "id": "ckx...",
    "name": "iPhone 15 Pro",
    "description": "Smartphone Apple iPhone 15 Pro 256GB",
    "category": "Electronics",
    "images": ["https://..."],
    "coinPrice": 5000,
    "brand": "Apple",
    "specifications": {
      "storage": "256GB",
      "color": "Titanium Blue"
    },
    "stock": 10,
    "variants": [...]
  }
}
```

**Erros:**
- `404` - Prêmio não encontrado ou não disponível para sua empresa

---

#### `GET /prizes/categories`
Lista todas as categorias disponíveis (usando SQL DISTINCT).

**Resposta de Sucesso (200):**
```json
{
  "categories": [
    "Electronics",
    "Books",
    "Gift Cards",
    "Sports & Outdoors"
  ]
}
```

---

### 2️⃣ Administração de Prêmios (Requer permissões de Admin)

#### `POST /prizes`
Cria um novo prêmio no sistema.

**Request Body:**
```json
{
  "name": "iPhone 15 Pro",
  "description": "Smartphone Apple iPhone 15 Pro 256GB com tecnologia A17 Pro",
  "category": "Electronics",
  "images": [
    "https://example.com/iphone15pro-front.jpg",
    "https://example.com/iphone15pro-back.jpg"
  ],
  "coinPrice": 5000,
  "brand": "Apple",
  "specifications": {
    "storage": "256GB",
    "color": "Titanium Blue",
    "weight": "221g"
  },
  "stock": 10,
  "isGlobal": false
}
```

**Campos:**
- `name` *(string, obrigatório)* - Nome do prêmio (3-200 caracteres)
- `description` *(string, obrigatório)* - Descrição detalhada (10-2000 caracteres)
- `category` *(string, obrigatório)* - Categoria (2-100 caracteres)
- `images` *(array, obrigatório)* - URLs das imagens (1-10 items)
- `coinPrice` *(integer, obrigatório)* - Preço em moedas (mínimo 1)
- `brand` *(string, opcional)* - Marca do produto
- `specifications` *(object, opcional)* - Especificações técnicas (JSON livre)
- `stock` *(integer, obrigatório)* - Quantidade em estoque
- `isGlobal` *(boolean, opcional)* - Se `true`, disponível para todas empresas

**Resposta de Sucesso (201):**
```json
{
  "message": "Prize created successfully",
  "prize": {
    "id": "ckx...",
    "name": "iPhone 15 Pro",
    ...
  }
}
```

---

#### `POST /prizes/:prizeId/variants`
Adiciona uma variante a um prêmio existente (ex: cor, voltagem, tamanho).

**Path Parameters:**
- `prizeId` - ID do prêmio

**Request Body:**
```json
{
  "name": "Color",
  "value": "Black",
  "stock": 5
}
```

**Campos:**
- `name` *(string, obrigatório)* - Nome da variante (ex: "Color", "Voltage", "Size")
- `value` *(string, obrigatório)* - Valor da variante (ex: "Black", "110V", "Large")
- `stock` *(integer, obrigatório)* - Estoque específico desta variante

**⚠️ Importante:** Variantes NÃO afetam o preço. Todas variantes compartilham o mesmo `coinPrice` do prêmio pai.

**Resposta de Sucesso (201):**
```json
{
  "message": "Prize variant added successfully",
  "variant": {
    "id": "ckx...",
    "prizeId": "ckx...",
    "name": "Color",
    "value": "Black",
    "stock": 5
  }
}
```

---

### 3️⃣ Resgates

#### `POST /redemptions/redeem`
Resgata um prêmio usando moedas reembolsáveis.

**Request Body:**
```json
{
  "prizeId": "ckx123...",
  "variantId": "ckx456...",  // Opcional, apenas se prêmio tiver variantes
  "deliveryInfo": {
    "address": "Rua Exemplo, 123, Apto 45",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "phone": "+5511999999999",
    "additionalInfo": "Portão azul, interfone apto 45"  // Opcional
  }
}
```

**Campos:**
- `prizeId` *(string, obrigatório)* - ID do prêmio a resgatar
- `variantId` *(string, opcional)* - ID da variante escolhida (se houver)
- `deliveryInfo` *(object, obrigatório)* - Informações de entrega
  - `address` *(string, 5-500 caracteres)*
  - `city` *(string, 2-100 caracteres)*
  - `state` *(string, 2-100 caracteres)*
  - `zipCode` *(string, 5-20 caracteres)*
  - `phone` *(string, 8-20 caracteres)*
  - `additionalInfo` *(string, opcional, max 500 caracteres)*

**Resposta de Sucesso (201):**
```json
{
  "message": "Prize redeemed successfully",
  "redemption": {
    "id": "ckx...",
    "userId": "ckx...",
    "prizeId": "ckx...",
    "variantId": "ckx...",
    "coinsSpent": 5000,
    "status": "pending",
    "deliveryInfo": {...},
    "redeemedAt": "2025-10-03T20:30:00.000Z"
  }
}
```

**Erros:**
- `400` - Saldo insuficiente
- `409` - Estoque insuficiente (race condition handled)
- `404` - Prêmio ou variante não encontrado

**🔒 Proteção Race Condition:**
O sistema usa transações atômicas do PostgreSQL com `updateMany` e condição `stock >= 1`. Se dois usuários tentarem resgatar simultaneamente o último item:
1. Primeiro que completar → Sucesso
2. Segundo → Erro `409 Insufficient stock`

**Processo Automático:**
1. ✅ Valida saldo do usuário
2. ✅ Decrementa estoque (atomic)
3. ✅ Debita moedas do wallet
4. ✅ Cria registro de resgate
5. ✅ Cria tracking inicial ("pending")
6. ✅ Cria transação de auditoria no wallet

---

#### `GET /redemptions/my-redemptions`
Lista todos os resgates do usuário autenticado.

**Query Parameters (opcionais):**
```javascript
{
  "limit": 20,    // Padrão: 20, máximo: 100
  "offset": 0     // Padrão: 0
}
```

**Resposta de Sucesso (200):**
```json
{
  "redemptions": [
    {
      "id": "ckx...",
      "prize": {
        "id": "ckx...",
        "name": "iPhone 15 Pro",
        "images": ["https://..."]
      },
      "variant": {
        "name": "Color",
        "value": "Black"
      },
      "coinsSpent": 5000,
      "status": "pending",
      "redeemedAt": "2025-10-03T20:30:00.000Z"
    }
  ],
  "meta": {
    "limit": 20,
    "offset": 0,
    "count": 1
  }
}
```

---

#### `GET /redemptions/my-redemptions/:redemptionId`
Obtém detalhes completos de um resgate específico, incluindo histórico de tracking.

**Path Parameters:**
- `redemptionId` - ID do resgate

**Resposta de Sucesso (200):**
```json
{
  "redemption": {
    "id": "ckx...",
    "prize": {
      "id": "ckx...",
      "name": "iPhone 15 Pro",
      "images": ["https://..."],
      "brand": "Apple"
    },
    "variant": {
      "name": "Color",
      "value": "Black"
    },
    "coinsSpent": 5000,
    "status": "processing",
    "deliveryInfo": {
      "address": "Rua Exemplo, 123",
      "city": "São Paulo",
      ...
    },
    "trackingCode": null,
    "redeemedAt": "2025-10-03T20:30:00.000Z",
    "tracking": [
      {
        "id": "ckx...",
        "status": "pending",
        "notes": "Pedido recebido",
        "createdAt": "2025-10-03T20:30:00.000Z"
      },
      {
        "id": "ckx...",
        "status": "processing",
        "notes": "Em processamento",
        "createdBy": "admin123",
        "createdAt": "2025-10-04T10:00:00.000Z"
      }
    ]
  }
}
```

**Status Possíveis:**
- `pending` - Aguardando processamento
- `processing` - Em processamento
- `shipped` - Enviado (com tracking code)
- `delivered` - Entregue
- `cancelled` - Cancelado

---

#### `POST /redemptions/my-redemptions/:redemptionId/cancel`
Cancela um resgate existente.

**Path Parameters:**
- `redemptionId` - ID do resgate

**Request Body:**
```json
{
  "reason": "Mudei de ideia, prefiro outro prêmio"
}
```

**Campos:**
- `reason` *(string, obrigatório)* - Motivo do cancelamento (5-500 caracteres)

**Resposta de Sucesso (200):**
```json
{
  "message": "Redemption cancelled successfully",
  "redemption": {
    "id": "ckx...",
    "status": "cancelled",
    ...
  }
}
```

**📋 Regras de Cancelamento:**
1. ✅ **Prazo:** Apenas dentro de **3 dias** do resgate
2. ✅ **Status:** Apenas se NÃO estiver "shipped" ou "delivered"
3. ✅ **Estoque:** Devolvido automaticamente (prêmio ou variante)
4. ✅ **Moedas:** Devolvidas ao `redeemableBalance` do usuário
5. ✅ **Auditoria:** Transação de crédito registrada no wallet
6. ✅ **Tracking:** Registro de cancelamento criado

**Erros:**
- `400` - Prazo de 3 dias expirado
- `400` - Pedido já foi enviado/entregue
- `404` - Resgate não encontrado

**Processo Automático:**
1. ✅ Valida prazo (≤ 3 dias)
2. ✅ Valida status (não enviado)
3. ✅ Atualiza status para "cancelled"
4. ✅ Retorna estoque (atomic)
5. ✅ Retorna moedas ao usuário
6. ✅ Cria tracking de cancelamento
7. ✅ Cria transação de auditoria

---

## 🎯 Exemplos de Uso Completo

### Cenário 1: Resgate Simples

```bash
# 1. Ver prêmios disponíveis
GET /prizes/catalog

# 2. Ver detalhes de um prêmio
GET /prizes/catalog/ckx123...

# 3. Resgatar
POST /redemptions/redeem
{
  "prizeId": "ckx123...",
  "deliveryInfo": { ... }
}

# 4. Verificar meu resgate
GET /redemptions/my-redemptions
```

### Cenário 2: Resgate com Variante

```bash
# 1. Ver prêmio com variantes
GET /prizes/catalog/ckx123...
# Resposta: prize.variants = [{ id: "var1", name: "Color", value: "Black" }, ...]

# 2. Resgatar escolhendo variante
POST /redemptions/redeem
{
  "prizeId": "ckx123...",
  "variantId": "var1",  # Escolhendo variante Black
  "deliveryInfo": { ... }
}
```

### Cenário 3: Cancelamento

```bash
# 1. Resgatar prêmio
POST /redemptions/redeem

# 2. Mudar de ideia (dentro de 3 dias)
POST /redemptions/my-redemptions/ckx456.../cancel
{
  "reason": "Prefiro economizar para outro prêmio"
}
# ✅ Estoque e moedas devolvidos automaticamente
```

### Cenário 4: Admin Criando Prêmio

```bash
# 1. Criar prêmio base
POST /prizes
{
  "name": "Cadeira Gamer",
  "category": "Furniture",
  "coinPrice": 2000,
  "stock": 5,
  ...
}
# Resposta: { prize: { id: "ckx789..." } }

# 2. Adicionar variantes de cor
POST /prizes/ckx789.../variants
{ "name": "Color", "value": "Black", "stock": 2 }

POST /prizes/ckx789.../variants
{ "name": "Color", "value": "Red", "stock": 3 }

# 3. Usuários agora veem:
GET /prizes/catalog
# Resposta: Cadeira Gamer com 2 variantes de cor
```

---

## 🔐 Segurança

### Race Condition Protection
```typescript
// Atomicidade garantida via PostgreSQL
const stockUpdate = await tx.prize.updateMany({
  where: {
    id: prizeId,
    stock: { gte: 1 },  // ✅ Só atualiza se tiver estoque
    isActive: true
  },
  data: {
    stock: { decrement: 1 }
  }
})

if (stockUpdate.count === 0) {
  throw new InsufficientStockError()  // ❌ Outro usuário pegou antes
}
```

### Auditoria Completa
Toda operação de moedas é registrada em `WalletTransaction`:
- Tipo: `DEBIT` ou `CREDIT`
- Balance Type: `REDEEMABLE`
- Reason: "Prize redemption" ou "Prize redemption cancelled"
- Metadata: `{ prizeId, redemptionId }`

---

## 📊 Estrutura do Banco de Dados

```sql
-- Prêmios
Prize {
  id, companyId, name, description, category,
  images[], coinPrice, brand, specifications{},
  stock, isActive, createdAt, updatedAt
}

-- Variantes (opcional)
PrizeVariant {
  id, prizeId, name, value, stock, isActive
}

-- Resgates
Redemption {
  id, userId, prizeId, variantId, companyId,
  coinsSpent, status, deliveryInfo{}, trackingCode,
  redeemedAt
}

-- Tracking de Status
RedemptionTracking {
  id, redemptionId, status, notes,
  createdBy, createdAt
}
```

---

## 🚀 Getting Started

1. **Configure ambiente:**
   ```bash
   cp .env.example .env
   # Configure DATABASE_URL e outras variáveis
   ```

2. **Rode migrations:**
   ```bash
   npx prisma migrate dev
   ```

3. **Inicie servidor:**
   ```bash
   npm run dev
   # Servidor rodando em http://localhost:3000
   ```

4. **Acesse Swagger:**
   ```
   http://localhost:3000/docs
   ```

5. **Teste no Postman:**
   - Importe coleção "Valorize API"
   - Configure `{{auth_token}}` após login
   - Pronto para testar!

---

## 📞 Suporte

Para dúvidas ou problemas, contate o time de desenvolvimento.

**Última atualização:** Outubro 2025

