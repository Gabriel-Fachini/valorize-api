# Plano de Testes Automatizados - Valorize API

## Objetivo

Este documento define o plano de testes automatizados da API do Valorize com foco em produção, integridade transacional, segurança e isolamento multi-tenant.

O objetivo principal não é apenas aumentar cobertura, e sim reduzir o risco real do SaaS nos fluxos que movimentam saldo, estoque, vouchers, autenticação e permissões.

## Estado Atual

- O projeto já usa `Vitest` com `setup` global em `src/tests/setup.ts`
- Existem helpers úteis para app, banco, auth e Supabase em `src/tests/helpers`
- Hoje existem apenas `2` arquivos `.test.ts`
- O `threshold` atual no `vitest.config.ts` está em `70%`
- As pastas `src/tests/factories` e `src/tests/mocks` ainda estão praticamente vazias
- Já existe um teste de rota para autenticação, mas os fluxos monetários ainda estão sem cobertura relevante

## Diretriz Sobre Cobertura

Cobertura é importante, mas neste projeto o melhor alvo é cobertura orientada a risco.

### Recomendação

- `90%+` obrigatório nos fluxos Tier 1
- `85%+` de branches nos fluxos Tier 1
- `80% a 85%` nos fluxos Tier 2
- `70%+` nos fluxos Tier 3 e Tier 4

### Recomendação de rollout da meta global

1. Fase 1: manter gate global em `70%` enquanto a fundação dos testes é criada
2. Fase 2: subir gate global para `80%`
3. Fase 3: subir gate global para `85%`
4. Fase 4: avaliar `90%` global depois que Tier 1 e Tier 2 estiverem estabilizados

### Observação importante

Se tentarmos impor `90%` global agora, existe um risco alto de produzir testes de baixo valor só para preencher números. Para uma API núcleo de SaaS, é melhor exigir `90%` primeiro onde o dano é financeiro, reputacional ou de segurança.

## Tipos de Testes Que Devemos Adotar

### 1. Testes unitários puros

Usar para regras determinísticas sem dependência de banco ou rede.

Exemplos:
- cálculo de expiração de moedas
- validação de permission pattern
- validação de assinatura do webhook
- conversões de moeda para coins

### 2. Testes de integração de serviço com banco real

Serão a base da suíte crítica.

Usar para validar:
- transações Prisma
- rollback
- criação de registros de auditoria
- consistência entre `Wallet`, `WalletTransaction`, `Redemption`, `VoucherRedemption`, `CompanyWallet` e `CoinExpiration`

### 3. Testes de rota com `Fastify.inject`

Usar para validar:
- autenticação
- autorização
- serialização de resposta
- códigos HTTP
- integração real entre middleware, schema, route e service

### 4. Testes de contrato de integrações externas

Usar mocks por padrão e um smoke opcional separado para integrações reais.

Integrações:
- Tremendous
- Supabase Auth/Admin
- Webhooks Tremendous

### 5. Testes de concorrência e idempotência

Essenciais para este projeto por causa de:
- disputa de estoque
- múltiplos processamentos do mesmo webhook
- consumo FIFO de saldo
- batches administrativos de voucher

### 6. Testes de segurança

Usar para validar:
- autenticação JWT
- isolamento entre empresas
- RBAC
- plan guard
- rejeição de webhook sem assinatura válida

### 7. Testes de smoke e não-funcionais

Usar em CI para garantir:
- app sobe corretamente
- rotas críticas respondem
- migrations não quebram o ambiente
- endpoints críticos não degradam em cenários básicos

## Ordem de Prioridade

## 🎯 Tier 1: Testes críticos monetários

Este tier deve ser implementado primeiro. Qualquer regressão aqui impacta saldo, estoque, emissão de voucher, dinheiro da empresa ou confiança do usuário.

### 1. Resgate individual de prêmio e voucher

Arquivos centrais:
- `src/features/app/prizes/redemptions/redemption.service.ts`
- `src/features/app/prizes/redemptions/redemption.routes.ts`
- `src/features/app/wallets/wallet.model.ts`
- `src/features/app/prizes/redemptions/redemption.model.ts`

Risco:
- débito indevido de saldo
- perda de estoque
- voucher emitido sem persistência correta
- falha parcial deixando sistema inconsistente

Tipos de teste:
- integração de serviço com banco real
- teste de rota com `Fastify.inject`
- testes de concorrência
- mock de provider Tremendous

