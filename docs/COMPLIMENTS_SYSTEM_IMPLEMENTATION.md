# Resumo da Implementação: Sistema de Elogios (Compliments)

Este documento detalha a implementação da funcionalidade do sistema de elogios na API Valorize, cobrindo as mudanças no banco de dados, novas funcionalidades, permissões de acesso e refatorações de código.

**Última Atualização**: Correções críticas aplicadas - tipo do valueId corrigido, validações aprimoradas, reset manual implementado.

## 1. Visão Geral da Funcionalidade

O sistema de elogios permite que usuários de uma mesma empresa enviem reconhecimento uns aos outros na forma de "elogios", que estão atrelados a valores da empresa e consomem moedas de um saldo semanal.

As principais funcionalidades são:
-   **Administração de Valores**: Admins da empresa podem cadastrar de 2 a 8 "valores" (ex: "Trabalho em Equipe", "Inovação") que servem como base para os elogios.
-   **Configurações da Empresa**: Admins podem definir um limite semanal de moedas que cada usuário pode distribuir (padrão de 100).
-   **Carteiras (Wallets)**: Cada usuário possui uma carteira com dois saldos:
    -   `complimentBalance`: Saldo de moedas para *enviar* elogios, resetado semanalmente.
    -   `redeemableBalance`: Saldo de moedas *recebidas*, que é cumulativo.
-   **Envio de Elogios**: Um usuário pode enviar um elogio para outro colega da mesma empresa, especificando um valor da empresa, uma mensagem e uma quantidade de moedas.
-   **Listagem de Usuários**: Para facilitar o envio, há um endpoint que lista todos os usuários elegíveis para receber um elogio (mesma empresa, excluindo o próprio remetente).

## 2. Estrutura do Banco de Dados (`prisma/schema.prisma`)

Para suportar a nova funcionalidade, foram adicionados os seguintes modelos ao schema do Prisma:

-   **`CompanyValue`**: Armazena os valores da empresa.
    -   `id`: `Int` (autoincremento)
    -   `companyId`: `String` (relação com `Company`)
    -   `title`, `description`, `icon`: `String`
    -   `isActive`: `Boolean`

-   **`CompanySettings`**: Armazena configurações específicas de cada empresa.
    -   `id`: `Int` (autoincremento)
    -   `companyId`: `String` (relação única com `Company`)
    -   `weeklyComplimentCoinLimit`: `Int`

-   **`Wallet`**: Gerencia os saldos de moedas dos usuários.
    -   `id`: `String` (`cuid`)
    -   `userId`: `String` (relação única com `User`)
    -   `complimentBalance`: `Int`
    -   `redeemableBalance`: `Int`

-   **`Compliment`**: Registra cada elogio enviado.
    -   `id`: `String` (`cuid`)
    -   `senderId`, `receiverId`: `String` (relação com `User`)
    -   `companyId`: `String` (relação com `Company`)
    -   `valueId`: `Int` (relação com `CompanyValue`)
    -   `message`: `String`
    -   `coins`: `Int`

Foram adicionados também os relacionamentos correspondentes nos modelos `User` e `Company`.

## 3. Arquitetura e Estrutura de Código

Seguindo o padrão *Feature-First* do projeto, as funcionalidades foram organizadas da seguinte forma:

### 3.1. `features/company-settings/`
Esta feature foi reestruturada em duas subpastas para melhor organização:

-   **`settings/`**: Lida com as configurações da empresa.
    -   `settings.model.ts`: `CompanySettingsModel` para interagir com o DB.
    -   `settings.schemas.ts`: Schema Zod (`updateCompanySettingsSchema`) para validação.
    -   `settings.service.ts`: Lógica para buscar e atualizar (`upsert`) as configurações.
    -   `settings.routes.ts`: Expõe os endpoints:
        -   `PUT /companies/:companyId/settings`
        -   `GET /companies/:companyId/settings`

-   **`values/`**: Lida com os valores da empresa.
    -   `values.model.ts`: `CompanyValueModel`.
    -   `values.schemas.ts`: Schemas Zod para criação e listagem.
    -   `values.service.ts`: Lógica para criar e listar valores, incluindo a validação de no máximo 8 valores ativos.
    -   `values.routes.ts`: Expõe os endpoints:
        -   `POST /companies/:companyId/values`
        -   `GET /companies/:companyId/values`

