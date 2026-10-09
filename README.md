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
- Admin user management is available under `/api/admin/users` to
  `SYSTEM_ADMIN` accounts. The list endpoint supports `name`, `email`, `address`,
  and `role` filters, `page`/`limit` pagination, and `sortBy`/`sortOrder`
  sorting. User creation accepts `NORMAL_USER` or `SYSTEM_ADMIN`; passwords are
  hashed and never included in responses. Apply pending schema changes with
  `npm run migration:run`.
- Admin store management is available under `/api/admin/stores` to
  `SYSTEM_ADMIN` accounts. Store creation requires an existing `STORE_OWNER`;
  each owner may own one store. Store lists support name, email, and address
  filters, whitelisted sorting by name, email, address, rating, or createdAt,
  and `page`/`limit` pagination. Average ratings are calculated from ratings
  records and cannot be supplied by clients. Apply pending schema changes with
  `npm run migration:run`.
- Normal users can view stores at `GET /api/stores`, submit ratings with
  `POST /api/ratings`, and update their own ratings with
  `PATCH /api/ratings/:ratingId`. Store listings include the overall average
  and only the authenticated user's own rating. The ratings table enforces one
  rating per user/store and the 1–5 range.

## Useful Commands

- Start app: `npm run start`
- Start dev server: `npm run start:dev`
- Build: `npm run build`
- Run tests: `npm test`
- Run e2e tests: `npm run test:e2e`

## Health Check

- `GET /api/health`
