# Horizon Sustainability Platform (MVP)

Workflow-first sustainability reporting and certification platform for companies in Turkey, aligned to IFRS S1/S2 and TSRS 1/2.

## What Is Included

- Multi-tenant data model with organization-level isolation
- Role-based auth (Admin, Sustainability Manager, Data Contributor, Finance Reviewer, Auditor)
- Setup wizard (organization, facilities, users, reporting period)
- Materiality scoring + matrix
- Data collection table + evidence upload
- Scope 1/2 emissions calculation and transparent formula detail
- Climate risk register + scenario analysis
- Targets and progress tracking
- Report generation/editing/export (HTML)
- Certification workflow (submit, comments, request changes, approve/reject)
- Audit trail for key mutations
- Unit, component, and basic E2E test coverage

## Tech Stack

- Next.js App Router + TypeScript + Tailwind
- Prisma ORM + PostgreSQL
- NextAuth (credentials)
- React Hook Form + Zod
- Recharts + Lucide
- Vitest + React Testing Library + Playwright

## Disclaimer

This platform provides structured sustainability reporting support. Final regulatory compliance and certification decisions require review by qualified professionals.

Seeded emission factors are placeholder/demo values and must be verified before production use.

## Quick Start (Docker)

### 1. Build and run

```bash
docker compose up --build -d
```

### 2. Open app

- App: http://localhost:3000
- Postgres: localhost:5432

### 3. Demo login

- Email: `admin@demo.com`
- Password: `Demo1234!`

Other seeded users:

- `sustainability@demo.com`
- `contributor@demo.com`
- `cfo@demo.com`
- `auditor@demo.com`

All use password: `Demo1234!`

### 4. Stop containers

```bash
docker compose down
```

## Local Non-Docker Setup

### Prerequisites

- Node.js 20+
- PostgreSQL

### Configure env

```bash
cp .env.example .env
```

### Install + DB + seed

```bash
npm ci
npm run prisma:generate
npm run db:push
npm run prisma:seed
```

### Run dev server

```bash
npm run dev
```

## Commands

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Docker Notes

- `docker/entrypoint.sh` applies schema and seeds demo data on container start.
- Evidence files are saved under `/app/uploads` and persisted via Docker volume.

## Main Routes

- `/dashboard`
- `/setup`
- `/materiality`
- `/data-collection`
- `/emissions`
- `/risks`
- `/targets`
- `/reports`
- `/reports/[id]`
- `/certification`
- `/certification/[id]`
- `/audit-trail`
- `/settings`

## API Modules

- Organization, facilities, users, reporting periods
- Materiality, metrics, evidence
- Emissions + recalculation
- Risks + scenarios
- Targets
- Reports + generation
- Certification + comments + decisions
- Audit logs

## Seed Data

Includes one demo organization:

- `Demo Manufacturing A.Ş.`
- Sector: Manufacturing
- Country: Turkey
- Reporting period: 2025
- Facilities: Istanbul Plant, Ankara Office

Also seeds:

- Required metric definitions
- Demo metric entries
- Placeholder emission factors
- Materiality topics
- Climate risk + scenario
- Target
- Report + certification sample + comments
- Audit logs

