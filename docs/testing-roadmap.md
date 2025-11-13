# Testing Roadmap - Valorize API

**Status**: Setup Fase 1 ✅
**Última Atualização**: Novembro 2025
**Objetivo**: Implementar testes aos poucos com infraestrutura pronta

---

## 📊 Visão Geral

Este documento serve como **checklist master** para implementação de testes na API Valorize. A infraestrutura está configurada para permitir implementação **gradual e incremental** de testes, priorizando fluxos críticos de negócio.

### Priorização por Tier

- **Tier 1 (CRÍTICO)**: Fluxos monetários, transações atômicas, integrações externas
- **Tier 2 (IMPORTANTE)**: Lógica de negócio, validações, permissões
- **Tier 3 (ÚTIL)**: Utilitários, helpers, edge cases

---

## 🎯 Infraestrutura de Testes (Setup)

**Status**: ⏳ Em Progresso

- [ ] `vitest.config.ts` - Configuração do framework
- [ ] `.env.test` - Variáveis de ambiente de teste
- [ ] `src/tests/setup.ts` - Setup global
- [ ] `src/tests/helpers/database.helper.ts` - DB helpers
- [ ] `src/tests/helpers/auth.helper.ts` - Auth helpers
- [ ] `src/tests/factories/` - Data factories (estrutura vazia)
- [ ] `src/tests/mocks/` - Mocks de APIs (estrutura vazia)
- [ ] `src/tests/README.md` - Documentação de testes
- [ ] `src/tests/setup.test.ts` - Teste dummy (validação)

### Comandos Disponíveis Após Setup

```bash
npm test                      # Rodar todos os testes
npm run test:coverage         # Coverage report
npm test -- --watch          # Watch mode
npm test -- wallet           # Testes específicos
npm test -- --ui             # UI interativa
```

---

## 🏆 Tier 1: Testes Críticos (Monetários)

### 1. **Redemption Service** ⭐⭐⭐
**Arquivo**: `src/features/prizes/redemptions/__tests__/redemption.service.test.ts`
**Prioridade**: MÁXIMA
**Complexidade**: Alta
**Estimativa**: 5-7 horas

**Status**: ☐ Não iniciado

#### Casos de Teste: redeemPrize()

- [ ] ✅ Redimir voucher com sucesso (saldo OK, estoque OK)
- [ ] ❌ Falha: saldo insuficiente → InsufficientBalanceError
- [ ] ❌ Falha: estoque insuficiente → InsufficientStockError
- [ ] ✅ Debita corretamente a carteira do usuário
- [ ] ✅ Debita corretamente a carteira da empresa (R$ 0.06/moeda)
- [ ] ✅ Chama Tremendous API com parâmetros corretos
- [ ] ✅ Cria registro com status PROCESSING
- [ ] ✅ Atualiza para SENT após sucesso Tremendous
- [ ] ✅ Atualiza para FAILED se Tremendous falhar
- [ ] ✅ Suporta variantes de prêmio

**Exemplo de Teste**:
```typescript
describe('RedemptionService', () => {
  describe('redeemPrize()', () => {
    it('should redeem prize successfully with sufficient balance', async () => {
      await withTransaction(async () => {
        // Arrange
        const user = await UserFactory.create()
        const wallet = await WalletFactory.create({
          userId: user.id,
          redeemableBalance: 1000
        })
        const prize = await PrizeFactory.create({ cost: 500 })
        mockTremendousSuccess()

        // Act
        const redemption = await redemptionService.redeemPrize({
          userId: user.id,
          prizeId: prize.id,
        })

        // Assert
        expect(redemption.status).toBe('SENT')
        expect(wallet.redeemableBalance).toBe(500)
        expect(mockTremendous).toHaveBeenCalled()
      })
    })

    it('should throw InsufficientBalanceError when balance is low', async () => {
      await withTransaction(async () => {
        // Arrange
        const user = await UserFactory.create()
        const wallet = await WalletFactory.create({
          userId: user.id,
          redeemableBalance: 100 // Insuficiente
        })
        const prize = await PrizeFactory.create({ cost: 500 })

        // Act & Assert
        await expect(
          redemptionService.redeemPrize({
            userId: user.id,
            prizeId: prize.id,
          })
        ).rejects.toThrow(InsufficientBalanceError)
      })
    })
  })
})
```

