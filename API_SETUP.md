# Valorize API - Setup Guide

This is the setup guide for the Valorize API, a B2B culture and engagement platform built with TypeScript, Fastify, PostgreSQL, and Auth0.

## Prerequisites

Before setting up the API, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v13 or higher)
- **Redis** (v6 or higher)
- **npm** or **yarn**

## Quick Start

1. **Clone the repository and install dependencies:**

```bash
cd valorize-api
npm install
```

2. **Set up environment variables:**

```bash
cp env.example .env
```

Edit the `.env` file with your actual configuration values.

3. **Set up PostgreSQL database:**

```sql
-- Connect to PostgreSQL and create the database
CREATE DATABASE valorize_db;
CREATE USER valorize_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE valorize_db TO valorize_user;
```

4. **Initialize Prisma:**

```bash
# Generate Prisma schema (you can customize the schema location)
npx prisma init

# Generate Prisma client after creating your schema
npm run db:generate

# Push your schema to the database
npm run db:push
# OR run migrations in development
npm run db:migrate

# Optional: Open Prisma Studio to view your data
npm run db:studio
```

5. **Start Redis:**

```bash
# On macOS with Homebrew
brew services start redis

# On Linux
redis-server

# On Windows with Docker
docker run -d -p 6379:6379 redis:alpine
```

6. **Configure Auth0:**

   - Create an Auth0 account at [https://auth0.com](https://auth0.com)
   - Create a new Application (Single Page Application)
   - Create a new API in Auth0 dashboard
   - Update your `.env` file with:
     - `AUTH0_DOMAIN`: Your Auth0 domain
     - `AUTH0_AUDIENCE`: Your API identifier
     - `AUTH0_CLIENT_ID`: Your application client ID
     - `AUTH0_CLIENT_SECRET`: Your application client secret

7. **Start the development server:**

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Documentation

Once the server is running, you can access the API documentation at:

- **Swagger UI**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/health`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

### Database Scripts (Prisma)
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations in development
- `npm run db:migrate:deploy` - Deploy migrations to production
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with initial data

## Project Structure

```
src/
├── modules/                    # Domain modules
│   └── users/                 # Users module
│       ├── domain/           # Business logic
│       ├── application/      # Use cases
│       ├── infrastructure/   # Data access
│       └── presentation/     # API routes
├── shared/                    # Shared utilities
│   ├── domain/              # Shared domain logic
│   ├── infrastructure/      # Database, Redis, etc.
│   └── presentation/        # Middlewares, errors
├── config/                   # App configuration
└── app.ts                   # Application entry point
```

## Architecture

This API follows **Clean Architecture** principles with a **Modular Monolith** approach:

- **Domain Layer**: Business entities and rules
- **Application Layer**: Use cases and DTOs
- **Infrastructure Layer**: Database, external services
- **Presentation Layer**: HTTP controllers and routes

## Authentication

The API uses **Auth0** for authentication. To test protected endpoints:

1. Get an access token from Auth0
2. Include it in the Authorization header: `Bearer <token>`

Example using curl:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/v1/users/profile
```

## Environment Variables

Key environment variables you need to configure:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `AUTH0_DOMAIN` | Auth0 domain | `your-domain.auth0.com` |
| `AUTH0_AUDIENCE` | Auth0 API identifier | `https://your-api-identifier` |
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Logging level | `debug` |

## Database

The API uses **PostgreSQL** as the primary database with **Prisma ORM** for type-safe database access and migrations.

### Prisma Features:
- **Type Safety**: Auto-generated TypeScript types
- **Migrations**: Version-controlled database schema changes  
- **Studio**: Web-based database browser at `http://localhost:5555`
- **Query Builder**: Intuitive and type-safe database queries
- **Connection Pooling**: Built-in connection management

### Working with Prisma:

1. **Modify your schema** in `prisma/schema.prisma`
2. **Generate client**: `npm run db:generate`
3. **Apply changes**: `npm run db:push` (dev) or `npm run db:migrate` (with versioning)
4. **View data**: `npm run db:studio`

## Caching

Redis is used for:
- Session management
- Rate limiting
- Weekly coins (auto-expiring data)
- General application caching

## Development Tips

1. **Hot Reload**: The dev server automatically restarts on file changes
2. **Logging**: Set `LOG_LEVEL=debug` to see detailed logs
3. **API Testing**: Use the Swagger UI at `/docs` for interactive testing
4. **Database**: Use a tool like pgAdmin or DBeaver to inspect the database

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the `PORT` in your `.env` file
2. **Database connection failed**: Check PostgreSQL is running and `DATABASE_URL` is correct
3. **Prisma client not generated**: Run `npm run db:generate` after schema changes
4. **Migration failed**: Check your schema syntax and database permissions
5. **Redis connection failed**: Make sure Redis server is running
6. **Auth0 token invalid**: Check your Auth0 configuration and token

### Logs

Check the application logs for detailed error information:

```bash
npm run dev
# Logs will appear in the console
```

## What's Next

This is the initial API foundation with Prisma ORM integrated. Future development will include:

1. **Database schema design** - Create Prisma models for your domain entities
2. **Complete user management** - Full CRUD operations using Prisma
3. **Coins module** - Virtual currency system
4. **Praise module** - Employee recognition system  
5. **Store module** - Rewards marketplace
6. **Education module** - Learning vouchers
7. **Library module** - Book reviews and ratings

## Support

For questions or issues, please check:

1. The API documentation at `/docs`
2. The architecture guide in `api_architecture_guide.md`
3. Application logs for error details 