Casos mínimos:
- resgate de voucher com sucesso cria `Redemption`, `VoucherRedemption`, tracking e debita saldo
- resgate de produto físico com sucesso exige endereço válido e decrementa estoque
- prêmio inativo ou de outra empresa falha sem efeitos colaterais
- saldo insuficiente falha sem debitar carteira e sem criar redemption
- estoque insuficiente falha sem debitar carteira
- prêmio com variante exige `variantId`
- variante inexistente ou inativa falha
- falha do provider marca voucher como `FAILED`, cria tracking de falha e preserva consistência transacional esperada
- cancelamento dentro de 3 dias devolve moedas e estoque
- cancelamento fora da janela ou em status não cancelável falha
- corrida pelo último item permite apenas um sucesso

Critério de saída:
- cobertura `90%+` em `redemption.service.ts`
- todos os cenários de rollback e race condition cobertos

### 2. Voucher administrativo pago pela empresa

Arquivos centrais:
- `src/features/app/prizes/redemptions/redemption.service.ts`
- `src/features/app/wallets/company-wallet.model.ts`

Risco:
- débito incorreto do caixa da empresa
- envio de voucher sem lastro financeiro
- rollback incompleto em batch
- inconsistência entre valor em BRL e coins registradas

Tipos de teste:
- integração de serviço com banco real
- mocks do provider de voucher
- testes de lote
- testes de conversão monetária

Casos mínimos:
- `sendVoucherToUser` debita `CompanyWallet` e registra `Redemption` corretamente
- `customAmount` recalcula `coinsSpent` com base no valor real
- `bulkRedeemVouchers` valida empresa, email e limite de `1..100` usuários
- `batchReserveResourcesAdmin` debita empresa uma única vez por batch
- `processVoucherAdmin` em sucesso marca `SENT`
- `processVoucherAdmin` em falha devolve saldo para `CompanyWallet`
- empresa sem saldo suficiente falha sem criar reservas parciais
- resolução de `VoucherProduct` para `Prize` funciona corretamente

Critério de saída:
- cobertura `90%+` nos fluxos administrativos de voucher
- testes cobrindo sucesso parcial e falha parcial em lote

### 3. Engine de carteiras e trilha de auditoria

Arquivos centrais:
- `src/features/app/wallets/wallet.model.ts`
- `src/features/app/wallets/wallet.service.ts`
- `src/features/app/wallets/company-wallet.model.ts`
- `src/features/app/wallets/wallet-transaction.model.ts`
- `src/features/app/wallets/coin-expiration.model.ts`

Risco:
- saldo negativo
- FIFO incorreto
- expiração incorreta
- ausência de trilha auditável

Tipos de teste:
- integração de serviço/model com banco real
- unitários puros para funções isoladas
- testes de data com `fake timers`

Casos mínimos:
- `getOrCreateByUserId` cria wallet padrão uma única vez
- `debitComplimentBalance` registra `WalletTransaction`
- `creditRedeemableBalance` cria crédito com `remainingAmount` e `expiresAt`
- `debitRedeemableBalance` consome créditos em FIFO
- tentativa de débito maior que o saldo falha
- `expireCoins` marca créditos expirados, reduz saldo e cria `CoinExpiration`
- `expireCoins(true)` faz dry-run sem mutar banco
- `resetWeeklyBalances` respeita empresa ativa, usuário ativo e `weeklyRenewalAmount`
- reset gera transações `RESET` quando houver alteração real

Critério de saída:
- cobertura `90%+` em `wallet.model.ts` e `wallet.service.ts`
- cobertura de branches para FIFO e expiração

### 4. Webhook Tremendous e idempotência

Arquivos centrais:
- `src/features/app/prizes/redemptions/tremendous-webhook.routes.ts`
- `src/features/app/prizes/redemptions/tremendous-webhook.service.ts`
- `src/features/app/prizes/redemptions/tremendous-webhook.validator.ts`

Risco:
- processar webhook duplicado
- aceitar webhook falso
- não devolver saldo em falha de entrega
- status do voucher divergente do status principal

Tipos de teste:
- unitários para assinatura HMAC
- testes de rota com corpo bruto
- integração de serviço com banco real
- testes de idempotência

Casos mínimos:
- assinatura válida aceita webhook
- assinatura ausente ou inválida retorna `401`
- webhook já processado retorna `200` com `already_processed`
- `DELIVERY_SUCCEEDED` atualiza `Redemption` e `VoucherRedemption`
- `DELIVERY_FAILED` atualiza status e devolve moedas
- evento desconhecido é logado sem quebrar endpoint
- processamento em background responde `200` imediatamente

Critério de saída:
- cobertura `90%+` no validator e service
- casos de duplicidade e refund cobertos