#### Casos de Teste: cancelRedemption()

- [ ] ✅ Cancelar dentro de 3 dias
- [ ] ❌ Falha após 3 dias → CancellationPeriodExpiredError
- [ ] ❌ Falha se enviado → CannotCancelShippedOrderError
- [ ] ✅ Reembolsa moedas ao usuário
- [ ] ✅ Restaura estoque do prêmio

#### Casos de Teste: bulkRedeemVouchers()

- [ ] ✅ Processar múltiplos resgates em batch
- [ ] ✅ Continuar se algum falhar (partial success)
- [ ] ✅ Retornar status de cada item processado

#### Casos de Teste: Webhook Handling

- [ ] ✅ Processar webhook de sucesso Tremendous
- [ ] ✅ Atualizar status para SENT
- [ ] ✅ Registrar log de webhook com valuation
- [ ] ❌ Rejeitar webhooks com signature inválida

---

### 2. **Wallet Service** ⭐⭐⭐
**Arquivo**: `src/features/wallets/__tests__/wallet.service.test.ts`
**Prioridade**: MÁXIMA
**Complexidade**: Alta
**Estimativa**: 4-5 horas

**Status**: ☐ Não iniciado

#### Casos de Teste: creditRedeemableBalance()

- [ ] ✅ Creditar saldo corretamente
- [ ] ✅ Criar registro de transação (audit)
- [ ] ✅ Retornar novo saldo
- [ ] ✅ Validar companyId (multi-tenancy)

#### Casos de Teste: debitComplimentBalance()

- [ ] ✅ Debitar saldo de compliment
- [ ] ❌ Falha se saldo insuficiente
- [ ] ✅ Criar registro de transação
- [ ] ✅ Múltiplos de 5 moedas

#### Casos de Teste: resetWeeklyComplimentBalance()

- [ ] ✅ Resetar para 100 moedas (padrão)
- [ ] ✅ Respeitar limite customizado da empresa
- [ ] ✅ Funcionar em batch para vários usuários
- [ ] ✅ Só resetar se houver semana decorrida
- [ ] ✅ Registrar transação de reset

#### Casos de Teste: getBalance()

- [ ] ✅ Retornar saldos separados (compliment + redeemable)
- [ ] ✅ Incluir data de próximo reset
- [ ] ✅ Validar companyId

#### Casos de Teste: Company Wallet Debit

- [ ] ✅ Debitar valor monetário corretamente (R$ 0.06/moeda)
- [ ] ✅ Respeitar limite de overdraft (até 120%)
- [ ] ✅ Bloquear vouchers se saldo insuficiente
- [ ] ✅ Atualizar contador de moedas distribuídas

---

### 3. **Compliment Service** ⭐⭐⭐
**Arquivo**: `src/features/compliments/__tests__/compliment.service.test.ts`
**Prioridade**: MÁXIMA
**Complexidade**: Alta (atomicidade crítica)
**Estimativa**: 4-5 horas

**Status**: ☐ Não iniciado

#### Casos de Teste: sendCompliment()

- [ ] ✅ Enviar compliment com sucesso (transação atômica)
- [ ] ❌ Falha: auto-elogio → CustomError
- [ ] ❌ Falha: empresas diferentes → ValidationError
- [ ] ❌ Falha: saldo insuficiente
- [ ] ✅ Debita remetente (compliment balance)
- [ ] ✅ Credita destinatário (redeemable balance)
- [ ] ✅ Vincula a valor da empresa (obrigatório)
- [ ] ✅ Valida múltiplos de 5 (5, 10, ..., 100)
- [ ] ❌ Falha se empresa sem valores cadastrados
- [ ] ✅ Garante atomicidade (rollback se falhar)

