# LMMS — Project Charter

Multi-tenant marketing SaaS for GCC laundry businesses.

Stack: pnpm + Turbo, TypeScript strict, Express (apps/api),
Next.js 14 App Router (apps/web), BullMQ worker (apps/worker),
Prisma + Postgres 16, Redis 7, JWT+refresh+OTP, Vitest, Playwright.

Packages: config, types, contracts, db, auth, audit, ingestion,
segmentation, whatsapp, campaigns, compliance, automations,
reporting, content-calendar, migration, ui, i18n, ai.

## Non-negotiable invariants

1. Consent hard gate — no send without valid ConsentRecord
2. Tenant isolation — every tenant table has tenantId, every query filters
3. Audit immutability — hash chain + append-only trigger
4. Deterministic only — no LLM text in production paths
5. RTL hard requirement on Arabic
6. Mode-awareness — unavailable features LOCKED with reason
7. No calendar deadlines — progress = gates passed

Status: bootstrap. V1 begins Session 1.
