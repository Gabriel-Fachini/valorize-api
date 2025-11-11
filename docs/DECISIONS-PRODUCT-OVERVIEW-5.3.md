# 🎯 Decisões para Product Overview 5.3
**Data:** 11 de novembro de 2025
**Contexto:** Consolidação de decisões críticas para MVP finalizado

---

## BLOCO 1: Estratégia de Pagamentos & Custódia

### ✅ Decisão Final
**Abordagem:** PIX Manual Direto (conforme `decisao-pagamentos-valorize.md`)

### Detalhes de Implementação

| Aspecto | Decisão |
|---------|---------|
| **Fluxo** | Cliente faz PIX manual → Saldo registrado na CompanyWallet (espelho) → Gestão 100% manual |
| **Automation** | Nenhuma (não usar Asaas neste momento) |
| **Custo** | Zero (PIX entre PJs é gratuito) |
| **Timing** | MVP não precisa de integração fintech |
| **Futuro** | Asaas será avaliado quando volume > 10 clientes |

### Roadmap de Pagamentos
```
MVP (Atual - 3-10 clientes):
├─ Recebimento: PIX manual
├─ Gestão: Operador verifica pagamento (10min)
└─ Liberação: Manual no sistema (SLA 2h)

Próxima Fase (10-20 clientes):
├─ API de notificação de PIX (Nubank/Inter)
├─ Liberação semi-automática
└─ Reduz para ~5min por transação

Fase Future (50+ clientes):
├─ Integração Asaas completa
├─ Escrow aceitável (7-14 dias)
└─ Automação 100%
```

### ⚠️ IMPORTANTE: Remoção de Overdraft Limit

**Decisão:** Remover `overdraftLimit` da `CompanyWallet` (ALTO RISCO)

**Motivo:** Risco de inadimplência / perda de receita

**Impacto no Código:**
- Remove campo `overdraftLimit` do schema Prisma
- Remove validação `if (newBalance < effectiveLimit)` no `debitBalance`
- Bloqueia resgate SEMPRE quando `balance < prizeValue` (sem tolerância)
- Interface: Mostra "Saldo insuficiente - adicione créditos" ao usuário

**Migração:**
```sql
-- Remove overdraft_limit da tabela company_wallets
ALTER TABLE company_wallets DROP COLUMN overdraft_limit;
```

**Novo fluxo de bloqueio:**
```typescript
// ANTES (com overdraft)
const effectiveLimit = -overdraftLimit
if (newBalance < effectiveLimit) throw error // Permitia -20% de saldo

// DEPOIS (sem overdraft)
if (balance < prizeValue) throw error // Bloqueia quando não há saldo
```

---

## BLOCO 2: Sistema de Gamificação (Expandido)

### ✅ Decisão Final
**Objetivo:** Aumentar engajamento através de reconhecimento progressivo

### Estrutura: 3 Tiers de Badges

#### **TIER 1: Badges de Milestone** (Marcos de Volume)
Desbloqueados ao atingir números redondos de atividade.

| Badge | Critério | Recompensa | Tipo |
|-------|----------|-----------|------|
| 🎯 Primeiro Elogio | 1 elogio enviado | +50 moedas | Onboarding |
| 🎯 Centésimo Elogio | 100 elogios enviados | +200 moedas | Milestone |
| 🎯 Milésimo Elogio | 1.000 elogios enviados | +500 moedas | Milestone |
| 🏆 Primeiro Resgate | 1 resgate realizado | +30 moedas | Onboarding |

**Visibilidade:** Exibir no perfil do usuário com tooltip "Atingiu este marco em [data]"

#### **TIER 2: Badges Sociais** (Reconhecimento Coletivo)
Baseados em interação com outras pessoas.

