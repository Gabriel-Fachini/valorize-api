# Product Context - Valorize API

## Por que o Valorize Existe

### Problemas Empresariais Identificados
- **Baixo Engajamento**: Colaboradores desconectados das atividades e valores da empresa
- **Falta de Reconhecimento**: Ausência de sistemas estruturados para valorizar contribuições
- **Cultura Fragmentada**: Dificuldade em construir e manter valores empresariais consistentes
- **Recompensas Ineficazes**: Prêmios distantes, raros ou irrelevantes para os colaboradores

## Como o Valorize Resolve

### Abordagem Centrada em Soluções
Em vez de focar nos problemas, o Valorize oferece soluções práticas e imediatas:

#### 1. **Engajamento Relevante**
- Ferramentas que conectam ações diárias aos valores da empresa
- Reconhecimento peer-to-peer baseado em valores reais
- Gamificação saudável que motiva participação genuína

#### 2. **Cultura Fortalecida**
- Sistema de elogios baseado nos valores da empresa
- Visibilidade das contribuições de cada colaborador
- Criação de conexões significativas entre colegas

#### 3. **Recompensas Tangíveis e Frequentes**
- Prêmios reais que os colaboradores realmente desejam
- Sistema de moedas que permite reconhecimento constante

## Funcionalidades Principais

### 1. Sistema de Elogios (Fluxo Principal)
**Como Funciona:**
- Usuário seleciona um valor da empresa (previamente cadastrado)
- Adiciona valor em moedas (máximo 100 por elogio)
- Envia mensagem de reconhecimento para colega
- Sistema registra e notifica o reconhecimento

**Impacto:**
- Reforça valores empresariais
- Cria cultura de reconhecimento peer-to-peer
- Gera dados sobre engajamento e valores praticados

### 2. Sistema de Moedas Virtuais
**Estrutura Dupla:**
- **Saldo de Elogios**: 100 moedas renovadas semanalmente (uso exclusivo para elogios)
- **Saldo de Resgate**: Acumulativo, usado para prêmios e outras iniciativas

**Benefícios:**
- Garante fluxo constante de reconhecimento
- Permite acúmulo para recompensas maiores
- Cria economia interna balanceada

### 3. Loja de Prêmios
**Características:**
- Prêmios tangíveis e desejáveis
- Sistema de resgate com moedas acumuladas
- Variantes de produtos (cor, voltagem, tamanho)
- Gestão de estoque com proteção contra race condition
- Sistema de endereços para entrega
- Tracking completo do status do pedido
- Cancelamento inteligente (até 3 dias após resgate)

**Fluxo de Resgate:**
1. Usuário navega pelo catálogo de prêmios
2. Seleciona prêmio desejado e variante (se aplicável)
3. Sistema valida saldo de moedas redeemable
4. Usuário seleciona ou cadastra endereço de entrega (máx 3 endereços)
5. Confirma resgate - moedas são debitadas automaticamente
6. Admin processa pedido e atualiza tracking
7. Usuário acompanha status (pendente → processando → enviado → entregue)
8. Pode cancelar em até 3 dias (moedas + estoque devolvidos)

## Experiência do Usuário

### Jornada Principal
1. **Login**: Acesso via Auth0 com dados da empresa
2. **Perfil Completo**: Usuário tem departamento e cargo definidos
3. **Dashboard**: Visão geral de moedas, elogios recebidos/enviados, métricas
4. **Enviar Elogio**: Fluxo principal - selecionar colega, valor, moeda e mensagem
5. **Explorar**: Catálogo de prêmios, histórico de atividades
6. **Cadastrar Endereço**: Até 3 endereços para entrega (se ainda não tiver)
7. **Resgatar**: Usar moedas acumuladas para prêmios
8. **Acompanhar**: Status do resgate em tempo real

### Personas Principais

#### **Colaborador Ativo**
- Usa sistema regularmente para reconhecer colegas
- Acumula moedas e resgata prêmios
- Participa de clubes de leitura

#### **Líder/Gestor**
- Reconhece equipe frequentemente
- Monitora cultura e engajamento
- Promove valores através de elogios

#### **RH/Admin**
- Configura valores da empresa
- Gerencia catálogo de prêmios
- Acompanha métricas de engajamento
- Configura estrutura organizacional (departamentos e cargos)
- Visualiza dashboard com analytics em tempo real
- Gerencia resgates e acompanha entregas
- Define domínios permitidos para SSO

## Diferencial Competitivo

### O que Torna o Valorize Único
1. **Foco em Valores**: Reconhecimento sempre conectado aos valores empresariais
2. **Economia Balanceada**: Sistema duplo de moedas garante fluxo e acúmulo
3. **Biblioteca Especializada**: Não é apenas uma loja, é uma ferramenta cultural
4. **Simplicidade**: Interface intuitiva, processo de elogio em poucos cliques
5. **Desenvolvimento Solo**: Agilidade e foco em funcionalidades essenciais

## Métricas de Sucesso

### Engajamento
- Frequência de elogios enviados/recebidos
- Participação ativa na plataforma
- Tempo médio na aplicação

### Cultura
- Distribuição de elogios por valores da empresa
- Conexões criadas entre colaboradores
- Feedback qualitativo sobre ambiente de trabalho
- Crescimento do catálogo de conhecimento compartilhado
