# Authentication System - Valorize API

## Overview

The Valorize API authentication system uses **Auth0** as the identity provider and **JWT (JSON Web Tokens)** for stateless authentication. The flow is implemented through Fastify middleware that automatically processes all requests.

## Architecture

### Main Components

1. **Auth0** - External identity provider
2. **@fastify/jwt** - Fastify plugin for JWT validation
3. **jwks-rsa** - Client for fetching Auth0 public keys
4. **auth0Middleware** - Global authentication middleware
5. **requirePermission** - RBAC middleware for access control

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Client
    participant API as Valorize API
    participant Auth0 as Auth0
    participant JWKS as Auth0 JWKS
    participant DB as Database

    Note over Client,DB: 1. Login Process
    Client->>API: POST /auth/login<br/>{email, password}
    API->>Auth0: POST /oauth/token<br/>(Resource Owner Password Grant)
    Auth0->>API: {access_token, refresh_token, user_info}
    API->>Auth0: GET /userinfo<br/>(Bearer access_token)
    Auth0->>API: User profile data
    API->>Client: {access_token, refresh_token, user_info}

    Note over Client,DB: 2. Authenticated Request
    Client->>API: Request + Authorization: Bearer <jwt>
    
    Note over API: 3. Global Middleware (preHandler)
    API->>API: auth0Middleware executes
    
    Note over API: 4. Initial Validations
    API->>API: Check if route is public
    API->>API: Extract token from header
    API->>API: Validate Bearer format
    
    Note over API: 5. JWT Verification
    API->>API: request.jwtVerify()
    API->>JWKS: Fetch public key (kid)
    JWKS->>API: Return public key
    API->>API: Validate JWT signature
    API->>API: Verify issuer/audience
    
    Note over API: 6. User Object Creation
    API->>API: Extract payload data
    API->>API: Create AuthenticatedUser
    API->>API: request.authenticatedUser = user
    
    Note over API: 7. Route Execution
    API->>API: Route handler executes
    API->>API: Call getCurrentUser() if needed
    
    Note over API: 8. RBAC Verification (if applicable)
    API->>API: requirePermission() middleware
    API->>DB: Query user permissions
    DB->>API: Return permissions
    API->>API: Validate required permission
    
    Note over API: 9. Response
    API->>Client: Response (200/401/403)
```

## Detailed Login Process

### 1. Login Endpoint (`POST /auth/login`)

```typescript
// Client sends credentials to the API
POST /auth/login
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

### 2. API processes login via Auth0

```typescript
// authService.login() executes:
const tokenResponse = await axios.post(
  `https://${auth0Domain}/oauth/token`,
  {
    grant_type: 'password',           // Resource Owner Password Grant
    username: credentials.email,
    password: credentials.password,
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'openid profile email offline_access',
    audience: audience,
  }
)
```

### 3. Auth0 returns tokens

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "v1.M0_BQH2Og8cNMJd-A4E-yQWNXEi2...",
  "scope": "openid profile email offline_access"
}
```

### 4. API fetches user information