| Badge | Critério | Recompensa | Tipo |
|-------|----------|-----------|------|
| 🌟 Rede de Ouro | Receber elogios de 10+ pessoas diferentes | +100 moedas | Social |
| 💬 Voz Influente | Estar no Top 5 de elogiadores por 2+ semanas | +150 moedas | Social |
| 🤝 Conectado | Elogiar 15+ colegas diferentes | +80 moedas | Social |

**Visibilidade:** Badge é recebido uma vez e nunca expira. Recompensa é creditada imediatamente.

#### **TIER 3: Badges de Consistência** (Engajamento Contínuo)
Baseados em padrões de comportamento.

| Badge | Critério | Recompensa | Tipo |
|-------|----------|-----------|------|
| 🔥 Semana em Chamas | Enviar elogios 5 dias consecutivos | +75 moedas | Semanal |
| 📈 Mês Generoso | Usar >70% das moedas semanais durante 1 mês | +150 moedas | Mensal |
| ⏰ Resgate Inteligente | Resgatar antes de 18 meses (não deixar expirar) | +50 moedas | Comportamento |

**Visibilidade:** Badges semanais/mensais aparecem no feed como conquista. Resetam ou acumulam conforme aplicável.

---

### 🏆 Leaderboard (Top 5)

#### **Configuração**
- **Frequência:** Semanal (reset automático toda segunda-feira)
- **Métrica:** Número de elogios enviados na semana
- **Visibilidade:** Card no dashboard "Mais Generosos desta Semana"
- **Participação:** Todos (opt-out futuro, mas não no MVP)
- **Recompensa:** Apenas reconhecimento visual (sem moedas, evita gamificação excessiva)

#### **Exemplo de Exibição**
```
🏆 MAIS GENEROSOS DESTA SEMANA

1. 👑 João Silva (12 elogios)
2. 💎 Maria Santos (10 elogios)
3. ✨ Pedro Costa (9 elogios)
4. ⭐ Ana Oliveira (8 elogios)
5. 🌟 Lucas Ferreira (7 elogios)

↻ Semana próxima: 17 de novembro
```

#### **Regras**
- Uma pessoa por posição (não há empate)
- Reset automático toda segunda (14h)
- Histórico de leaderboards anteriores visível (opcional: "Semanas passadas")
- Não há penalidade por sair do top 5 (apenas visual)

---

### 🎁 Sistema de Recompensas de Badges

**Política:** Badges desbloqueados = moedas creditadas imediatamente

```typescript
// Exemplo de credito ao desbloquear badge
const badgeRewards = {
  'primeiro-elogio': 50,
  'centesimo-elogio': 200,
  'milesimo-elogio': 500,
  'rede-de-ouro': 100,
  'voz-influente': 150,
  'conectado': 80,
  'semana-em-chamas': 75,
  'mes-generoso': 150,
  'resgate-inteligente': 50,
}

// Ao desbloquear: creditamos redeemable balance
await walletService.creditRedeemableBalance(userId, badgeRewards[badgeType])
```

---

### ❌ Decisão Rejeitada
**Badges de Valor Específicos** (ex: "Embaixador da Inovação")
- **Motivo:** Complexidade técnica desnecessária no MVP
- **Racional:** Leaderboards + badges genéricos já incentivam engajamento
- **Futuro:** Pode ser considerado se analytics mostrar oportunidade

---

## BLOCO 3: Sistema de Notificações (Minimalista)

### ✅ Decisão Final
**Filosofia:** Apenas o essencial. Não incomodar o usuário.

### 📧 Emails (Reduzido para 1 tipo)

| Email | Frequência | Trigger | Importância |
|-------|-----------|---------|------------|
| **Saldo de Resgate Expirando** | 1x por moeda (30d antes) | Moeda vai expirar em 30 dias | CRÍTICA |

**Todos os outros emails são REMOVIDOS:**
- ❌ Boas-vindas
- ❌ Primeiro elogio enviado
- ❌ Recebeu elogio
- ❌ Resgate confirmado
- ❌ Carteira baixa (admin)

