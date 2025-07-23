# Valorize Platform - Complete Database Component Report
## Detailed Analysis of Every Table, Trigger, Check, Function, and View

### 📋 Document Overview

This comprehensive report provides detailed explanations for every database component in the Valorize platform. Each table, trigger, constraint, function, and view is documented with its specific purpose, business justification, and technical implementation details.

**Total Components Analyzed**: 200+ database objects
**Architecture**: PostgreSQL 14+ with Enterprise Features
**Compliance**: GDPR, SOX, Security Standards

---

## 🗂️ Complete Table Directory

### Phase 1: Core Tables (12 Tables)

#### 1. `user` - Core User Management
**Purpose**: Central user identity and profile management
**Business Justification**: Foundation for all platform interactions and security
**Key Relationships**: Referenced by all user-related tables

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key, auto-generated | PRIMARY KEY |
| `name` | varchar(200) | User's display name | NOT NULL |
| `avatar` | varchar(400) | Profile picture URL | Optional |
| `email` | varchar(200) | Unique login identifier | NOT NULL, UNIQUE |
| `password` | text | Hashed password storage | NOT NULL |
| `coins_to_donate` | int | Available donation coins | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `coins_to_spend` | int | Available spending coins | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `active` | boolean | Account status flag | NOT NULL, DEFAULT true |
| `created_at` | timestamptz | Account creation time | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last profile update | NOT NULL, DEFAULT NOW() |
| `deleted_at` | timestamptz | Soft delete timestamp | Added in Phase 3 |

**Indexes Created**:
- `idx_user_email`: Fast login lookups
- `idx_user_active`: Filter active users
- `idx_user_active`: Partial index for non-deleted users

**Why This Design**: 
- Separates coins into donation and spending buckets for business logic
- Uses soft deletes for GDPR compliance
- Email uniqueness ensures single account per email
- Timestamps enable audit trails and analytics

---

#### 2. `address` - Shipping & Contact Information  
**Purpose**: User address management for reward shipping
**Business Justification**: Essential for physical reward fulfillment

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `id_user` | int | User owner reference | NOT NULL, FK to user |
| `nickname` | varchar(100) | Address label (Home, Work) | NOT NULL |
| `default_address` | boolean | Primary address flag | NOT NULL, DEFAULT false |
| `active` | boolean | Address validity | NOT NULL, DEFAULT true |
| `cpf` | varchar(20) | Brazilian tax ID | Optional (international) |
| `zip_code` | varchar(15) | Postal code | NOT NULL |
| `street` | varchar(200) | Street address | NOT NULL |
| `number` | varchar(20) | Address number/unit | Changed to varchar for "123A" |
| `city` | varchar(100) | City name | NOT NULL |
| `neighborhood` | varchar(100) | District/neighborhood | Optional |
| `complement` | varchar(100) | Additional address info | Optional |
| `state` | varchar(50) | State/province | NOT NULL |
| `country` | varchar(2) | ISO country code | NOT NULL, DEFAULT 'BR' |
| `reference` | varchar(200) | Location reference | Optional |
| `created_at` | timestamptz | Address creation | NOT NULL, DEFAULT NOW() |
| `deleted_at` | timestamptz | Soft delete support | Added in Phase 3 |

**Special Constraints**:
- `idx_user_default_address`: Ensures only one default address per user
- Soft delete support for address history

**Why This Design**:
- International address support with flexible field lengths
- Default address logic for streamlined checkout
- Address history preservation for compliance
- Support for complex address formats globally

---

#### 3. `initiatives` - Company Programs & Challenges
**Purpose**: Manage company initiatives and engagement programs
**Business Justification**: Drive employee participation in company goals

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `title` | varchar(200) | Initiative name | NOT NULL |
| `description` | text | Detailed description | NOT NULL |
| `image` | varchar(500) | Initiative image URL | Optional |
| `coins` | int | Reward for completion | NOT NULL, CHECK > 0 |
| `active` | boolean | Initiative availability | NOT NULL, DEFAULT true |
| `visible` | boolean | Public visibility | NOT NULL, DEFAULT true |
| `rules` | jsonb | Participation rules | Optional, JSON for flexibility |
| `tags` | jsonb | Initiative tags/categories | Optional, JSON for search |
| `link` | varchar(500) | External link | Optional |
| `created_at` | timestamptz | Creation timestamp | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last modification | NOT NULL, DEFAULT NOW() |
| `deleted_at` | timestamptz | Soft delete support | Added in Phase 3 |

**JSON Field Usage**:
- `rules`: Flexible rule definitions (time limits, prerequisites, etc.)
- `tags`: Searchable categorization and filtering

**Why JSONB**: Superior performance for querying and indexing JSON data

---

#### 4. `credits` - Initiative Completion Tracking
**Purpose**: Track user participation and coin awards from initiatives
**Business Justification**: Audit trail for virtual currency distribution

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `date` | timestamptz | Completion timestamp | NOT NULL, DEFAULT NOW() |
| `id_user` | int | Participating user | NOT NULL, FK to user |
| `id_initiative` | int | Completed initiative | NOT NULL, FK to initiatives |
| `quantity` | int | Coins awarded | NOT NULL, CHECK > 0 |
| `created_at` | timestamptz | Record creation | NOT NULL, DEFAULT NOW() |

**Business Rules**:
- One user can complete the same initiative multiple times (if rules allow)
- Positive coin values only
- Immutable records for audit integrity

---

#### 5. `compliment` - Peer Recognition System
**Purpose**: Core peer-to-peer recognition functionality
**Business Justification**: Central feature for culture building and employee engagement

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `date` | timestamptz | Compliment timestamp | NOT NULL, DEFAULT NOW() |
| `id_sender_user` | int | User giving compliment | NOT NULL, FK to user |
| `id_receiver_user` | int | User receiving compliment | NOT NULL, FK to user |
| `quantity` | int | Coins transferred | NOT NULL, CHECK > 0 |
| `company_value` | varchar(100) | Associated company value | NOT NULL (Phase 1) |
| `description` | varchar(1000) | Compliment message | NOT NULL |
| `created_at` | timestamptz | Creation time | NOT NULL, DEFAULT NOW() |
| `company_value_id` | int | Structured value reference | Added in Phase 2 |

**Critical Constraint**: `no_self_compliment` prevents users from complimenting themselves

**Evolution**: Phase 2 replaces varchar `company_value` with structured `company_value_id`

---

#### 6. `rewards` - Reward Catalog
**Purpose**: Manage available rewards and prizes
**Business Justification**: Core marketplace functionality for coin spending

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `title` | varchar(200) | Reward name | NOT NULL |
| `image` | varchar(500) | Product image URL | Optional |
| `description` | text | Detailed description | NOT NULL |
| `price` | decimal(10,2) | Monetary price | NOT NULL, CHECK > 0 |
| `active` | boolean | Availability status | NOT NULL, DEFAULT true |
| `category` | varchar(100) | Product category | NOT NULL (Phase 1) |
| `brand` | varchar(100) | Brand/manufacturer | Optional |
| `redeemed` | int | Redemption counter | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `created_at` | timestamptz | Creation time | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last modification | NOT NULL, DEFAULT NOW() |
| `limited` | boolean | Limited availability flag | NOT NULL, DEFAULT false |
| `slug` | varchar(100) | URL-friendly identifier | NOT NULL, UNIQUE |
| `deleted_at` | timestamptz | Soft delete support | Added in Phase 3 |
| `category_id` | int | Structured category reference | Added in Phase 2 |

