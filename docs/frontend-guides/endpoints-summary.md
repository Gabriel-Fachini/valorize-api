# Resumo dos Endpoints - Sistema de Emails de Boas-Vindas

## Admin Endpoints

### 1. Enviar Email de Boas-Vindas (Individual)
```
POST /admin/users/:userId/send-welcome-email
```
**Permissão**: `users:manage`

**Body**:
```json
{
  "requestedBy": "admin_user_id"
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
```
POST /admin/users/send-welcome-emails-bulk
```
**Permissão**: `users:manage`

**Body**:
```json
{
  "userIds": ["clx123...", "clx456...", "clx789..."],
  "requestedBy": "admin_user_id"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Sent 2 of 3 emails",
    "results": [
      { "userId": "clx123...", "success": true, "emailSendCount": 1 },
      { "userId": "clx456...", "success": false, "error": "Maximum email send limit (3) reached for this user" },
      { "userId": "clx789...", "success": true, "emailSendCount": 2 }
    ],
    "summary": {
      "total": 3,
      "sent": 2,
      "failed": 1
    }
  }
}
```

---

## Resumo por Caso de Uso

### Admin: Criar usuário e enviar email depois
1. `POST /admin/users` com `sendEmail: false`
2. `POST /admin/users/:id/send-welcome-email`

### Admin: Criar usuário e enviar email imediatamente
1. `POST /admin/users` com `sendEmail: true`

### Admin: Importar CSV e enviar emails
1. `POST /admin/users/csv-import` com `sendEmails: true`

### Admin: Reenviar email manualmente
1. `POST /admin/users/:id/send-welcome-email` (máximo 3 vezes)

---

## Erros Comuns

### 400 - Limite de Emails Atingido
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Maximum email send limit (3) reached for this user",
  "statusCode": 400
}
```

### 404 - Usuário Não Encontrado
```json
{
  "success": false,
  "error": "Not Found",
  "message": "User not found",
  "statusCode": 404
}
```

---

## Observações Importantes

- **Limite de emails**: Máximo 3 por usuário
- **Campos opcionais**: `sendEmail` em criação de usuário é opcional (default: `false`)
- **Email via Supabase**: Emails são enviados via Supabase Auth `resetPasswordForEmail`
- **Tracking simplificado**: Sistema rastreia apenas envio de emails (não cliques, definição de senha, etc.)
