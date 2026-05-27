# Horizon Sustainability Platform

> Workflow-first sustainability reporting and certification platform for Turkish companies, aligned to **IFRS S1/S2**, **TSRS 1/2**, **ESRS/CSRD**, **SASB**, and **NACE** sector frameworks.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Quick Start — Docker](#quick-start--docker)
5. [Local Development](#local-development)
6. [Environment Variables](#environment-variables)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Approval Workflow](#approval-workflow)
9. [AI & RAG Module](#ai--rag-module)
10. [Data Model](#data-model)
11. [Project Structure](#project-structure)
12. [API Reference](#api-reference)
13. [Testing](#testing)
14. [Commands](#commands)
15. [Seed Data](#seed-data)
16. [Disclaimer](#disclaimer)

---

## Features

| Module | Highlights |
|---|---|
| **Multi-tenancy** | `organizationId` scoped on every Prisma query; cross-tenant isolation enforced in service layer |
| **Auth** | NextAuth.js credentials provider, bcryptjs hashing, JWT sessions, role-based access control |
| **Setup Wizard** | 5-step guided onboarding: org profile → facilities → users → reporting period → sector |
| **Questionnaire** | Topic CRUD, sections/subsections, question types, per-answer tracking, completion dashboard |
| **Materiality** | Double-materiality scoring matrix (financial + impact, 1–5 scale), bulk save, visual heatmap |
| **Data Collection** | Metric entry table, inline editing, anomaly detection (±200% warn / ±500% block YoY), evidence gate |
| **Emissions** | Scope 1/2/3 breakdown, transparent formula detail, sector-aware metric codes (SASB/NACE/ESRS), recalculation |
| **Climate Risks** | Risk register (physical acute/chronic, transition policy/market/tech/reputation/legal), probability × impact matrix |
| **Scenario Analysis** | TCFD-aligned scenario planning linked to reporting periods |
| **Targets** | Net-zero / reduction targets with baseline year, progress % (ON\_TRACK / AT\_RISK / OFF\_TRACK) |
| **Reports** | HTML report generation/editing, multi-section templates, PDF-ready export |
| **Certification** | 4-stage certification workflow (Submitted → In Review → Changes Requested → Certified/Rejected), threaded comments |
| **5-stage Approval** | Per-metric approval: DATA\_ENTRY → MANAGER\_REVIEW → HORIZON\_REVIEW → APPROVED (REVISION\_REQUESTED exit) |
| **Evidence Gate** | Evidence must be uploaded before advancing metric approval stage |
| **Period Guard** | Writes blocked on locked/submitted/certified reporting periods |
| **Audit Trail** | Append-only audit log for every key mutation (before/after JSON payloads) |
| **Notifications** | In-app notification system; stage-transition notifications sent to metric owners |
| **AI Assistant** | Multi-provider LLM chat (Claude, GPT-4o, Gemini, Ollama) + RAG over org knowledge base |
| **ESG Summary** | AI-generated ESG narrative with streaming, editable sections, export |
| **Knowledge Base** | pgvector semantic search over uploaded documents; chunked embedding storage |
| **i18n** | Turkish (default) / English toggle; `useI18n()` hook, all UI strings externalized |
| **Dark/Light mode** | Tailwind `dark:` classes throughout |

---

## Tech Stack

### Core

| Package | Version | Role |
|---|---|---|
| Next.js | 16.2.4 | App Router, RSC, API Routes |
| React | 19.x | UI framework |
| TypeScript | 5.x | Static typing |
| Tailwind CSS | 4.x | Utility-first styling |
| Prisma | 6.19.0 | ORM + schema management |
| PostgreSQL | 16 | Primary database |
| pgvector | 0.8.0 | Vector similarity (RAG) |

### Auth & Security

| Package | Version | Role |
|---|---|---|
| next-auth | 4.x | Session management (JWT) |
| bcryptjs | 2.x | Password hashing |
| AES-256-GCM | Node crypto | AI API key encryption per org |

### Forms & Validation

| Package | Version | Role |
|---|---|---|
| zod | 3.x | Schema validation |
| react-hook-form | 7.x | Form state management |

### AI / LLM

| Package | Version | Role |
|---|---|---|
| @anthropic-ai/sdk | 0.39.0 | Claude Opus 4.7, Sonnet 4.6, Haiku 4.5 |
| openai | 4.x | GPT-4o |
| @google/generative-ai | 0.21.0 | Gemini 2.5 Pro / Flash |
| ollama | 0.5.x | Self-hosted QWEN2.5 |

### Data Visualization

| Package | Version | Role |
|---|---|---|
| recharts | 2.x | Line, bar, radar, area charts |
| lucide-react | 0.x | Icon library |

### Testing

| Package | Version | Role |
|---|---|---|
| vitest | 3.x | Unit + component runner |
| @testing-library/react | 16.x | Component testing |
| @testing-library/user-event | 14.x | User interaction simulation |
| playwright | 1.x | End-to-end tests |
| jsdom | 26.x | DOM environment for Vitest |

### Infrastructure

| Tool | Role |
|---|---|
| Docker + Compose | Container orchestration |
| Docker volume | Evidence file persistence at `/app/uploads` |

---

## Architecture

### Layer Contract

```
HTTP Request
    │
    ▼
┌─────────────────────────────────┐
│  Next.js API Route (route.ts)   │  ← auth check (requireRole)
│  Thin controller only:          │  ← input parse (zod schema)
│  - requireRole()                │  ← delegate to service
│  - schema.parse()               │  ← return apiOk / apiError
│  - service call                 │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Service Layer (src/services/)  │  ← all business logic lives here
│  - tenant isolation             │  ← Prisma queries with organizationId
│  - domain rules                 │  ← validation, computation, state machine
│  - side effects                 │  ← audit log, notifications, anomaly check
│  - error enrichment             │  ← httpStatus attached to thrown Errors
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Library Modules (src/lib/)     │
│  audit · anomaly · approval     │
│  evidence-gate · period-guard   │
│  notifications · sector-mappings│
│  rag · ai-client · encryption   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Prisma ORM → PostgreSQL 16     │
│  + pgvector extension           │
└─────────────────────────────────┘
```

### Tenant Isolation Invariant

Every `prisma.<model>.findMany/findFirst/findFirstOrThrow` call in the service layer **must** include `where: { organizationId: user.organizationId }`. Cross-tenant data leakage is prevented at the service level, not by database row-level security.

### Auth Flow

```
POST /api/auth/callback/credentials
    → bcrypt.compare(password, hash)
    → NextAuth JWT { id, organizationId, role }
    → requireRole() in every route reads the JWT
```

---

## Quick Start — Docker

### Prerequisites

- Docker Desktop ≥ 4.x
- `docker compose` v2

### 1. Build and run

```bash
docker compose up --build -d
```

The entrypoint script (`docker/entrypoint.sh`) automatically runs:
- `prisma migrate deploy` (schema applied)
- `prisma db seed` (demo data inserted)

### 2. Open app

| Service | URL |
|---|---|
| Application | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

### 3. Demo credentials

| Email | Password | Role |
|---|---|---|
| `admin@demo.com` | `Demo1234!` | ADMIN |
| `sustainability@demo.com` | `Demo1234!` | SUSTAINABILITY\_MANAGER |
| `contributor@demo.com` | `Demo1234!` | DATA\_CONTRIBUTOR |
| `cfo@demo.com` | `Demo1234!` | FINANCE\_REVIEWER |
| `auditor@demo.com` | `Demo1234!` | AUDITOR |

### 4. Stop

```bash
docker compose down          # keep volumes
docker compose down -v       # also wipe the database
```

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 16 with `pgvector` extension enabled
- (Optional) Ollama for local LLM

### Setup

```bash
# 1. Copy env
cp .env.example .env

# 2. Install dependencies
npm ci

# 3. Generate Prisma client
npm run prisma:generate

# 4. Apply schema
npm run db:push          # dev: push without migrations
# or
npx prisma migrate dev   # dev: create migration file

# 5. Seed demo data
npm run prisma:seed

# 6. Start dev server
npm run dev
```

Application runs at **http://localhost:3000**.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (`postgresql://user:pass@host:5432/db`) |
| `NEXTAUTH_SECRET` | ✅ | Random string for JWT signing (min 32 chars) |
| `NEXTAUTH_URL` | ✅ | Public base URL (`http://localhost:3000`) |
| `ENCRYPTION_KEY` | ✅ | 64-char hex string for AES-256-GCM AI key encryption |
| `ANTHROPIC_API_KEY` | ⬜ | Global Anthropic key (org-level keys override) |
| `OPENAI_API_KEY` | ⬜ | Global OpenAI key |
| `GOOGLE_API_KEY` | ⬜ | Global Google Generative AI key |
| `OLLAMA_BASE_URL` | ⬜ | Ollama server URL (default `http://localhost:11434`) |
| `UPLOAD_DIR` | ⬜ | Evidence file storage path (default `/app/uploads`) |

> **AI keys**: Per-organization AI provider keys stored encrypted in the database override the global env keys. Set them in **Settings → AI Configuration** after login.

---

## User Roles & Permissions

| Role | Key Permissions |
|---|---|
| `ADMIN` | Full access: org config, user management, all modules, certification decisions |
| `SUSTAINABILITY_MANAGER` | All ESG modules, approve metrics up to HORIZON\_REVIEW, submit/edit reports |
| `DATA_CONTRIBUTOR` | Enter metric data, upload evidence, answer questionnaires |
| `FINANCE_REVIEWER` | Read all data, review emissions + financials, PATCH metrics (no delete) |
| `AUDITOR` | Read-only across all modules, including audit trail |
| `HORIZON_CONSULTANT` | Horizon staff role: final metric stage review, certification workflow actions |

> Roles are enforced via `requireRole(allowedRoles[])` at the top of every API route. The RBAC check runs before any service call.

---

## Approval Workflow

### Metric Entry 5-Stage Approval

```
DATA_ENTRY
    │
    │  (Data Contributor / Manager submits)
    ▼
MANAGER_REVIEW
    │
    │  (Manager reviews & approves)
    ▼
HORIZON_REVIEW  ← Evidence gate: must have ≥1 evidence doc
    │
    │  (Horizon Consultant reviews)
    ▼
APPROVED
    │
    └── At any stage → REVISION_REQUESTED (sends back to DATA_ENTRY)
```

**Transitions enforced by:**
- `src/lib/approval.ts` — `validateTransition()` checks role permissions per step
- `src/lib/evidence-gate.ts` — `transitionRequiresEvidence()` + `hasEvidence()`
- `src/lib/period-guard.ts` — `assertPeriodOpen()` blocks writes on closed periods

### Report Certification 4-Stage Workflow

```
SUBMITTED → IN_REVIEW → CHANGES_REQUESTED → CERTIFIED
                                          → REJECTED
```

---

## AI & RAG Module

### Supported Providers

| Provider | Models | Config |
|---|---|---|
| Anthropic | claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5 | Per-org API key or global env |
| OpenAI | gpt-4o, gpt-4o-mini | Per-org API key or global env |
| Google | gemini-2.5-pro, gemini-2.5-flash | Per-org API key or global env |
| Ollama | qwen2.5 (self-hosted) | `OLLAMA_BASE_URL` env |

### Knowledge Base (RAG)

1. Upload documents in **Settings → Knowledge Base**
2. Documents are chunked (500-token windows, 50-token overlap) and embedded using the org's configured provider
3. Embeddings stored as `vector(1536)` in PostgreSQL via pgvector
4. Chat queries trigger cosine similarity search (`<=>` operator) — top-5 chunks injected as system context
5. Fallback: if no knowledge base documents, AI responds from general training

### AI Features

| Feature | Endpoint | Description |
|---|---|---|
| Chat assistant | `POST /api/ai/chat` | Streaming SSE response with RAG context |
| ESG narrative | `POST /api/esg-summary` | Generate editable ESG summary per period |
| Report drafting | Via report editor | AI-assisted section writing |

### Per-org Key Management

- Keys stored AES-256-GCM encrypted in `Organization.encryptedApiKeys` (JSON)
- Encryption key: `ENCRYPTION_KEY` env variable (64-char hex)
- UI: **Settings → AI Configuration** (ADMIN role required)

---

## Data Model

31 Prisma models across 6 domains:

| Domain | Models |
|---|---|
| **Identity** | `Organization`, `User`, `Session`, `Account`, `VerificationToken` |
| **Structure** | `Facility`, `BusinessUnit`, `ReportingPeriod` |
| **Questionnaire** | `QuestionnaireTemplate`, `Section`, `Subsection`, `Question`, `QuestionnaireAnswer` |
| **Materiality** | `MaterialityTopic` |
| **Metrics** | `MetricDefinition`, `MetricEntry`, `EmissionFactor`, `Target` |
| **Evidence** | `Evidence` |
| **Risk** | `ClimateRisk`, `Scenario` |
| **Reporting** | `Report`, `ReportSection`, `Certification`, `CertificationComment` |
| **AI / KB** | `KnowledgeBaseDocument`, `KnowledgeBaseChunk` |
| **System** | `AuditLog`, `Notification`, `Task` |

Key model relationships:
- `MetricEntry` → `MetricDefinition` + `Facility` + `ReportingPeriod` (unique composite key)
- `Evidence` → polymorphic (`entityType` + `entityId`)
- `AuditLog` → polymorphic (`entityType` + `entityId`) with `beforeValueJson` / `afterValueJson`
- `KnowledgeBaseChunk.embedding` → `vector(1536)` with `ivfflat` cosine index

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                  # Authenticated app routes (layout with sidebar)
│   │   ├── dashboard/
│   │   ├── setup/
│   │   ├── questionnaire/
│   │   ├── materiality/
│   │   ├── data-collection/
│   │   ├── emissions/
│   │   ├── risks/
│   │   ├── targets/
│   │   ├── reports/
│   │   ├── certification/
│   │   ├── audit-trail/
│   │   ├── esg-summary/
│   │   ├── knowledge-base/
│   │   └── settings/
│   ├── api/                    # API routes (thin controllers)
│   │   ├── auth/
│   │   ├── organization/
│   │   ├── facilities/
│   │   ├── business-units/
│   │   ├── reporting-periods/
│   │   ├── questionnaire/
│   │   ├── materiality/
│   │   ├── metrics/
│   │   ├── evidence/
│   │   ├── emissions/
│   │   ├── risks/
│   │   ├── scenarios/
│   │   ├── targets/
│   │   ├── reports/
│   │   ├── certification/
│   │   ├── audit-logs/
│   │   ├── tasks/
│   │   ├── notifications/
│   │   ├── esg-summary/
│   │   ├── ai/
│   │   └── knowledge-base/
│   └── auth/                   # Sign-in page
│
├── services/                   # Business logic (service layer)
│   ├── types.ts                # AuthUser type
│   ├── metric-entry.service.ts
│   ├── climate-risk.service.ts
│   ├── target.service.ts
│   ├── facility.service.ts
│   ├── scenario.service.ts
│   ├── materiality.service.ts
│   ├── task.service.ts
│   ├── report.service.ts
│   └── business-unit.service.ts
│
├── components/
│   ├── domain/                 # Feature-specific components
│   ├── layout/                 # AppShell, SidebarNav, TopBar
│   ├── providers/              # SessionProvider, LanguageProvider
│   └── ui/                    # Primitive UI components (button, card, etc.)
│
├── lib/                        # Shared utilities and integrations
│   ├── prisma.ts               # Singleton Prisma client
│   ├── api.ts                  # apiOk / apiError helpers
│   ├── rbac.ts                 # requireRole()
│   ├── validation.ts           # Zod schemas
│   ├── audit.ts                # createAuditLog()
│   ├── notifications.ts        # createNotification()
│   ├── anomaly.ts              # detectAnomaly() — YoY change detection
│   ├── approval.ts             # validateTransition() — stage state machine
│   ├── evidence-gate.ts        # transitionRequiresEvidence() + hasEvidence()
│   ├── period-guard.ts         # assertPeriodOpen()
│   ├── sector-mappings.ts      # getSectorMetricCodes() — SASB/NACE/ESRS
│   ├── dashboard.ts            # getDashboardData() — server-side aggregation
│   ├── ai-client.ts            # Multi-provider AI client factory
│   ├── rag.ts                  # RAG pipeline: chunk → embed → search → inject
│   ├── encryption.ts           # AES-256-GCM key encryption/decryption
│   ├── constants.ts            # Domain enums and labels
│   └── i18n.ts                 # Translation map (tr/en)
│
├── tests/
│   ├── unit/                   # Vitest unit tests (service + lib)
│   │   ├── bugs-fixed.test.ts
│   │   ├── metric-entry.service.test.ts
│   │   ├── climate-risk.service.test.ts
│   │   └── target.service.test.ts
│   ├── components/             # React Testing Library tests
│   │   ├── TopBar.test.tsx
│   │   ├── ProgressBar.test.tsx
│   │   └── StatusBadge.test.tsx
│   └── e2e/                    # Playwright end-to-end tests
│
└── middleware.ts               # NextAuth session guard for all (app) routes
```

---

## API Reference

All routes require a valid NextAuth session. Role requirements are listed per endpoint.

### Organization

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/organization` | All | Get current org profile |
| PATCH | `/api/organization` | ADMIN | Update org profile |

### Facilities

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/facilities` | All | List facilities |
| POST | `/api/facilities` | ADMIN, SM | Create facility |
| PATCH | `/api/facilities` | ADMIN, SM | Update facility |
| DELETE | `/api/facilities` | ADMIN | Delete facility |

### Business Units

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/business-units` | All | List business units |
| POST | `/api/business-units` | ADMIN, SM | Create |
| PATCH | `/api/business-units` | ADMIN, SM | Update |
| DELETE | `/api/business-units` | ADMIN | Delete |

### Reporting Periods

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/reporting-periods` | All | List periods |
| POST | `/api/reporting-periods` | ADMIN, SM | Create period |
| PATCH | `/api/reporting-periods` | ADMIN, SM | Update / lock period |

### Questionnaire

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/questionnaire` | All | List templates + sections |
| POST | `/api/questionnaire` | ADMIN | Create template |
| GET | `/api/questionnaire/answers` | All | List answers |
| POST | `/api/questionnaire/answers` | All authenticated | Upsert answer |

### Materiality

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/materiality` | All | List materiality topics |
| POST | `/api/materiality` | ADMIN, SM | Upsert topic scores |

### Metrics (Data Collection)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/metrics` | All | List metric entries (sector-filtered) |
| POST | `/api/metrics` | ADMIN, SM, DC | Create or update metric entry |
| PATCH | `/api/metrics` | ADMIN, SM, DC, FR, HC | Update data fields OR advance approval stage |

> **PATCH routing**: if body contains `approvalStage` without `value`/`unit`/`facilityId`, routes to `transitionMetricStage`; otherwise routes to `updateMetricEntry`.

### Evidence

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/evidence` | All | List evidence by entityType + entityId |
| POST | `/api/evidence` | ADMIN, SM, DC | Upload evidence file (multipart) |
| DELETE | `/api/evidence` | ADMIN, SM | Delete evidence file |

### Emissions

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/emissions` | All | Get emissions summary (Scope 1/2/3 breakdown) |
| POST | `/api/emissions/recalculate` | ADMIN, SM | Trigger recalculation |

### Risks

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/risks` | All | List climate risks |
| POST | `/api/risks` | ADMIN, SM | Create risk |
| PATCH | `/api/risks` | ADMIN, SM | Update risk |
| DELETE | `/api/risks` | ADMIN | Delete risk |

### Scenarios

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/scenarios` | All | List scenarios |
| POST | `/api/scenarios` | ADMIN, SM | Create scenario |
| PATCH | `/api/scenarios` | ADMIN, SM | Update scenario |
| DELETE | `/api/scenarios` | ADMIN | Delete scenario |

### Targets

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/targets` | All | List targets (with computed progress %) |
| POST | `/api/targets` | ADMIN, SM | Create target |
| PATCH | `/api/targets` | ADMIN, SM | Update target |
| DELETE | `/api/targets` | ADMIN | Delete target |

### Reports

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/reports` | All | List reports |
| POST | `/api/reports` | ADMIN, SM | Generate report |
| GET | `/api/reports/[id]` | All | Get report with sections |
| PATCH | `/api/reports/[id]` | ADMIN, SM | Update report |
| POST | `/api/reports/[id]/approve` | ADMIN, HC | Approve report |

### Certification

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/certification` | All | List certification records |
| POST | `/api/certification` | ADMIN, SM | Submit for certification |
| POST | `/api/certification/comment` | All authenticated | Add comment |
| POST | `/api/certification/decision` | ADMIN, HC | Make decision (approve/reject/request changes) |

### Audit Logs

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/audit-logs` | All | List audit logs (paginated) |

### Tasks

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/tasks` | All | List tasks |
| POST | `/api/tasks` | ADMIN, SM | Create task |
| PATCH | `/api/tasks` | ADMIN, SM, DC | Update task |
| DELETE | `/api/tasks` | ADMIN | Delete task |

### ESG Summary

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/esg-summary` | All | Get ESG summary for period |
| POST | `/api/esg-summary` | ADMIN, SM | Generate AI ESG summary |

### AI & Knowledge Base

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/api/ai/chat` | All authenticated | Streaming AI chat with RAG |
| GET | `/api/knowledge-base` | All | List KB documents |
| POST | `/api/knowledge-base` | ADMIN | Upload document + embed |
| DELETE | `/api/knowledge-base/[id]` | ADMIN | Delete KB document + chunks |

---

## Testing

### Test Count: 302 tests (0 failures)

```
src/tests/
├── unit/
│   ├── bugs-fixed.test.ts              51 tests  (regression: all 10 fixed bugs)
│   ├── metric-entry.service.test.ts    20 tests  (list, upsert, update, stage transitions)
│   ├── climate-risk.service.test.ts    15 tests  (scoring, CRUD, audit)
│   └── target.service.test.ts          20 tests  (status derivation, CRUD, progress calc)
├── components/
│   ├── TopBar.test.tsx                  6 tests  (notification rendering, field mapping)
│   ├── ProgressBar.test.tsx             8 tests  (rendering, edge cases)
│   └── StatusBadge.test.tsx             8 tests  (badge variants)
└── e2e/
    └── ...                            174 tests  (Playwright, full flows)
```

### Running Tests

```bash
# All unit + component tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# End-to-end (Playwright)
npm run test:e2e
```

### Test Strategy

- **Unit tests**: Pure functions and service methods. Prisma mocked with `vi.mock("@/lib/prisma")`. No database required.
- **Component tests**: React Testing Library with jsdom. Server-side hooks mocked.
- **E2E tests**: Playwright against running dev server. Full browser automation.

### Key Testing Patterns

```typescript
// Service test pattern — all Prisma calls mocked
vi.mock("@/lib/prisma", () => ({
  prisma: { metricEntry: { findMany: vi.fn(), ... } }
}));

// Tenant isolation assertion
const where = vi.mocked(prisma.metricEntry.findMany).mock.calls[0][0]?.where;
expect(where).toMatchObject({ organizationId: "org1" });

// httpStatus on thrown errors
const err = await transitionMetricStage(user, payload).catch(e => e);
expect((err as { httpStatus: number }).httpStatus).toBe(403);
```

---

## Commands

```bash
# Development
npm run dev                  # Start Next.js dev server (port 3000)
npm run build                # Production build
npm run start                # Start production server

# Code quality
npm run lint                 # ESLint
npm run type-check           # tsc --noEmit

# Database
npm run prisma:generate      # Generate Prisma client from schema
npm run db:push              # Push schema to DB (no migration file)
npx prisma migrate dev       # Create + apply migration
npx prisma migrate deploy    # Apply migrations (CI/production)
npm run prisma:seed          # Seed demo data
npx prisma studio            # Open Prisma Studio (GUI)

# Testing
npm test                     # Vitest unit + component tests
npm run test:watch           # Vitest watch mode
npm run test:coverage        # Coverage report
npm run test:e2e             # Playwright E2E tests

# Docker
docker compose up --build -d # Build + start all services
docker compose down          # Stop (keep volumes)
docker compose down -v       # Stop + wipe volumes
docker compose logs -f app   # Follow app logs
```

---

## Seed Data

The seed script (`prisma/seed.ts`) creates a complete demo environment:

**Organization**: `Demo Manufacturing A.Ş.`
- Country: Turkey
- Sector: Manufacturing (SASB `IF-CH`)
- Reporting period: 2025 (Jan 1 – Dec 31)
- Facilities: Istanbul Plant, Ankara Office

**Users** (all password `Demo1234!`):

| Email | Role |
|---|---|
| `admin@demo.com` | ADMIN |
| `sustainability@demo.com` | SUSTAINABILITY\_MANAGER |
| `contributor@demo.com` | DATA\_CONTRIBUTOR |
| `cfo@demo.com` | FINANCE\_REVIEWER |
| `auditor@demo.com` | AUDITOR |

**Seeded content**:
- 20+ metric definitions (electricity, natural gas, water, waste, Scope 1/2/3)
- Demo metric entries with values for both facilities
- Placeholder emission factors (⚠ demo values — must be verified for production)
- 5 materiality topics with scores
- 2 climate risk entries (physical acute: flood, transition: carbon tax)
- 1 scenario analysis (2°C transition scenario)
- 1 net-zero target (2030, 60% reduction from 2020 baseline)
- 1 generated report with sections
- 1 certification record with comments
- 20 audit log entries
- 5 sample tasks
- 2 questionnaire templates (Kimya/Chemical sector):
  - `Kimya Sektörü Sözel Soru Seti` (verbal questions)
  - `Kimya Sektörü Sayısal Soru Seti` (numeric questions)

---

## Disclaimer

This platform provides structured sustainability reporting support. **Final regulatory compliance and certification decisions require review by qualified sustainability and legal professionals.**

- Seeded emission factors are **placeholder/demo values** and must be independently verified against official Turkish and international emission factor databases before production use.
- AI-generated content (ESG summaries, report drafts, chat responses) is for guidance only and may contain inaccuracies. Human review is mandatory before submission to regulators.
- This platform does not constitute legal advice on TSRS, IFRS S1/S2, ESRS, or CSRD compliance.