**Design Evolution**: Category management enhanced in Phase 2 with structured categories

---

#### 7. `stock` - Inventory Management
**Purpose**: Track available stock for limited rewards
**Business Justification**: Prevent overselling and manage inventory

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `id_reward` | int | Associated reward | NOT NULL, FK to rewards |
| `characteristic` | varchar(100) | Variant description (Size, Color) | NOT NULL |
| `quantity` | int | Available stock | NOT NULL, CHECK >= 0 |

**Why Separate Table**: Supports multiple variants per reward (different sizes, colors, etc.)

---

#### 8. `redeem` - Purchase & Fulfillment Tracking
**Purpose**: Complete order management and fulfillment tracking
**Business Justification**: Order history and shipping management

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `date` | timestamptz | Order timestamp | NOT NULL, DEFAULT NOW() |
| `id_user` | int | Purchasing user | NOT NULL, FK to user |
| `id_reward` | int | Purchased reward | NOT NULL, FK to rewards |
| `id_address` | int | Shipping address | Optional, FK to address |
| `purchased` | boolean | Payment status | NOT NULL, DEFAULT false |
| `delivery_estimate` | date | Expected delivery | Optional |
| `cancelled` | boolean | Cancellation flag | NOT NULL, DEFAULT false |
| `received_date` | date | Delivery confirmation | Optional |
| `cost` | decimal(10,2) | Final price paid | NOT NULL, CHECK >= 0 |
| `carrier` | varchar(100) | Shipping company | Optional |
| `tracking_code` | varchar(100) | Shipment tracking | Optional |
| `observations` | text | Order notes | Optional |
| `created_at` | timestamptz | Order creation | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Status updates | NOT NULL, DEFAULT NOW() |

**Complete Order Lifecycle**: From purchase → payment → fulfillment → delivery

---

#### 9. `doubts` - FAQ & Support System
**Purpose**: Knowledge base and user support
**Business Justification**: Reduce support load and improve user experience

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `question` | varchar(500) | FAQ question | NOT NULL |
| `answer` | text | Detailed answer | NOT NULL |
| `tags` | jsonb | Search/categorization tags | Optional |
| `active` | boolean | Visibility status | NOT NULL, DEFAULT true |
| `created_at` | timestamptz | Creation time | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last update | NOT NULL, DEFAULT NOW() |

**Search Optimization**: JSONB tags enable flexible categorization and search

---

#### 10-12. Admin System (`admin_roles`, `admin_permissions`, `permissions_to_roles`, `admin_users`)

**Purpose**: Role-based access control (RBAC) for administrative functions
**Business Justification**: Secure, scalable administrative access management

##### `admin_roles` - Administrative Role Definitions
| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `name` | varchar(50) | Role identifier | PRIMARY KEY |
| `description` | varchar(200) | Role description | NOT NULL |
| `created_at` | timestamptz | Creation time | NOT NULL, DEFAULT NOW() |

##### `admin_permissions` - Permission Catalog  
| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `name` | varchar(50) | Permission identifier | PRIMARY KEY |
| `description` | varchar(200) | Permission description | NOT NULL |
| `created_at` | timestamptz | Creation time | NOT NULL, DEFAULT NOW() |

##### `permissions_to_roles` - Role-Permission Mapping
| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `role_name` | varchar(50) | Role reference | FK to admin_roles, PRIMARY KEY |
| `permission_name` | varchar(50) | Permission reference | FK to admin_permissions, PRIMARY KEY |
| `created_at` | timestamptz | Assignment time | NOT NULL, DEFAULT NOW() |

##### `admin_users` - Administrative User Accounts
| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `email` | varchar(200) | Admin email | NOT NULL, UNIQUE |
| `avatar` | varchar(500) | Profile image | Optional |
| `name` | varchar(100) | Admin name | NOT NULL |
| `role` | varchar(50) | Assigned role | NOT NULL, FK to admin_roles |
| `active` | boolean | Account status | NOT NULL, DEFAULT true |
| `created_at` | timestamptz | Account creation | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last update | NOT NULL, DEFAULT NOW() |

**RBAC Benefits**:
- Granular permission control
- Easy role management
- Audit trail for admin actions
- Scalable permission system

---

## 🎯 Phase 2: Business Logic Enhancement (12 Tables)

### Enhanced Company Values System

#### 13. `company_values` - Structured Values Management
**Purpose**: Replace varchar company values with structured, themeable system
**Business Justification**: Consistent branding, better analytics, UI theming

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `code` | varchar(50) | Internal identifier | NOT NULL, UNIQUE |
| `name` | varchar(100) | Display name | NOT NULL |
| `description` | text | Value description | Optional |
| `icon` | varchar(200) | Icon/image URL | Optional |
| `color` | varchar(7) | Hex color code | Optional |
| `active` | boolean | Visibility status | NOT NULL, DEFAULT true |
| `sort_order` | int | Display ordering | NOT NULL, DEFAULT 0 |
| `created_at` | timestamptz | Creation time | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last update | NOT NULL, DEFAULT NOW() |

**UI Enhancement**: Color and icon support for consistent visual theming

---

### Advanced Transaction System

#### 14. `coin_transactions` - Complete Transaction History
**Purpose**: Comprehensive audit trail for all coin movements
**Business Justification**: Financial compliance, fraud prevention, detailed analytics

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Transaction owner | NOT NULL, FK to user |
| `transaction_type` | varchar(20) | CREDIT or DEBIT | NOT NULL |
| `source_type` | varchar(30) | Transaction source | NOT NULL |
| `source_id` | int | Reference to source record | Optional |
| `amount` | int | Transaction amount | NOT NULL, CHECK != 0 |
| `balance_before` | int | Pre-transaction balance | NOT NULL |
| `balance_after` | int | Post-transaction balance | NOT NULL |
| `description` | varchar(500) | Transaction description | Optional |
| `metadata` | jsonb | Additional context | Optional |
| `created_at` | timestamptz | Transaction time | NOT NULL, DEFAULT NOW() |

**Complex Constraints**:
- `check_balance_consistency`: Ensures balance calculations are correct
- `check_no_negative_balance`: Prevents negative balances
- `check_transaction_amount`: Prevents zero-amount transactions

**Source Types**: `COMPLIMENT_RECEIVED`, `REWARD_PURCHASE`, `INITIATIVE_COMPLETED`, etc.

---

### Social Engagement Features

#### 15. `compliment_reactions` - Social Validation
**Purpose**: Allow users to react to compliments (like, heart, clap)
**Business Justification**: Increase engagement, amplify recognition impact

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `compliment_id` | int | Target compliment | NOT NULL, FK to compliment |
| `user_id` | int | Reacting user | NOT NULL, FK to user |
| `reaction_type` | varchar(20) | Reaction kind | NOT NULL, DEFAULT 'LIKE' |
| `created_at` | timestamptz | Reaction time | NOT NULL, DEFAULT NOW() |