```typescript
// Fetch complete user data
const userInfo = await axios.get(
  `https://${auth0Domain}/userinfo`,
  {
    headers: { Authorization: `Bearer ${access_token}` }
  }
)
```

### 5. Final response to client

```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "refresh_token": "v1.M0_BQH2Og8cNMJd-A4E-yQWNXEi2...",
    "scope": "openid profile email offline_access",
    "user_info": {
      "sub": "auth0|507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "email_verified": true,
      "name": "John Doe",
      "avatar": "https://s.gravatar.com/avatar/..."
    }
  }
}
```

## Data Structures

### AuthenticatedUser Interface

```typescript
export interface AuthenticatedUser {
  sub: string              // Auth0 User ID (unique identifier)
  email?: string           // User email
  email_verified?: boolean // Email verification status
  name?: string           // Full name
  avatar?: string        // Profile picture URL
  [key: string]: unknown  // Other JWT payload fields
}
```

### FastifyRequest Extension

```typescript
declare module 'fastify' {
  interface FastifyRequest {
    authenticatedUser?: AuthenticatedUser
  }
}
```

## Configuration

### 1. JWT Plugin (@fastify/jwt)

```typescript
await app.register(jwt, {
  secret: async function (request: any, token: any) {
    const client = jwksClient({
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      cache: true,           // Cache public keys
      cacheMaxEntries: 5,    // Maximum 5 keys in cache
      cacheMaxAge: 600000,   // Cache for 10 minutes
    })
    
    // Extract 'kid' from JWT header
    // Fetch corresponding public key
    const key = await client.getSigningKey(kid)
    return key.getPublicKey()
  }
})
```

### 2. Global Middleware Registration

```typescript
// Executes before all route handlers
app.addHook('preHandler', auth0Middleware)
```

### 3. Environment Variables

```env
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=your-api-identifier
AUTH0_SCOPE=openid profile email offline_access
```

## auth0Middleware

### Responsibilities

1. **Filter public routes** - Skip for `/health`, `/docs`, `/auth/login`, etc.
2. **Extract JWT token** - From `Authorization: Bearer <token>` header
3. **Validate format** - Check if it's a valid Bearer token
4. **Verify signature** - Using Auth0 public keys (JWKS)
5. **Validate claims** - Issuer, audience, expiration
6. **Create user object** - Extract data from JWT payload
7. **Attach to request** - `request.authenticatedUser = user`

### Public Routes

```typescript
const PUBLIC_ROUTES = [
  '/health',
  '/docs',
  '/docs/static',
  '/docs/json',
  '/docs/yaml',
  '/auth/login',           // Login endpoint
  '/auth/refresh',         // Token renewal
  '/auth/refresh-info',    // Refresh information
]
```

## Utility Functions

### getCurrentUser()

```typescript
export const getCurrentUser = (request: FastifyRequest): AuthenticatedUser => {
  if (!request.authenticatedUser) {
    throw new UnauthorizedError('User not authenticated')
  }
  return request.authenticatedUser
}
```

**Usage:**
- Ensures user is authenticated
- Provides type safety
- Throws error if not authenticated

### isAuthenticated()

```typescript
export const isAuthenticated = (request: FastifyRequest): boolean => {
  return !!request.authenticatedUser
}
```

**Usage:**
- Simple boolean check
- Does not throw errors

## RBAC Integration

### requirePermission Middleware

```typescript
export const requirePermission = (permission: string) => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = getCurrentUser(request)  // Uses already processed data
    
    const { allowed } = await rbacService.checkPermissionWithDetails(
      user.sub, 
      permission
    )
    
    if (!allowed) {
      throw new InsufficientPermissionError(permission, ...)
    }
  }
}
```

### Usage Example

```typescript
// Route protected by authentication + permission
fastify.get('/admin/users', {
  preHandler: requirePermission('admin:read_users')
}, async (request, reply) => {
  const user = getCurrentUser(request)
  // Route logic...
})
```

## Token Renewal

### Refresh Endpoint (`POST /auth/refresh`)

```typescript
POST /auth/refresh
{
  "refresh_token": "v1.M0_BQH2Og8cNMJd-A4E-yQWNXEi2..."
}
```

### Renewal Process

1. **Client sends refresh_token** to `/auth/refresh`
2. **API validates refresh_token** with Auth0
3. **Auth0 returns new access_token** (and possibly new refresh_token)
4. **API returns updated tokens** to client

```typescript
// authService.refreshToken() executes:
const refreshResponse = await axios.post(
  `https://${auth0Domain}/oauth/token`,
  {
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    audience: audience,
  }
)
```

## Session Verification

### Verification Endpoint (`GET /auth/verify`)

```typescript
GET /auth/verify?minimal=true
Authorization: Bearer <jwt_token>
```

### Verification Modes

#### 1. Minimal Mode (`?minimal=true`)
- Basic token validation (structure and expiration)
- No authentication middleware required
- Faster and more efficient

#### 2. Full Mode (default)
- Complete validation via middleware
- Detailed session information
- Complete user data

## Error Handling

### Error Types

1. **UnauthorizedError** - Token missing, invalid, or expired
2. **InsufficientPermissionError** - User lacks required permission

### JWT Error Codes

```typescript
// Error mapping from @fastify/jwt
if (errorCode === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
  throw new UnauthorizedError('Token has expired')
}

