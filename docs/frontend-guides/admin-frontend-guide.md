# Guia de Implementação - Admin Frontend (Sistema Simplificado de Emails)

## Visão Geral

Este guia apresenta a implementação **simplificada** do sistema de envio de emails de boas-vindas para o painel admin.

**Funcionalidades**:
- ✅ Enviar email de boas-vindas individual
- ✅ Enviar emails em lote
- ✅ Limite de 3 emails por usuário
- ✅ Integração com criação de usuários e importação CSV

**O que foi removido (simplicidade MVP)**:
- ❌ Tracking de cliques no email
- ❌ Tracking de definição de senha
- ❌ Tracking de primeiro login
- ❌ Dashboard de progresso de onboarding
- ❌ Cálculo de porcentagem de completude

---

## Endpoints Disponíveis

### 1. Enviar Email Individual

```typescript
POST /admin/users/:userId/send-welcome-email
```

**Exemplo de uso**:

```typescript
async function sendWelcomeEmail(userId: string) {
  try {
    const response = await fetch(
      `${API_URL}/admin/users/${userId}/send-welcome-email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestedBy: currentUserId,
        }),
      }
    )

    const result = await response.json()

    if (result.success) {
      console.log('Email enviado!', result.data.emailSendCount)
      // Atualizar UI: mostrar sucesso e contador de envios
    }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Welcome email sent successfully",
    "emailSendCount": 1,
    "lastSentAt": "2025-01-21T10:35:00.000Z"
  }
}
```

---

### 2. Enviar Emails em Lote

```typescript
POST /admin/users/send-welcome-emails-bulk
```

**Exemplo de uso**:

```typescript
async function sendBulkWelcomeEmails(userIds: string[]) {
  try {
    const response = await fetch(
      `${API_URL}/admin/users/send-welcome-emails-bulk`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          requestedBy: currentUserId,
        }),
      }
    )

    const result = await response.json()

    if (result.success) {
      const { sent, failed, total } = result.data.summary
      console.log(`Enviados: ${sent}/${total} emails`)

      // Mostrar resultados detalhados
      result.data.results.forEach((r) => {
        if (!r.success) {
          console.error(`Falha para ${r.userId}: ${r.error}`)
        }
      })
    }
  } catch (error) {
    console.error('Erro no envio em lote:', error)
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Sent 145 of 150 emails",
    "results": [
      { "userId": "clx123", "success": true, "emailSendCount": 1 },
      { "userId": "clx456", "success": false, "error": "Maximum email send limit (3) reached for this user" }
    ],
    "summary": {
      "total": 150,
      "sent": 145,
      "failed": 5
    }
  }
}
```

---

## Integração com Criação de Usuários

### Opção 1: Criar usuário SEM enviar email

```typescript
async function createUser(userData: UserData) {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: userData.name,
      email: userData.email,
      departmentId: userData.departmentId,
      jobTitleId: userData.jobTitleId,
      sendEmail: false, // 👈 Não envia email agora
    }),
  })

  const result = await response.json()

  if (result.success) {
    const userId = result.data.user.id

    // Enviar email posteriormente se necessário
    // await sendWelcomeEmail(userId)
  }
}
```

### Opção 2: Criar usuário E enviar email imediatamente

```typescript
async function createUserAndSendEmail(userData: UserData) {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: userData.name,
      email: userData.email,
      departmentId: userData.departmentId,
      jobTitleId: userData.jobTitleId,
      sendEmail: true, // 👈 Envia email automaticamente
    }),
  })

  const result = await response.json()

  if (result.success) {
    console.log('Usuário criado e email enviado!')
  }
}
```

---

## Integração com Importação CSV

### Importar com envio de emails

```typescript
async function confirmCsvImport(previewId: string, confirmedRows: number[], sendEmails: boolean) {
  const response = await fetch(`${API_URL}/admin/users/csv-import`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      previewId,
      confirmedRows,
      sendEmails, // true para enviar emails, false para não enviar
    }),
  })

  const result = await response.json()

  if (result.success) {
    console.log(`Criados: ${result.data.usersCreated}`)
    console.log(`Emails enviados: ${result.data.emailsSent}`)
  }
}
```

---

## Componente React de Exemplo

```typescript
import React, { useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  welcomeEmailSendCount: number
  lastWelcomeEmailSentAt: string | null
}

