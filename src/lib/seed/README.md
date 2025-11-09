# Seed System Documentation

## Overview

The seed system has been refactored into a modular, maintainable structure. Instead of one large 700+ line file, the system is now split into focused, single-responsibility modules.

## Directory Structure

```
src/lib/seed/
├── index.ts                    # Main orchestrator
├── data/                       # Data definitions
│   ├── permissions.ts          # Permission definitions
│   ├── roles.ts                # Role configurations
│   ├── companies.ts            # Company data
│   ├── users.ts                # User data
│   ├── values.ts               # Company values
│   ├── contacts.ts             # Company contacts
│   └── compliments.ts          # Compliment data
├── seeders/                    # Seeding logic
│   ├── base.seeder.ts          # Base seeder class
│   ├── permission.seeder.ts    # Permission seeder
│   ├── role.seeder.ts          # Role seeder
│   ├── company.seeder.ts       # Company seeder
│   ├── user.seeder.ts          # User seeder
│   ├── wallet.seeder.ts        # Wallet seeder
│   ├── value.seeder.ts         # Company value seeder
│   ├── contact.seeder.ts       # Company contact seeder
│   └── compliment.seeder.ts    # Compliment seeder
└── utils/                      # Utilities
    ├── clear-database.ts       # Database cleanup
    └── verify-seed.ts          # Seed verification
```

## Usage

### Running Seeds

```bash
# Run all seeders
npm run db:seed

# Or directly with tsx
tsx src/lib/seed.ts
```

### Adding New Data

#### 1. Add Data Definitions

Edit the appropriate file in `src/lib/seed/data/`:

```typescript
// src/lib/seed/data/users.ts
export const DEMO_USERS: UserData[] = [
  // ... existing users
  {
    auth0Id: 'auth0|new-user-id',
    email: 'newuser@company.com',
    name: 'New User',
    companyId: 'demo-company-001',
    roles: ['employee'],
  },
]
```

#### 2. Data is Automatically Seeded

The seeders will automatically pick up your new data on the next run.

### Creating a New Seeder

If you need to seed a new entity type:

#### 1. Create Data File

```typescript
// src/lib/seed/data/my-entity.ts
export interface MyEntityData {
  name: string
  description: string
}

export const MY_ENTITIES: MyEntityData[] = [
  { name: 'Entity 1', description: 'First entity' },
  { name: 'Entity 2', description: 'Second entity' },
]
```

#### 2. Create Seeder

```typescript
// src/lib/seed/seeders/my-entity.seeder.ts
import { BaseSeeder } from './base.seeder'
import { MY_ENTITIES } from '../data/my-entity'

export class MyEntitySeeder extends BaseSeeder {
  protected get name(): string {
    return 'my entities'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    for (const entity of MY_ENTITIES) {
      await this.prisma.myEntity.create({
        data: entity,
      })
    }
    
    this.logComplete(MY_ENTITIES.length, 'entities')
  }
}
```

#### 3. Add to Orchestrator

```typescript
// src/lib/seed/index.ts
import { MyEntitySeeder } from './seeders/my-entity.seeder'

export async function seed(): Promise<void> {
  // ... existing seeders
  await new MyEntitySeeder(prisma).seed()
  // ... rest of seeders
}
```

## Architecture

### BaseSeeder Class

All seeders extend `BaseSeeder` which provides:

- Consistent logging with `logStart()`, `logComplete()`, `logWarning()`, `logInfo()`
- Access to Prisma client via `this.prisma`
- Abstract `seed()` method to implement
- Abstract `name` property for identification

### Seeding Order

Seeders run in dependency order:

1. **Companies** - Base entities
2. **Permissions** - RBAC foundation
3. **Roles** - Assigned to companies
4. **Users** - Belong to companies
5. **Wallets** - One per user
6. **Values** - Company values
7. **Contacts** - Company contacts
8. **Compliments** - Depends on users and values

### Data Organization

- **Data files**: Pure TypeScript objects with type definitions
- **Seeders**: Logic for inserting data into database
- **Utils**: Reusable utilities (clear, verify)
- **Index**: Orchestrates execution order

## Benefits

✅ **Modular** - Each file is 30-100 lines, easy to navigate  
✅ **Maintainable** - Changes are localized to specific files  
✅ **Testable** - Each seeder can be tested independently  
✅ **Scalable** - Add new seeders without touching existing code  
✅ **Type-safe** - Better TypeScript inference with smaller files  
✅ **Clear separation** - Data vs logic separation  

## Migration from Old System

The old `seed.ts` file now acts as a thin wrapper that delegates to the new modular system. This ensures backward compatibility with existing scripts and commands.

## Examples

### Updating Company Data

```typescript
// src/lib/seed/data/companies.ts
export const DEMO_COMPANIES: CompanyData[] = [
  {
    id: 'demo-company-004',
    name: 'New Company',
    domain: 'newcompany.com',
    country: 'US',
    timezone: 'America/Los_Angeles',
  },
]
```

### Modifying Permissions

```typescript
// src/lib/seed/data/permissions.ts
export const PERMISSIONS: PermissionData[] = [
  // ... existing permissions
  { name: 'reports:view', description: 'View reports' },
  { name: 'reports:export', description: 'Export reports' },
]
```

### Adjusting User Roles

```typescript
// src/lib/seed/data/users.ts
{
  auth0Id: 'auth0|688aa3e7f3f1dbd119c3b600',
  email: 'gabriel.fachini@usevalorize.com.br',
  name: 'Gabriel Fachini',
  companyId: 'demo-company-001',
  roles: ['super_admin', 'company_admin'], // Multiple roles
}
```

## Troubleshooting

### Error: Cannot find module

Make sure all imports use correct relative paths:
- From seeders: `../data/...`, `./base.seeder`
- From index: `./seeders/...`, `./utils/...`

### Seeding fails with foreign key constraint

Check the seeding order in `index.ts`. Dependencies must be seeded before dependents.

### Data not updating

Seeders use `upsert` where possible. Check the `where` clause matches your unique constraints.

## Future Enhancements

Possible improvements:

- **Environment-specific seeds**: Different data for dev/staging/prod
- **Partial seeding**: Seed only specific entities
- **Seed from CLI args**: `npm run db:seed -- --only=users`
- **Faker integration**: Generate realistic fake data
- **Seed factories**: Generate multiple variations of entities
- **Incremental seeding**: Add data without clearing database