**Unique Constraint**: User can only give one reaction type per compliment

#### 16. `compliment_comments` - Discussion Threads
**Purpose**: Enable comments and discussions on compliments
**Business Justification**: Foster community engagement and deeper recognition

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `compliment_id` | int | Parent compliment | NOT NULL, FK to compliment |
| `user_id` | int | Comment author | NOT NULL, FK to user |
| `comment` | varchar(500) | Comment text | NOT NULL |
| `active` | boolean | Comment visibility | NOT NULL, DEFAULT true |
| `created_at` | timestamptz | Comment time | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last edit | NOT NULL, DEFAULT NOW() |

**Validation**: `check_comment_not_empty` ensures meaningful comments

---

### Enhanced Reward System

#### 17. `reward_categories` - Hierarchical Categories
**Purpose**: Structured, hierarchical reward categorization
**Business Justification**: Better organization, improved discovery, analytics

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `name` | varchar(100) | Category name | NOT NULL |
| `slug` | varchar(100) | URL identifier | NOT NULL, UNIQUE |
| `description` | text | Category description | Optional |
| `icon` | varchar(200) | Category icon | Optional |
| `color` | varchar(7) | Theme color | Optional |
| `parent_id` | int | Parent category | Optional, FK to self |
| `active` | boolean | Category status | NOT NULL, DEFAULT true |
| `sort_order` | int | Display order | NOT NULL, DEFAULT 0 |
| `created_at` | timestamptz | Creation time | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last update | NOT NULL, DEFAULT NOW() |

**Hierarchy Control**: `check_category_hierarchy()` function prevents cycles

#### 18. `reward_wishlist` - User Preferences
**Purpose**: User wishlist and preference tracking
**Business Justification**: Personalization, demand analytics, user engagement

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Wishlist owner | NOT NULL, FK to user |
| `reward_id` | int | Desired reward | NOT NULL, FK to rewards |
| `priority` | int | Preference priority | NOT NULL, DEFAULT 1 |
| `notes` | varchar(500) | User notes | Optional |
| `created_at` | timestamptz | Addition time | NOT NULL, DEFAULT NOW() |

**Priority Levels**: 1=HIGH, 2=MEDIUM, 3=LOW for prioritization

#### 19. `initiative_participants` - Enhanced Participation Tracking
**Purpose**: Detailed initiative participation beyond simple completion
**Business Justification**: Progress tracking, engagement analytics

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `initiative_id` | int | Target initiative | NOT NULL, FK to initiatives |
| `user_id` | int | Participant | NOT NULL, FK to user |
| `status` | varchar(20) | Participation status | NOT NULL, DEFAULT 'ACTIVE' |
| `joined_at` | timestamptz | Participation start | NOT NULL, DEFAULT NOW() |
| `completed_at` | timestamptz | Completion time | Optional |
| `progress_data` | jsonb | Custom progress tracking | Optional |
| `notes` | text | Participation notes | Optional |

**Status Values**: `ACTIVE`, `COMPLETED`, `WITHDRAWN`

---

### Communication System

#### 20. `notifications` - In-App Notifications
**Purpose**: Real-time user communication and engagement
**Business Justification**: User retention, important updates, engagement

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Notification recipient | NOT NULL, FK to user |
| `type` | varchar(50) | Notification category | NOT NULL |
| `title` | varchar(200) | Notification headline | NOT NULL |
| `message` | text | Full message content | NOT NULL |
| `data` | jsonb | Additional notification data | Optional |
| `read` | boolean | Read status | NOT NULL, DEFAULT false |
| `read_at` | timestamptz | Read timestamp | Optional |
| `created_at` | timestamptz | Notification time | NOT NULL, DEFAULT NOW() |

**Types**: `COMPLIMENT_RECEIVED`, `REWARD_AVAILABLE`, `INITIATIVE_UPDATE`, etc.

---

### Performance Optimization

#### 21. `mv_compliment_stats` - Materialized View
**Purpose**: Pre-calculated compliment statistics for dashboards
**Business Justification**: Performance optimization for analytics queries

**Calculated Metrics**:
- Total compliments by company value
- Average coins per compliment
- Unique senders/receivers
- Monthly trends

**Refresh Strategy**: Updated via scheduled tasks for optimal performance

---

### Business Intelligence Views

#### Views Created in Phase 2:
- `v_user_dashboard`: Optimized user dashboard data
- `v_reward_catalog`: Enhanced reward display with category info
- Performance views for common query patterns

---

## 🔒 Phase 3: Security & Compliance (8 Tables)

### Advanced User Security

#### 22. `user_security` - Enhanced Security Management
**Purpose**: Comprehensive user security beyond basic authentication
**Business Justification**: Enterprise security, compliance, threat prevention

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `id_user` | int | Associated user | NOT NULL, FK to user |
| `password_hash` | text | Secure password hash | NOT NULL |
| `password_changed_at` | timestamptz | Last password change | NOT NULL, DEFAULT NOW() |
| `failed_login_attempts` | int | Failed login counter | NOT NULL, DEFAULT 0, CHECK 0-10 |
| `locked_until` | timestamptz | Account lockout expiry | Optional |
| `last_login_at` | timestamptz | Last successful login | Optional |
| `last_login_ip` | inet | Login IP tracking | Optional |
| `last_login_user_agent` | text | Device/browser info | Optional |
| `mfa_enabled` | boolean | Multi-factor auth status | NOT NULL, DEFAULT false |
| `mfa_secret` | text | TOTP secret (encrypted) | Optional |
| `mfa_backup_codes` | text[] | Emergency backup codes | Optional |
| `password_reset_token` | varchar(255) | Reset token | Optional |
| `password_reset_expires` | timestamptz | Token expiration | Optional |
| `email_verification_token` | varchar(255) | Email verification | Optional |
| `email_verified_at` | timestamptz | Verification timestamp | Optional |
| `created_at` | timestamptz | Security record creation | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last security update | NOT NULL, DEFAULT NOW() |

**Security Features**:
- Account lockout after 5 failed attempts
- MFA with TOTP and backup codes
- Email verification requirement
- Secure password reset flow

---

#### 23. `rate_limits` - Abuse Prevention
**Purpose**: Prevent abuse and DoS attacks at database level
**Business Justification**: System stability, security, resource protection

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Rate limited user | Optional, FK to user |
| `ip_address` | inet | Source IP address | Optional |
| `endpoint` | varchar(100) | Target endpoint | NOT NULL |
| `operation` | varchar(50) | Operation type | Optional |
| `attempts` | int | Attempt counter | NOT NULL, DEFAULT 1, CHECK > 0 |
| `window_start` | timestamptz | Rate limit window start | NOT NULL, DEFAULT NOW() |
| `window_duration` | interval | Window duration | NOT NULL, DEFAULT '1 hour' |
| `blocked_until` | timestamptz | Block expiry time | Optional |
| `severity` | varchar(20) | Threat severity | NOT NULL, DEFAULT 'LOW' |
| `metadata` | jsonb | Additional context | Optional |
| `created_at` | timestamptz | Record creation | NOT NULL, DEFAULT NOW() |