function UserActions({ user }: { user: User }) {
  const [loading, setLoading] = useState(false)
  const canSendEmail = user.welcomeEmailSendCount < 3

  async function handleSendEmail() {
    if (!canSendEmail) {
      alert('Limite de 3 emails atingido para este usuário')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${API_URL}/admin/users/${user.id}/send-welcome-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestedBy: currentUserId,
          }),
        }
      )

      const result = await response.json()

      if (result.success) {
        alert('Email enviado com sucesso!')
        // Atualizar estado do usuário
        user.welcomeEmailSendCount = result.data.emailSendCount
        user.lastWelcomeEmailSentAt = result.data.lastSentAt
      } else {
        alert(`Erro: ${result.message}`)
      }
    } catch (error) {
      alert('Erro ao enviar email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSendEmail}
        disabled={loading || !canSendEmail}
      >
        {loading ? 'Enviando...' : 'Enviar Email de Boas-Vindas'}
      </button>

      <p>
        Emails enviados: {user.welcomeEmailSendCount}/3
      </p>

      {user.lastWelcomeEmailSentAt && (
        <p>
          Último envio: {new Date(user.lastWelcomeEmailSentAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
```

---

## Tratamento de Erros

### Limite de 3 emails atingido

```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Maximum email send limit (3) reached for this user",
  "statusCode": 400
}
```

**Como tratar**:
```typescript
if (response.status === 400) {
  const error = await response.json()

  if (error.message.includes('Maximum email send limit')) {
    // Desabilitar botão de envio
    // Mostrar mensagem: "Limite atingido (3/3 emails)"
  }
}
```

### Usuário não encontrado

```json
{
  "success": false,
  "error": "Not Found",
  "message": "User not found",
  "statusCode": 404
}
```

---

## Boas Práticas de UX

### 1. Mostrar contador de emails

```typescript
// UI visual do contador
<div className="email-status">
  <span className={emailCount >= 3 ? 'text-red' : 'text-green'}>
    {emailCount}/3 emails enviados
  </span>
</div>
```

### 2. Desabilitar botão quando limite atingido

```typescript
const canSend = user.welcomeEmailSendCount < 3

<button disabled={!canSend || loading}>
  {canSend ? 'Enviar Email' : 'Limite Atingido (3/3)'}
</button>
```

### 3. Mostrar confirmação antes de envio em lote

```typescript
function confirmBulkSend(count: number) {
  if (confirm(`Enviar email para ${count} usuários?`)) {
    sendBulkWelcomeEmails(selectedUserIds)
  }
}
```

### 4. Feedback de progresso para envio em lote

```typescript
// Para 650 usuários (Toro)
const [progress, setProgress] = useState(0)

async function sendWithProgress(userIds: string[]) {
  const response = await fetch('/send-welcome-emails-bulk', {
    // ... configuração
  })

  // Mostrar resumo após conclusão
  const result = await response.json()
  alert(`Enviados: ${result.data.summary.sent}/${result.data.summary.total}`)
}
```

---

## Campos do Usuário (Backend)

O sistema agora rastreia apenas 3 campos no modelo `User`:

```typescript
interface User {
  // ... outros campos
  welcomeEmailSentAt: Date | null       // Data do primeiro envio
  lastWelcomeEmailSentAt: Date | null   // Data do último envio
  welcomeEmailSendCount: number         // Contador (max 3)
}
```

---

## Resumo

✅ **Sistema simplificado** - Apenas envio de emails, sem tracking complexo
✅ **2 endpoints** - Individual + Bulk
✅ **Limite de 3 emails** - Validado no backend
✅ **Integração completa** - Criação de usuário + CSV import
✅ **Ideal para MVP** - Funcionalidade essencial sem over-engineering

---

**Última atualização**: Novembro 2025
**Status**: ✅ Implementação simplificada para MVP