### 5. Envio de elogios com transação atômica

Arquivos centrais:
- `src/features/app/compliments/compliment.service.ts`
- `src/features/app/compliments/compliment.routes.ts`

Risco:
- débito de saldo de elogio sem crédito correspondente
- elogios entre empresas diferentes
- uso de valor inválido ou inativo
- quebra do fluxo principal do produto

Tipos de teste:
- integração de serviço com banco real
- testes de rota
- testes de rollback

Casos mínimos:
- envio com sucesso debita `complimentBalance`, credita `redeemableBalance` e cria `Compliment`
- usuário não pode elogiar a si mesmo
- usuários de empresas diferentes falham
- `companyValue` inativo falha
- saldo insuficiente impede envio
- se qualquer etapa interna falhar, nada deve ficar persistido parcialmente

Critério de saída:
- cobertura `90%+` no fluxo de envio
- rota `/compliments/send-compliment` coberta nos cenários principais

## Tier 2: Segurança, autenticação e isolamento multi-tenant

Este tier protege o contorno da API. Mesmo quando o fluxo interno está correto, falhas aqui expõem dados de outra empresa ou permitem ações sem permissão.

### 1. Middleware de autenticação e rotas de auth

Arquivos centrais:
- `src/middleware/auth.ts`
- `src/features/app/auth/auth.routes.ts`
- `src/features/app/auth/auth.service.ts`

Tipos de teste:
- rota com `Fastify.inject`
- mocks de Supabase
- testes negativos de token

Casos mínimos:
- rotas públicas não exigem token
- rotas protegidas rejeitam ausência de `Authorization`
- formato diferente de `Bearer` falha
- token expirado retorna `401`
- issuer inválido falha
- `/auth/login`, `/auth/verify` retornam payload esperado

### 2. RBAC e plan guard

Arquivos centrais:
- `src/middleware/rbac.ts`
- `src/middleware/plan-guard.ts`
- `src/features/app/rbac/rbac.service.ts`

Tipos de teste:
- unitários
- integração com banco
- rota protegida com `Fastify.inject`

Casos mínimos:
- criação de role valida pattern de permissão
- agregação de permissões via múltiplos papéis funciona
- `requirePermission` bloqueia usuário sem permissão
- usuário de uma empresa não herda permissão de outra
- cache de plano pode ser limpo corretamente
- `requireFeature` e `requirePlan` respeitam plano ativo

### 3. Isolamento multi-tenant

Fluxos a cobrir:
- usuário só acessa endereço próprio
- usuário só vê resgates próprios
- empresa não acessa prêmios exclusivos de outra empresa
- listas e históricos retornam somente dados da empresa do usuário

Tipos de teste:
- integração de serviço
- rota com dois usuários autenticados de empresas diferentes

## Tier 3: Operação essencial de administração

Este tier cobre fluxos importantes para operação diária, onboarding e manutenção do SaaS.

### 1. Onboarding e envio de convites

Arquivos centrais:
- `src/features/admin/users/user-onboarding.service.ts`

Tipos de teste:
- unitários com mock de Supabase Admin
- integração leve com banco

Casos mínimos:
- envio de convite com sucesso atualiza `authUserId` e contadores
- reenvio respeita limite de `3`
- erro de rate limit é traduzido corretamente
- falha do Supabase não incrementa contadores
- bulk acumula sucesso e falha por usuário

### 2. Gestão administrativa de usuários e importação

Arquivos prioritários:
- `src/features/admin/users/users.service.ts`
- `src/features/admin/users/csv-import.service.ts`

Casos mínimos:
- validação de email
- prevenção de duplicidade
- importação parcial com relatório de erros
- preservação de `companyId`

### 3. Catálogo, endereços e configurações

Arquivos prioritários:
- `src/features/app/addresses/*`
- `src/features/app/prizes/*`
- `src/features/app/company-settings/*`

Casos mínimos:
- endereço default e ownership
- leitura de catálogo respeitando `isActive`, `stock` e escopo da empresa
- valores da empresa ativos e ordenação
- configurações de renovação por empresa

## Tier 4: Dashboards, relatórios e leitura de negócio

Este tier tem menor risco transacional, mas é importante para confiança do cliente piloto e para decisões de RH/gestão.

Arquivos prioritários:
- `src/features/app/dashboard/*`
- `src/features/admin/compliments-dashboard/*`
- `src/features/admin/redemptions/*`
- `src/features/admin/company-coin-economy/*`
- `src/features/backoffice/financial/*`
- `src/features/backoffice/audit-logs/*`

Tipos de teste:
- integração com banco seeded
- testes de paginação, filtros e agregações