if (errorCode === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
  throw new UnauthorizedError('Invalid token')
}
```

### Login Errors

```typescript
// Auth0 errors during login
if (authError?.error === 'invalid_grant') {
  throw new Error('Invalid email or password')
}

if (authError?.error === 'access_denied') {
  throw new Error('Access denied')
}
```

## Security

### Implemented Validations

1. **Token Format** - Must be `Bearer <jwt>`
2. **JWT Signature** - Verified with Auth0 public keys
3. **Issuer** - Must match configured Auth0 domain
4. **Audience** - Validated if configured (optional)
5. **Expiration** - Automatically checked by JWT plugin

### JWKS Key Cache

- **Cache enabled** for Auth0 public keys
- **10-minute TTL** to reduce latency
- **Maximum 5 keys** in simultaneous cache

### Resource Owner Password Grant

- **Secure grant type** for trusted applications
- **Client secret** required for validation
- **Limited scope** as per configuration

## Performance

### Existing Optimizations

1. **JWKS Cache** - Avoids repeatedly fetching public keys
2. **Skip public routes** - Skips unnecessary authentication processing
3. **Skip OPTIONS** - Ignores CORS preflight requests
4. **Cache user info** - User data fetched only during login

### Typical Metrics

- **Public route**: ~0.1ms (route check only)
- **Complete login**: ~200-500ms (Auth0 + userinfo)
- **First JWT validation**: ~5-10ms (JWKS key fetch)
- **Subsequent validations**: ~2-3ms (cached key)

## Complete Usage Example

### 1. Client Login

```javascript
// Frontend - Login
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'userpassword'
  })
})

const { data } = await response.json()
const { access_token, refresh_token } = data

// Store tokens (localStorage, sessionStorage, etc.)
localStorage.setItem('access_token', access_token)
localStorage.setItem('refresh_token', refresh_token)
```

### 2. Authenticated Requests

```javascript
// Frontend - Subsequent requests
const token = localStorage.getItem('access_token')

const response = await fetch('/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### 3. Backend Processing

```typescript
// Backend - Route handler
app.get('/users/profile', async (request, reply) => {
  // auth0Middleware already executed and populated request.authenticatedUser
  const user = getCurrentUser(request)  // Data already available
  
  return {
    profile: {
      id: user.sub,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    }
  }
})
```

### 4. Token Renewal

```javascript
// Frontend - Renew token when needed
const refreshToken = localStorage.getItem('refresh_token')

const response = await fetch('/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refresh_token: refreshToken
  })
})

const { data } = await response.json()
localStorage.setItem('access_token', data.access_token)
```

## Troubleshooting

### Common Issues

1. **Token expired** - Client should renew via `/auth/refresh`
2. **Invalid issuer** - Check `AUTH0_DOMAIN` configuration
3. **JWKS key not found** - Verify connectivity with Auth0
4. **Invalid audience** - Check `AUTH0_AUDIENCE` (if configured)
5. **Invalid credentials** - Verify email/password in Auth0
6. **Incorrect client secret** - Check `AUTH0_CLIENT_SECRET`

### Useful Logs

```typescript
// Debug login
logger.info('Auth0 login successful', {
  email: credentials.email,
  tokenType: tokenData.token_type,
  expiresIn: tokenData.expires_in,
  hasRefreshToken: !!tokenData.refresh_token,
})

// Debug authentication
logger.debug('User authenticated successfully', {
  userId: user.sub,
  email: user.email,
  url: request.url
})

// Warnings on failure
logger.warn('JWT verification failed', {
  error: error.message,
  url: request.url
})
```

### Monitoring

```typescript
// Important metrics to monitor:
// - Login success rate
// - Auth0 response time
// - JWKS cache hit rate
// - Token refresh frequency
// - JWT validation error frequency
```

---

**Note**: This system implements stateless, scalable, and secure authentication using the Resource Owner Password Grant flow from OAuth 2.0 via Auth0, with complete integration to the RBAC system for granular permission control.