**Rate Limit Strategy**: Both user-based and IP-based limiting for comprehensive protection

---

### Comprehensive Audit System

#### 24. `audit_logs` - Complete Change Tracking
**Purpose**: Enterprise audit trail for regulatory compliance
**Business Justification**: SOX, GDPR compliance, security investigations

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | User performing action | Optional, FK to user |
| `admin_user_id` | int | Admin performing action | Optional, FK to admin_users |
| `action` | varchar(50) | Operation type | NOT NULL |
| `entity_type` | varchar(50) | Affected entity type | Optional |
| `entity_id` | varchar(50) | Affected entity ID | Optional |
| `old_values` | jsonb | Previous state | Optional |
| `new_values` | jsonb | New state | Optional |
| `ip_address` | inet | Source IP | Optional |
| `user_agent` | text | Client information | Optional |
| `session_id` | varchar(255) | Session identifier | Optional |
| `request_id` | varchar(255) | Request tracing | Optional |
| `severity` | varchar(20) | Log severity | NOT NULL, DEFAULT 'INFO' |
| `compliance_flag` | boolean | Compliance relevance | NOT NULL, DEFAULT false |
| `timestamp` | timestamptz | Event timestamp | NOT NULL, DEFAULT NOW() |

**Actions Tracked**: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `PERMISSION_CHANGE`, etc.

#### 25. `security_events` - Threat Monitoring
**Purpose**: Security incident tracking and alerting
**Business Justification**: Threat detection, incident response, compliance

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `event_type` | varchar(50) | Security event type | NOT NULL |
| `severity` | varchar(20) | Threat severity | NOT NULL |
| `user_id` | int | Affected user | Optional, FK to user |
| `ip_address` | inet | Source IP | Optional |
| `user_agent` | text | Client info | Optional |
| `description` | text | Event description | NOT NULL |
| `event_data` | jsonb | Additional event details | Optional |
| `resolved` | boolean | Resolution status | NOT NULL, DEFAULT false |
| `resolved_at` | timestamptz | Resolution time | Optional |
| `resolved_by` | int | Resolving admin | Optional |
| `resolution_notes` | text | Resolution details | Optional |
| `created_at` | timestamptz | Event time | NOT NULL, DEFAULT NOW() |

**Event Types**: `FAILED_LOGIN`, `SUSPICIOUS_ACTIVITY`, `ACCOUNT_LOCKED`, `PRIVILEGE_ESCALATION`, etc.

---

### Data Protection & Privacy

#### 26. `user_consents` - GDPR Compliance
**Purpose**: Track user consent for data processing
**Business Justification**: GDPR Article 6 & 7 compliance, legal protection

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Consenting user | NOT NULL, FK to user |
| `consent_type` | varchar(50) | Type of consent | NOT NULL |
| `granted` | boolean | Consent status | NOT NULL |
| `ip_address` | inet | Consent source IP | Optional |
| `user_agent` | text | Client information | Optional |
| `granted_at` | timestamptz | Consent timestamp | NOT NULL, DEFAULT NOW() |
| `withdrawn_at` | timestamptz | Withdrawal time | Optional |
| `version` | varchar(10) | Policy version | NOT NULL, DEFAULT '1.0' |
| `source` | varchar(50) | Consent source | NOT NULL, DEFAULT 'WEB' |
| `metadata` | jsonb | Additional context | Optional |

**Consent Types**: `MARKETING`, `ANALYTICS`, `COOKIES`, `PROFILING`, `THIRD_PARTY`

**Legal Logic**: `check_consent_withdrawn_logic` ensures proper consent workflow

#### 27. `encrypted_personal_data` - Sensitive Data Protection
**Purpose**: Encrypted storage for sensitive personal information
**Business Justification**: Data protection, privacy compliance, security

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Data owner | NOT NULL, FK to user |
| `data_type` | varchar(50) | Data classification | NOT NULL |
| `encrypted_value` | text | AES-256-GCM encrypted data | NOT NULL |
| `hash_value` | varchar(64) | SHA-256 for searching | Optional |
| `encryption_key_id` | varchar(50) | Key rotation support | NOT NULL |
| `encryption_algorithm` | varchar(50) | Encryption method | NOT NULL, DEFAULT 'AES-256-GCM' |
| `created_at` | timestamptz | Encryption time | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last re-encryption | NOT NULL, DEFAULT NOW() |

**Data Types**: `CPF`, `PHONE`, `SSN`, `PASSPORT`, etc.

**Key Rotation**: Support for encryption key versioning and rotation

---

### Session Management

#### 28. `user_sessions` - Comprehensive Session Tracking
**Purpose**: Secure session management with device tracking
**Business Justification**: Security monitoring, session hijacking prevention

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | varchar(255) | Session token/JWT ID | PRIMARY KEY |
| `user_id` | int | Session owner | NOT NULL, FK to user |
| `session_type` | varchar(20) | Session type | NOT NULL, DEFAULT 'WEB' |
| `ip_address` | inet | Session IP | Optional |
| `user_agent` | text | Client details | Optional |
| `device_fingerprint` | varchar(255) | Device identification | Optional |
| `location` | jsonb | Geographic data | Optional |
| `created_at` | timestamptz | Session start | NOT NULL, DEFAULT NOW() |
| `expires_at` | timestamptz | Session expiry | NOT NULL |
| `revoked_at` | timestamptz | Manual revocation | Optional |
| `revoked_reason` | varchar(100) | Revocation reason | Optional |
| `last_activity` | timestamptz | Last activity | NOT NULL, DEFAULT NOW() |
| `activity_count` | int | Activity counter | NOT NULL, DEFAULT 1 |
| `is_suspicious` | boolean | Suspicious activity flag | NOT NULL, DEFAULT false |
| `metadata` | jsonb | Additional session data | Optional |

**Session Types**: `WEB`, `MOBILE`, `API`

**Security Features**: Device fingerprinting, suspicious activity detection, geographic tracking

---

### Data Management

#### 29. `data_retention_policies` - Automated Data Management
**Purpose**: Define and track data retention policies
**Business Justification**: GDPR compliance, storage optimization, legal requirements

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `table_name` | varchar(50) | Target table | NOT NULL |
| `retention_days` | int | Retention period | NOT NULL, CHECK > 0 |
| `deletion_strategy` | varchar(20) | Deletion method | NOT NULL |
| `last_cleanup` | timestamptz | Last execution | Optional |
| `active` | boolean | Policy status | NOT NULL, DEFAULT true |
| `description` | text | Policy description | Optional |
| `created_at` | timestamptz | Policy creation | NOT NULL, DEFAULT NOW() |

**Strategies**: `SOFT` (mark deleted), `HARD` (permanent delete), `ARCHIVE` (move to archive)

---

## 🌍 Phase 4: Internationalization (10 Tables)

### Language & Cultural Support