#### Casos de Teste: Atomic Transaction

```typescript
it('should rollback ALL changes if any step fails', async () => {
  await withTransaction(async () => {
    // Arrange
    const sender = await UserFactory.create()
    const receiver = await UserFactory.create()
    const senderWallet = await WalletFactory.create({
      userId: sender.id,
      complimentBalance: 50 // Vai ficar 0 (saldo limite)
    })

    // Mock: enviar compliment, mas falhar ao creditar receiver
    mockWalletCreditFail()

    // Act & Assert
    await expect(
      complimentService.sendCompliment(sender.id, receiver.id, 100)
    ).rejects.toThrow()

    // Verificar que sender ainda tem saldo (rollback)
    const senderWalletAfter = await Wallet.findByUserId(sender.id)
    expect(senderWalletAfter.complimentBalance).toBe(50)
  })
})
```

---

## 🏅 Tier 2: Testes Importantes (Lógica de Negócio)

### 4. **Wallet Model** ⭐⭐
**Arquivo**: `src/features/wallets/__tests__/wallet.model.test.ts`
**Prioridade**: ALTA
**Complexidade**: Média
**Estimativa**: 2-3 horas

**Status**: ☐ Não iniciado

#### Casos de Teste

- [ ] ✅ Wallet.findByUserId() retorna carteira
- [ ] ✅ Wallet.findByUserId() retorna null se não existir
- [ ] ✅ Wallet.create() com saldos iniciais
- [ ] ✅ Wallet.create() vincula companyId
- [ ] ✅ Wallet.findWalletsForWeeklyReset() filtra corretamente
- [ ] ✅ Wallet.findWalletsForWeeklyReset() respeita companyId
- [ ] ✅ Wallet.update() atualiza campos
- [ ] ❌ Wallet.update() não atualiza se companyId diferente (multi-tenancy)

---

### 5. **Compliment Model** ⭐⭐
**Arquivo**: `src/features/compliments/__tests__/compliment.model.test.ts`
**Prioridade**: ALTA
**Complexidade**: Média
**Estimativa**: 2-3 horas

**Status**: ☐ Não iniciado

#### Casos de Teste

- [ ] ✅ Compliment.create() com dados válidos
- [ ] ✅ Compliment.findByCompanyId() retorna compliments
- [ ] ✅ Compliment.findByReceiverId() retorna compliments recebidos
- [ ] ✅ Compliment.findBySenderId() retorna compliments enviados
- [ ] ✅ Validar obrigatoriedade de valueId
- [ ] ✅ Validar obrigatoriedade de companyId
- [ ] ❌ Falha se tentar criar com companyId inválido

---

### 6. **Prize Model** ⭐⭐
**Arquivo**: `src/features/prizes/__tests__/prize.model.test.ts`
**Prioridade**: ALTA
**Complexidade**: Média
**Estimativa**: 2-3 horas

**Status**: ☐ Não iniciado

#### Casos de Teste

- [ ] ✅ Prize.findByCompanyId() retorna prêmios ativos
- [ ] ✅ Prize.findByCompanyId() filtra por tipo (voucher, físico)
- [ ] ✅ Prize.updateStock() decrementa corretamente
- [ ] ✅ Prize.updateStock() cria registro de transação
- [ ] ✅ PrizeVariant carregamento com prêmio
- [ ] ✅ Soft delete (isActive: false) filtra automaticamente

---

### 7. **RBAC Middleware** ⭐⭐
**Arquivo**: `src/middleware/__tests__/rbac.middleware.test.ts`
**Prioridade**: ALTA
**Complexidade**: Média
**Estimativa**: 2-3 horas

**Status**: ☐ Não iniciado

#### Casos de Teste

- [ ] ✅ Permitir request com permissão correta
- [ ] ❌ Bloquear request sem permissão
- [ ] ❌ Bloquear request com companyId diferente
- [ ] ✅ Admin bypass (permissão admin:access_panel)
- [ ] ✅ Validar granularidade (feature:objective)