**Racional:** Email fatiga. In-app notifications são suficientes.

---

### 🔔 In-App Notifications (Centro Inteligente)

#### **Componente: Badge no Sino (Bell Icon)**
```
// Estado do sino
┌─────────────────┐
│     🔔          │  ← Sino cinza (sem notificações não lidas)
│     🔔4         │  ← Sino com badge vermelho "4" (4 notificações não lidas)
└─────────────────┘

Clique: Abre modal com histórico
```

#### **Notificações In-App (Aparecerão no Centro)**

| Evento | Trigger | Duração | Tipo |
|--------|---------|--------|------|
| ✅ Elogio Enviado | Usuário clica em "Enviar" | Permanente no histórico | Info |
| ✅ Elogio Recebido | Outro usuário elogia | Permanente no histórico | Alert |
| ✅ Resgate Confirmado | Resgate processado | Permanente no histórico | Success |
| ✅ Saldo Expirando (30d) | Data de expiração -30 | Permanente no histórico | Warning |
| ✅ Resgate Bloqueado | Saldo insuficiente | Permanente no histórico | Error |

**Markup:**
```typescript
interface InAppNotification {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string // "Elogio Recebido"
  message: string // "João elogiou sua comunicação clara"
  metadata?: Record<string, any> // { complimentId, senderId, value }
  isRead: boolean
  createdAt: DateTime
  actionUrl?: string // Link para contexto (ex: perfil de quem elogiou)
}
```

#### **UX do Centro de Notificações**
```
┌──────────────────────────────────────┐
│  NOTIFICAÇÕES (4 não lidas)          │ X
├──────────────────────────────────────┤
│ 🔴 3h atrás                          │
│ ⭐ João elogiou sua comunicação     │
│   Clique para ver                    │
├──────────────────────────────────────┤
│ 🟢 1d atrás                          │
│ ✅ Resgate confirmado: R$ 50        │
│   Amazon Gift Card                   │
├──────────────────────────────────────┤
│ 🟡 7d atrás                          │
│ ⚠️ Saldo expirando em 23 dias       │
│   R$ 150 - 18 dez                   │
├──────────────────────────────────────┤
│ [ Marcar tudo como lido ]            │
│ [ Limpar histórico ]                 │
└──────────────────────────────────────┘
```

---

### 📬 Infraestrutura Mínima

| Componente | Decisão | Status |
|-----------|---------|--------|
| **Resend** | Setup para 1 email (expiring coins) | ⏳ TODO |
| **Email Template** | Simples + link para app | ⏳ TODO |
| **In-App Storage** | Tabela `InAppNotification` no Prisma | ⏳ TODO |
| **Badge no UI** | Contador de não lidos no sino | ⏳ TODO |
| **Histórico** | Infinito (sem limpeza automática) | ⏳ TODO |
| **Preferências** | Usuário pode silenciar tudo (futuro) | 🚫 Fora do MVP |

---

## 📋 Impacto no Código

### Mudanças Necessárias

