# Backoffice Module

## Overview
This module contains all backoffice features for Valorize product management team. Access is restricted to Super Admins from "Valorize HQ" company only.

## Purpose
- Manage all client companies
- View cross-company analytics
- Create global prizes
- Configure system-wide settings
- Audit cross-company actions

## Authentication
- **Endpoint**: `POST /backoffice/auth/login`
- **Requirement**: User must have `SUPER_ADMIN` role AND belong to "Valorize HQ" company
- **Middleware**: `requireSuperAdmin()` validates all backoffice routes

## Structure
```
backoffice/
├── auth/                    # Backoffice authentication
│   ├── backoffice-auth.service.ts
│   ├── backoffice-auth.routes.ts
│   └── backoffice-auth.schemas.ts
├── backoffice.routes.ts     # Route aggregator
└── README.md                # This file
```

## Security
- All routes under `/backoffice/*` (except `/backoffice/auth/login`) are protected
- Multi-tenant isolation is **bypassed** for backoffice users (cross-company access)
- All actions are logged for audit purposes

## Future Features
- [ ] Company Management (CRUD)
- [ ] Cross-Company Analytics Dashboard
- [ ] Global Prize Management
- [ ] Integration Management (Tremendous, Auth0)
- [ ] System Audit Logs
- [ ] User Impersonation (for support)

---
**Last Updated**: November 2025