### 3.2. `features/wallets/`
-   `wallet.model.ts`: `WalletModel` com lógica para encontrar, criar e atualizar saldos, preparada para transações do Prisma.
-   `wallet.service.ts`: Lógica de negócio que garante que todo usuário tenha uma carteira (`getOrCreateByUserId`). A rota para consulta de saldo foi adicionada em `user.routes.ts` para manter a coesão.

### 3.3. `features/compliments/`
-   `compliment.model.ts`: `ComplimentModel` para criar registros de elogios.
-   `compliment.schemas.ts`: Schema Zod (`sendComplimentSchema`) para validar o corpo da requisição de envio.
-   `compliment.service.ts`: Contém a lógica de negócio mais crítica:
    -   `sendCompliment`: Executa uma transação no banco de dados que valida as regras de negócio (mesma empresa, saldo suficiente, não enviar para si mesmo), debita moedas do remetente, credita na carteira do destinatário e cria o registro do elogio.
    -   `listReceivableUsers`: Busca todos os usuários da empresa do usuário logado, exceto ele mesmo.
-   `compliment.routes.ts`: Expõe os endpoints sob o prefixo `/compliments`:
    -   `POST /send-compliment`
    -   `GET /list-receivable-users`

## 4. Permissões e Segurança (RBAC)

-   Uma nova permissão, `company:manage_settings`, foi criada em `src/lib/seed.ts`.
-   Esta permissão foi atribuída ao role `company_admin`, garantindo que apenas administradores da empresa possam gerenciar os valores e as configurações.
-   As rotas administrativas são protegidas pelo middleware `requirePermission('company:manage_settings')`.
-   A autenticação é garantida pelo hook global `auth0Middleware` registrado em `src/config/app.ts`.

## 5. Refinamentos e Correções

Durante a implementação, foram realizados os seguintes refinamentos:
-   **IDs de Tabelas**: Os IDs das tabelas `CompanySettings` e `CompanyValue` foram alterados de `cuid()` para `Int @default(autoincrement())` por não serem tabelas de segurança crítica.
-   **Tipagem de Rotas**: Os handlers das rotas foram corretamente tipados usando a inferência de tipos do Zod, eliminando a necessidade de casting manual e aumentando a segurança de tipos.
-   **Uso de Middleware**: Foi removido o registro duplicado de middleware de autenticação nas rotas, uma vez que ele já é registrado globalmente.
-   **Linting**: O código foi formatado e os erros de linting foram corrigidos em todos os arquivos criados e modificados.

## 6. Correções Críticas Aplicadas (Pós-Revisão)

### 6.1. Correção de Tipo Fatal no valueId
- **Problema**: Incompatibilidade entre `valueId` (String) no modelo Compliment e `id` (Int) no CompanyValue
- **Solução**: Alterado `valueId` para `Int` no schema Prisma e validações Zod correspondentes

### 6.2. Validações de Negócio Aprimoradas
- **Moedas em Múltiplos de 5**: Implementado validação para aceitar apenas valores de 5 a 100, em múltiplos de 5
- **Mínimo de Valores da Empresa**: Validação que exige no mínimo 2 valores ativos antes de permitir elogios
- **Schema Zod atualizado**: `compliment.schemas.ts` com validações apropriadas

### 6.3. Reset Manual de Saldo Semanal
- **Implementação**: Função `resetWeeklyBalances()` em `wallet.service.ts`
- **Endpoint Admin**: `POST /wallets/reset-weekly-balance` (requer permissão `admin:manage_system`)
- **Sem Cron Jobs**: Reset executado manualmente conforme necessário

### 6.4. Endpoints Adicionados
- `GET /companies/:companyId/settings` - Buscar configurações da empresa
- `GET /wallets/balance` - Consultar saldo do usuário autenticado
- `POST /wallets/reset-weekly-balance` - Reset manual (admin)

### 6.5. Otimizações de Performance
- **Índices adicionados**:
  - `@@index([complimentBalance])` na tabela Wallet
  - `@@index([createdAt])` na tabela Compliment
  - `@@index([companyId, createdAt])` índice composto para queries por empresa e data

## 7. Ações Necessárias

Para aplicar todas as correções, execute:

```bash
# Gerar e aplicar migration com as mudanças de tipo e índices
npx prisma migrate dev --name fix_compliment_system

# Gerar cliente Prisma atualizado
npx prisma generate
```

**Nota**: A permissão `admin:manage_system` deve ser adicionada ao seed para permitir o reset manual.
