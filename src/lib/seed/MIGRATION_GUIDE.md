# Migration Guide: Old Seed System → New Modular System

## Overview

This guide helps you understand how the old seed system maps to the new modular structure.

## File Mapping

### Before → After

| Old Location | New Location | Purpose |
|-------------|--------------|---------|
| `seed.ts` (lines 1-50) | `data/permissions.ts` | Permission definitions |
| `seed.ts` (lines 51-120) | `data/roles.ts` | Role configurations |
| `seed.ts` (lines 121-180) | `data/companies.ts` | Company data |
| `seed.ts` (lines 181-280) | `data/users.ts` | User data |
| `seed.ts` (lines 281-380) | `data/values.ts` | Company values |
| `seed.ts` (lines 381-420) | `data/contacts.ts` | Company contacts |
| `seed.ts` (lines 421-520) | `data/compliments.ts` | Compliment data |
| `seed.ts` (clearDatabase fn) | `utils/clear-database.ts` | Database cleanup |
| `seed.ts` (verifySeeding fn) | `utils/verify-seed.ts` | Verification |
| `seed.ts` (seedCompanies fn) | `seeders/company.seeder.ts` | Company seeding logic |
| `seed.ts` (seedPermissions fn) | `seeders/permission.seeder.ts` | Permission seeding logic |
| `seed.ts` (seedRoles fn) | `seeders/role.seeder.ts` | Role seeding logic |
| `seed.ts` (seedUsers fn) | `seeders/user.seeder.ts` | User seeding logic |
| `seed.ts` (seedWallets fn) | `seeders/wallet.seeder.ts` | Wallet seeding logic |
| `seed.ts` (seedCompanyValues fn) | `seeders/value.seeder.ts` | Value seeding logic |
| `seed.ts` (seedCompanyContacts fn) | `seeders/contact.seeder.ts` | Contact seeding logic |
| `seed.ts` (seedCompliments fn) | `seeders/compliment.seeder.ts` | Compliment seeding logic |
| `seed.ts` (main fn) | `index.ts` (seed fn) | Orchestration |

## Code Examples

### Example 1: Adding a New User

#### Old Way
```typescript
// src/lib/seed.ts (line ~250)
const DEMO_USERS = [
  // ... scroll through 700 lines to find this section
  {
    auth0Id: 'auth0|new-user',
    email: 'newuser@company.com',
    name: 'New User',
    companyId: DEMO_COMPANIES[0].id,
    roles: ['employee'],
  },
]
```

#### New Way
```typescript
// src/lib/seed/data/users.ts (clear, focused file)
export const DEMO_USERS: UserData[] = [
  // ... existing users
  {
    auth0Id: 'auth0|new-user',
    email: 'newuser@company.com',
    name: 'New User',
    companyId: 'demo-company-001',
    roles: ['employee'],
  },
]
```

### Example 2: Adding a New Permission

#### Old Way
```typescript
// src/lib/seed.ts (line ~25)
const PERMISSIONS = [
  // ... find the right section in 700 lines
  { name: 'new:permission', description: 'New permission' },
]
```

#### New Way
```typescript
// src/lib/seed/data/permissions.ts (focused file)
export const PERMISSIONS: PermissionData[] = [
  // ... existing permissions
  { name: 'new:permission', description: 'New permission' },
]
```

### Example 3: Modifying Seeding Logic

#### Old Way
```typescript
// src/lib/seed.ts (line ~450)
async function seedUsers() {
  logger.info('👤 Seeding users...')
  
  for (const userData of DEMO_USERS) {
    // ... 30 lines of logic mixed with other 600+ lines
  }
}
```

#### New Way
```typescript
// src/lib/seed/seeders/user.seeder.ts (focused file)
export class UserSeeder extends BaseSeeder {
  protected get name(): string {
    return 'users'
  }

  async seed(): Promise<void> {
    this.logStart()
    
    for (const userData of DEMO_USERS) {
      // ... seeding logic
    }
    
    this.logComplete(DEMO_USERS.length, 'users')
  }
}
```

## Common Tasks

### Task 1: Update Company Data

**Old**: Open `seed.ts`, search for "DEMO_COMPANIES", scroll to find it  
**New**: Open `src/lib/seed/data/companies.ts`

### Task 2: Add New Role Permission

**Old**: Open `seed.ts`, search for "ROLES_CONFIG", modify array  
**New**: Open `src/lib/seed/data/roles.ts`, update configuration

### Task 3: Change Seeding Order

**Old**: Reorder function calls in `main()` function  
**New**: Reorder seeder calls in `src/lib/seed/index.ts`

### Task 4: Debug Seeding Issue

**Old**: Add console.logs in 700-line file, hard to isolate issue  
**New**: Focus on specific seeder file (30-80 lines), easy to debug

### Task 5: Test Specific Seeder

**Old**: Comment out other seeders in `main()`, run entire file  
**New**: Import and test specific seeder class independently

## Benefits of New Structure

### 1. **Easy Navigation**
- Old: Ctrl+F through 700 lines
- New: Open the specific file you need (30-80 lines each)

### 2. **Clear Organization**
- Old: All data and logic mixed together
- New: Data in `data/`, logic in `seeders/`, utils in `utils/`

### 3. **Better Collaboration**
- Old: Merge conflicts on large file
- New: Team members can work on different files simultaneously

### 4. **Faster Development**
- Old: Time wasted scrolling and searching
- New: Jump directly to the file you need

### 5. **Easier Testing**
- Old: Hard to test individual components
- New: Import and test specific seeders

### 6. **Type Safety**
- Old: Large file = slower IDE, worse autocomplete
- New: Small files = fast IDE, excellent autocomplete

## Breaking Changes

**None!** The old `seed.ts` file still works as a wrapper:

```typescript
// src/lib/seed.ts
import { seed } from './seed/index'
export { seed }
```

All existing code that imports from `seed.ts` continues to work.

## Imports Update

If you were importing seed functions directly (rare):

### Before
```typescript
import { seedUsers, seedCompanies } from './seed'
```

### After
```typescript
import { UserSeeder } from './seed/seeders/user.seeder'
import { CompanySeeder } from './seed/seeders/company.seeder'

const prisma = new PrismaClient()
await new UserSeeder(prisma).seed()
await new CompanySeeder(prisma).seed()
```

## Recommended Workflow

1. **Always run tests** after modifying seed data
2. **Use TypeScript types** exported from data files
3. **Follow existing patterns** when creating new seeders
4. **Read README.md** in `src/lib/seed/` for detailed docs
5. **Keep data files pure** - no logic, just data definitions

## Troubleshooting

### Issue: Import errors

**Solution**: Check relative paths in imports
- From seeder: `import { DATA } from '../data/file'`
- From index: `import { Seeder } from './seeders/file.seeder'`

### Issue: Seeding order problems

**Solution**: Check `src/lib/seed/index.ts` - ensure dependencies are seeded first

### Issue: Data not updating

**Solution**: Seeders use `upsert` - check unique constraints match `where` clauses

## Next Steps

1. ✅ Review the new structure in `src/lib/seed/`
2. ✅ Read `README.md` for complete documentation
3. ✅ Try adding new data to see how easy it is
4. ✅ Explore individual seeder files to understand patterns
5. ✅ Run `npm run db:seed` to verify everything works

## Questions?

Check these resources:
- `src/lib/seed/README.md` - Full usage guide
- `src/lib/seed/REFACTORING_SUMMARY.md` - What changed
- Code comments in each file
- TypeScript types for all data structures

---

**Result**: A more maintainable, scalable, and developer-friendly seed system! 🚀