Casos mínimos:
- métricas retornam números coerentes com seed controlado
- filtros por período e status funcionam
- paginação e ordenação não perdem registros
- exportações retornam estrutura esperada

## Tier 5: Smoke, contrato real opcional e performance

### 1. Smoke de aplicação

Casos mínimos:
- app sobe com config de teste
- `/health` responde
- rotas principais registram sem erro

### 2. Contrato real opcional

Executar separado do pipeline principal.

Casos mínimos:
- smoke manual ou agendado contra Tremendous sandbox quando existir
- smoke opcional de Supabase Admin/Auth em ambiente de teste controlado

### 3. Performance básica

Prioridade baixa, mas necessária antes do piloto crescer.

Rotas a exercitar:
- `POST /auth/login`
- `POST /compliments/send-compliment`
- `POST /redemptions/redeem`
- `POST /webhooks/tremendous`

Objetivo:
- detectar regressões grosseiras de latência
- validar que locks e transações não degradam sob concorrência moderada

## Estrutura Recomendada da Suíte

### Pastas

```text
src/tests/
├── setup.ts
├── helpers/
├── factories/
│   ├── company.factory.ts
│   ├── user.factory.ts
│   ├── wallet.factory.ts
│   ├── prize.factory.ts
│   ├── address.factory.ts
│   ├── role.factory.ts
│   └── company-value.factory.ts
└── mocks/
    ├── tremendous.mock.ts
    └── supabase.mock.ts
```

### Arquivos de teste prioritários

```text
src/features/app/prizes/redemptions/redemption.service.test.ts
src/features/app/prizes/redemptions/redemption.routes.test.ts
src/features/app/prizes/redemptions/tremendous-webhook.service.test.ts
src/features/app/prizes/redemptions/tremendous-webhook.routes.test.ts
src/features/app/prizes/redemptions/tremendous-webhook.validator.test.ts
src/features/app/wallets/wallet.model.test.ts
src/features/app/wallets/wallet.service.test.ts
src/features/app/wallets/company-wallet.model.test.ts
src/features/app/compliments/compliment.service.test.ts
src/features/app/compliments/compliment.routes.test.ts
src/middleware/auth.test.ts
src/middleware/rbac.test.ts
src/middleware/plan-guard.test.ts
src/features/admin/users/user-onboarding.service.test.ts
```

## Sequência Recomendada de Implementação

### Fase 1. Fundação da suíte

Entregáveis:
- factories de `Company`, `User`, `Wallet`, `Prize`, `Address`, `Role` e `CompanyValue`
- mocks reutilizáveis de Tremendous e Supabase
- helpers para congelar tempo e gerar cenários multi-tenant
- revisão do `setup` para falhar cedo quando o banco de teste estiver incorreto

### Fase 2. Tier 1 completo

Entregáveis:
- cobertura pesada em resgates, carteiras, webhook e elogios
- primeiros testes de concorrência
- cobertura por pasta acima das metas do Tier 1

### Fase 3. Tier 2 completo

Entregáveis:
- auth, RBAC, plan guard e isolamento multi-tenant cobertos
- testes de rota protegida com diferentes perfis de usuário

### Fase 4. Tier 3 e Tier 4

Entregáveis:
- onboarding, importações, dashboards e relatórios cobertos
- aumento gradual do gate global

### Fase 5. Smoke, contrato real opcional e performance

Entregáveis:
- smoke suite para CI
- performance básica em endpoints sensíveis
- contrato real separado do pipeline principal

## Critérios de Qualidade da Suíte

- cada teste deve validar comportamento observável, não detalhe interno irrelevante
- fluxos monetários devem sempre validar estado final em múltiplas tabelas
- testes críticos devem verificar ausência de efeito colateral em caso de falha
- sempre que houver transação, testar caminho feliz e caminho de rollback
- sempre que houver integração externa, testar sucesso, timeout, erro e duplicidade
- toda regra multi-tenant deve ter cenário positivo e cenário cross-company

## Resumo Executivo de Prioridade

Se tivermos que escolher a ordem exata de implementação, a sequência recomendada é:

1. `redemption.service` e `wallet.model`
2. `company-wallet.model` e vouchers administrativos
3. webhook Tremendous
4. `compliment.service`
5. `auth`, `rbac` e `plan-guard`
6. onboarding de usuários
7. catálogo, endereços e configurações
8. dashboards, relatórios e backoffice

Essa ordem protege primeiro o caixa, depois a consistência da moeda interna, depois a segurança de acesso e por fim as camadas analíticas e operacionais.