#### 30. `languages` - Comprehensive Language Support
**Purpose**: Define supported languages with cultural settings
**Business Justification**: Global platform support, cultural sensitivity

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `code` | varchar(5) | ISO language code | PRIMARY KEY |
| `name` | varchar(100) | English name | NOT NULL |
| `native_name` | varchar(100) | Native language name | NOT NULL |
| `active` | boolean | Language availability | NOT NULL, DEFAULT true |
| `rtl` | boolean | Right-to-left support | NOT NULL, DEFAULT false |
| `flag_emoji` | varchar(10) | Country flag for UI | Optional |
| `decimal_separator` | varchar(1) | Number formatting | NOT NULL, DEFAULT '.' |
| `thousands_separator` | varchar(1) | Number formatting | NOT NULL, DEFAULT ',' |
| `date_format` | varchar(20) | Date display format | NOT NULL, DEFAULT 'YYYY-MM-DD' |
| `time_format` | varchar(10) | Time display format | NOT NULL, DEFAULT '24h' |
| `first_day_of_week` | smallint | Week start day | NOT NULL, DEFAULT 0 |
| `created_at` | timestamptz | Language addition | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last update | NOT NULL, DEFAULT NOW() |

**Cultural Considerations**:
- RTL support for Arabic, Hebrew
- Cultural number formatting (1,000.00 vs 1.000,00)
- Week start preferences (Sunday vs Monday)
- Time format preferences (12h vs 24h)

#### 31. `currencies` - Multi-Currency Support
**Purpose**: Support multiple currencies with proper formatting
**Business Justification**: Global market support, local pricing

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `code` | varchar(3) | ISO 4217 currency code | PRIMARY KEY |
| `name` | varchar(100) | Currency name | NOT NULL |
| `symbol` | varchar(10) | Currency symbol | NOT NULL |
| `symbol_position` | varchar(10) | Symbol placement | NOT NULL, DEFAULT 'before' |
| `decimal_places` | smallint | Decimal precision | NOT NULL, DEFAULT 2, CHECK 0-8 |
| `active` | boolean | Currency availability | NOT NULL, DEFAULT true |
| `is_crypto` | boolean | Cryptocurrency flag | NOT NULL, DEFAULT false |
| `created_at` | timestamptz | Currency addition | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last update | NOT NULL, DEFAULT NOW() |

**Examples**:
- USD: $ before, 2 decimals
- JPY: ¥ before, 0 decimals
- BTC: ₿ before, 8 decimals (cryptocurrency)

#### 32. `exchange_rates` - Currency Conversion
**Purpose**: Maintain current exchange rates for currency conversion
**Business Justification**: Real-time pricing, fair currency conversion

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `from_currency` | varchar(3) | Source currency | NOT NULL, FK to currencies |
| `to_currency` | varchar(3) | Target currency | NOT NULL, FK to currencies |
| `rate` | decimal(20,8) | Exchange rate | NOT NULL, CHECK > 0 |
| `rate_date` | date | Rate validity date | NOT NULL |
| `source` | varchar(50) | Rate source | NOT NULL, DEFAULT 'API' |
| `created_at` | timestamptz | Rate record time | NOT NULL, DEFAULT NOW() |

**Rate Sources**: `API` (external service), `MANUAL` (admin entry), `BANK` (bank rates)

**Unique Constraint**: One rate per currency pair per date

---

### User Localization

#### 33. `user_preferences` - Personal Localization Settings
**Purpose**: Store user's personal localization preferences
**Business Justification**: Personalized user experience, cultural adaptation

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `user_id` | int | User reference | PRIMARY KEY, FK to user |
| `language_code` | varchar(5) | Preferred language | NOT NULL, DEFAULT 'en', FK to languages |
| `timezone` | varchar(50) | IANA timezone | NOT NULL, DEFAULT 'UTC' |
| `currency_code` | varchar(3) | Preferred currency | NOT NULL, DEFAULT 'USD', FK to currencies |
| `date_format` | varchar(20) | Date formatting | NOT NULL, DEFAULT 'YYYY-MM-DD' |
| `time_format` | varchar(10) | Time formatting | NOT NULL, DEFAULT '24h' |
| `number_format` | varchar(10) | Number locale | NOT NULL, DEFAULT 'en-US' |
| `first_day_of_week` | smallint | Week start override | NOT NULL, DEFAULT 1 |
| `theme` | varchar(20) | UI theme preference | NOT NULL, DEFAULT 'light' |
| `density` | varchar(20) | UI density | NOT NULL, DEFAULT 'normal' |
| `email_frequency` | varchar(20) | Email preferences | NOT NULL, DEFAULT 'daily' |
| `push_notifications` | boolean | Push notification setting | NOT NULL, DEFAULT true |
| `created_at` | timestamptz | Preference creation | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last update | NOT NULL, DEFAULT NOW() |

**Comprehensive Personalization**: Language, culture, UI, communication preferences

---

### Localized Content System

#### 34. `initiatives_i18n` - Multi-Language Initiatives
**Purpose**: Store translated initiative content
**Business Justification**: Global content accessibility, local relevance

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `initiative_id` | int | Parent initiative | NOT NULL, FK to initiatives |
| `language_code` | varchar(5) | Content language | NOT NULL, FK to languages |
| `title` | varchar(200) | Translated title | NOT NULL |
| `description` | text | Translated description | NOT NULL |
| `created_at` | timestamptz | Translation creation | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last update | NOT NULL, DEFAULT NOW() |

**Unique Constraint**: One translation per initiative per language

#### 35. `rewards_i18n` - Multi-Language Rewards
**Purpose**: Translated reward information
**Business Justification**: Global product accessibility, local appeal

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `reward_id` | int | Parent reward | NOT NULL, FK to rewards |
| `language_code` | varchar(5) | Content language | NOT NULL, FK to languages |
| `title` | varchar(200) | Translated title | NOT NULL |
| `description` | text | Translated description | NOT NULL |
| `category` | varchar(100) | Translated category | NOT NULL |
| `created_at` | timestamptz | Translation creation | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last update | NOT NULL, DEFAULT NOW() |

#### 36. `company_values_i18n` - Multi-Language Company Values
**Purpose**: Translated company values for global teams
**Business Justification**: Cultural alignment, global understanding

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `value_id` | int | Parent value | NOT NULL, FK to company_values |
| `language_code` | varchar(5) | Translation language | NOT NULL, FK to languages |
| `name` | varchar(100) | Translated value name | NOT NULL |
| `description` | text | Translated description | Optional |
| `created_at` | timestamptz | Translation time | NOT NULL, DEFAULT NOW() |

#### 37. `reward_categories_i18n` - Multi-Language Categories
**Purpose**: Translated category names and descriptions
**Business Justification**: Localized browsing experience

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `category_id` | int | Parent category | NOT NULL, FK to reward_categories |
| `language_code` | varchar(5) | Translation language | NOT NULL, FK to languages |
| `name` | varchar(100) | Translated category name | NOT NULL |
| `description` | text | Translated description | Optional |
| `created_at` | timestamptz | Translation time | NOT NULL, DEFAULT NOW() |

