# Valorize - Especificação Detalhada de Features

Este documento descreve todas as funcionalidades do Valorize, organizadas por categoria. As features estão classificadas em: **implementadas** ✅, **planejadas para MVP** 🎯, **futuras** 🔮, ou **descartadas** ❌.

---

## 📋 Índice de Categorias

1. [Elogios (Core Feature)](#elogios)
2. [Prêmios](#prêmios)
3. [Resgates](#resgates)
4. [Transações](#transações)
5. [Dashboard e Analytics](#dashboard-e-analytics)
6. [Autenticação e Segurança](#autenticação-e-segurança)
7. [Onboarding e Adoção](#onboarding-e-adoção)
8. [Notificações](#notificações)
9. [Perfil e Configurações](#perfil-e-configurações)
10. [Gamificação](#gamificação)
11. [Calendário e Iniciativas](#calendário-e-iniciativas)
12. [Administração](#administração)
13. [Notícias e Comunicação](#notícias-e-comunicação)
14. [Eventos e Lives](#eventos-e-lives)
15. [Treinamentos](#treinamentos)

---

## 🎯 Elogios

### Funcionalidades do Usuário

#### ✅ Implementadas

- **Enviar Elogio Individual**
  - Usuário seleciona um colega
  - Escolhe um valor da empresa
  - Define quantidade de moedas (máximo 100)
  - Escreve mensagem de reconhecimento
  - Sistema registra e notifica destinatário

- **Associação com Valores**
  - Todo elogio obrigatoriamente vinculado a um valor empresarial
  - Reforça cultura organizacional

- **Feed Público de Elogios**
  - Visualização de todos os elogios enviados na empresa
  - Transparência para mitigar má fé (trocas artificiais)
  - Celebração coletiva de reconhecimentos

#### 🎯 Planejadas para MVP

- **Sugestão Inteligente de Elogios**
  - Sistema analisa colaborações recentes
  - Sugere pessoas para reconhecer
  - Exemplo: "Você trabalhou com Maria no Projeto X, que tal reconhecê-la?"
  - **Implementação**: Lógica de código puro (sem IA cara)

- **Reações aos Elogios**
  - Outros colaboradores podem reagir com emojis (👏, ❤️, 🎉, 🔥)
  - Amplifica reconhecimento
  - Cria senso de comunidade

- **Milestones de Elogios**
  - Badges por marcos atingidos
  - Exemplos: "Primeiro elogio enviado", "50 elogios enviados", "100 elogios recebidos"
  - **Valor**: Gamificação sutil que incentiva participação

#### 🔮 Futuras

- **Elogios com Mídia**
  - Anexar imagens ou GIFs ao elogio
  - Torna reconhecimento mais expressivo

- **Mensagem Privada Adicional**
  - Além do elogio público, opção de mensagem privada
  - Para contextos mais pessoais

#### ❌ Descartadas

- **Elogios para Times/Grupos**
  - Motivo: Dilui valor (moedas divididas por muitas pessoas)
  - Perde impacto individual do reconhecimento

- **Templates de Elogios**
  - Motivo: Tornaria elogios robóticos e artificiais
  - Contraria objetivo de conexão autêntica

---

### Funcionalidades Admin - Elogios

#### 🎯 Planejadas para MVP

- **Configurar Valores da Empresa**
  - Adicionar/editar/remover valores
  - Definir descrição e exemplos para cada valor
  - **Crítico**: Base para todo sistema de reconhecimento

- **Dashboard de Elogios**
  - Quantidade total de elogios trocados
  - Quantidade de moedas movimentadas
  - Valores mais citados em elogios
  - Índice de engajamento de elogios
  - Gráficos de evolução temporal

- **Índice de Engajamento**
  - Fórmula: `(Usuários Ativos / Total Usuários) × 100`
  - Usuário ativo: fez ≥1 ação nos últimos 7 dias
  - Breakdown por tipo de ação (enviar/receber elogios)

- **Configurar Renovação Semanal**
  - Definir quantidade de moedas renovadas semanalmente
  - Padrão: 100 moedas de elogios

#### 🎯 Auditoria e Segurança (MVP)

- **Detecção de Má Fé**
  - **Trocas Recíprocas Excessivas**
    - Detecta pares que trocam elogios repetidamente
    - Alerta quando > 5 trocas mútuas em 30 dias
    - Query SQL identifica padrões suspeitos
  
  - **Mensagens de Baixa Qualidade**
    - Mensagens muito curtas (< 10 caracteres)
    - Mensagens genéricas ("valeu", "top", "obg")
    - Mensagens repetitivas
  
  - **Timing Suspeito**
    - Detecta múltiplos elogios enviados rapidamente
    - Comportamento de bot (ex: 15 elogios em 3 minutos)
  
  - **Score de Risco**
    - Pontuação baseada em múltiplos fatores
    - Categorias: NORMAL, ATENÇÃO, ALERTA, CRÍTICO
    - Ações automáticas baseadas no risco

- **Dashboard de Auditoria**
  - Lista de alertas de segurança
  - Histórico de usuários com comportamento suspeito
  - Ações: ver detalhes, marcar como falso positivo, notificar usuário
  - Execução semanal automática (cron job)

#### 🔮 Futuras

- **Análise de Sentimento por IA**
  - Análise de clima organizacional pelas mensagens
  - Identificação de mudanças bruscas no padrão
  - Alertas preventivos para RH
  - **MVP**: Biblioteca gratuita (TextBlob/VADER)
  - **V2**: API OpenAI para maior precisão

- **Network Graph de Reconhecimento**
  - Visualização de quem elogia quem
  - Identifica silos, líderes informais, pessoas isoladas
  - Insights sobre dinâmica organizacional

- **Detecção Avançada por IA**
  - Machine learning para padrões mais complexos
  - Análise preditiva de comportamento

---

## 🎁 Prêmios

### Funcionalidades do Usuário

#### ✅ Implementadas

- **Catálogo de Prêmios**
  - Visualizar todos os prêmios disponíveis
  - Filtros por categoria, faixa de preço
  - Ordenação por relevância, preço, popularidade

- **Detalhes do Prêmio**
  - Imagens em alta resolução
  - Descrição completa
  - Variantes disponíveis (cor, tamanho, modelo)
  - Número de unidades em estoque
  - Custo em moedas

- **Fluxo de Resgate**
  - Escolher variante do prêmio
  - Selecionar endereço de envio
  - Criar novo endereço na hora do resgate
  - Confirmação do pedido

#### 🎯 Planejadas para MVP

- **Lista de Desejos**
  - Usuário marca prêmios de interesse
  - Recebe notificação quando estiver perto de ter moedas suficientes
  - **Valor**: Dados para RH sobre preferências dos colaboradores

#### 🔮 Futuras

- **Prêmios Experiência**
  - Não apenas físicos: day-off, almoço com CEO, estacionamento VIP
  - Variedade para diferentes perfis

- **Prêmios Rotativos**
  - Ofertas limitadas ou sazonais
  - Senso de urgência e novidade

- **Doação para Causas**
  - Converter moedas em doações para ONGs
  - Alinha com valores ESG
  - Requer parceria com ONGs e estrutura fiscal

#### ❌ Descartadas

- **Prêmios Coletivos**
  - Motivo: Complexo operacionalmente
  - Potencial para conflitos (sorteio, divisão)

---

### Funcionalidades Admin - Prêmios

#### 🎯 Planejadas para MVP

- **Gerenciar Catálogo**
  - Adicionar/editar/remover prêmios
  - Upload de imagens
  - Definir categorias e tags
  - Configurar custo em moedas
  - Gerenciar estoque

- **Analytics Simplificado**
  - **Top 5 Prêmios Mais Resgatados**
  - **Categoria Mais Popular**
  - **Gasto Médio em Moedas por Resgate**
  - **Tempo Médio para Primeiro Resgate** (dias desde entrada do colaborador)
  - Gráficos de evolução temporal

#### 🔮 Futuras

- **Analytics de ROI**
  - Tentar correlacionar resgates com aumento de engajamento
  - Comparar tipos de prêmio por impacto
  - **Desafio**: Difícil medir causalidade precisa

- **Integração com Fornecedores**
  - API para catálogo automático
  - Sincronização de estoque em tempo real
  - Processamento automático de pedidos

---

## 📦 Resgates

### Funcionalidades do Usuário

#### ✅ Implementadas

- **Visualizar Resgates**
  - Histórico completo de resgates
  - Status de cada pedido (processando, enviado, entregue)
  - Detalhes do prêmio resgatado

- **Acompanhar Rastreamento**
  - Código de rastreio visível
  - Link para transportadora
  - Atualizações de status

- **Cancelar Resgate**
  - Permitido até 24h após o resgate
  - Moedas devolvidas automaticamente

#### 🔮 Futuras

- **Avaliação de Prêmio**
  - Após receber, usuário pode avaliar
  - Feedback sobre qualidade e experiência

---

### Funcionalidades Admin - Resgates

#### 🎯 Planejadas para MVP

- **Gerenciar Resgates**
  - Visualizar todos os resgates
  - Filtrar por status, data, usuário
  - Atualizar código de rastreio
  - Marcar como enviado/entregue

- **Analytics de Entrega**
  - Tempo médio de entrega
  - Número de falhas/problemas
  - Taxa de cancelamento
  - Estatísticas por transportadora

#### 🔮 Futuras

- **Automação de Logística**
  - Integração com API de transportadoras
  - Geração automática de etiquetas
  - Atualização automática de rastreio

---

## 💰 Transações

### Funcionalidades do Usuário

#### ✅ Implementadas

- **Histórico de Transações**
  - Todas as movimentações de moedas
  - Tipo: recebido por elogio, enviado em elogio, resgate, renovação semanal
  - Auditoria: saldo anterior e após transação
  - Data e hora

- **Filtros de Transações**
  - Por tipo de transação
  - Por período
  - Por valor

- **ID de Transação**
  - Para suporte e debug
  - Rastreabilidade completa

#### 🔮 Futuras

- **Exportar Extrato**
  - Download em PDF/Excel
  - Relatório personalizado

---

### Funcionalidades Admin - Transações

#### 🔮 Futuras

- **Auditoria Financeira**
  - Total de moedas em circulação
  - Taxa de conversão (elogios → resgates)
  - Identificar anomalias

- **Ajustes Manuais**
  - Corrigir saldos em casos excepcionais
  - Registrar motivo do ajuste

---

## 📊 Dashboard e Analytics

### Funcionalidades Admin

#### 🎯 Planejadas para MVP (CRÍTICO)

- **Dashboard Executivo**
  - Visão geral em uma tela
  - Cards principais: elogios enviados/recebidos, moedas movimentadas, usuários ativos
  - Gráficos de evolução temporal (últimos 30/90 dias)
  - Índice de engajamento da plataforma

- **Analytics de Valores**
  - Distribuição de elogios por valor
  - Identificar valores mais/menos praticados
  - Comparação entre departamentos
  - **Valor**: Mostra quais valores são realmente vividos vs apenas declarados

- **Relatórios Exportáveis**
  - Gerar PDF para apresentações executivas
  - Incluir gráficos e métricas principais
  - Período customizável

- **Comparação Temporal**
  - Mês vs mês anterior
  - Trimestre vs trimestre anterior
  - Indicadores de crescimento/declínio

#### 🔮 Futuras

- **Network Graph de Reconhecimento**
  - Visualização interativa de conexões
  - Identificação de silos e líderes informais
  - Pessoas isoladas (não recebem/enviam elogios)

- **Perfis de Engajamento**
  - Top reconhecedores
  - Valores mais praticados por departamento
  - Colaboradores destaque

- **Análise Preditiva**
  - IA para prever tendências
  - Alertas de queda de engajamento
  - Recomendações de ações

---

## 🔐 Autenticação e Segurança

### Funcionalidades do Usuário

#### 🎯 Planejadas para MVP

- **Login com Google Workspace (SSO)**
  - Autenticação via OAuth Google
  - Verificação automática de domínio do email
  - Bloqueia acesso se domínio não for cliente
  - Extração automática de dados: nome, email, foto de perfil

- **Fluxo de Segurança**
  ```
  1. Usuário clica "Login com Google"
  2. OAuth do Google
  3. Recebe: email, nome, foto
  4. Valida domínio (@empresa.com.br)
  5. Se domínio é cliente → Permite login
  6. Se não → Bloqueia com mensagem clara
  ```

- **Tela de Erro Personalizada**
  - Mensagem amigável quando domínio não é cliente
  - Orientações para contatar RH
  - Link para conhecer o Valorize

#### 🔮 Futuras

- **Login com Microsoft (Azure AD)**
  - Para empresas que usam Microsoft 365
  - Mesmo fluxo de validação de domínio

- **Autenticação de Dois Fatores**
  - Para empresas que exigem segurança extra

---

## 🚀 Onboarding e Adoção

### Funcionalidades do Usuário

#### ✅ Implementadas (Básico)

- **Tour Inicial**
  - Apresentação visual das páginas principais
  - Navegação guiada

#### 🎯 Planejadas para MVP (CRÍTICO)

- **Onboarding Interativo**
  - **Passo 1**: "Bem-vindo! Envie seu primeiro elogio" → +50 moedas de bônus
  - **Passo 2**: "Explore os prêmios disponíveis" → +25 moedas
  - **Passo 3**: "Complete seu perfil" → +25 moedas
  - Total de bônus: +100 moedas extras

- **Checklist de Primeiros Passos**
  - Visual no dashboard
  - Progresso em porcentagem
  - Incentivo claro para completar

- **Tooltips Contextuais**
  - Aparecem na primeira vez que usuário acessa cada área
  - Explicação rápida de como usar
  - Podem ser reativadas nas configurações

#### 🔮 Futuras

- **Embaixadores Internos**
  - Identificar e treinar early adopters
  - Dashboard especial para embaixadores
  - Gamificação para incentivar advocacia

- **Integração com Slack/Teams**
  - Notificações de elogios
  - Comandos rápidos (/elogiar @usuario)
  - Reduz atrito de "mais uma ferramenta"

---

## 🔔 Notificações

### Funcionalidades do Usuário

#### 🎯 Planejadas para MVP

- **Centro de Notificações (In-App)**
  - Badge no ícone com contador
  - Lista de notificações recentes
  - Marcação como lida
  - Link direto para conteúdo relacionado

- **Tipos de Notificações**
  - Recebeu elogio
  - Alguém reagiu ao seu elogio
  - Saldo semanal renovado
  - Novo prêmio disponível
  - Prêmio resgatado enviado
  - Milestone atingido

- **Email Digest Semanal**
  - Resumo das atividades da semana
  - Elogios recebidos/enviados
  - Progresso em direção a prêmios
  - Próximos eventos/iniciativas
  - **Objetivo**: Re-engajamento sem spam

#### 🔮 Futuras

- **Web Push Notifications**
  - Notificações do browser (mesmo com site fechado)
  - Opt-in do usuário

- **App Mobile Nativo**
  - Push notifications nativas
  - Maior taxa de engajamento

---

## 👤 Perfil e Configurações

### Funcionalidades do Usuário

#### 🎯 Planejadas para MVP

- **Perfil Básico**
  - Foto de perfil (importada do Google)
  - Nome completo
  - Email
  - Cargo
  - Departamento

- **Perfil Público**
  - Visível para outros colaboradores
  - Mostra valores mais recebidos (top 3)
  - Total de elogios enviados/recebidos

#### ✅ Implementadas

- **Gerenciar Endereços**
  - Adicionar múltiplos endereços
  - Editar endereços existentes
  - Definir endereço padrão
  - Remover endereços

- **Acessibilidade**
  - Opções de contraste
  - Tamanho de fonte
  - Preferências de leitura

#### 🔮 Futuras (Perfil Rico)

- **Informações Adicionais**
  - Bio pessoal
  - Pronomes
  - Data de aniversário
  - Tempo de empresa

- **Conquistas/Badges**
  - Showcase de marcos atingidos
  - Milestones de elogios
  - Participação em iniciativas

- **Livros Lidos** (quando biblioteca for implementada)
  - Lista de livros resgatados
  - Avaliações feitas
  - Progresso de leitura

---

## 🎮 Gamificação

### Funcionalidades do Usuário

#### 🎯 Planejadas para MVP

- **Badges de Marcos**
  - Primeiro elogio enviado
  - 10/50/100 elogios enviados
  - 10/50/100 elogios recebidos
  - Primeiro prêmio resgatado
  - Onboarding completo

- **Celebração de Conquistas**
  - Modal/toast quando badge é desbloqueado
  - Compartilhamento opcional no feed

#### 🔮 Futuras

- **Leaderboards (Opcional)**
  - Configurável por empresa
  - Por valores, não apenas quantidade
  - Evita competição tóxica

- **Desafios Mensais**
  - "Reconheça alguém de outro departamento esta semana"
  - "Pratique todos os valores da empresa este mês"
  - Recompensas extras

- **Níveis/XP**
  - Sistema de progressão baseado em atividades
  - Desbloqueio de recursos especiais

---

## 📅 Calendário e Iniciativas

### Funcionalidades do Usuário

#### 🎯 Planejadas para MVP

- **Calendário Corporativo**
  - Aniversários dos colaboradores
  - Tempo de casa (aniversário de entrada)
  - Eventos da empresa

- **Iniciativas Automáticas**
  - **Aniversário**: Bônus de moedas no dia
  - **Tempo de Casa**: Reconhecimento automático (1 ano, 5 anos, etc)
  - **Onboarding Completo**: Bônus de moedas

#### 🔮 Futuras

- **Campanhas Temáticas**
  - RH cria campanhas (ex: "Semana da Gratidão")
  - Bônus temporários de moedas
  - Desafios especiais

- **Outras Iniciativas**
  - Doação de sangue
  - Participação em eventos
  - Conclusão de treinamentos

---

### Funcionalidades Admin - Iniciativas

#### 🔮 Futuras

- **Configurar Iniciativas**
  - Ligar/desligar iniciativas
  - Definir quantidade de recompensa
  - Regras de elegibilidade

- **Analytics de Iniciativas**
  - Participação em cada iniciativa
  - Moedas distribuídas
  - Impacto no engajamento

---

## ⚙️ Administração

### Funcionalidades Admin

#### 🎯 Planejadas para MVP

- **Gerenciamento de Usuários**
  - Visualizar todos os usuários
  - Filtrar por departamento, status
  - Ativar/desativar usuários
  - Editar informações básicas

- **Importação em Massa**
  - Upload CSV com lista de colaboradores
  - Campos: nome, email, departamento, cargo
  - Validação automática

- **Configuração da Empresa**
  - Nome da empresa
  - Logo
  - Cores (white label básico)
  - Domínios permitidos para login

- **Configuração de Valores**
  - Definir valores da empresa
  - Descrição e exemplos para cada valor
  - Ícones/cores para cada valor

- **Configuração de Economia**
  - Quantidade de renovação semanal (padrão: 100 moedas)
  - Regras de distribuição

#### 🔮 Futuras

- **Roles e Permissões**
  - Admin global
  - Gestor de RH
  - Gestor de departamento
  - Usuário padrão

- **Departamentos e Hierarquia**
  - Organograma visual
  - Gestão de equipes
  - Analytics por departamento

- **White Label Completo**
  - Domínio customizado (app.minhaempresa.com.br)
  - Branding completo
  - Email personalizado

- **Exportação de Dados**
  - LGPD compliance
  - Export completo dos dados da empresa

---

## 📰 Notícias e Comunicação

### Funcionalidades do Usuário

#### 🔮 Futuras

- **Feed de Notícias**
  - Visualizar notícias corporativas
  - Filtrar por categoria, data
  - Buscar notícias

- **Detalhes da Notícia**
  - Conteúdo rich media (texto, imagem, vídeo)
  - Autor e data de publicação
  - Reações (curtir, celebrar, etc)
  - Comentários

- **Interação**
  - Reagir a notícias
  - Comentar
  - Compartilhar (interno)

---

### Funcionalidades Admin - Notícias

#### 🔮 Futuras

- **Criar/Editar Notícias**
  - Editor de texto rico
  - Upload de mídia
  - Agendamento de publicação
  - Categorização

- **Analytics de Notícias**
  - Taxa de abertura
  - Tempo médio de leitura
  - Engajamento (reações, comentários)
  - % de abertura considerando usuários ativos

---

## 🎥 Eventos e Lives

### Funcionalidades do Usuário

#### 🔮 Futuras

- **Calendário de Eventos**
  - Visualizar eventos futuros
  - Confirmar presença
  - Ver detalhes (local, horário, descrição)
  - Ver quem confirmou

- **Participar de Lives**
  - Assistir transmissão ao vivo
  - Chat em tempo real
  - Reações durante live

---

### Funcionalidades Admin - Eventos

#### 🔮 Futuras

- **Criar Eventos**
  - Definir data, horário, local
  - Descrição e imagem
  - Limite de participantes
  - Confirmação de presença

- **Transmitir Lives**
  - Streaming pela plataforma
  - Moderação de chat
  - Métricas de audiência
  - Gravação automática

---

## 🎓 Treinamentos

### Funcionalidades do Usuário

#### 🔮 Futuras

- **Catálogo de Treinamentos**
  - Visualizar treinamentos disponíveis
  - Obrigatórios vs opcionais
  - Filtrar por categoria, duração

- **Assistir Treinamento**
  - Vídeo aulas
  - Material de apoio
  - Marcação de progresso automática

- **Avaliações**
  - Quiz ao final
  - Certificado de conclusão

- **Meu Progresso**
  - Treinamentos concluídos
  - Em andamento
  - Pendentes

---

### Funcionalidades Admin - Treinamentos

#### 🔮 Futuras

- **Criar Treinamentos**
  - Upload de conteúdo
  - Configurar como obrigatório
  - Definir prazo de conclusão
  - Criar avaliações

- **Gerenciar Ciclos**
  - Treinamentos periódicos (anual, trimestral)
  - Atribuir a departamentos específicos

- **Analytics de Treinamento**
  - Taxa de conclusão
  - Tempo médio para completar
  - Notas nas avaliações
  - Identificar colaboradores atrasados

---

##  Resumo de Priorização

### ✅ Já Implementado (MVP Atual)
- Elogios básicos
- Sistema de moedas
- Catálogo de prêmios
- Resgates com rastreamento
- Transações com auditoria
- Gerenciamento de endereços

### 🎯 MVP - Features Críticas (Próxima Sprint)
1. Login Google Workspace com verificação de domínio
2. Dashboard e Analytics para RH
3. Auditoria de má fé (detecção básica)
4. Onboarding interativo com recompensas
5. Notificações in-app + email digest
6. Calendário com aniversários
7. Configuração de valores da empresa
8. Sugestão de elogios
9. Reações aos elogios
10. Milestones/badges

### 🔮 V2 - Expansão (3-6 meses)
- Network graph de reconhecimento
- Análise de sentimento por IA
- Gamificação avançada (leaderboards, desafios)
- Notícias corporativas
- Campanhas temáticas
- Web push notifications

### 🔮 V3 - Futuro (6-12 meses)
- Eventos e lives
- Treinamentos
- White label completo
- Integrações Slack/Teams
- Analytics preditivos com IA

---

**Última Atualização**: Outubro 2025  
**Versão**: 2.0 - Refinado após discussões estratégicas  
**Próximo Passo**: Definir escopo final do MVP