---

### 8. **Auth Middleware** ⭐⭐
**Arquivo**: `src/middleware/__tests__/auth.middleware.test.ts`
**Prioridade**: ALTA
**Complexidade**: Média
**Estimativa**: 2-3 horas

**Status**: ☐ Não iniciado

#### Casos de Teste

- [ ] ✅ Permitir request com JWT válido
- [ ] ❌ Bloquear request sem Authorization header
- [ ] ❌ Bloquear request com token inválido
- [ ] ❌ Bloquear request com token expirado
- [ ] ✅ Extrair claims do token corretamente
- [ ] ✅ Permitir rotas públicas (exemptions)

---

## 📱 Tier 3: Testes Úteis (Edge Cases & Helpers)

### 9. **Route Integration Tests**

#### Compliment Routes
**Arquivo**: `src/features/compliments/__tests__/compliment.routes.test.ts`
**Estimativa**: 3-4 horas

- [ ] POST /compliments - Enviar compliment
- [ ] GET /compliments - Listar compliments
- [ ] GET /compliments/:id - Detalhe
- [ ] Validar autenticação obrigatória
- [ ] Validar RBAC em cada endpoint

#### Redemption Routes
**Arquivo**: `src/features/prizes/redemptions/__tests__/redemption.routes.test.ts`
**Estimativa**: 3-4 horas

- [ ] POST /redemptions - Resgatar prêmio
- [ ] GET /redemptions - Listar resgates
- [ ] POST /redemptions/:id/cancel - Cancelar
- [ ] POST /webhooks/tremendous - Webhook
- [ ] Validação de stock antes de processar
- [ ] Validação de saldo antes de debitar

#### Wallet Routes
**Arquivo**: `src/features/wallets/__tests__/wallet.routes.test.ts`
**Estimativa**: 2-3 horas

- [ ] GET /wallets - Saldo atual
- [ ] GET /wallets/transactions - Histórico
- [ ] POST /wallets/reset - Reset semanal (admin)

---

### 10. **Company Wallet Tests**

**Arquivo**: `src/features/company-wallets/__tests__/company-wallet.service.test.ts`
**Estimativa**: 3-4 horas

- [ ] ✅ Calcular saldo monetário corretamente (R$ 0.06/moeda)
- [ ] ✅ Respeitar limite de overdraft (até 120%)
- [ ] ✅ Bloquear vouchers se saldo baixo
- [ ] ✅ Atualizar após cada redemption

---

### 11. **Error Handling Tests**

**Arquivo**: `src/lib/__tests__/error-handler.test.ts`
**Estimativa**: 2-3 horas

- [ ] ✅ Serializar erros corretamente
- [ ] ✅ Incluir stack trace em desenvolvimento
- [ ] ✅ Remover stack trace em produção
- [ ] ✅ Validar status codes HTTP

---

## 🧪 Factories a Implementar

**Arquivo**: `src/tests/factories/`

- [ ] `user.factory.ts` - UserFactory com roles variados
- [ ] `company.factory.ts` - CompanyFactory com configurações
- [ ] `wallet.factory.ts` - WalletFactory com saldos customizáveis
- [ ] `prize.factory.ts` - PrizeFactory para vouchers e físicos
- [ ] `compliment.factory.ts` - ComplimentFactory válido
- [ ] `company-value.factory.ts` - CompanyValueFactory
- [ ] `role.factory.ts` - RoleFactory com permissions

---

## 🎭 Mocks a Implementar

**Arquivo**: `src/tests/mocks/`

- [ ] `tremendous.mock.ts` - Mock API Tremendous
  - [ ] orderVoucher() sucesso e erro
  - [ ] getProducts() listagem
  - [ ] Webhook simulation

- [ ] `auth0.mock.ts` - Mock Auth0
  - [ ] JWKS endpoint
  - [ ] Token validation bypass

- [ ] `storage.mock.ts` - Mock Supabase Storage
  - [ ] upload() simulado
  - [ ] download() simulado