#### **1. Schema Prisma (prisma/schema.prisma)**
```diff
model CompanyWallet {
  id             String   @id @default(cuid())
  companyId      String   @unique @map("company_id")
  balance        Decimal  @default(0) @db.Decimal(10, 2)
  totalDeposited Decimal  @default(0) @map("total_deposited") @db.Decimal(10, 2)
  totalSpent     Decimal  @default(0) @map("total_spent") @db.Decimal(10, 2)
- overdraftLimit Decimal  @default(0) @map("overdraft_limit") @db.Decimal(10, 2)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  ...
}

+ model Badge {
+   id        String   @id @default(cuid())
+   userId    String   @map("user_id")
+   badgeType String   @map("badge_type")
+   unlockedAt DateTime @default(now()) @map("unlocked_at")
+   rewardGiven Decimal  @default(0) @db.Decimal(10, 2)
+
+   user User @relation(fields: [userId], references: [id], onDelete: Cascade)
+   @@unique([userId, badgeType])
+   @@map("badges")
+ }

+ model InAppNotification {
+   id        String   @id @default(cuid())
+   userId    String   @map("user_id")
+   type      String   // 'info', 'success', 'warning', 'error'
+   title     String
+   message   String
+   metadata  Json?
+   isRead    Boolean  @default(false) @map("is_read")
+   actionUrl String?  @map("action_url")
+   createdAt DateTime @default(now()) @map("created_at")
+
+   user User @relation(fields: [userId], references: [id], onDelete: Cascade)
+   @@index([userId, isRead])
+   @@map("in_app_notifications")
+ }

+ model Leaderboard {
+   id        String   @id @default(cuid())
+   companyId String   @map("company_id")
+   weekStart DateTime @map("week_start") // Monday of the week
+   position  Int      // 1-5
+   userId    String   @map("user_id")
+   score     Int      // Number of compliments
+   createdAt DateTime @default(now()) @map("created_at")
+
+   company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
+   user User     @relation(fields: [userId], references: [id], onDelete: Cascade)
+   @@unique([companyId, weekStart, position])
+   @@index([companyId, weekStart])
+   @@map("leaderboards")
+ }
```

#### **2. CompanyWallet Model (src/features/wallets/company-wallet.model.ts)**
```typescript
// REMOVER validação com overdraft
- const effectiveLimit = -currentWallet.overdraftLimit.toNumber()
- if (newBalance < effectiveLimit) {
-   throw new InsufficientCompanyBalanceError()
- }

// ADICIONAR validação simples
+ if (balance < prizeValue) {
+   throw new InsufficientCompanyBalanceError('Saldo insuficiente para este resgate')
+ }
```

#### **3. Novos Features a Criar**
```
src/features/
├── badges/
│   ├── badge.model.ts
│   ├── badge.service.ts
│   └── badge.routes.ts (admin)
├── leaderboards/
│   ├── leaderboard.model.ts
│   ├── leaderboard.service.ts
│   └── leaderboard.routes.ts
└── notifications/
    ├── notification.model.ts
    ├── notification.service.ts
    └── notification.routes.ts
```

---

## 🚀 Roadmap de Implementação

### Fase 1: Core Fixes (Esta Semana)
- [ ] Remover `overdraftLimit` do schema + migrations
- [ ] Atualizar validações de saldo em `debitBalance`
- [ ] Testes: tentar resgate com saldo insuficiente

### Fase 2: Gamification (Próxima Semana)
- [ ] Criar models: Badge + Leaderboard
- [ ] Implementar lógica de unlock automático de badges
- [ ] Criar rota admin para visualizar badges
- [ ] Implementar cálculo semanal de leaderboard

### Fase 3: Notificações (Semana Seguinte)
- [ ] Criar model: InAppNotification
- [ ] Setup Resend API (1 email template)
- [ ] Badge no sino (UI count)
- [ ] Centro de notificações (UI history)

---

## 📊 Comparativo: Product Overview 5.2 vs 5.3

| Aspecto | v5.2 | v5.3 | Mudança |
|---------|------|------|---------|
| **Pagamentos** | Asaas (não confirmado) | PIX Manual | ✅ Clarificado |
| **Overdraft** | 120% permitido | Bloqueado | ✅ Removido risco |
| **Badges** | 3 genéricos | 9 estruturados | ✅ Expandido |
| **Leaderboard** | Mencionado | Top 5 Semanal | ✅ Definido |
| **Emails** | 6 tipos | 1 tipo | ✅ Minimalista |
| **In-App** | Badge genérico | Centro completo | ✅ Melhorado |

---

**Status:** ✅ Decisões Finalizadas - Pronto para implementação
**Próximo Passo:** Atualizar Product Overview 5.2 com estas decisões