---

### Multi-Currency Pricing

#### 38. `reward_pricing` - Currency-Specific Pricing
**Purpose**: Store reward prices in multiple currencies
**Business Justification**: Local pricing strategies, currency preference support

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `reward_id` | int | Priced reward | NOT NULL, FK to rewards |
| `currency_code` | varchar(3) | Price currency | NOT NULL, FK to currencies |
| `price` | decimal(15,4) | Monetary price | NOT NULL, CHECK > 0 |
| `coins_price` | int | Platform coin price | NOT NULL, CHECK > 0 |
| `active` | boolean | Pricing availability | NOT NULL, DEFAULT true |
| `created_at` | timestamptz | Price creation | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Price update | NOT NULL, DEFAULT NOW() |

**Dual Pricing**: Both monetary and coin pricing for flexibility

#### 39. `system_translations` - UI Translations
**Purpose**: Store system UI text translations
**Business Justification**: Complete interface localization

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `translation_key` | varchar(100) | Translation identifier | NOT NULL |
| `language_code` | varchar(5) | Target language | NOT NULL, FK to languages |
| `translation` | text | Translated text | NOT NULL |
| `context` | varchar(100) | Translation context | Optional |
| `pluralization` | jsonb | Plural form rules | Optional |
| `created_at` | timestamptz | Translation creation | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last update | NOT NULL, DEFAULT NOW() |

**Translation Keys**: Hierarchical like `buttons.save`, `nav.dashboard`, `messages.welcome`

**Pluralization**: JSON rules for complex plural forms in different languages

---

## 📊 Phase 5: Analytics & Advanced Features (8 Tables)

### User Activity Analytics

#### 40. `user_activities` - Comprehensive Activity Tracking
**Purpose**: Track all user interactions for analytics and personalization
**Business Justification**: User behavior analysis, engagement optimization, personalization

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Acting user | NOT NULL, FK to user |
| `activity_type` | varchar(50) | Activity classification | NOT NULL |
| `activity_category` | varchar(30) | High-level category | NOT NULL, DEFAULT 'ENGAGEMENT' |
| `entity_type` | varchar(50) | Target entity type | Optional |
| `entity_id` | int | Target entity ID | Optional |
| `metadata` | jsonb | Flexible activity data | Optional |
| `value_impact` | int | Coin/value change | DEFAULT 0 |
| `session_id` | varchar(255) | User session | Optional |
| `ip_address` | inet | Source IP | Optional |
| `user_agent` | text | Client information | Optional |
| `referrer` | varchar(500) | HTTP referrer | Optional |
| `timestamp` | timestamptz | Activity time | NOT NULL, DEFAULT NOW() |

**Activity Types**: `LOGIN`, `COMPLIMENT_SENT`, `COMPLIMENT_RECEIVED`, `REWARD_CLAIMED`, `SEARCH_PERFORMED`, etc.

**Categories**: `ENGAGEMENT`, `TRANSACTION`, `SECURITY`, `SYSTEM`, `SOCIAL`

#### 41. `user_behavior_patterns` - AI-Powered Insights
**Purpose**: Store detected user behavior patterns for personalization
**Business Justification**: AI-driven personalization, user experience optimization

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Pattern owner | NOT NULL, FK to user |
| `pattern_type` | varchar(50) | Pattern classification | NOT NULL |
| `pattern_data` | jsonb | Pattern details | NOT NULL |
| `confidence_score` | decimal(5,4) | AI confidence | DEFAULT 0.5, CHECK 0.0-1.0 |
| `last_updated` | timestamptz | Pattern refresh | NOT NULL, DEFAULT NOW() |
| `created_at` | timestamptz | Pattern discovery | NOT NULL, DEFAULT NOW() |

**Pattern Types**: `ACTIVE_HOURS`, `PREFERRED_CATEGORIES`, `INTERACTION_STYLE`, `ENGAGEMENT_LEVEL`

#### 42. `user_statistics` - Aggregated Metrics
**Purpose**: Pre-calculated user engagement statistics
**Business Justification**: Performance optimization, quick dashboard loading

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Statistics owner | NOT NULL, FK to user |
| `period_type` | varchar(10) | Aggregation period | NOT NULL |
| `period_start` | date | Period beginning | NOT NULL |
| `period_end` | date | Period end | NOT NULL |
| `login_count` | int | Login frequency | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `active_days` | int | Days active | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `session_duration_avg` | interval | Average session length | Optional |
| `compliments_sent` | int | Compliments given | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `compliments_received` | int | Compliments received | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `coins_given` | int | Coins donated | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `coins_received` | int | Coins earned | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `rewards_claimed` | int | Rewards redeemed | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `coins_spent` | int | Coins spent | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `reactions_given` | int | Reactions made | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `reactions_received` | int | Reactions received | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `comments_made` | int | Comments posted | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `initiatives_joined` | int | Initiatives participated | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `initiatives_completed` | int | Initiatives finished | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `created_at` | timestamptz | Statistics calculation | NOT NULL, DEFAULT NOW() |