---

## 📈 Cobertura de Testes

### Alvo por Feature

| Feature | Alvo | Status |
|---------|------|--------|
| Wallets | 85% | ☐ |
| Compliments | 80% | ☐ |
| Redemptions | 90% | ☐ |
| RBAC | 75% | ☐ |
| Auth | 80% | ☐ |
| Prizes | 70% | ☐ |
| Companies | 65% | ☐ |
| Users | 60% | ☐ |

### Cobertura Geral

- **Alvo**: 70% de linhas/funções/branches
- **Status**: 0% (antes de implementar testes)
- **Acompanhamento**: `npm run test:coverage`

---

## 🚀 Roadmap de Implementação

### Sprint 1 (Infraestrutura)
- [x] Setup Vitest + helpers + factories
- [ ] Teste dummy (validação)
- **Tempo**: ~1 hora

### Sprint 2 (Tier 1 - Críticos)
- [ ] Wallet Service (12 testes) - 4-5h
- [ ] Wallet Model (8 testes) - 2-3h
- [ ] Compliment Service (10 testes) - 4-5h
- **Tempo**: ~10-13 horas

### Sprint 3 (Tier 1 - Continuação)
- [ ] Redemption Service (17 testes) - 5-7h
- **Tempo**: ~5-7 horas

### Sprint 4 (Tier 2)
- [ ] Compliment Model - 2-3h
- [ ] Prize Model - 2-3h
- [ ] RBAC Middleware - 2-3h
- [ ] Auth Middleware - 2-3h
- **Tempo**: ~8-12 horas

### Sprint 5 (Routes & Integration)
- [ ] Compliment Routes - 3-4h
- [ ] Redemption Routes - 3-4h
- [ ] Wallet Routes - 2-3h
- **Tempo**: ~8-11 horas

### Sprint 6 (Tier 3 & Polishing)
- [ ] Company Wallet Tests - 3-4h
- [ ] Error Handling - 2-3h
- [ ] Coverage refinement
- **Tempo**: ~5-7 horas

---

## ⏱️ Estimativa Total

| Componente | Horas |
|-----------|-------|
| Setup + Infraestrutura | 1-2 |
| Tier 1 (Críticos) | 15-20 |
| Tier 2 (Importantes) | 8-12 |
| Tier 3 (Úteis) | 8-11 |
| Coverage refinement | 2-3 |
| **TOTAL** | **34-48 horas** |

**Recomendação**: ~1-2 horas por dia = 3-4 semanas (implementação gradual)

---

## 📝 Checklist de Qualidade

Antes de considerar testes "completos":

- [ ] Coverage > 70% em files críticos
- [ ] Todos os Tier 1 testes implementados
- [ ] 0 erros na suite de testes
- [ ] Testes rodam em < 5 segundos total
- [ ] Transaction rollback funciona (isolamento)
- [ ] Mocks funcionam corretamente (sem APIs reais)
- [ ] Documentação atualizada
- [ ] CI/CD integrado com `npm test`

---

## 🔗 Referências

- **Documentação**: `/src/tests/README.md`
- **Padrões**: Veja seção "Padrões" no README
- **Helpers**: `/src/tests/helpers/`
- **Factories**: `/src/tests/factories/`
- **Mocks**: `/src/tests/mocks/`

---

## 📞 Dúvidas Frequentes

### Como isolar testes do banco?
Use `withTransaction()` do helpers/database.helper.ts - faz rollback automático.

### Preciso mockar Tremendous em cada teste?
Não - use os mocks globais em `setup.ts` ou imports específicos quando necessário.

### Como testar webhooks?
Use `mockTremendousWebhook()` do mock para simular payload completo.

### Posso testar rotas sem subir servidor?
Sim - use `app.inject()` (Fastify testing built-in) via app.helper.ts.

---

**Status**: ⏳ Pronto para implementação gradual
**Próximo passo**: Começar com Tier 1 (Wallet tests)
