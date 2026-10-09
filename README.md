# Store Rating App Backend

This project is the NestJS backend for the Store Rating App.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- JWT
- bcrypt
- class-validator
- class-transformer
- ConfigModule

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL 14+

## Setup

1. Install dependencies:

   npm install

2. Copy the environment file:

   cp .env.example .env

3. Update `.env` values for your local PostgreSQL database and JWT secret.

4. Start PostgreSQL and create the database:

   createdb store_rating_app

5. Start the app in development mode:

   npm run start:dev

## Environment Variables

- `PORT`: application port
- `NODE_ENV`: environment (`development`, `production`, etc.)
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_USERNAME`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_NAME`: PostgreSQL database name
- `JWT_SECRET`: secret used to sign JWT tokens
- `JWT_EXPIRES_IN_SECONDS`: JWT access-token lifetime in seconds

## Application Notes

- The app uses a global `/api` prefix.
- CORS is enabled for browser clients.
- Global validation is enabled.
- A health endpoint is available at `/api/health`.
- TypeORM is configured with `synchronize: false` and migration support.
- Role-protected authorization examples are available at
  `/api/authorization-demo/admin`, `/api/authorization-demo/normal-user`, and
  `/api/authorization-demo/store-owner/stores/:storeId/ratings`.
- The store-owner example checks `storeId` against the authenticated owner's ID
  and returns 404 for stores they do not own.

## Useful Commands

- Start app: `npm run start`
- Start dev server: `npm run start:dev`
- Build: `npm run build`
- Run tests: `npm test`
- Run e2e tests: `npm run test:e2e`

## Health Check

- `GET /api/health`