**Period Types**: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`

---

### Business Intelligence

#### 43. `company_metrics` - KPI Tracking
**Purpose**: Track company-wide key performance indicators
**Business Justification**: Data-driven decision making, performance monitoring

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `metric_name` | varchar(100) | KPI identifier | NOT NULL |
| `metric_category` | varchar(50) | KPI classification | NOT NULL, DEFAULT 'ENGAGEMENT' |
| `metric_value` | decimal(15,4) | KPI value | NOT NULL |
| `metric_unit` | varchar(20) | Value unit | Optional |
| `metric_date` | date | Measurement date | NOT NULL |
| `department` | varchar(100) | Department scope | Optional |
| `team` | varchar(100) | Team scope | Optional |
| `metadata` | jsonb | Additional context | Optional |
| `calculation_method` | varchar(100) | How calculated | Optional |
| `created_at` | timestamptz | Metric calculation | NOT NULL, DEFAULT NOW() |

**Categories**: `ENGAGEMENT`, `FINANCIAL`, `GROWTH`, `SATISFACTION`, `PRODUCTIVITY`, `RETENTION`

**Sample Metrics**: `daily_active_users`, `compliment_rate`, `retention_rate`, `nps_score`

---

### Advanced Search System

#### 44. `search_indexes` - Full-Text Search
**Purpose**: Optimized search indexes for content discovery
**Business Justification**: Fast, relevant search results, improved user experience

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `entity_type` | varchar(50) | Searchable entity | NOT NULL |
| `entity_id` | int | Entity reference | NOT NULL |
| `language_code` | varchar(5) | Content language | NOT NULL, DEFAULT 'en', FK to languages |
| `search_vector` | tsvector | PostgreSQL search vector | NOT NULL |
| `content_hash` | varchar(64) | Change detection | Optional |
| `indexed_at` | timestamptz | Index creation/update | NOT NULL, DEFAULT NOW() |

**GIN Index**: `idx_search_indexes_vector` for fast full-text search

#### 45. `search_queries` - Search Analytics
**Purpose**: Track user search behavior for optimization
**Business Justification**: Search improvement, content discovery, user behavior analysis

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Searching user | Optional, FK to user |
| `query` | varchar(500) | Search query | NOT NULL |
| `filters` | jsonb | Applied filters | Optional |
| `results_count` | int | Result count | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `clicked_result_id` | int | Selected result | Optional |
| `clicked_result_type` | varchar(50) | Result entity type | Optional |
| `session_id` | varchar(255) | Search session | Optional |
| `created_at` | timestamptz | Search time | NOT NULL, DEFAULT NOW() |

#### 46. `filter_presets` - Personalized Filters
**Purpose**: Save user's custom filter configurations
**Business Justification**: Personalization, improved user experience

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `user_id` | int | Filter owner | Optional, FK to user |
| `name` | varchar(100) | Preset name | NOT NULL |
| `entity_type` | varchar(50) | What's being filtered | NOT NULL |
| `filters` | jsonb | Filter configuration | NOT NULL |
| `is_public` | boolean | Shareable preset | NOT NULL, DEFAULT false |
| `usage_count` | int | Usage tracking | NOT NULL, DEFAULT 0, CHECK >= 0 |
| `created_at` | timestamptz | Preset creation | NOT NULL, DEFAULT NOW() |
| `updated_at` | timestamptz | Last modification | NOT NULL, DEFAULT NOW() |

---

### System Monitoring

#### 47. `system_health_checks` - Health Monitoring
**Purpose**: Automated system health monitoring and reporting
**Business Justification**: System reliability, proactive maintenance, uptime assurance

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `check_name` | varchar(100) | Health check identifier | NOT NULL |
| `check_category` | varchar(50) | Check classification | NOT NULL |
| `status` | varchar(20) | Check result | NOT NULL |
| `message` | text | Check details | Optional |
| `execution_time` | interval | Check duration | Optional |
| `metadata` | jsonb | Additional check data | Optional |
| `checked_at` | timestamptz | Check execution time | NOT NULL, DEFAULT NOW() |

**Categories**: `PERFORMANCE`, `SECURITY`, `DATA_INTEGRITY`, `AVAILABILITY`, `COMPLIANCE`

**Statuses**: `PASS`, `FAIL`, `WARNING`

#### 48. `query_performance_logs` - Database Performance
**Purpose**: Monitor database query performance
**Business Justification**: Performance optimization, bottleneck identification

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | INT IDENTITY | Primary key | PRIMARY KEY |
| `query_type` | varchar(50) | Query classification | NOT NULL |
| `table_name` | varchar(50) | Primary table | Optional |
| `execution_time` | interval | Query duration | NOT NULL |
| `rows_affected` | int | Result/update count | Optional |
| `query_hash` | varchar(64) | Query identifier | Optional |
| `user_id` | int | Query executor | Optional |
| `logged_at` | timestamptz | Log time | NOT NULL, DEFAULT NOW() |

---

## 📈 Materialized Views & Performance Optimization

### Pre-Calculated Analytics Views

#### `mv_user_dashboard_stats` - Dashboard Performance
**Purpose**: Pre-calculated user dashboard data for fast loading
**Refresh Strategy**: Updated via scheduled tasks (hourly/daily)

**Calculated Metrics**:
- Compliment statistics (sent, received, coins)
- Activity summaries
- Engagement rankings
- Recent activity timestamps

#### `mv_company_analytics` - Business Intelligence
**Purpose**: Company-wide analytics for executive dashboards
**Refresh Strategy**: Daily refresh for trending data

**Calculated Metrics**:
- Active user trends
- Engagement metrics by month
- Platform adoption rates
- Growth indicators

---

## 🔧 Functions & Stored Procedures

### Core Utility Functions

#### 1. `update_updated_at_column()` - Timestamp Management
**Purpose**: Automatically update `updated_at` columns
**Usage**: Triggered on all UPDATE operations
**Business Value**: Consistent audit trails

#### 2. `log_data_changes()` - Audit Logging
**Purpose**: Automatic audit trail creation
**Usage**: Triggered on all data modifications
**Compliance**: Required for SOX, GDPR compliance

#### 3. `record_login_attempt()` - Security Function
**Purpose**: Track login attempts and implement security measures
**Features**: 
- Failed attempt counting
- Account lockout logic
- Security event creation
- Breach detection

#### 4. `is_user_locked()` - Security Check
**Purpose**: Verify user account status before authentication
**Return**: Boolean indicating lockout status

#### 5. `get_user_timestamp()` - Timezone Function
**Purpose**: Convert UTC timestamps to user's timezone
**Usage**: Display localized times in UI

#### 6. `format_currency_amount()` - Internationalization
**Purpose**: Format currency amounts per user preferences
**Features**: 
- Multi-currency support
- Cultural formatting
- Symbol positioning

#### 7. `calculate_user_engagement_score()` - Analytics
**Purpose**: Calculate user engagement scores
**Algorithm**: Weighted scoring based on activities
**Usage**: User ranking and gamification

#### 8. `refresh_analytics_views()` - Performance
**Purpose**: Refresh all materialized views
**Scheduling**: Called by cron jobs
**Error Handling**: Logs failures for monitoring

#### 9. `update_search_indexes()` - Search Optimization
**Purpose**: Maintain full-text search indexes
**Features**:
- Multi-language support
- Content change detection
- Incremental updates

#### 10. `cleanup_old_data()` - Data Management
**Purpose**: Implement data retention policies
**Strategies**: Soft delete, hard delete, archival
**Compliance**: GDPR data minimization

#### 11. `validate_database_integrity()` - Quality Assurance
**Purpose**: Comprehensive database health check
**Checks**:
- Foreign key integrity
- Orphaned record detection
- Constraint validation
- Performance metrics

### Trigger Functions

#### 12. `check_category_hierarchy()` - Business Logic
**Purpose**: Prevent circular references in category hierarchy
**Validation**: Maximum 10-level depth, cycle detection

#### 13. `update_session_activity()` - Security Monitoring
**Purpose**: Track user session activity
**Features**: Activity counting, timestamp updates

---

## 🎯 Constraints & Business Rules

### Data Integrity Constraints

#### Check Constraints by Category

**Financial Integrity**:
- `check_coins_non_negative`: Prevent negative coin balances
- `check_transaction_amount`: No zero-amount transactions
- `check_balance_consistency`: Ensure transaction math is correct
- `check_positive_prices`: All prices must be positive

**Security Constraints**:
- `check_failed_attempts`: Limit failed login attempts (0-10)
- `check_password_not_empty`: Require password hash
- `check_valid_severity`: Validate security event severity levels

**Business Logic**:
- `no_self_compliment`: Users cannot compliment themselves
- `check_comment_not_empty`: Require meaningful comments
- `check_positive_stats`: All statistics must be non-negative

**Data Quality**:
- `check_translation_not_empty`: Require translation content
- `check_encrypted_value_not_empty`: Require encrypted data

**System Integrity**:
- `check_retention_days_positive`: Positive retention periods
- `check_valid_deletion_strategy`: Valid deletion methods
- `check_session_times`: Logical session timestamps

### Unique Constraints

#### Multi-Column Uniqueness

**User Experience**:
- `(user_id, reward_id)`: One wishlist entry per user per reward
- `(user_id, default_address)`: One default address per user (conditional)
- `(initiative_id, user_id)`: One participation record per user per initiative

**Content Management**:
- `(initiative_id, language_code)`: One translation per language
- `(reward_id, language_code)`: One translation per language  
- `(translation_key, language_code)`: One UI translation per language

**System Integrity**:
- `(role_name, permission_name)`: Unique permission assignments
- `(from_currency, to_currency, rate_date)`: Unique exchange rates per day

### Foreign Key Relationships

#### Cascade Strategies

**CASCADE Deletions** (Data follows user):
- User → Address, Preferences, Security, Sessions
- Reward → Stock, Pricing, Translations
- Initiative → Participation, Translations

**RESTRICT Deletions** (Prevent deletion if referenced):
- Initiatives referenced by credits
- Rewards referenced by redemptions
- Admin roles referenced by users

**SET NULL** (Optional relationships):
- Address can be null for digital rewards
- Search queries can exist without user (anonymous)

---

## 📊 Indexing Strategy

### Performance Index Categories

#### Primary Access Patterns

**User-Centric Queries**:
```sql
-- Fast user lookups
idx_user_email (email)
idx_user_active (active) WHERE deleted_at IS NULL

