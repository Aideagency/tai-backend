# TAI Backend

TAI Backend is the NestJS API and admin server for The Agudah Institute platform. It powers authentication, user profiles, community features, learning resources, events, counselling bookings, payments, books, articles, and the server-rendered admin dashboard.

The project is organized as a modular Nest application backed by PostgreSQL/TypeORM, with integrations for Supabase auth, Paystack payments, Cloudinary media, Resend/SMTP/SendGrid email, the Bible API, WordPress articles, Google OAuth, and Zoho Learn.

## Core Features

- **Authentication and accounts**: signup, login, email verification, password reset, JWT refresh tokens, profile updates, Supabase support, and Google OAuth routes.
- **Admin operations**: admin auth, user management, password resets, suspension/restoration flows, and EJS-powered admin views.
- **Learning and content**: courses, lessons, lesson sections, attachments, course progress, course access, books, book downloads, nuggets, daily nuggets, and external WordPress articles.
- **Community**: posts, comments, likes, follows, follower requests, connection details, prayer wall posts, amens, comments, reports, sharing, and answered-prayer tracking.
- **Spiritual growth challenges**: challenge creation, tasks, enrollment, daily task progress, partner confirmations, completion flows, reflections, and badges.
- **Events and counselling**: event registration, counselling booking, payment confirmation, cancellation, refund request flows, and admin listing views.
- **Payments**: Paystack initialization, verification, webhook processing, transaction records, and refund handling.
- **Infrastructure**: PostgreSQL migrations, repository abstraction, email templates, Cloudinary uploads, structured logging, Swagger API docs, and EJS static/admin assets.

## Tech Stack

- Node.js + TypeScript
- NestJS 10
- PostgreSQL with TypeORM
- EJS admin views
- Passport strategies for JWT, local auth, Google OAuth, and Supabase
- Paystack, Cloudinary, Resend, SendGrid, Nodemailer, Zoho Learn, WordPress, and Bible API integrations

## Project Structure

```text
src/
  admin/             Admin APIs and admin authentication
  admin-views/       Server-rendered EJS dashboard routes
  articles/          WordPress article proxy
  auth/              User authentication and profile flows
  bible/             Bible API integration
  books/             Book catalog, downloads, and admin book APIs
  challenges/        Challenge, task, progress, and badge workflows
  common/            Shared HTTP helpers and utilities
  connections/       Follow and connection management
  counselling/       Counselling sessions, bookings, and payments
  courses/           Course, lesson, section, attachment, and progress APIs
  database/          TypeORM entities and migrations
  event/             Events, registrations, and cancellation flows
  infrastructure/    Email and Cloudinary providers
  nuggets/           Nuggets, daily nuggets, likes, comments, and shares
  payment/           Paystack transactions and webhooks
  post/              Social posts, likes, and comments
  prayer-wall/       Prayer requests, amens, comments, and reports
  refund-request/    Refund request APIs
  repository/        Repository layer around TypeORM entities
  user/              User module
views/               EJS admin pages, partials, and static assets
```

## Requirements

- Node.js 20 or newer is recommended
- Yarn
- PostgreSQL database URL, usually Supabase-compatible because the TypeORM config enables SSL

## Getting Started

Install dependencies:

```bash
yarn install
```

Create your environment file:

```bash
cp .env.example .env
```

Update `.env` with real credentials, then run migrations:

```bash
yarn migrate-up
```

Start the app in watch mode:

```bash
yarn start:dev
```

The server listens on `PORT`. Swagger docs are available at:

```text
http://localhost:<PORT>/api/v1/backend
```

The admin login view is available at:

```text
http://localhost:<PORT>/admin-views/login
```

## Scripts

```bash
yarn start          # Start Nest normally
yarn start:dev      # Start Nest in watch mode
yarn build          # Compile the app to dist/
yarn start:prod     # Run the compiled app
yarn lint           # Run ESLint with auto-fix
yarn test           # Run unit tests
yarn test:e2e       # Run e2e tests
yarn test:cov       # Run tests with coverage
yarn migrate-up     # Run pending TypeORM migrations
yarn migrate-down   # Revert the latest TypeORM migration
```

## Database

The app uses TypeORM with `DATABASE_URL`. Runtime configuration is in `src/database/database.module.ts`, while migration CLI configuration is in `src/config/typeorm.config-migrations.ts`.

Important database defaults:

- `synchronize` is disabled.
- SSL is controlled by `DATABASE_SSL`. Use `DATABASE_SSL=false` for local Postgres and `DATABASE_SSL=true` for Supabase or other hosted Postgres providers that require SSL.
- Application entities are loaded automatically at runtime.
- Migrations live in `src/database/migrations`.

To generate a migration:

```bash
yarn migration:generate -- MigrationName
```

## API Documentation

Swagger is configured in `src/main.ts` and mounted at `/api/v1/backend`. Most APIs use resource-based controller prefixes, including:

- `/auth`
- `/admin/auth`
- `/admin/users`
- `/admin-views`
- `/articles`
- `/bible`
- `/books`
- `/admin/books`
- `/challenges`
- `/connections`
- `/counselling`
- `/courses`
- `/admin/courses`
- `/events`
- `/nuggets`
- `/payment`
- `/posts`
- `/prayers`
- `/refund-requests`

## Environment

Use `.env.example` as the source of truth for local configuration. At minimum, local development needs `PORT`, `NODE_ENV`, `DATABASE_URL`, JWT/session secrets, and credentials for whichever external services your flow exercises.

Do not commit real secrets.

## Notes

- The app serves EJS views from `views/` and static assets from the same directory.
- CORS is enabled with credential support and dynamic origins.
- Global validation strips non-whitelisted DTO properties and rejects unknown fields.
- Paystack webhooks are signature-checked and restricted to known Paystack IPs before business fulfillment is triggered.
