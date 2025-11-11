# Decisão: Sistema de Pagamentos do Valorize

**Data:** 11 de novembro de 2025  
**Contexto:** Definição da infraestrutura de pagamentos para o SaaS Valorize (MVP)

---

## Problema Identificado

O Valorize possui dois fluxos financeiros distintos:

1. **Mensalidade da plataforma** - Valor fixo mensal por uso do sistema
2. **Saldo pré-pago de premiação** - Valor que deve ser usado exclusivamente para compra de vouchers/recompensas

**Desafio:** Gateways de pagamento tradicionais (como Asaas) utilizam conta escrow, retendo valores por 14-30 dias antes de liberar. Isso cria problema de capital de giro, pois os vouchers precisam ser comprados imediatamente quando funcionários fazem resgates.

---

## Conceitos Esclarecidos

### Gateway de Pagamento
Intermediário que processa pagamentos com cartão de crédito/débito. Cuida da autorização, segurança (PCI-DSS) e comunicação com operadoras (Visa, Mastercard).

### Conta Escrow
Conta intermediária onde o dinheiro fica retido temporariamente (14-30 dias) antes de ser liberado ao vendedor. Existe para proteger contra chargebacks e fraudes.

### Chargeback
Quando o cliente contesta uma compra diretamente no banco/operadora do cartão, revertendo o pagamento mesmo após você já ter recebido. O gateway pode retirar o dinheiro da sua conta meses depois.

### Asaas
Fintech brasileira que oferece:
- Gateway de pagamento (cartão, boleto, Pix)
- Sistema de assinaturas recorrentes
- Emissão de nota fiscal
- API para automação

**Escrow na Asaas:**
- Cartão de crédito: 14-30 dias de retenção
- Pix/Boleto: 1-2 dias (D+1 ou D+2)

---

## Decisão Tomada

### Solução para Fase MVP (0-10 clientes)

**Abordagem:** 100% manual com Pix direto para conta PJ

#### Implementação

**1. Infraestrutura**
- Abrir conta PJ gratuita (Nubank PJ ou Inter Empresas)
- Pix ilimitado sem custos

**2. Mensalidade**
- Cliente faz Pix mensal manual
- Sistema mostra: chave Pix + valor + identificador único
- Operador verifica pagamento no app do banco
- Ativação/renovação manual no sistema

**3. Créditos de Premiação**
- Cliente faz Pix com identificador único
- Dinheiro cai imediatamente (D+0)
- Operador compra vouchers com o valor recebido
- Créditos liberados manualmente no sistema em até 2h

#### Fluxo Operacional

```
Cliente solicita créditos
    ↓
Sistema gera chave Pix + identificador
    ↓
Cliente paga via Pix
    ↓
Notificação bancária (email/push)
    ↓
Operador verifica pagamento (10min)
    ↓
Compra vouchers no fornecedor
    ↓
Libera créditos manualmente no sistema
    ↓
Notifica cliente por email
```

**Tempo estimado por transação:** 10 minutos  
**Volume esperado:** 3 clientes x 1-2 recargas/mês = ~1h de trabalho/mês

---

## Vantagens da Solução Escolhida

✅ **Zero capital de giro** - Dinheiro disponível imediatamente  
✅ **Zero custos fixos** - Sem mensalidade de gateway  
✅ **Zero taxas** - Pix entre PJs é gratuito  
✅ **Zero complexidade técnica** - Sem integrações ou APIs  
✅ **Validação do modelo** - Testa demanda real antes de investir em automação  
✅ **Viável para o momento** - Perfeitamente operável com 3-10 clientes

---

## Roadmap de Automação

### Quando automatizar?
- **10+ clientes ativos**, OU
- **5+ horas/semana** em conferência de pagamentos, OU
- **Perda de clientes** por demora na liberação

### Próximos passos (futuro)
1. **Fase 1 (10-20 clientes):** Integrar API do banco (Nubank/Inter têm API gratuita) para notificação automática de Pix
2. **Fase 2 (20-50 clientes):** Migrar mensalidade para Asaas com cartão recorrente (aceitar escrow)
3. **Fase 3 (50+ clientes):** Tudo na Asaas, negociar redução de escrow para 7-14 dias

---

## Tecnologia Necessária (MVP)

```typescript
// Tela de adicionar créditos - exibe dados para pagamento
function TelaAdicionarCreditos({ empresaId }) {
  const identificador = `${empresaId}-CREDITOS-${Date.now()}`;
  
  return (
    <div>
      <h3>Faça um Pix com os dados abaixo:</h3>
      <p>Chave: <strong>12345678000190</strong> (CNPJ)</p>
      <p>Valor: <strong>R$ {valor}</strong></p>
      <p>Descrição: <strong>{identificador}</strong></p>
      <p>Envie comprovante para: financeiro@usevalorize.com.br</p>
      <p>Liberação em até 2h úteis</p>
    </div>
  );
}

// Painel admin - liberação manual
function PainelAdmin() {
  return (
    <button onClick={() => liberarCreditos(empresaId, valor)}>
      Liberar Créditos Manualmente
    </button>
  );
}
```

---

## Riscos Mitigados

**Risco:** Cliente não pagar mensalidade  
**Mitigação:** Bloqueio automático do sistema após vencimento

**Risco:** Demora na liberação de créditos  
**Mitigação:** SLA de 2h úteis (razoável para B2B)

**Risco:** Erro na conferência de pagamentos  
**Mitigação:** Identificador único obrigatório + validação de valor

---

## Resumo Executivo

Para os primeiros 3-10 clientes do Valorize, a solução mais adequada é receber pagamentos via **Pix direto para conta PJ**, com **operação 100% manual**. 

Isso elimina problemas de capital de giro (escrow), reduz custos a zero, e é perfeitamente viável operacionalmente nesta escala.

Automação será implementada gradualmente conforme o volume de clientes justificar o investimento em integrações e ferramentas de pagamento.
