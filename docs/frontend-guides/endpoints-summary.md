# Welcome Email System - Endpoints Summary

## Admin Endpoints

### 1. Send Welcome Email (Individual)
```
POST /admin/users/:userId/send-welcome-email
```
**Permission**: `users:manage`

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

### 2. Send Welcome Emails in Bulk
```
POST /admin/users/send-welcome-emails-bulk
```
**Permission**: `users:manage`

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

## Use Cases Summary

### Admin: Create user and send email later
1. `POST /admin/users` with `sendEmail: false`
2. `POST /admin/users/:id/send-welcome-email`

### Admin: Create user and send email immediately
1. `POST /admin/users` with `sendEmail: true`

### Admin: Import CSV and send emails
1. `POST /admin/users/csv-import` with `sendEmails: true`

### Admin: Resend email manually
1. `POST /admin/users/:id/send-welcome-email` (maximum 3 times)

---

## Common Errors

### 400 - Email Limit Reached
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Maximum email send limit (3) reached for this user",
  "statusCode": 400
}
```

### 404 - User Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "User not found",
  "statusCode": 404
}
```

---

## Important Notes

- **Email limit**: Maximum 3 per user
- **Optional fields**: `sendEmail` in user creation is optional (default: `false`)
- **Email via Supabase**: Emails are sent via Supabase Auth `resetPasswordForEmail`
- **Simplified tracking**: System tracks only email sending (not clicks, password setting, etc.)
