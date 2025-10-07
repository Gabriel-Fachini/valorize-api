# 🎁 API de Prêmios - Referência Rápida

## 📌 Endpoints Principais

### Catálogo (Usuários)
```
GET  /prizes/catalog              → Listar prêmios disponíveis
GET  /prizes/catalog/:id          → Detalhes do prêmio
GET  /prizes/categories           → Categorias disponíveis
```

### Resgates (Usuários)
```
POST /redemptions/redeem          → Resgatar prêmio
GET  /redemptions/my-redemptions  → Histórico de resgates
GET  /redemptions/my-redemptions/:id → Detalhes do resgate
POST /redemptions/my-redemptions/:id/cancel → Cancelar resgate
```

### Admin
```
POST /prizes                      → Criar prêmio
POST /prizes/:id/variants         → Adicionar variante
```

## ⚡ Exemplos Rápidos

### Resgatar Prêmio
```json
POST /redemptions/redeem
{
  "prizeId": "ckx123...",
  "deliveryInfo": {
    "address": "Rua Exemplo, 123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "phone": "+5511999999999"
  }
}
```

### Cancelar Resgate (até 3 dias)
```json
POST /redemptions/my-redemptions/:id/cancel
{
  "reason": "Mudei de ideia"
}
```

### Criar Prêmio (Admin)
```json
POST /prizes
{
  "name": "iPhone 15 Pro",
  "description": "Smartphone Apple iPhone 15 Pro 256GB",
  "category": "Electronics",
  "images": ["https://example.com/iphone.jpg"],
  "coinPrice": 5000,
  "stock": 10,
  "isGlobal": false
}
```

## 🔒 Regras Importantes

### Resgate
- ✅ Usa apenas `redeemableBalance` (moedas de elogios)
- ✅ Proteção race condition (transação atômica)
- ✅ Estoque decrementado automaticamente

### Cancelamento
- ⏰ Prazo: **3 dias**
- 📦 Status: Não pode estar "shipped" ou "delivered"
- 💰 Moedas e estoque devolvidos automaticamente

### Variantes
- 🎨 Não afetam o preço
- 📊 Têm estoque independente
- 🔄 Opcional por prêmio

## 🎯 Status de Resgate

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando processamento |
| `processing` | Em processamento |
| `shipped` | Enviado (com código de rastreio) |
| `delivered` | Entregue |
| `cancelled` | Cancelado |

## 📱 Postman Collection

Todos os endpoints estão disponíveis na coleção **"Valorize API"** → Pasta **"Prizes"**.

Configure `{{auth_token}}` após fazer login para testar.

---

**Documentação completa:** [prizes-api.md](./prizes-api.md)

