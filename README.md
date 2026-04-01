# Neuromart


Specialized AI marketplace for listing, discovering, and renting niche AI models.

Neuromart is a full-stack TypeScript app with a React frontend and an Express backend. Publishers can create model listings, renters can browse by category and quality, and rentals are managed through a clean API-first contract.

## Why Neuromart

- Focused on specialist AI use cases, not generic chatbots.
- API-first architecture with shared types and validation.
- Fast local development with a database-backed mode and a memory fallback mode.
- Modern UI stack (Vite, Tailwind, Framer Motion, shadcn/ui patterns).

## Core Features

- Marketplace browsing with category and quality-oriented discovery.
- Model detail pages with onboarding and pricing metadata.
- Publisher dashboard for creating and managing listings.
- Rental lifecycle endpoints (create, list, cancel).
- Shared schema contracts across client and server.
- Validation-first request handling with Zod and Drizzle-Zod.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, TanStack Query, Wouter
- Backend: Node.js, Express 5, TypeScript, ws
- Data: Drizzle ORM, PostgreSQL (optional), in-memory fallback storage
- Validation: Zod, drizzle-zod
- Tooling: tsx, TypeScript compiler, Drizzle Kit

## Repository Structure

```
client/          React app (pages, components, hooks, styles)
server/          Express server, route handlers, storage abstraction
shared/          Shared schema, enums, route contract types
script/          Build scripts
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Choose runtime mode

Neuromart can run in two modes:

- Database mode: set `DATABASE_URL` to use PostgreSQL.
- Memory mode: omit `DATABASE_URL` to use in-memory storage (great for local demos).

### 3. Run locally

#### macOS/Linux

```bash
npm run dev
```

#### Windows PowerShell

```powershell
$env:NODE_ENV='development'
$env:PORT='5000'
npx tsx server/index.ts
```

Server starts on `http://localhost:5000` by default.

## Environment Variables

- `PORT` (optional): HTTP port, defaults to `5000`
- `NODE_ENV` (optional): `development` or `production`
- `DATABASE_URL` (optional): PostgreSQL connection string

If `DATABASE_URL` is not provided, the app uses `MemoryStorage` automatically.

## Available Scripts

- `npm run dev`: Start local development server
- `npm run build`: Build client and server bundles
- `npm start`: Run production build from `dist/index.cjs`
- `npm run check`: TypeScript type-check
- `npm run db:push`: Push Drizzle schema to the configured database

## API Overview

Base path: `/api`

### Users

- `GET /api/users` list users
- `POST /api/users` create user

### Models

- `GET /api/models` list models (supports filters + pagination)
- `GET /api/models/:id` get one model
- `POST /api/models` create model
- `PATCH /api/models/:id` update model
- `DELETE /api/models/:id` delete model

### Rentals

- `GET /api/rentals` list rentals
- `POST /api/rentals` create rental
- `PATCH /api/rentals/:id/cancel` cancel rental

Contracts for route shapes and input/output schemas live in `shared/routes.ts` and `shared/schema.ts`.

## Domain Model Highlights

Model categories include:

- DeFi & Web3
- Industrial
- Bio-Tech
- Creative & Media
- Legal & Security
- Engineering & DevOps
- Logistics
- Academic & Research
- Urban & Civic
- Strategy
- Custom

Onboarding modes:

- `external_api`
- `provider_backed`
- `self_hosted`
- `prompt_only`

Pricing modes:

- `per_request`
- `custom_quote`

Model statuses:

- `draft`, `published`, `beta`, `paused`, `deprecated`, `archived`

## Architecture Notes

- Shared-first contracts: frontend and backend rely on common schema/types under `shared/`.
- Storage abstraction: `DatabaseStorage` and `MemoryStorage` implement the same interface.
- Validation-first mutations: create/update model payloads are strongly validated with cross-field checks.

## Troubleshooting

- `npm run dev` fails on Windows:
	- Run the PowerShell commands from the Quick Start section (env var syntax differs from Unix shells).
- App starts but data does not persist:
	- Set `DATABASE_URL` and run `npm run db:push`.
- Type errors after changing shared contracts:
	- Run `npm run check` and update both server and client callsites.

## Publishing & Integration

For publisher token flow and integration examples, see `PUBLISHER_GUIDE.md`.

## License

MIT
=======
Specialized AI exchange
>>>>>>> 24e516150ec0aad6a28c53493b1c582377cffe19