-- User activity patterns  
idx_user_activities_user_type (user_id, activity_type, timestamp)
idx_compliment_receiver (id_receiver_user)
idx_redeem_user_date (id_user, created_at, cancelled)
```

**Business Logic Queries**:
```sql
-- Reward discovery
idx_rewards_category (category_id)  
idx_rewards_active_price (price) WHERE active = true

-- Initiative tracking
idx_credits_user (id_user)
idx_initiative_participants_initiative (initiative_id, status)
```

**Security & Audit**:
```sql
-- Security monitoring
idx_user_security_login_attempts (failed_login_attempts, locked_until)
idx_security_events_unresolved (resolved, created_at) WHERE resolved = false

-- Audit trail
idx_audit_logs_user_action (user_id, action, timestamp)
idx_audit_logs_compliance (compliance_flag, timestamp) WHERE compliance_flag = true
```

#### Search & Analytics

**Full-Text Search**:
```sql
-- Content search
idx_search_indexes_vector USING gin(search_vector)
idx_system_translations_search USING gin(to_tsvector('simple', translation_key || ' ' || translation))

-- Rewards/initiatives search  
idx_rewards_search USING gin(to_tsvector('english', title || ' ' || description))
idx_initiatives_search USING gin(to_tsvector('english', title || ' ' || description))
```

**JSON Optimization**:
```sql
-- JSON field queries
idx_user_activities_metadata_gin USING gin(metadata)
idx_initiatives_rules_gin USING gin(rules)  
idx_initiatives_tags USING gin(tags)
```

**Analytics Performance**:
```sql
-- Statistics aggregation
idx_user_statistics_period (period_type, period_start)
idx_company_metrics_date (metric_date, metric_name)
idx_praise_stats_period (period_type, period_start)
```

#### Partial Indexes (Performance Optimization)

**Active Data Only**:
```sql
-- Only index active records for better performance
idx_user_active ON user (id) WHERE deleted_at IS NULL
idx_rewards_active_not_deleted ON rewards (active) WHERE deleted_at IS NULL
idx_initiatives_active ON initiatives (id) WHERE deleted_at IS NULL
```

**Security & Monitoring**:
```sql
-- Only index problematic sessions
idx_user_sessions_suspicious ON user_sessions (is_suspicious, created_at) WHERE is_suspicious = true

-- Only index unresolved security events
idx_security_events_unresolved ON security_events (resolved, created_at) WHERE resolved = false

-- Only index active sessions
idx_user_sessions_active ON user_sessions (user_id) WHERE revoked_at IS NULL AND expires_at > NOW()
```

---

## 🔄 Triggers & Automation

### Data Management Triggers

#### Timestamp Management
**Applied to Tables**: All tables with `updated_at` columns
**Function**: `update_updated_at_column()`
**Purpose**: Maintain accurate modification timestamps

#### Audit Trail Triggers
**Applied to Tables**: Critical business tables (user, compliment, redeem, coin_transactions)
**Function**: `log_data_changes()`
**Purpose**: Comprehensive change tracking for compliance

### Business Logic Triggers

#### Category Hierarchy Validation
**Table**: `reward_categories`
**Function**: `check_category_hierarchy()`
**Validation**: 
- Prevent circular references
- Limit hierarchy depth to 10 levels
- Maintain data integrity

#### Session Activity Tracking
**Function**: `update_session_activity()`
**Purpose**: Monitor user session engagement
**Data**: Activity counts, last activity timestamps

---

## 📋 Summary Statistics

### Complete Database Metrics

| Component Type | Count | Purpose |
|----------------|-------|---------|
| **Core Tables** | 12 | Essential business operations |
| **Business Logic Tables** | 12 | Advanced features & social |
| **Security Tables** | 8 | Enterprise security & compliance |
| **I18n Tables** | 10 | Global platform support |
| **Analytics Tables** | 8 | Business intelligence & optimization |
| **Total Tables** | **50** | **Complete platform** |
| **Indexes** | **150+** | Query performance optimization |
| **Views** | **20+** | Simplified data access |
| **Materialized Views** | **5+** | Pre-calculated analytics |
| **Functions** | **15+** | Business logic & utilities |
| **Triggers** | **25+** | Automated data management |
| **Constraints** | **100+** | Data integrity & validation |

### Business Value by Phase

| Phase | Business Impact | Technical Foundation | Compliance Level |
|-------|----------------|---------------------|------------------|
| **Phase 1** | Core functionality | Essential relationships | Basic |
| **Phase 2** | Enhanced engagement | Advanced business logic | Improved |
| **Phase 3** | Enterprise security | Comprehensive audit | Full compliance |
| **Phase 4** | Global platform | International support | Localized compliance |
| **Phase 5** | Data-driven insights | Performance optimization | Analytics-ready |

### Compliance & Security Coverage

| Requirement | Implementation | Tables Involved | Status |
|-------------|----------------|-----------------|---------|
| **GDPR Article 6** | Consent management | user_consents, encrypted_personal_data | ✅ Complete |
| **GDPR Article 7** | Consent withdrawal | user_consents (withdrawn_at) | ✅ Complete |
| **Right to be Forgotten** | Soft deletes | All major tables (deleted_at) | ✅ Complete |
| **Data Portability** | JSON exports | All user data accessible | ✅ Complete |
| **SOX Compliance** | Audit trails | audit_logs, security_events | ✅ Complete |
| **PCI DSS** | No card data stored | N/A - Coins only | ✅ N/A |
| **Data Retention** | Automated cleanup | data_retention_policies | ✅ Complete |

---

**This comprehensive analysis covers every database component in the Valorize platform, providing complete justification for design decisions, business value, and technical implementation details. The phased approach ensures systematic deployment while maintaining data integrity and system performance throughout the platform's evolution.** 